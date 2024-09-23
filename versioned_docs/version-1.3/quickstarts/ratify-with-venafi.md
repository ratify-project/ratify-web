---
sidebar_position: 4
---

# Ratify with Venafi CodeSign Protect

This guide will explain how to get started with Ratify and the [Venafi CodeSign Protect notation plugin](https://venafi.com/codesign-protect/). This will involve setting up the necessary components, and configuring them properly. Once everything is set up we will walk through a simple scenario of verifying the signature on a container image at deployment time.

By the end of this guide you will have a Kubernetes cluster with Gatekeeper and Ratify installed, and have validated that only images signed by an authorized Venafi CodeSign Protect signing identity can be deployed.

This guide assumes you have a working Kubernetes cluster and [Venafi CodeSign Protect](https://venafi.com/codesign-protect/) platform.  Portions of this guide can be skipped if you have an existing cluster and/or repository.

## Table of Contents
- [Ratify with Venafi CodeSign Protect](#ratify-with-venafi-codesign-protect)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Prepare Container Image](#prepare-container-image)
  - [Sign Container Image](#sign-container-image)
  - [Deploy Gatekeeper](#deploy-gatekeeper)
  - [Deploy Ratify](#deploy-ratify)
  - [Deploy Container Image](#deploy-container-image)

## Prerequisites

There are a number of tools that you will need locally to complete this guide:

- [kubectl](https://kubernetes.io/docs/tasks/tools/): This is used to interact with the cluster
- [helm](https://helm.sh/docs/intro/quickstart/): This is used to install ratify components into the cluster
- [docker](https://www.docker.com/get-started): This is used to build the container image we will deploy in this guide
- [ratify](https://github.com/ratify-project/ratify/releases): This is used to check images from ECR locally
- [jq](https://stedolan.github.io/jq/): This is used to capture variables from json returned by commands
- [notation](https://github.com/notaryproject/notation): This is used to sign the container image we will deploy in this guide
- [Venafi CodeSign Protect notation plugin](https://github.com/Venafi/notation-venafi-csp): this is required to use `notation` with [Venafi CodeSign Protect](https://venafi.com/codesign-protect/) signing identities

## Prepare Container Image

For this guide we will create a basic container image we can use to simulate deployments of a service. We will start by
building the container image:

```shell
docker build -t $REPO_URI:v1 https://github.com/wabbit-networks/net-monitor.git#main
```

After the container is built we need to push it to a repository such as ECR:

```shell
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin $REPO_URI

docker push $REPO_URI:v1
```

You can also push to other OCI-compatible registries such as GitHub:

```shell
echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin

docker push ghcr.io/myorg/net-monitor:v1
```

For more information on provisioning ECR repositories check the [documentation](https://docs.aws.amazon.com/AmazonECR/latest/public/public-getting-started.html).

## Sign Container Image

For this guide, we will sign the image using `notation` with the Venafi CodeSign Protect platform and plugin resources.

To use signing identity in `notation`, we will add the certificate label as the signing key:
```shell
notation key add \
    --plugin venafi-csp \
    --id "venafi-csp-cert-label" \
    --default "venafi-csp-cert-label" \
    --plugin-config "config"="/path/to/vsign/config.ini"
```

After the signing identity has been added, we will use `notation` to sign the image:

```shell
notation sign $REPO_URI:v1
```

Both the container image and the signature should now be in the public ECR repository. We can also inspect the signature information using notation:

```shell
notation inspect $REPO_URI:v1
```

More information on signing with Venafi CodeSign Protect can be found in the [Venafi Notation Plugin](https://github.com/Venafi/notation-venafi-csp) and [notation](https://github.com/notaryproject/notation) documentation.

## Deploy Gatekeeper

The Ratify container will perform the actual validation of images and their artifacts, but [Gatekeeper](https://github.com/open-policy-agent/gatekeeper) is used as the policy controller for Kubernetes.

We first need to install Gatekeeper into the cluster. We will use the Gatekeeper helm chart with some customizations:

```shell
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts

helm install gatekeeper/gatekeeper  \
    --name-template=gatekeeper \
    --namespace gatekeeper-system --create-namespace \
    --set enableExternalData=true \
    --set validatingWebhookTimeoutSeconds=5 \
    --set mutatingWebhookTimeoutSeconds=2 \
    --set externaldataProviderResponseCacheTTL=10s
```

Next, we need to deploy a Gatekeeper policy and constraint. For this guide, we will use a sample policy and constraint that requires images to have at least one trusted signature.

```shell
kubectl apply -f https://raw.githubusercontent.com/deislabs/ratify/main/library/notation-validation/template.yml
kubectl apply -f https://raw.githubusercontent.com/deislabs/ratify/main/library/notation-validation/samples/constraint.yaml
```

More complex combinations of regos and Ratify verifiers can be used to accomplish many types of checks. See the [Gatekeeper docs](https://open-policy-agent.github.io/gatekeeper/website/docs/) for more information on rego authoring.

## Deploy Ratify

Now we can deploy Ratify to our cluster:
```shell
helm install ratify \
    ratify/ratify --atomic \
    --namespace gatekeeper-system \
    --set featureFlags.RATIFY_EXPERIMENTAL_DYNAMIC_PLUGINS=true \
    --set featureFlags.RATIFY_CERT_ROTATION=true
```
Refer to the Ratify [documentation](https://ratify.dev/docs/1.0/quickstarts/quickstart-manual/) if you need to customize the helm chart installation.

After deploying Ratify, we will download the Venafi CodeSign Protect notation plugin to the Ratify pod using the [Dynamic Plugins feature](../reference/dynamic-plugins.md):

```shell
cat > venafi-notation-plugin.yaml << EOF
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: notation-venafi-csp-plugin
spec:
  name: notation-venafi-csp
  artifactTypes: application/vnd.oci.image.manifest.v1+json
  source:
    artifact: ghcr.io/venafi/notation-venafi-csp:linux-amd64-latest
EOF

kubectl apply -f venafi-notation-plugin.yaml
```

Next we will need to deploy the trusted Root certificate used to issue the signing identity referenced above:

```shell
cat > venafi_root.yaml << EOF
apiVersion: config.ratify.deislabs.io/v1beta1
kind: CertificateStore
metadata:
  name: ratify-notation-inline-cert
  namespace: gatekeeper-system
spec:
  provider: inline
  parameters:
    value: |
      -----BEGIN CERTIFICATE-----
      ...
      -----END CERTIFICATE-----
EOF

kubectl apply -f venafi_root.yaml
```

Finally, we will create a verifier that specifies the trust policy to use when verifying signatures. In this guide, we will use a trust policy that only trusts images signed by the Venafi CodeSign Protect signing identity we created earlier:

```shell
cat > notation-verifier.yaml << EOF
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-notation
spec:
  name: notation
  artifactTypes: application/vnd.cncf.notary.signature
  parameters:
    verificationCertStores:
      signingAuthority:
        certs:
          - ratify-notation-inline-cert
    trustPolicyDoc:
      version: "1.0"
      trustPolicies:
        - name: default
          registryScopes:
            - "*"
          signatureVerification:
            level: strict
          trustStores:
            - signingAuthority:certs
          trustedIdentities:
            - "x509.subject: CN=signer.example.com,O=Acme,L=Cupertino,ST=CA,C=US"
EOF

kubectl apply -f notation-verifier.yaml
```

More complex trust policies can be used to customize verification. See [notation documentation](https://github.com/notaryproject/specifications/blob/v1.0.0/specs/trust-store-trust-policy.md) for more information on writing trust policies.

## Deploy Container Image

Now that the signed container image is in the registry and Ratify is installed into the Kubernetes cluster we can deploy our
container image:

```shell
kubectl run demosigned -n default --image $REPO_URI:v1
```

We should be able to see from the Ratify and Gatekeeper logs that the container signature was validated. The pod for the container should also be running.

```shell
kubectl logs -n gatekeeper-system deployment/ratify
```

```
time=2023-11-15T18:24:22.104435502Z level=info msg=verify result for subject ghcr.io/myorg/net-monitor@sha256:fcc8a5d24fcc9619b80e2e86695d2a792108add778439ac0a0647c9cae745176: {
  "isSuccess": true,
  "verifierReports": [
    {
      "subject": "ghcr.io/myorg/net-monitor@sha256:fcc8a5d24fcc9619b80e2e86695d2a792108add778439ac0a0647c9cae745176",
      "isSuccess": true,
      "name": "notation",
      "message": "signature verification success",
      "extensions": {
        "Issuer": "CN=Issuer,O=Example,C=US",
        "SN": "CN=signer.example.com,O=Example,L=San Jose,ST=CA,C=US"
      },
      "artifactType": "application/vnd.cncf.notary.signature"
    }
  ]
}
```

We can also test that an image without a valid signature is not able to run:

```shell
kubectl run demounsigned -n default --image busybox
Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request: [ratify-constraint] Subject failed verification: docker.io/library/busybox@sha256:3fbc632167424a6d997e74f52b878d7cc478225cffac6bc977eedfe51c7f4e79
```

The command should fail with an error and we should be able to see from the Ratify and Gatekeeper logs that the signature validation failed.

```
time=2023-11-15T18:24:08.110678426Z level=info msg=verify result for subject docker.io/library/busybox@sha256:3fbc632167424a6d997e74f52b878d7cc478225cffac6bc977eedfe51c7f4e79: {
  "verifierReports": [
    {
      "subject": "docker.io/library/busybox@sha256:3fbc632167424a6d997e74f52b878d7cc478225cffac6bc977eedfe51c7f4e79",
      "isSuccess": false,
      "message": "verification failed: Error: referrers not found, Code: REFERRERS_NOT_FOUND, Component Type: executor"
    }
  ]
}
```
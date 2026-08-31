---
sidebar_position: 1
---

# Manual Quick Start Steps

This document outlines the **manual** production ready steps to install the latest development version of Ratify with Gatekeeper in admission control scenarios. Please refer to the [Quick Start](../quick-start.mdx) for recommended install steps.

Prerequisites:
- Kubernetes v1.30+, Minikube is used in this guide
- kubectl v1.30+
- Helm v3.0+
- OPA Gatekeeper v3.18+

## Step 1: Setup Gatekeeper with [external data](https://open-policy-agent.github.io/gatekeeper/website/docs/externaldata)

> NOTE: If you have added Helm repository for Gatekeeper and Ratify, you can update them by executing `helm repo update` before installation.

```bash
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts

helm install gatekeeper/gatekeeper  \
    --name-template=gatekeeper \
    --namespace gatekeeper-system --create-namespace \
    --set enableExternalData=true \
    --set validatingWebhookTimeoutSeconds=5 \
    --set mutatingWebhookTimeoutSeconds=2 \
    --set externaldataProviderResponseCacheTTL=10s
```

> NOTE: `validatingWebhookTimeoutSeconds` and `mutationWebhookTimeoutSeconds` increased from 3 to 5 and 1 to 2 respectively, so all Ratify operations complete in complex scenarios. See [discussion here](https://github.com/notaryproject/ratify/issues/269) to remove this requirement. Kubernetes v1.20 or higher is REQUIRED to increase timeout. Timeout is configurable in helm chart under `provider.timeout` section.

## Step 2: Deploy ratify on gatekeeper in the gatekeeper-system namespace

- Option 1: Install the last development version of Ratify

```bash
helm repo add ratify https://notaryproject.github.io/ratify
# download the notary verification certificate
curl -sSLO https://raw.githubusercontent.com/notaryproject/ratify/main/test/testdata/notation.crt
helm install ratify-gatekeeper-provider \
  ratify/ratify-gatekeeper-provider --atomic \
  --version 2.0.0-dev \
  --namespace gatekeeper-system --create-namespace \
  --set 'executor.scopes[0]=ghcr.io' \
  --set 'notation.certs[0].provider=inline' \
  --set-file 'notation.certs[0].cert=./notation.crt'
```

- Option 2: Install ratify with charts from your local branch.

```bash
git clone https://github.com/notaryproject/ratify.git
cd ratify
helm install ratify-gatekeeper-provider \
  ./deployments/ratify-gatekeeper-provider --atomic \
  --namespace gatekeeper-system --create-namespace \
  --set 'executor.scopes[0]=ghcr.io' \
  --set 'notation.certs[0].provider=inline' \
  --set-file 'notation.certs[0].cert=./notation.crt'
```

## Step 3: See Ratify in action

- Deploy a `demo` constraint

```bash
kubectl apply -f https://raw.githubusercontent.com/notaryproject/ratify/main/configs/constrainttemplates/default/template.yaml
kubectl apply -f https://raw.githubusercontent.com/notaryproject/ratify/main/configs/constrainttemplates/default/constraint.yaml
```

Once the installation is completed, you can test the deployment of an image that is signed using Notary V2 solution.

- This will successfully create the pod `demo`

```bash
kubectl run demo --namespace default --image=ghcr.io/deislabs/ratify/notary-image:signed
kubectl get pods demo
```

Optionally you can see the output of the pod logs via: `kubectl logs demo -n default`

- Now deploy an unsigned image

```bash
kubectl run demo1 --namespace default --image=ghcr.io/deislabs/ratify/notary-image:unsigned
```

You will see a deny message from Gatekeeper denying the request to create it as the image doesn't have any signatures.

```bash
Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request: [ratify-constraint] Artifact failed verification: ghcr.io/deislabs/ratify/notary-image@sha256:17490f904cf278d4314a1ccba407fc8fd00fb45303589b8cc7f5174ac35554f4, 
report: {"artifactReports": null, "succeeded": false}
```

You just validated the container images in your k8s cluster!

## Step 4: Uninstall Ratify

Notes: Helm does NOT support upgrading CRDs, so uninstalling Ratify will require you to delete the CRDs manually. Otherwise, you might fail to install CRDs of newer versions when installing Ratify.

```bash
kubectl delete -f https://raw.githubusercontent.com/notaryproject/ratify/main/configs/constrainttemplates/default/template.yaml
helm delete ratify-gatekeeper-provider --namespace gatekeeper-system
kubectl delete crd executors.config.ratify.dev
```

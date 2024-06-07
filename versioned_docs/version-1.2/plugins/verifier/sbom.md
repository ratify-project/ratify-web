---
sidebar_position: 3
---

# SBOM Validation

This document outlines how Ratify can be used to verify SBOM (Software bill of material). The `sbom` verifier is added as a plugin to the Ratify verification framework.  Currently the SBOM verifier is in 2.0.0-alpha release, and it supports the following SBOM validation:
- SBOM attached to the subject image as a referrer artifact
- SBOM generated in [JSON(.spdx.json)](https://spdx.dev/learn/overview/) format

## Table of Contents

* [SBOM with License and Package Validation](#sbom-with-license-and-package-validation)
* [SBOM with Signature Validation](#sbom-with-signature-validation)
* [Configuration](#configuration)
* [Future improvement](#future-improvements)
* [FAQ](#faq)

## SBOM with License and Package Validation

Alice has a Kubernetes cluster. The software she deploys to her cluster depends on many open source components. She wants to make sure container images meet the following criteria:
- does not contain licenses that could conflict with her business interest
- does not contain any vulnerable packages

### Walkthrough

#### 1. Generate SBOM and attach to your image

Use a SBOM generator such as syft to generate an SBOM for your iamge  `myregistry.io/sbom/alpine:3.18.2`. A reference artifact is generated:
1. Use [syft](https://github.com/anchore/syft) to scan `myregistry.io/sbom/alpine:3.18.2` and save the output file
    ```shell
    syft -o spdx-json --file sbom.spdx.json myregistry.io/sbom/alpine:3.18.2
    ```
    
2. A tool such as `oras` is used to package, attach, and then push the report to registry
    - `artifact-type` MUST be `application/spdx+json`
    ```shell
    oras attach \
        --artifact-type application/spdx+json \
        myregistry.io/sbom/alpine:3.18.2 \
        sbom.spdx.json
    ```

The resulting image will have a single SBOM artifact attached:

```shell
> oras discover myregistry.io/sbom/alpine:3.18.2 -o tree
myregistry.io/sbom/alpine@sha256:96f270a2d97f70713ef7bd6c4b80552178bf97fc6bd75ac9af2df4ba06b26f62
└── application/spdx+json
    └── sha256:6944ae19f248ed93a494c528a839d3eac4c33df6ca81d6f762a0483af8b2b87f
```

#### 2. Ratfy Installation and configuration
First, follow the first step of the [manual quickstart](../../quickstarts/quickstart-manual.md) to installs Gatekeeper on the cluster. 

Second, install Ratify and configure the SBOM verifier with disallowed license and package information. In the configuration below, Alice specifies `busybox` as a disallowed package as it leads arbitrary code execution. [Copy left ](https://www.gnu.org/licenses/copyleft.en.html) license such as `MPL` is also disallowed due to license restrictions.

```bash
helm repo add ratify https://ratify-project.github.io/ratify
helm install ratify \
    ratify/ratify --atomic \
    --namespace gatekeeper-system \
    --set featureFlags.RATIFY_CERT_ROTATION=true \
    --set sbom.enabled=true \
    --set sbom.disallowedLicenses={"MPL"} \
    --set sbom.disallowedPackages[0].name="busybox" \
    --set sbom.disallowedPackages[0].version="1.36.1-r0"
    
```
Third, deploy a `demo` constraint.
```
kubectl apply -f https://ratify-project.github.io/ratify/library/default/template.yaml
kubectl apply -f https://ratify-project.github.io/ratify/library/default/samples/constraint.yaml
```
#### 3. Deploying test image
Finally we will attempt to deploy our test image `myregistry.io/sbom/alpine:3.18.2`. We expect this to FAIL since the SBOM contains disallowed packages busybox:

```shell
> kubectl run alpine-image -n default --image=myregistry.io/sbom/alpine:3.18.2, the output
Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request: Subject failed verification: myregistry.io/sbom/alpine@sha256:96f270a2d97f70713ef7bd6c4b80552178bf97fc6bd75ac9af2df4ba06b26f62
```

Taking a look at the Ratify logs reveals the failing report:

```json
> kubectl logs deploy/ratify -n gatekeeper-system
time=2023-12-07T20:02:17.238355853Z level=info msg=verify result for subject myregistry.io/sbom/alpine@sha256:96f270a2d97f70713ef7bd6c4b80552178bf97fc6bd75ac9af2df4ba06b26f62: {
  "verifierReports": [
    {
      "subject": "myregistry.io/sbom/alpine@sha256:96f270a2d97f70713ef7bd6c4b80552178bf97fc6bd75ac9af2df4ba06b26f62",
      "isSuccess": false,
      "name": "verifier-sbom",
      "message": "SBOM validation failed.",
      "extensions": {
        "creationInfo": {
          "created": "2023-12-07T19:22:42.448010842Z",
          "creators": [
            "Organization: Anchore, Inc",
            "Tool: syft-0.36.0"
          ],
          "licenseListVersion": "3.15"
        },
        "packageViolations": [
          {
            "License": "GPL-2.0-only",
            "Name": "busybox",
            "Version": "1.36.1-r0"
          },
          {
            "License": "GPL-2.0-only",
            "Name": "busybox-binsh",
            "Version": "1.36.1-r0"
          }
        ]
      },
      "artifactType": "application/spdx+json"
    }
  ]
} 
```
## SBOM with Signature Validation

Alice has a Kubernetes cluster. The software she deploys to her cluster depends on many open source components. She wants to make sure container images meet the following criteria:
- does not contain licenses that could conflict with her business interest
- does not contain any vulnerable packages

Furthermore, the most recent report being validated must have a verified Notary Project signature attached to it.

### Installation 
First, follow the first step of the [manual quickstart](../../quickstarts/quickstart-manual.md) to install Gatekeeper. 

Second, install Ratify with the SBOM verifier enabled and configured. The SBOM verifier must also be configured and cert provided. Here, we will assume the report is signed using the quickstart image's signing key.

Third, deploy a `demo` constraint.
```
kubectl apply -f https://ratify-project.github.io/ratify/library/default/template.yaml
kubectl apply -f https://ratify-project.github.io/ratify/library/default/samples/constraint.yaml
```

```bash
helm repo add ratify https://ratify-project.github.io/ratify
# download the notary verification certificate
curl -sSLO https://raw.githubusercontent.com/deislabs/ratify/main/test/testdata/notation.crt
helm install ratify \
    ratify/ratify --atomic \
    --namespace gatekeeper-system \
    --set featureFlags.RATIFY_CERT_ROTATION=true \
    --set-file notationCerts={./notation.crt} \
    --set sbom.enabled=true \
    --set sbom.notaryProjectSignatureRequired=true \
    --set sbom.disallowedLicenses={"MPL"} \
    --set sbom.disallowedPackages[0].name="busybox" \
    --set sbom.disallowedPackages[0].version="1.36.1-r0"
    
```

### 1. Generate, sign the SBOM and attach to your image

Use a sbom generator such as syft to generate an sbom for your iamge  `myregistry.io/sbom/alpine:3.18.2`. A reference artifact is generated:
1. Use syft to scan `myregistry.io/sbom/alpine:3.18.2` and save the output file
    ```shell
    syft -o spdx-json --file sbom.spdx.json myregistry.io/sbom/alpine:3.18.2
    ```
    
2. A tool such as `oras` is used to package, attach, and then push the report to registry
    - `artifact-type` MUST be `application/spdx+json`
    ```shell
    oras attach \
        --artifact-type application/spdx+json \
        myregistry.io/sbom/alpine:3.18.2 \
        sbom.spdx.json
    ```

3. Use [`notation`](https://notaryproject.dev/) to sign the report
  ```shell
  report_digest=$(oras discover myregistry.io/sbom/alpine:3.18.2 -o json | jq .manifests[0].digest | tr -d \")
  notation sign myregistry.io/sbom/alpine@$report_digest
  ```

The resulting image will have a single sbom artifact attached with Notary Project signature attached:

```shell
> oras discover myregistry.io/sbom/alpine:3.18.2 -o tree
myregistry.io/sbom/alpine@sha256:96f270a2d97f70713ef7bd6c4b80552178bf97fc6bd75ac9af2df4ba06b26f62
└── application/spdx+json
    └── sha256:6944ae19f248ed93a494c528a839d3eac4c33df6ca81d6f762a0483af8b2b87f
        └── application/vnd.cncf.notary.signature
            └── sha256:3ed4d26f01c6dc5b410e2370031d2222dd27f1cfa16fca74dff2966f9bac9df9
```

Finally we will attempt to deploy our test image `myregistry.io/sbom/alpine:3.18.2`. We expect this to FAIL since our package busybox is not allowed.

```
{
  "isSuccess": true,
  "verifierReports": [
    {
      "subject": "myregistry.io/sbom/alpine@sha256:96f270a2d97f70713ef7bd6c4b80552178bf97fc6bd75ac9af2df4ba06b26f62",
      "isSuccess": false,
      "name": "verifier-sbom",
      "message": "SBOM validation failed.",
      "extensions": {
        "creationInfo": {
          "created": "2023-12-07T19:22:42.448010842Z",
          "creators": [
            "Organization: Anchore, Inc",
            "Tool: syft-0.36.0"
          ],
          "licenseListVersion": "3.15"
        },
        "packageViolations": [
          {
            "License": "GPL-2.0-only",
            "Name": "busybox",
            "Version": "1.36.1-r0"
          },
          {
            "License": "GPL-2.0-only",
            "Name": "busybox-binsh",
            "Version": "1.36.1-r0"
          }
        ]
      },
      "nestedResults": [
        {
          "subject": "myregistry.io/sbom/alpine@sha256:6944ae19f248ed93a494c528a839d3eac4c33df6ca81d6f762a0483af8b2b87f",
          "isSuccess": true,
          "name": "notation",
          "message": "signature verification success",
          "extensions": {
            "Issuer": "CN=wabbit-networks.io,O=Notary,L=Seattle,ST=WA,C=US",
            "SN": "CN=wabbit-networks.io,O=Notary,L=Seattle,ST=WA,C=US"
          },
          "artifactType": "application/vnd.cncf.notary.signature"
        }
      ],
      "artifactType": "application/spdx+json"
    }
  ]
}
```
## Configuration
Sample YAML
```json
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-sbom
spec:
  name: sbom
  artifactTypes: application/spdx+json
  parameters:
    disallowedPackages:
    - name: busybox
      version: 1.36.1-r0
    disallowedLicenses: 
    - MPL
```
| Name                  | Required | Path                                  | Description                                                                                                                                                                                          | Default Value                      |
| --------------------- | -------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| disallowedPackages            | No       | spec.parameters.disallowedPackages            | Array of disallowed packages. If version is empty, all packages with matching name will be disallowed.                                                                                                                                                              | []                                |
| disallowedLicenses  | No       | spec.parameters.disallowedLicenses  | String array of disallowed licenses.  | []                                 |

### CLI

Sample JSON
```json
{
    "store": {
        "version": "1.0.0",
        "plugins": [
            {
                "name": "oras",
                "useHttp": true
            }
        ]
    },
    "policy": {
        "version": "1.0.0",
        "plugin": {
            "name": "configPolicy",
            "artifactVerificationPolicies": {
                "application/spdx+json": "all"
            }
        }
    },
    "verifier": {
        "version": "1.0.0",
        "plugins": [
            {
                "name": "sbom",
                "artifactTypes": "application/spdx+json",
                "disallowedLicenses": ["MPL"],
                "disallowedPackages":[{"name":"busybox","version":"1.36.1-r0"}]
            }
        ]
    }
}
```
### Future Improvements
Please vote on these issues to help us prioritize:
- [SBOM Verifier to support other formats](https://github.com/deislabs/ratify/issues/1206)
- [SBOM verifier to support license expressions](https://github.com/deislabs/ratify/issues/1207)

### FAQ

#### Why are there multiple external verifiers that can verify SBOMs?
These verifiers are authored by various contributors to fit their project need. The license checker implements a strict validation against the allowed licenses list, where as the SBOM verifier works against a disallowed license and package list.

The licensechecker verifier has been DEPRECATED and will be removed in future releases. Please use the SBOM verifier for license checks moving forward. Package license verification is associated typically with SBOMs. As such, Ratify has decided to incorporate package license filtering in SBOM verification.
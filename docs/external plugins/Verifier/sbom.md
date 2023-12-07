# SBOM Validation

This document outlines how Ratify can be used to verify sbom (Software bill of material). The `sbom` verifier is added as a plugin to the Ratify verification framework. Currently the sbom verifier supports the following report types:

- sbom attached to the subject image as a referrer artifact
- Reports in SARIF format
- Reports generated in spdx+json format

## Table of Contents

* [Example Scenario](#example-scenario)
* [Configuration](#configuration)
* [SBOM with Signature Validation](#sbom-with-signature-validation)

## Example Scenario 

Alice has a Kubernetes cluster. The software she deploys to her cluster depends on many open source components, she wants to make sure the container images meets the following criteria:
- does not contain licenses that could conflict with her business interest
- does not contain any vulnerable packages

### Walkthrough

#### 1. Installation and configuration
First, follow the first step of the [manual quickstart](../../quickstarts/quickstart-manual.md) to installs Gatekeeper on the cluster. 

Second, install Ratify and configure the sbom verifier with disallowed license and package information.

```bash
helm repo add ratify https://deislabs.github.io/ratify
helm install ratify \
    ratify/ratify --atomic \
    --namespace gatekeeper-system \
    --set featureFlags.RATIFY_CERT_ROTATION=true \
    --set vulnerabilityreport.enabled=true \
    TO FIX command
    
```
#### 2. Generate SBOM and attach to your image

Use a sbom generator such as syft to generate an sbom for your iamge  `myregistry.io/vuln/alpine:3.18.2`. A reference artifact is generated:
1. Use Trivy to scan `myregistry.io/vuln/alpine:3.18.2` and output a report in SARIF format
    ```shell
    trivy image -q -f sarif myregistry.io/vuln/alpine:3.18.2 > trivy-sarif.json
    ```
    
2. A tool such as `oras` is used to package, attach, and then push the report to registry
    - `artifact-type` MUST be `application/sarif+json`
    - `org.opencontainers.image.created` annotation with RFC3339 formatted current timestamp
    ```shell
    oras attach \
        --artifact-type application/sarif+json \
        --annotation "org.opencontainers.image.created=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        myregistry.io/vuln/alpine:3.18.2 \
        trivy-sarif.json:application/sarif+json
    ```

The resulting image will have a single SARIF vulnerability report artifact attached:

```shell
> oras discover myregistry.io/vuln/alpine:3.18.2 -o tree
myregistry.io/vuln/alpine@sha256:25fad2a32ad1f6f510e528448ae1ec69a28ef81916a004d3629874104f8a7f70
└── application/sarif+json
    └── sha256:6170ef41e5a7c7088f86e3bc6b9c370cf97e613f7c7e359628c0119ec7d3d5f4
```
#### 3. Deploying test image
Finally we will attempt to deploy our test image `myregistry.io/vuln/alpine:3.18.2`. We expect this to FAIL since our vulnerability report indicates multiple HIGH and CRITICAL level severities:

```shell
> kubectl run vuln-alpine-image -n default --image=myregistry.io/vuln/alpine:3.18.2
Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request: [vulnerability-report-validation-constraint] Subject failed verification: myregistry.io/vuln/alpine@sha256:25fad2a32ad1f6f510e528448ae1ec69a28ef81916a004d3629874104f8a7f70
```

Taking a look at the Ratify logs reveals the failing report:

```json
> kubectl logs deploy/ratify -n gatekeeper-system
time=2023-11-20T12:00:00Z level=info msg=verify result for subject myregistry.io/vuln/alpine@sha256:25fad2a32ad1f6f510e528448ae1ec69a28ef81916a004d3629874104f8a7f70: {
  "verifierReports": [
    {
      "subject": "myregistry.io/vuln/alpine@sha256:25fad2a32ad1f6f510e528448ae1ec69a28ef81916a004d3629874104f8a7f70",
      "isSuccess": false,
      "name": "vulnerabilityreport",
      "message": "vulnerability report validation failed",
      "extensions": {
        "scanner": "trivy",
        "severityViolations": [
          {
            "defaultConfiguration": {
              "level": "error"
            },
            "fullDescription": {
              "text": "There is a stack overflow vulnerability in ash.c:6030 in busybox before 1.35. In the environment of Internet of Vehicles, this vulnerability can be executed from command to arbitrary code execution."
            },
            "help": {
              "markdown": "**Vulnerability CVE-2022-48174**\n| Severity | Package | Fixed Version | Link |\n| --- | --- | --- | --- |\n|CRITICAL|ssl_client|1.36.1-r1|[CVE-2022-48174](https://avd.aquasec.com/nvd/cve-2022-48174)|\n\nThere is a stack overflow vulnerability in ash.c:6030 in busybox before 1.35. In the environment of Internet of Vehicles, this vulnerability can be executed from command to arbitrary code execution.",
              "text": "Vulnerability CVE-2022-48174\nSeverity: CRITICAL\nPackage: ssl_client\nFixed Version: 1.36.1-r1\nLink: [CVE-2022-48174](https://avd.aquasec.com/nvd/cve-2022-48174)\nThere is a stack overflow vulnerability in ash.c:6030 in busybox before 1.35. In the environment of Internet of Vehicles, this vulnerability can be executed from command to arbitrary code execution."
            },
            "helpUri": "https://avd.aquasec.com/nvd/cve-2022-48174",
            "id": "CVE-2022-48174",
            "name": "OsPackageVulnerability",
            "properties": {
              "precision": "very-high",
              "security-severity": "9.8",
              "tags": [
                "vulnerability",
                "security",
                "CRITICAL"
              ]
            },
            "shortDescription": {
              "text": "stack overflow vulnerability in ash.c leads to arbitrary code execution"
            }
          },
          ...
        ]
      }
    }
  ]
}

```
 
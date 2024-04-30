# Schema Validator

This document outlines how Ratify can be used to verify the schema of any reference artifact. The `schemavalidator` verifier is added as a plugin to the Ratify verification framework. Currently the schema validator verifier supports JSON schema validation.

## Configuration

### K8s

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-schemavalidator
spec:
  name: schemavalidator
  artifactTypes: vnd.aquasecurity.trivy.report.sarif.v1
  parameters: 
    schemas:
      application/sarif+json: https://json.schemastore.org/sarif-2.1.0-rtm.5.json
```
| Name    | Required | Description                                                                                                                            | Default Value |
| ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| schemas | yes      | A mapping between the schema name to the schema path. The path can be either a URL or a canonical file path that starts with `file://` | ""            |

### JSON config

```json
 "plugins": [
      {
        "name": "schemavalidator",
        "artifactTypes": "application/vnd.aquasecurity.trivy.report.sarif.v1",
        "schemas": {
            "application/sarif+json": "https://json.schemastore.org/sarif-2.1.0-rtm.5.json"
          }
      }
 ]
```
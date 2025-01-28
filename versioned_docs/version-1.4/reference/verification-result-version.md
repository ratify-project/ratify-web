# Verification Response

Verification Response is the data returned for external data request calls. As we add new features, the Verification Response may change its format. To make it easy for users and other developers to work with different formats, we have implemented versioning support. This document lists all the versions of the Verification Response that have ever existed and will be updated whenever we make a new change to the format.

# Table of Contents
- [Verification Response](#verification-response)
- [Table of Contents](#table-of-contents)
- [Verification Response Versions and Policy Providers](#verification-response-versions-and-policy-providers)
- [Supported Versions](#supported-versions)
  - [0.1.0](#010)
    - [Definition](#definition)
    - [Example](#example)
  - [0.2.0](#020)
    - [Definition](#definition-1)
    - [Example](#example-1)
  - [1.0.0](#100)
    - [Definition](#definition-2)
    - [Example](#example-2)
  - [1.1.0](#110)
    - [Definition](#definition-3)
    - [Example](#example-3)

# Verification Response Versions and Policy Providers
As outlined in [policy providers documentation](./custom%20resources/policies.md), Ratify supports both config and rego policies. However, due to historical reasons, these two policy providers generate different Verification Response formats. The config policy provider generates Verification Response in version 0.x, while the rego policy provider uses version 1.x. The primary difference between these versions is that 0.x was not well designed to handle nested verification and multiple verifiers for the same artifact. We already have a tracking [issue](https://github.com/ratify-project/ratify/issues/1690) to unify the Verification Response format in the future.

# Supported Versions

## 0.1.0
### Definition
```yaml
definitions:
  VerificationResponse:
    type: object
    properties:
      isSuccess:
        type: boolean
      version:
        type: string
        description: The version of the verification report
      verifierReports:
        type: array
        items:
          $ref: '#/definitions/VerifierReport'
  VerifierReport:
    type: object
    properties:
      subject:
        type: string
        description: Digested reference of the subject that was verified
      isSuccess:
        type: boolean
        description: The result of the verification
      name:
        type: string
        description: The name of the verifier that performed the verification
      type:
        type: string
        description: The type of the verifier that performed the verfication
      message:
        type: string
        description: The message describing the verification result
      extensions:
        type: object
        description: Any extended information about the verification result
      artifactType:
        type: string
        description: The media type of the artifact being verified
      nestedResults:
        type: array
        items:
          $ref: '#/definitions/VerifierReport'
        description: The nested verification results
```
### Example
```json
{
  "version": "0.1.0",
  "isSuccess": true,
  "verifierReports": [
    {
      "subject": "registry:5000/sbom@sha256:4139357ed163984fe8ea49eaa0b82325dfc4feda98d0f6691b24f24cd6f0591e",
      "isSuccess": true,
      "name": "sbom-verifier-1",
      "type": "sbom",
      "message": "SBOM verification success. The schema is good.",
      "extensions": {
        "created": "2023-05-08T17:11:15Z",
        "creators": [
          "Organization: acme",
          "Tool: Microsoft.SBOMTool-1.0.2"
        ],
        "licenseListVersion": ""
      },
      "artifactType": "org.example.sbom.v0",
      "nestedResults": [
        {
          "subject": "registry:5000/sbom@sha256:a59b9a5ee8ce41fed4be7f6b8d8619bd9e619bbda6b7b1feb591c3c85f6ab7af",
          "isSuccess": true,
          "name": "notation-verifier-1",
          "type": "notation",
          "message": "signature verification success",
          "extensions": {
            "Issuer": "CN=ratify-bats-test,O=Notary,L=Seattle,ST=WA,C=US",
            "SN": "CN=ratify-bats-test,O=Notary,L=Seattle,ST=WA,C=US"
          },
          "artifactType": "application/vnd.cncf.notary.signature"
        }
      ]
    }
  ]
}
```

## 0.2.0
### Definition
```yaml
definitions:
  VerificationResponse:
    type: object
    properties:
      isSuccess:
        type: boolean
      version:
        type: string
        description: The version of the verification report
      traceID:
        type: string
        description: The trace ID for the validation request, which can be used for filtering logs
      timestamp:
        type: string
        description: The timestamp when the validation request was made
      verifierReports:
        type: array
        items:
          $ref: '#/definitions/VerifierReport'
  VerifierReport:
    type: object
    properties:
      subject:
        type: string
        description: Digested reference of the subject that was verified
      isSuccess:
        type: boolean
        description: The result of the verification
      verifierName:
        type: string
        description: The name of the verifier that performed the verification
      name:
        type: string
        description: The name of the verifier that performed the verification. Deprecated in v1.3.0, please use `verifierName` instead
      verifierType:
        type: string
        description: The type of the verifier that performed the verfication 
      type:
        type: string
        description: The type of the verifier that performed the verfication. Deprecated in v1.3.0, please use `verifierType` instead
      referenceDigest:
        type: string
        description: The digest of the artifact that was verified
      message:
        type: string
        description: The message describing the verification result
      errorReason:
        type: string
        description: The root cause for the verification failure. This field is optional and should be used only when the verification fails
      remediation:
        type: string
        description: The remediation guideline to fix the verification failure. This field is optional and should be used only when the verification fails
      extensions:
        type: object
        description: Any extended information about the verification result
      artifactType:
        type: string
        description: The media type of the artifact being verified
      nestedResults:
        type: array
        items:
          $ref: '#/definitions/VerifierReport'
        description: The nested verification results
```
### Example
```json
{
  "version": "0.2.0",
  "isSuccess": true,
  "traceID": "e6827667-308f-4bee-bd25-4b40b7739441",
  "timestamp": "2024-08-28T15:04:15.682247974Z",
  "verifierReports": [
    {
      "subject": "registry:5000/sbom@sha256:4139357ed163984fe8ea49eaa0b82325dfc4feda98d0f6691b24f24cd6f0591e",
      "referenceDigest": "sha256:a59b9a5ee8ce41fed4be7f6b8d8619bd9e619bbda6b7b1feb591c3c85f6ab7af",
      "isSuccess": true,
      "verifierName": "sbom-verifier-1",
      "verifierType": "sbom",
      "message": "SBOM verification success. The schema is good.",
      "extensions": {
        "created": "2023-05-08T17:11:15Z",
        "creators": [
          "Organization: acme",
          "Tool: Microsoft.SBOMTool-1.0.2"
        ],
        "licenseListVersion": ""
      },
      "artifactType": "org.example.sbom.v0",
      "nestedResults": [
        {
          "subject": "registry:5000/sbom@sha256:a59b9a5ee8ce41fed4be7f6b8d8619bd9e619bbda6b7b1feb591c3c85f6ab7af",
          "referenceDigest": "sha256:bf67213f8e048c2262b1dd007a4380f03431e1aa2ab58c7afdce7c2f763f7684",
          "isSuccess": false,
          "verifierName": "notation-verifier-1",
          "verifierType": "notation",
          "message": "signature verification failed",
          "errorReason": "certificate expired",
          "remediation": "renew the certificate",
          "extensions": {
            "Issuer": "CN=ratify-bats-test,O=Notary,L=Seattle,ST=WA,C=US",
            "SN": "CN=ratify-bats-test,O=Notary,L=Seattle,ST=WA,C=US"
          },
          "artifactType": "application/vnd.cncf.notary.signature"
        }
      ]
    }
  ]
}
```

## 1.0.0
### Definition
```yaml
definitions:
  VerificationResponse:
    type: object
    properties:
      version:
        type: string
        description: The version of the verification report
      isSuccess:
        type: boolean
      verifierReports:
        type: array
        items:
          $ref: '#/definitions/VerifierReport'
  VerifierReport:
    type: object
    properties:
      subject:
        type: string
        description: Digested reference of the subject that was verified
      referenceDigest:
        type: string
        description: The digest of the artifact that was verified
      artifactType:
        type: string
        description: The media type of the artifact being verified
      verifierReports:
        type: array
        items:
          $ref: '#/definitions/InnerVerifierReport'
        description: The verification reports related to the artifact
      nestedReports:
        type: array
        items:
          $ref: '#/definitions/VerifierReport'
        description: The nested verification reports
  InnerVerifierReport:
    type: object
    properties:
      isSuccess:
        type: boolean
        description: The result of the verification
      message:
        type: string
        description: The message describing the verification result
      name:
        type: string
        description: The name of the verifier that performed the verification
      type:
        type: string
        description: The type of the verifier that performed the verification, optional
      extensions:
        type: object
        description: Any extended information about the verification result
```

### Example
```json
{
  "version": "1.0.0",
  "isSuccess": true,
  "verifierReports": [
    {
      "subject": "registry:5000/sbom@sha256:f291201143149e4006894b2d64202a8b90416b7dcde1c8ad997b1099312af3ce",
      "referenceDigest": "sha256:932dde71a9f26ddafa61e8a7df2b296b1787bcb6e75c515584a53776e81a8a00",
      "artifactType": "org.example.sbom.v0",
      "verifierReports": [
        {
          "isSuccess": true,
          "message": "SBOM verification success. The schema is good.",
          "name": "verifier-sbom-1",
          "type": "sbom",
          "extensions": {
            "created": "2023-05-11T05:20:43Z",
            "creators": [
              "Organization: acme",
              "Tool: Microsoft.SBOMTool-1.1.0"
            ],
            "licenseListVersion": ""
          }
        }
      ],
      "nestedReports": [
        {
          "subject": "registry:5000/sbom@sha256:932dde71a9f26ddafa61e8a7df2b296b1787bcb6e75c515584a53776e81a8a00",
          "referenceDigest": "sha256:bf67213f8e048c2262b1dd007a4380f03431e1aa2ab58c7afdce7c2f763f7684",
          "artifactType": "application/vnd.cncf.notary.signature",
          "verifierReports": [
            {
              "isSuccess": true,
              "message": "signature verification success",
              "name": "verifier-notation-1",
              "type": "notation",
              "extensions": {
                "Issuer": "CN=ratify-bats-test,O=Notary,L=Seattle,ST=WA,C=US",
                "SN": "CN=ratify-bats-test,O=Notary,L=Seattle,ST=WA,C=US"
              }
            }
          ],
          "nestedReports": []
        }
      ]
    }
  ]
}
```

## 1.1.0
### Definition
```yaml
definitions:
  VerificationResponse:
    type: object
    properties:
      version:
        type: string
        description: The version of the verification report
      isSuccess:
        type: boolean
      traceID:
        type: string
        description: The trace ID for the validation request, which can be used for filtering logs
      timestamp:
        type: string
        description: The timestamp when the validation request was made
      verifierReports:
        type: array
        items:
          $ref: '#/definitions/VerifierReport'
  VerifierReport:
    type: object
    properties:
      subject:
        type: string
        description: Digested reference of the subject that was verified
      referenceDigest:
        type: string
        description: The digest of the artifact that was verified
      artifactType:
        type: string
        description: The media type of the artifact being verified
      verifierReports:
        type: array
        items:
          $ref: '#/definitions/InnerVerifierReport'
        description: The verification reports related to the artifact
      nestedReports:
        type: array
        items:
          $ref: '#/definitions/VerifierReport'
        description: The nested verification reports
  InnerVerifierReport:
    type: object
    properties:
      isSuccess:
        type: boolean
        description: The result of the verification
      message:
        type: string
        description: The message describing the verification result
      errorReason:
        type: string
        description: The root cause for the verification failure. This field is optional and should be used only when the verification fails
      remediation:
        type: string
        description: The remediation guideline to fix the verification failure. This field is optional and should be used only when the verification fails
      verifierName:
        type: string
        description: The name of the verifier that performed the verification
      name:
        type: string
        description: The name of the verifier that performed the verification. Deprecated in v1.3.0, please use `verifierName` instead
      verifierType:
        type: string
        description: The type of the verifier that performed the verfication 
      type:
        type: string
        description: The type of the verifier that performed the verfication. Deprecated in v1.3.0, please use `verifierType` instead
      extensions:
        type: object
        description: Any extended information about the verification result
```

### Example
```json
{
  "version": "1.1.0",
  "isSuccess": true,
  "traceID": "e6827667-308f-4bee-bd25-4b40b7739441",
  "timestamp": "2024-08-28T15:04:15.682247974Z",
  "verifierReports": [
    {
      "subject": "registry:5000/sbom@sha256:f291201143149e4006894b2d64202a8b90416b7dcde1c8ad997b1099312af3ce",
      "referenceDigest": "sha256:932dde71a9f26ddafa61e8a7df2b296b1787bcb6e75c515584a53776e81a8a00",
      "artifactType": "org.example.sbom.v0",
      "verifierReports": [
        {
          "isSuccess": true,
          "message": "SBOM verification success. The schema is good.",
          "verifierName": "verifier-sbom-1",
          "verifierType": "sbom",
          "extensions": {
            "created": "2023-05-11T05:20:43Z",
            "creators": [
              "Organization: acme",
              "Tool: Microsoft.SBOMTool-1.1.0"
            ],
            "licenseListVersion": ""
          }
        }
      ],
      "nestedReports": [
        {
          "subject": "registry:5000/sbom@sha256:932dde71a9f26ddafa61e8a7df2b296b1787bcb6e75c515584a53776e81a8a00",
          "referenceDigest": "sha256:bf67213f8e048c2262b1dd007a4380f03431e1aa2ab58c7afdce7c2f763f7684",
          "artifactType": "application/vnd.cncf.notary.signature",
          "verifierReports": [
            {
              "isSuccess": false,
              "message": "signature verification failed",
              "errorReason": "certificate expired",
              "remediation": "renew the certificate",
              "verifierName": "verifier-notation-1",
              "verifierType": "notation",
              "extensions": {
                "Issuer": "CN=ratify-bats-test,O=Notary,L=Seattle,ST=WA,C=US",
                "SN": "CN=ratify-bats-test,O=Notary,L=Seattle,ST=WA,C=US"
              }
            }
          ],
          "nestedReports": []
        }
      ]
    }
  ]
}
```
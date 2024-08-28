---
sidebar_position: 1
---

# Notation

Notation is a built-in verifier to Ratify. Notation currently supports X.509 based PKI and identities, and uses a trust store and trust policy to determine if a signed artifact is considered authentic.

## Configuration

### Kubernetes

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-notation
spec:
  name: notation
  artifactTypes: application/vnd.cncf.notary.signature
  parameters:
    verificationCertStores:  # maps a Trust Store to KeyManagementProvider resources with certificates 
      ca: # trust-store-type
        ca-certs: # name of the trustStore
          - <NAMESPACE>/<KEY MANAGEMENT PROVIDER NAME> # namespace/name of the key management provider CRD to include in this trustStore
      tsa: # trust-store-type
        tsa-certs: # name of the trustStore
          - <NAMESPACE>/<KEY MANAGEMENT PROVIDER NAME> # namespace/name of the key management provider CRD to include in this trustStore
    trustPolicyDoc: # policy language that indicates which identities are trusted to produce artifacts
      version: "1.0"
      trustPolicies:
        - name: default
          registryScopes:
            - "*"
          signatureVerification:
            level: strict
          trustStores:
            - ca:ca-certs
            - tsa:tsa-certs
          trustedIdentities:
            - "*"
```

| Name                   | Required | Description                                                                                                                                                                                       | Default Value |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| verificationCerts      | no       | An array of string. Notation verifier will load all certificates from path specified in this array.                                                                                               | ""            |
| verificationCertStores | no       | Defines a collection of key management provider objects. This property supersedes the path defined in `verificationCerts`. CLI NOT supported.                                                     | ""            |
| trustPolicyDoc         | yes      | [Trust policy](https://github.com/notaryproject/notaryproject/blob/main/specs/trust-store-trust-policy.md) is a policy language that indicates which identities are trusted to produce artifacts. | ""            |

There are two ways to configure verification certificates:

1. `verificationCerts`: Notation verifier will load all certificates from path specified in this array.

2. `verificationCertStores`: Defines a collection of Notary Project [Trust Stores](https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#trust-store). Notary Project specification defines a [Trust Policy](https://github.com/notaryproject/notaryproject/blob/main/specs/trust-store-trust-policy.md), which is a policy construct to specify which identities and Trust Stores are trusted to produce artifacts in a verification. The name of KeyManagementProvider (KMP) resource(s) must be accurately provided. When a KMP name is specifed, the notation verifier will be configured to trust all certificates fetched from that particular KMP resource. 

> NOTE 0: CLI is NOT SUPPORTED.

> NOTE 1: `verificationCertStore` is able to reference a [KeyManagementProvider](../../reference/custom%20resources/key-management-providers.md) to construct trust stores. When referencing a namespaced KMP resource, ensure to include the corresponding namespace prefix, while cluster-wide KMP should be referenced by its name directly. Refer to [this section](../../reference/custom%20resources/key-management-providers.md#utilization-in-verifiers) for more information.

> NOTE 2: `verificationCertStores` supersedes `verificationCerts` if both fields are specified.

> NOTE 3: `verificationCertStores` currently supported values for `trust-store-type` are `ca`, `signingAuthority` and `tsa`(coming soon).  For backward compatibility, users can either specify the truststore type or omit it, in which case it will default to the ca type.

> **WARNING!**: Starting in Ratify v1.2.0, the `KeyManagementProvider` resource replaces `CertificateStore`. It is NOT recommended to use both `CertificateStore` and `KeyManagementProvider` resources together. If using helm to upgrade Ratify, please make sure to delete any existing `CertificateStore` resources. For self-managed `CertificateStore` resources, users should migrate to the equivalent `KeyManagementProvider`. If migration is not possible and both resources must exist together, please make sure to use DIFFERENT names for each resource type. Ratify is configured to prefer `KMP` resources when a matching `CertificateStore` with same name is found.

Sample Notation yaml spec:

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: notation-wabbit
spec:
  name: notation
  artifactTypes: application/vnd.cncf.notary.signature
  parameters:
    verificationCertStores:
      ca:
        ca-certs: 
          - gatekeeper-system/kmp-akv-ca
      tsa:
        tsa-certs: 
          - gatekeeper-system/kmp-akv-tsa
    trustPolicyDoc:
      version: "1.0"
      trustPolicies:
        - name: default
          registryScopes:
            - "*"
          signatureVerification:
            level: strict
          trustStores:
            - ca:ca-certs
            - tsa:tsa-certs
          trustedIdentities:
            - "*"
```

In the example, the verifier's configuration references 2 `KeyManagementProvider`s, kmp-akv-ca, kmp-akv-tsa. Here, `ca:ca-certs` is one of the trust stores specifing and the `ca-certs` suffix corresponds to the `ca-certs` certificate collection listed in the `verificationCertStores` section.
To use the Time-stamping feature(coming soon) users need to config trust store type accordingly. In the sample, `tsa:tsa-certs` is the trust stores specifing for Time-stamping and the `tsa-certs` suffix corresponds to the `tsa-certs` certificate collection listed in the `verificationCertStores` section.

### CLI

```json
{
    "store": {
        "version": "1.0.0",
        "plugins": [
            {
                "name": "oras",
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
                "name": "notation",
                "artifactTypes": "application/spdx+json",
                "verificationCerts": [
                    "/usr/local/ratify-certs/notation/truststore"
                ],
                "trustPolicyDoc": {
                    "version": "1.0",
                    "trustPolicies": [
                        {
                            "name": "default",
                            "registryScopes": [
                                "*"
                            ],
                            "signatureVerification": {
                                "level": "strict"
                            },
                            "trustStores": [
                                "ca:ca-certs",
                                "tsa:tsa-certs"
                            ],
                            "trustedIdentities": [
                                "*"
                            ]
                        }
                    ]
                }
            }
        ]
    }
}
```

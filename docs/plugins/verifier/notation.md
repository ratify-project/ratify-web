---
sidebar_position: 1
---

# Notation

Notation is a built-in verifier to Ratify. Notation currently supports X.509 based PKI and identities, and uses a trust store and trust policy to determine if a signed artifact is considered authentic.

[[_TOC_]]

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
      tsa: # trust-store-type; optional, please remove if timestamp verification is not required
        tsa-certs: # name of the trustStore; optional, please remove if timestamp verification is not required
          - <NAMESPACE>/<KEY MANAGEMENT PROVIDER NAME> # namespace/name of the key management provider CRD to include in this trustStore; optional, please remove if timestamp verification is not required
    trustPolicyDoc: # policy language that indicates which identities are trusted to produce artifacts
      version: "1.0"
      trustPolicies:
        - name: default
          registryScopes:
            - "*"
          signatureVerification:
            level: strict
            verifyTimestamp: "always" # optional, this parameter is only applicable if timestamp verification has been enabled. The default value is `always`, which means timestamp will always be validated. If you want to verify timestamp only when any code signing certificate has expired, set the value to `afterCertExpiry`. 
          trustStores: # trustStore must be trust-store-type:trust-store-name specified in verificationCertStores
            - ca:ca-certs
            - tsa:tsa-certs # optional, please remove if timestamp verification is not required.
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

- The Trust Stores currently supports three kinds of identities, additional identities may be supported in future:

  - Certificates: The x509/ca trust store contains named stores that contain Certificate Authority (CA) root certificates.
  - SigningAuthority Certificate: The x509/signingAuthority trust store contains named stores that contain Signing Authority's root certificates.
  - Timestamping Certificates: The x509/tsa trust store contains named stores that contain Timestamping Authority (TSA) root certificates.

> NOTE 0: CLI is NOT SUPPORTED.

> NOTE 1: `verificationCertStore` is able to reference a [KeyManagementProvider](../../reference/custom%20resources/key-management-providers.md) to construct trust stores. When referencing a namespaced KMP resource, ensure to include the corresponding namespace prefix, while cluster-wide KMP should be referenced by its name directly. Refer to [this section](../../reference/custom%20resources/key-management-providers.md#utilization-in-verifiers) for more information.

> NOTE 2: `verificationCertStores` supersedes `verificationCerts` if both fields are specified.

> NOTE 3: `verificationCertStores` currently supported values for `trust-store-type` are `ca`, `signingAuthority` and `tsa`.  For backward compatibility, users can either specify the truststore type or omit it, in which case it will default to the ca type.

> **WARNING!**: Starting in Ratify v1.2.0, the `KeyManagementProvider` resource replaces `CertificateStore`. It is NOT recommended to use both `CertificateStore` and `KeyManagementProvider` resources together. If using helm to upgrade Ratify, please make sure to delete any existing `CertificateStore` resources. For self-managed `CertificateStore` resources, users should migrate to the equivalent `KeyManagementProvider`. If migration is not possible and both resources must exist together, please make sure to use DIFFERENT names for each resource type. Ratify is configured to prefer `KMP` resources when a matching `CertificateStore` with same name is found.

Sample Notation yaml spec:

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-notation
spec:
  name: notation
  artifactTypes: application/vnd.cncf.notary.signature
  parameters:
    verificationCertStores:
      ca:
        ca-certs: 
          - gatekeeper-system/kmp-akv-ca
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
          trustedIdentities:
            - "*"
```

In the example, the verifier's configuration references 2 `KeyManagementProvider`s, `kmp-akv-ca`. Here, `ca:ca-certs` is one of the trust stores specifing and the `ca-certs` suffix corresponds to the `ca-certs` certificate collection listed in the `verificationCertStores` section.

### CLI

Sample Notation CLI config:

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
                                "ca:ca-certs"
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

## Timestamping Configuration

In the X.509 Public Key Infrastructure (PKI) system, digital signatures must be generated within the certificate’s validity period, as expired certificates compromise the signature’s trustworthiness. The [RFC 3161](https://datatracker.ietf.org/doc/html/rfc3161) standard defines the internet X.509 PKI Time-Stamp Protocol (TSP), where a timestamp is issued by a trusted third party acting as a Time Stamping Authority (TSA). These trusted timestamps extend the trust of signatures created within certificates validity, enabling successful signature verification even after certificates have expired.

### Kubernetes

Sample Notation yaml spec with timestamping configuration:

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-notation
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
            verifyTimestamp: "always" # The default value is `always`, which means timestamp will always be validated. If you want to verify timestamp only when any code signing certificate has expired, set the value to `afterCertExpiry`. 
          trustStores:
            - ca:ca-certs
            - tsa:tsa-certs # To enable timestamp verification, `tsa` type of trust stores MUST be configured.
          trustedIdentities:
            - "*"
```

To use the timestamping feature, you need to configure the trust store type accordingly. In the example, `tsa:tsa-certs` is the trust store specified for timestamp verification, and the `tsa-certs` suffix corresponds to the `tsa-certs` certificate collection listed in the `verificationCertStores` field.

### CLI

Sample Notation CLI config with timestamping configuration:

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
                                "level": "strict",
                                "verifyTimestamp": "always" // The default value is `always`, which means timestamp will always be validated. If you want to verify timestamp only when any code signing certificate has expired, set the value to `afterCertExpiry`. 
                            },
                            "trustStores": [
                                "ca:ca-certs",
                                "tsa:tsa-certs" // To enable timestamp verification, `tsa` type of trust stores MUST be configured.
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

## Certificate Revocation Check (CRL)

Ratify supports CRL based on notation-core-go v1.2.0-rc1 and notation-go v1.3.0-rc1

## Intro
Certificate validation is an essential step during signature validation. Currently Ratify supports checking for revoked certificates through OCSP supported by notation-go library. However, OCSP validation requires internet connection for each validation while CRL could be cached for better performance. As notary-project added the CRL support for notation signature validation, and Ratify utilized it.

Starting from Root to leaf certificate, for each certificate in the certificate chain, perform the following steps to check its revocation status:

- If the certificate being validated doesn't include information OCSP or CRLs then no revocation check is performed and the certificate is considered valid(not revoked).
- If the certificate being validated includes either OCSP or CRL information, then the one which is present is used for revocation check.
- If both OCSP URLs and CDP URLs are present, then OCSP is preferred over CRLs. If revocation status cannot be determined using OCSP because of any reason such as unavailability then fallback to using CRLs for revocation check.

CRL download location (URL) can be obtained from the certificate's CRL Distribution Point (CDP) extension. If the certificate contains multiple CDP locations then each location download is attempted in sequential order, until a 200 response is received for any of the location. For each CDP location, Notary Project verification workflow will try to download the CRL. If the CRL cannot be downloaded within the timeout threshold the revocation result will be "revocation unavailable".


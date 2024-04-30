# Notation

Notation is a built-in verifier to Ratify. Notation currently supports X.509 based PKI and identities, and uses a trust store and trust policy to determine if a signed artifact is considered authentic.

There are two ways to configure verification certificates:

1. `verificationCerts`: Notation verifier will load all certificates from path specified in this array.

2. `verificationCertStores`: Defines a collection of Notary Project [Trust Stores](https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#trust-store). Notary Project specification defines a [Trust Policy](https://github.com/notaryproject/notaryproject/blob/main/specs/trust-store-trust-policy.md), which is a policy construct to specify which identities and Trust Stores are trusted to produce artifacts in a verification. The name of KMP resource(s) must be accurately provided. When a KMP name is specifed, the notation verifier will be configured to trust all certificates fetched from that particular KMP resource.

> NOTE: `verificationCertStores` supersedes `verificationCerts` if both fields are specified.
> **WARNING!**: Starting in Ratify v1.2.0, the `KeyManagementProvider` resource replaces `CertificateStore`. It is NOT recommended to use both `CertificateStore` and `KeyManagementProvider` resources together. If using helm to upgrade Ratify, please make sure to delete any existing `CertificateStore` resources. For self-managed `CertificateStore` resources, users should migrate to the equivalent `KeyManagementProvider`. If migration is not possible and both resources must exist together, please make sure to use DIFFERENT names for each resource type. Ratify is configured to prefer `KMP` resources when a matching `CertificateStore` with same name is found.

In the following example, the verifier's configuration references 2 `KeyManagementProvider`s, kmp-akv, kmp-akv1. Here, `ca:certs` is the only trust store specified and the `certs` suffix corresponds to the `certs` certification collection listed in the `verificationCertStores` section.

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
    verificationCertStores:  # maps a Trust Store to KeyManagementProvider resources with certificates 
      certs: # name of the trustStore
        - gatekeeper-system/kmp-akv # namespace/name of the key management provider CRD to include in this trustStore
        - gatekeeper-system/kmp-akv1 
    trustPolicyDoc: # policy language that indicates which identities are trusted to produce artifacts
      version: "1.0"
      trustPolicies:
        - name: default
          registryScopes:
            - "*"
          signatureVerification:
            level: strict
          trustStores:
            - ca:certs
          trustedIdentities:
            - "*"
```

| Name                   | Required | Description                                                                                                                                                                                                                                                                                                                                      | Default Value |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| verificationCerts      | no       | An array of string. Notation verifier will load all certificates from path specified in this array                                                                                                                                                                                                                                               | ""            |
| verificationCertStores | no       | Defines a collection of cert store objects. This property supersedes the path defined in `verificationCerts`. It is assumed that the referenced key management provider exists in the Ratify installed namespace. To reference a certificate store defined in a different namespace, please specify the full namespace name. E.g. `mynamespace/myCert` | ""            |
| trustPolicyDoc         | yes      | [Trust policy](https://github.com/notaryproject/notaryproject/blob/main/specs/trust-store-trust-policy.md) is a policy language that indicates which identities are trusted to produce artifacts.                                                                                                                                                | ""            |

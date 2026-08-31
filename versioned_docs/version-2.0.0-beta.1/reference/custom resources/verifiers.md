Verifier
---

Ratify supports many verifiers to validate different artifact types. Please refer to [plugins](../../plugins/verifier/) documentation for details on supported verifiers.

## Table of Contents
- [Verifier](#verifier)
- [Table of Contents](#table-of-contents)
- [Scope](#scope)
- [Common properties](#common-properties)
- [Configuration guidelines](#configuration-guidelines)
  - [Notation-verifier](#notation-verifier)
    - [Template](#template)
    - [Example](#example)
  - [Cosign verifier](#cosign-verifier)
    - [Template](#template-1)

## Scope
Verifiers can be defined as cluster-wide resources(using the kind `Verifier`) or namespaced resources(using the kind `NamespacedVerifier`).

Namespaced verifiers will only apply to the namespace in which they are defined. If a verification request targeting a namespace cannot find a verifier in required namespace, it will look up the cluster-wide verifiers.

Cluster-wide verifiers are applied as the default global verifier if no namespaced verifier is specified in required namespace.

Each verifier must specify the `name` of the verifier and the `artifactType` this verifier handles.

## Common properties
```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier # NamespacedVerifier has the same spec.
metadata:
  name: test-verifier
spec:
  name: # REQUIRED: [string], the unique type of the verifier (notation, cosign)
  artifactType: # REQUIRED: [string], comma seperated list, artifact type this verifier handles
  address: # OPTIONAL: [string], Plugin path, defaults to value of env "RATIFY_CONFIG" or "~/.ratify/plugins"
  version: # OPTIONAL: [string], Version of the external plugin, defaults to 1.0.0. On ratify initialization, the specified version will be validated against the supported plugin version.
  source:
    artifact: # OPTIONAL: [string], Source location to download the plugin binary, learn more at docs/reference/dynamic-plugins.md e.g. wabbitnetworks.azurecr.io/test sample-verifier-plugin:v1
  parameters: # OPTIONAL: [object] Parameters specific to this verifier
```
## Configuration guidelines
### Notation Verifier
#### Template
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
      ca: # CA type of the trustStore
        ca-certs: # name of the trustStore
          - <NAMESPACE>/<KEY MANAGEMENT PROVIDER NAME> # namespace/name of the key management provider CRD to include in this trustStore
      tsa: # TSA type of the trustStore
        tsa-certs: # name of the trustStore
          - <NAMESPACE>/<KEY MANAGEMENT PROVIDER NAME> # namespace/name of the key management provider CRD to include in this trustStore
    trustPolicyDoc: # policy language that indicates which identities are trusted to produce artifacts
      version: "1.0"
      trustPolicies:
        - name: # REQUIRED: [string], trust policy name. MUST be unique across policies
          registryScopes: # REQUIRED: [array of strings], string list of scopes
          signatureVerification: # REQUIRED: [object], indicate how signature verification is performed.
          trustStores: # REQUIRED: [array of strings], list of trust stores to use for verification
          trustedIdentities: # REQUIRED: [array of strings], list of identities trusted to produce artifacts
```
| Name                   | Required | Description                                                                                                                                                                                       | Default Value |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| verificationCerts      | no       | An array of string. Notation verifier will load all certificates from path specified in this array.                                                                                               | ""            |
| verificationCertStores | no       | Defines a collection of key management provider objects. This property supersedes the path defined in `verificationCerts`.                                                                        | ""            |
| trustPolicyDoc         | yes      | [Trust policy](https://github.com/notaryproject/notaryproject/blob/main/specs/trust-store-trust-policy.md) is a policy language that indicates which identities are trusted to produce artifacts. | ""            |
| trustStores            | yes      | An array of `trust store names` defined in `verificationCertStores`. And each store should be in format: `<trust store type>:<trust store name>`                                                  | ""            |

#### Example
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
          trustStores: # trustStore must be trust-store-type:trust-store-name specified in verificationCertStores
            - ca:ca-certs
            - tsa:tsa-certs
          trustedIdentities:
            - "*"
```

### Cosign Verifier
#### Template
```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-cosign
spec:
  artifactTypes: application/vnd.dev.cosign.artifact.sig.v1+json
  name: cosign
  parameters:
    trustPolicies: # OPTIONAL: [list], trust policies matching keys to scopes
    - name: # REQUIRED: [string], trust policy name. MUST be unique across policies
      version: # OPTIONAL: [string], trust policy schema version  
      scopes: # REQUIRED: [list], string list of scopes
      tLogVerify: # OPTIONAL: [boolean] enables/disables transparency log verification. default is 'true'
      rekorURL: # OPTIONAL: [string] specifies a rekor URL pointing to a transparency log server. default is https://rekor.sigstore.dev
      keys: # OPTIONAL: [list], keys associated with trust policy. Either 'keys' or 'keyless' must be defined
        - provider: # OPTIONAL: [string], name of key management provider
          file: # OPTIONAL: [string], absolute file path or reference to a public key
          name: # OPTIONAL: [string], name of key stored in referenced provider
          version: # OPTIONAL: [string], version of named key
      keyless: # OPTIONAL: keyless verification configuration. Either 'keys' or 'keyless' must be defined
        ctLogVerify: # OPTIONAL: [boolean] enables/disables certificate transparency log verification. default is 'true'
        certificateIdentity: # OPTIONAL: [string] exact string identity associated with public certificate
        certificateIdentityRegExp: # OPTIONAL: [string] string regular expression of matching identity associated with public certificate.
        certificateOIDCIssuer: # OPTIONAL: [string] exact string OIDC issuer associated with public certificate
        certificateOIDCIssuerRegExp: # OPTIONAL: [string] string regular expression of matching OIDC issuer associated with public certificate.
    key: # DEPRECATED,OPTIONAL: [string], absolute file path to public key
    rekorURL: # DEPRECATED,OPTIONAL: [string], rekor server URL
```
Please refer to [Cosign Verifier](../../plugins/verifier/cosign.md) for more details and examples.
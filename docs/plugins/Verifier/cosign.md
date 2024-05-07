---
sidebar_position: 2
---

# Cosign

Cosign is a built-in verifier. With Cosign verifier, Ratify can be used to verify signatures generated using [Cosign](https://github.com/sigstore/cosign/). The verifier implementation uses [Cosign](https://github.com/sigstore/cosign/) packages to perform verifications. Cosign verifier works with container registries where cosign related artifacts are linked as specially formatted tag to the subject image. It also is compatible with OCI 1.1 supported Cosign which pushes the signature OCI Image as a referrer to the subject image. (Note: this is currently experimental for cosign) It works only with [ORAS](../Store/oras.md) referrer store plugin that uses the OCI registry API to discover and fetch the artifacts.

## Signing

Please refer cosign documentation on how to sign an image using cosign using [key-pair based signatures](https://docs.sigstore.dev/key_management/signing_with_self-managed_keys/) and [keyless signatures](https://docs.sigstore.dev/signing/quickstart/#keyless-signing-of-a-container).

## Some Caveats

A configuration flag `cosignEnabled` is introduced to the ORAS Store configuration. This flag is required to be set to `true` in order to fetch cosign signatures stored as in an OCI Image tagged using Cosign's unique convention. Regardless of the flag being set, Ratify will fetch OCI 1.1-compliant cosign signatures returned via the referrers API.

## Trust Policy

A trust policy binds a set of verification configurations against a set of registry-reference scopes. In particular, a trust policy allows a user to define the trust keys to use in against a set of scopes.

**Sample trust policies:**

```yaml
- name: policy-1
  version: 1.0.0  
  scopes:
    - "myregistry.io/namespace1/image:tag"
  keys:
    - provider: inline-keymanagementprovider-1
- name: policy-2
  version: 1.0.0  
  scopes:
    - "myregistry.io/namespace2*"
  keys:
    - provider: inline-keymanagementprovider-2
```

### Scopes

Each trust policy defines a list of `scopes`. When an image reference for verification is provided, cosign uses the `scopes` to match a single trust policy.

Some characteristics of a scope:

- a scope may contain a wildcard `*` character which represents 0+ matching characters
- the wild card character MUST be the last letter in the scope string if used
- multiple wildcard characers CANNOT be used
- a scope that does NOT have a suffixed `*` character, it is assumed to be an absolute reference. The entire scope must be an exact match to the image reference.

There are restrictions on scopes list within and across trust policies:

- scopes within or across trust policies CANNOT overlap in any form regardless if it's an absolute scope or a scope using a wildcard character
  - INVALID: given scope-A = `myregistry.io/*` & scope-B = `myregistry.io/namespace/*`, these scopes overlap since scope-B is contained in scope-A
  - INVALID: given scope-A = `myregistry.io/*` & scope-B = `myregistry.io/namespace/image:tag`, these scopes overlap since absolute scope-B is contained in scope-A
  - VALID: given scope-A = `myregistry.io/namespace1/*` & scope-B = `myregistry.io/namespace2/*`, these scopes do NOT overlap since neither scope can overlap with each other
  - Why do we enforce strict scope overlap checks? To avoid unintended verification behaviors at verification time when scope matching occurs. For higher security bar, Ratify makes sure that every single scope is guaranteed to match to a single trust policy. This validation occurs on creation of the verifier and NOT at verification time allowing users to catch misconfigurations ahead of time.

The single wildcard `*` scope is a special global scope that encompasses ALL references. Only a single trust policy can define a `*` global scope. If `*` scope exists in conjunction with other trust policies containing more granular scopes, the trust policy with a more granular matching scope will be selected instead.

### Keys

Trust policy can be configured with a list of `keys` that are trusted for this particular policy. Each entry in the list of `keys` corresponds to either: all the keys in a particular `KeyManagementProvider` resource OR a specific key.

The `provider` field is always required except for when the `file` field is defined. The `provider` is the name of the `KeyManagementProvider` resource Ratify should look for configured keys from. If the `name` field is not provided for a specific key, all keys in the `KeyManagementProvider` are trusted.

The `name` field specifies a specific key defined in the provider. An optional `version` can be defined if the latest version is not desired.

The `file` field defines an absolute file path to a local public key. This field should NOT be used in conjunction with `provider`, `name`, `version`.


### Limitations

Currently, Cosign trust policies only support key-based configurations. Keyless support will be added soon.

## Demo: Multi-key, Multi-image Verification

Alice manages multiple container images across a development and test environment. Container images for each environment are partitioned by namespace in the registry. Build pipelines for all images use Cosign to sign the image. The key used for testing is NOT the same as the key used for the development environment.

Alice woud like to verify that all images used by resources in her team's Kubernetes cluster are signed with a valid cosign signature. To achieve this, Alice setups Ratify with OPA Gatekeeper.

### Recording

[![asciicast](https://asciinema.org/a/658139.svg)](https://asciinema.org/a/658139)

### Walkthrough



## Keyless Verification

This section outlines how to use `ratify` to verify the signatures signed using keyless signatures.

> [!WARNING]
> Cosign keyless verification may result in verification timeout due to Fulcio and Rekor server latencies

### Configuration

#### Kubernetes

```yaml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-cosign
spec:
  name: cosign
  artifactTypes: application/vnd.dev.cosign.artifact.sig.v1+json
  parameters:
    rekorURL: https://rekor.sigstore.dev
---
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Store
metadata:
  name: store-oras
spec:
  name: oras
  parameters:
    cacheEnabled: true
    cosignEnabled: true
    ttl: 10
```

#### CLI

```json
{
    "store": {
        "version": "1.0.0",
        "plugins": [
            {
                "name": "oras",
                "cosignEnabled": true
            }
        ]
    },
    "policy": {
        "version": "1.0.0",
        "plugin": {
            "name": "configPolicy",
            "artifactVerificationPolicies": {
                "application/vnd.dev.cosign.artifact.sig.v1+json": "any"
            }
        }
    },
    "verifier": {
        "version": "1.0.0",
        "plugins": [
            {
                "name":"cosign",
                "artifactTypes": "application/vnd.dev.cosign.artifact.sig.v1+json",
                "rekorURL": "https://rekor.sigstore.dev"
            }
        ]
    }
}
```

Please note that the `key` is not specified in the config. This is because the keyless verification uses ephemeral keys and certificates, which are signed automatically by the [fulcio](https://github.com/sigstore/fulcio) root CA. Signatures are stored in the [Rekor](https://github.com/sigstore/rekor) transparency log, which automatically provides an attestation as to when the signature was created.

The `rekorURL` MUST be provided for keyless verification. Otherwise, signature validation will fail.
If using a custom Rekor transparency log instance, you can customize the Rekor URL using the `rekorURL` field.

### Usage

```bash
$ ratify verify --config ~/.ratify/config.json --subject myregistry.io/example/hello-world@sha256:f54a58bc1aac5ea1a25d796ae155dc228b3f0e11d046ae276b39c4bf2f13d8c4
{
  "isSuccess": true,
  "verifierReports": [
    {
      "subject": "myregistry.io/example/hello-world@sha256:f54a58bc1aac5ea1a25d796ae155dc228b3f0e11d046ae276b39c4bf2f13d8c4",
      "isSuccess": true,
      "name": "cosign",
      "message": "cosign verification success. valid signatures found",
      "extensions": 
      {
        "signatures": [
          {
            "bundleVerified": true,
            "isSuccess": true,
            "signatureDigest": "sha256:abc123"
          }
        ]
      },
      "artifactType": "application/vnd.dev.cosign.artifact.sig.v1+json"
    }
  ]
}
```

## Configuration

### Kubernetes

```yaml
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
      keys: # OPTIONAL: [list], keys associated with trust policy
        - provider: # OPTIONAL: [string], name of key management provider
          file: # OPTIONAL: [string], absolute file path or reference to a public key
          name: # OPTIONAL: [string], name of key stored in referenced provider
          version: # OPTIONAL: [string], version of named key
    key: # DEPRECATED,OPTIONAL: [string], absolute file path to public key
    rekorURL: # DEPRECATED,OPTIONAL: [string], rekor server URL
```

### CLI

There is currently no support for CLI using `KeyManagementProvider` and trust policies. Please refer to legacy [configuration](#cli-1).

## Legacy: Key-pair based verification

This section outlines how to use `ratify` to verify the signatures signed using key pairs.

Following is an example `ratify` config with cosign verifier. Please note the `key` refers to the public key generated by `cosign generate-key-pair` command. It is used to verify the signature signed by cosign.

### Configuration

#### Kubernetes

```yaml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-cosign
spec:
  name: cosign
  artifactTypes: application/vnd.dev.cosign.artifact.sig.v1+json
  parameters:
    key: /path/to/cosign.pub
---
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Store
metadata:
  name: store-oras
spec:
  name: oras
  parameters:
    cacheEnabled: true
    cosignEnabled: true
    ttl: 10
```

#### CLI

```json
{
    "store": {
        "version": "1.0.0",
        "plugins": [
            {
                "name": "oras",
                "cosignEnabled": true
            }
        ]
    },
    "policy": {
        "version": "1.0.0",
        "plugin": {
            "name": "configPolicy",
            "artifactVerificationPolicies": {
                "application/vnd.dev.cosign.artifact.sig.v1+json": "any"
            }
        }
    },
    "verifier": {
        "version": "1.0.0",
        "plugins": [
            {
                "name":"cosign",
                "artifactTypes": "application/vnd.dev.cosign.artifact.sig.v1+json",
                "key": "/path/to/cosign.pub"
            }
        ]
    }
}
```

### Usage

```bash
$ ratify verify --config ~/.ratify/config.json --subject myregistry.io/example/hello-world@sha256:f54a58bc1aac5ea1a25d796ae155dc228b3f0e11d046ae276b39c4bf2f13d8c4
{
  "isSuccess": true,
  "verifierReports": [
    {
      "subject": "myregistry.io/example/hello-world@sha256:f54a58bc1aac5ea1a25d796ae155dc228b3f0e11d046ae276b39c4bf2f13d8c4",
      "isSuccess": true,
      "name": "cosign",
      "message": "cosign verification success. valid signatures found",
      "extensions": 
      {
        "signatures": [
          {
            "bundleVerified": false,
            "isSuccess": true,
            "signatureDigest": "sha256:abc123"
          }
        ]
      },
      "artifactType": "application/vnd.dev.cosign.artifact.sig.v1+json"
    }
  ]
}
```

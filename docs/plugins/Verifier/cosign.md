---
sidebar_position: 2
---

# Cosign

Cosign is a built-in verifier. With the Cosign verifier, Ratify can be used to verify signatures generated using [Cosign](https://github.com/sigstore/cosign/). The verifier implementation uses [Cosign](https://github.com/sigstore/cosign/) packages to perform verifications. Cosign verifier works with container registries where cosign related artifacts are linked as a specially formatted tag to the subject image. It also is compatible with OCI 1.1 supported Cosign which pushes the signature OCI Image as a referrer to the subject image. (Note: this is currently experimental for cosign) It works only with [ORAS](../Store/oras.md) referrer store plugin, which uses the OCI registry API to discover and fetch the artifacts.

## Signing

Please refer to cosign documentation on how to sign an image using cosign using [key-pair based signatures](https://docs.sigstore.dev/key_management/signing_with_self-managed_keys/) and [keyless signatures](https://docs.sigstore.dev/signing/quickstart/#keyless-signing-of-a-container).

## Some Caveats

A configuration flag `cosignEnabled` is introduced to the ORAS Store configuration. This flag is required to be set to `true` in order to fetch cosign signatures stored in an OCI Image tagged with Cosign's unique convention (`<hash-algorithm>-<hash-of-subject-image>.sig`). Regardless of the flag being set, Ratify will fetch OCI 1.1-compliant cosign signatures returned via the referrers API.

## Trust Policy

A trust policy binds a set of verification configurations against a set of registry-reference scopes. In particular, a trust policy allows a user to define the trusted keys to use for a given set of scopes.

**Sample trust policies:**

```yaml
- name: policy-1
  version: 1.0.0  
  scopes:
    - "myregistry.io/namespace1/image*"
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

- A scope MAY contain a wildcard `*` character which represents 0+ matching characters
- The wild card character MUST be the last character in the scope string, if used at all
- Multiple wildcard characers CANNOT be used within the same scope
- A scope, which does NOT have a suffixed `*` character, is assumed to be an absolute reference. The entire scope must be an exact match to the image reference.

There are restrictions on `scopes` listed within and across trust policies:

- Scopes within or across trust policies CANNOT overlap in any form, regardless of it being an absolute scope or a scope using a wildcard character.
  - INVALID: given scope-A = `myregistry.io/*` & scope-B = `myregistry.io/namespace/*`, these scopes overlap since scope-B is contained in scope-A
  - INVALID: given scope-A = `myregistry.io/*` & scope-B = `myregistry.io/namespace/image@sha256:abcd1234`, these scopes overlap since absolute scope-B is contained in scope-A
  - VALID: given scope-A = `myregistry.io/namespace1/*` & scope-B = `myregistry.io/namespace2/*`, these scopes do NOT overlap since neither scope can overlap with each other
  - Why do we enforce strict scope overlap checks? To avoid unintended verification behaviors at verification time when scope matching occurs. To set a higher security bar, Ratify makes sure that every single scope is guaranteed to match to a single trust policy. This validation occurs on creation of the verifier and NOT at verification time, thus allowing users to catch misconfigurations ahead of time.

The single wildcard `*` scope is a special global scope that encompasses ALL references. Only a single trust policy can define a `*` global scope. If `*` scope exists in conjunction with other trust policies containing more granular scopes, the trust policy with a more granular matching scope will be selected instead.

>WARNING: Ratify, by default, enables tag-to-digest mutation. All tag based scopes will NOT match to an intended scope. Either scope to a specific digest or provide a wild card scope such as `myregistry.io/namespace/image*`

### Keys

A trust policy can be configured with a list of `keys` that are trusted for a particular policy. Each entry in the list of `keys` corresponds to either: all the keys in a particular `KeyManagementProvider` resource OR a specific key when a `name` and optionally a `version` is provided.

The `provider` field is always required except for when the `file` field is defined. The `provider` is the name of the `KeyManagementProvider` resource Ratify should look for configured keys from. If the `name` field is not provided for a specific key, all keys in the `KeyManagementProvider` are trusted.

The `name` field specifies a specific key defined in the provider. An optional `version` can be defined if the latest version is not desired.

The `file` field defines an absolute file path to a local public key. This field should NOT be used in conjunction with `provider`, `name`, `version`.

### Limitations

Currently, Cosign trust policies only support key-based configurations. Keyless support will be added soon.

## Demo: Multi-key, Multi-image Verification

Alice manages multiple container images across a development and test environment. Container images for each environment are partitioned by namespace in the registry. Build pipelines for all images use Cosign to sign the image. The key used for testing is NOT the same as the key used for the development environment.

Alice woud like to verify that all images used by resources in her team's Kubernetes cluster are signed with a valid cosign signature. To achieve this, Alice sets up Ratify with OPA Gatekeeper.

### Recording

[![asciicast](https://asciinema.org/a/658139.svg)](https://asciinema.org/a/658139)

### Walkthrough

Prerequisites:

- Kubernetes Cluster
- Gatekeeper already installed on the cluster with proper configuration. Refer to this [guide](../../quickstarts/quickstart-manual.md#step-1-setup-gatekeeper-with-external-data) for steps.
- 2 unique container images pushed to different namespaces to a registry. One namespace for 'dev' and one for 'test'
  - Generate 2 cosign key pairs and use key pairs to sign each image individually.
  - Make public keys for each pair accessible for use in steps below

1. Install Ratify

```bash
helm repo add ratify https://deislabs.github.io/ratify
helm install ratify ratify/ratify \
    --atomic \
    --namespace gatekeeper-system \
    --set cosign.enabled=true \
    --set featureFlags.RATIFY_CERT_ROTATION=true \
    --set-file cosignKeys[0]=<insert file path to dev public key> \
    --set-file cosignKeys[1]=<insert file path to test public key>
```

2. Apply Constraint and ConstraintTemplate

```bash
kubectl apply -f https://deislabs.github.io/ratify/library/default/template.yaml
kubectl apply -f https://deislabs.github.io/ratify/library/default/samples/constraint.yaml
```

3. Apply Cosign verifier

```bash
cat <<EOF > cosign-verifier.yaml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-cosign
spec:
  name: cosign
  artifactTypes: application/vnd.dev.cosign.artifact.sig.v1+json
  parameters:
    trustPolicies:
      - name: dev
        scopes:
          - "<insert dev namespace registry path; ex: myregistry.io/dev>*"
        keys:
          - provider: keymanagementprovider-dev
      - name: test
        scopes:
          - "<insert test namespace registry path; ex: myregistry.io/test>*"
        keys:
          - provider: keymanagementprovider-test
EOF

kubectl apply -f cosign-verifier.yaml 
```

4. Deploy a pod that references an image in 'dev' registry namespace. This should succeed.

```bash
kubectl run demo -n default --image=<insert dev namespace image reference>
```

5. Deploy a pod that references an image in 'test' registry namespace. This should succeed.

```bash
kubectl run demo2 -n default --image=<insert test namespace image reference>
```

6. Check the Ratify logs to verify each key was used for that namespace-specific verification.  

```bash
kubectl logs deploy/ratify -n gatekeeper-system
```

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

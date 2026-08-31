---
sidebar_position: 2
---

# Cosign

`cosign` is a built-in Ratify verifier that validates [Sigstore Cosign](https://github.com/sigstore/cosign) signatures. It supports both keyless (certificate identity + OIDC issuer) and key-based verification.

In Ratify v2 the verifier is configured inline in the `verifiers` list of an [Executor](../../concepts/executor.md); there is no separate `Verifier` CRD.

Cosign signatures are commonly published as a specially formatted tag alongside the subject image. To let the store discover them, set `allowCosignTag: true` on the `registry-store`.

:::caution
Keyless verification in v2.0.0-beta.1 initializes a Sigstore TUF client, which needs to write to the local cache directory. The default container runs with a read-only root filesystem, so keyless verification currently fails at startup (`mkdir /home/nonroot/.sigstore: read-only file system`). Key-based verification is unaffected.
:::

## Keyless configuration

```yaml
apiVersion: config.ratify.sh/v2alpha1
kind: Executor
metadata:
  name: executor-cosign
spec:
  scopes:
    - ghcr.io
  verifiers:
    - name: cosign-verifier
      type: cosign
      parameters:
        trustPolicies:
          - scopes:
              - "ghcr.io"
            certificateIdentity: "https://github.com/user/repo/.github/workflows/build.yml@refs/heads/main"
            certificateOIDCIssuer: "https://token.actions.githubusercontent.com"
            ignoreTLog: false
            ignoreCTLog: false
  stores:
    - type: registry-store
      parameters:
        credential:
          provider: static
        allowCosignTag: true
```

## Key-based configuration

Provide a public key through a key provider (`inline` or `azurekeyvault`) under `keys`:

```yaml
      parameters:
        trustPolicies:
          - scopes:
              - "registry.example.com"
            keys:
              inline:
                keys: |
                  -----BEGIN PUBLIC KEY-----
                  ...
                  -----END PUBLIC KEY-----
```

### Parameters

`trustPolicies` is a list; each policy accepts:

| Field | Description |
| ----- | ----------- |
| `scopes` | Scopes this policy applies to. Optional; defaults to all executor scopes. |
| `certificateIdentity` / `certificateIdentityRegex` | Expected signing certificate identity (exact or regex) for keyless verification. |
| `certificateOIDCIssuer` / `certificateOIDCIssuerRegex` | Expected OIDC issuer (exact or regex) for keyless verification. |
| `ignoreTLog` | Skip Rekor transparency-log verification. |
| `ignoreCTLog` | Skip certificate-transparency-log verification. |
| `ignoreObserverTimestamps` | Ignore observer timestamps. |
| `keys` | Public key provider (`inline` or `azurekeyvault`) for key-based verification. |

See [Configuration → Cosign Verifier](../../ratify-configuration.mdx#cosign-verifier) for more.

# Verifier

A **verifier** validates a specific artifact type (for example a signature) associated with a subject image and returns a verification report. Verifiers are one of the pluggable components that the [Executor](./executor.md) coordinates during verification.

In Ratify v2, verifiers are **built-in**: they are compiled into Ratify and selected by `type`. Each verifier instance is declared inline in the `verifiers` list of an `Executor` (or `NamespacedExecutor`) custom resource — there is no separate `Verifier` CRD.

## Supported verifiers

| Type | Description |
| ---- | ----------- |
| `notation` | Verifies [Notary Project](https://notaryproject.dev/) (X.509) signatures using a trust store and trusted identities. |
| `cosign` | Verifies [Sigstore Cosign](https://github.com/sigstore/cosign) signatures (keyless or key-based). |

## Configuration

Each entry in `spec.verifiers` accepts:

| Field | Required | Description |
| ----- | -------- | ----------- |
| `name` | yes | Unique identifier of the verifier instance within the executor. Referenced by the policy enforcer. |
| `type` | yes | Verifier implementation to use (`notation` or `cosign`). |
| `parameters` | no | Type-specific options. |

Example:

```yaml
apiVersion: config.ratify.sh/v2alpha1
kind: Executor
metadata:
  name: executor-sample
spec:
  scopes:
    - registry.example.com
  verifiers:
    - name: notation-verifier
      type: notation
      parameters:
        certificates:
          - type: ca
            inline:
              certs: |
                -----BEGIN CERTIFICATE-----
                ...
                -----END CERTIFICATE-----
  stores:
    - type: registry-store
      parameters:
        credential:
          provider: static
```

Key material (certificates and keys) is supplied through **key providers** (`inline`, `files`, `azurekeyvault`) configured directly inside the verifier `parameters` — there is no separate `KeyManagementProvider` CRD in v2.

See the per-verifier pages for full parameter references:

- [Notation](../plugins/verifier/notation.md)
- [Cosign](../plugins/verifier/cosign.md)

For the complete configuration schema, see [Configuration](../ratify-configuration.mdx).

# Store

A **referrer store** (or **store**) discovers and retrieves artifacts and their referrers (signatures, SBOMs, and other metadata) for a subject image. Stores are one of the pluggable components that the [Executor](./executor.md) coordinates during verification.

In Ratify v2, stores are **built-in** and declared inline in the `stores` list of an `Executor` (or `NamespacedExecutor`) custom resource — there is no separate `Store` CRD.

## Supported stores

| Type | Description |
| ---- | ----------- |
| `registry-store` | Connects to OCI-compliant registries using [ORAS](https://oras.land/) to discover and pull artifacts. Supports registry authentication. |

`registry-store` is the only supported store in v2.0.0-beta.1.

## Configuration

Each entry in `spec.stores` accepts:

| Field | Required | Description |
| ----- | -------- | ----------- |
| `type` | yes | Store implementation. Use `registry-store`. |
| `scopes` | no | Scopes this store applies to. |
| `parameters` | no | Type-specific options. |

Example (registry store with static credentials):

```yaml
apiVersion: config.ratify.sh/v2alpha1
kind: Executor
metadata:
  name: executor-sample
spec:
  scopes:
    - registry.example.com
  stores:
    - type: registry-store
      parameters:
        credential:
          provider: static
          username: myuser
          password: mypassword
  verifiers:
    - name: notation-verifier
      type: notation
      parameters:
        certificates:
          - type: ca
            files:
              - /etc/ratify/certs/ca.pem
```

`registry-store` supports multiple credential providers (`static`, `azure`) and TLS options. See [Registry Store](../plugins/store/oras.md) and the full [Configuration](../ratify-configuration.mdx#store-configuration) reference for all parameters.

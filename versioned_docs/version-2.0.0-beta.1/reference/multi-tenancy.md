# Multi-tenancy

Ratify v2 supports multi-tenancy through the namespaced **`NamespacedExecutor`** custom resource, allowing multiple teams to share a single cluster while each manages its own verification configuration.

## Cluster-scoped vs namespaced executors

Ratify v2 exposes two custom resources in the `config.ratify.sh/v2alpha1` API group, and both share the same `spec` schema (`scopes`, `verifiers`, `stores`, `policyEnforcer`, `concurrency`):

| Resource | Scope | Applies to |
| -------- | ----- | ---------- |
| `Executor` | Cluster | Validation requests for workloads in any namespace. |
| `NamespacedExecutor` | Namespaced | Validation requests only for workloads deployed in the same namespace. |

## Resolution and precedence

When Ratify validates a workload, it selects the executor configuration as follows:

1. If a `NamespacedExecutor` in the workload's namespace matches the subject scope, it is used.
2. Otherwise, Ratify falls back to the cluster-scoped `Executor`.

This lets a cluster admin provide a secure default `Executor` for the whole cluster, while individual namespace admins tailor verification for their own namespace with a `NamespacedExecutor`.

:::caution Security note
Because a `NamespacedExecutor` overrides the cluster-scoped `Executor` for its namespace, it can **weaken** image verification there. Write access to `NamespacedExecutor` resources should be tightly restricted to trusted namespace admins via Kubernetes RBAC.
:::

## Example

A namespace admin for `team-a` deploys a `NamespacedExecutor` that verifies images from their own registry:

```yaml
apiVersion: config.ratify.sh/v2alpha1
kind: NamespacedExecutor
metadata:
  name: team-a-executor
  namespace: team-a
spec:
  scopes:
    - team-a.azurecr.io
  verifiers:
    - name: notation-verifier
      type: notation
      parameters:
        certificates:
          - type: ca
            files:
              - /etc/ratify/certs/team-a-ca.pem
  stores:
    - type: registry-store
      parameters:
        credential:
          provider: azure
  policyEnforcer:
    type: threshold-policy
    parameters:
      policy:
        rules:
          - verifierName: notation-verifier
        threshold: 1
```

The `spec` fields are identical to the cluster-scoped `Executor`. See [Configuration](../ratify-configuration.mdx) for the full schema.

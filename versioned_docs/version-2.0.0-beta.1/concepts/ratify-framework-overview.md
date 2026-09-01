# Framework Overview

Ratify is a verification engine that coordinates the verification of supply chain artifacts (signatures, SBOMs, attestations, and other metadata) associated with an image, and produces a single trust decision that an admission controller such as [OPA Gatekeeper](https://open-policy-agent.github.io/gatekeeper/) can act on.

## Core components

Ratify composes four pluggable component types. In v2 they are configured together, inline, in a single [Executor](./executor.md) custom resource.

- **[Store](./store.md)** — discovers and retrieves an artifact's referrers (signatures, SBOMs, etc.) from an OCI registry or a local OCI layout.
- **[Verifier](./verifier.md)** — validates a specific artifact type and returns a verification report. The built-in verifiers are `notation` and `cosign`.
- **Policy enforcer** — evaluates the individual verifier reports against a policy to determine the overall result. v2 ships the `threshold-policy` enforcer.
- **[Executor](./executor.md)** — the orchestrator that ties the stores, verifiers, and policy enforcer together and drives the verification workflow.

## Verification flow

1. A verification request arrives with a subject image reference (from the Gatekeeper external data provider or the executor API).
2. Ratify selects the executor whose `scopes` match the subject registry/repository.
3. For the subject, the configured **stores** are queried for referrer artifacts.
4. Each referrer is passed to the **verifiers** that can handle its artifact type, producing verifier reports.
5. The **policy enforcer** aggregates the reports and returns the final allow/deny decision.

## Scopes

Every executor declares one or more `scopes` (registry, repository, or wildcard registry patterns) that determine which images it is responsible for. Scopes must not overlap between executors. See [Configuration](../ratify-configuration.mdx#scope-patterns) for scope precedence rules.

## Custom resources

Ratify v2 exposes two custom resources in the `config.ratify.sh/v2alpha1` API group:

- `Executor` (cluster-scoped) — applies to the whole cluster.
- `NamespacedExecutor` (namespaced) — enables [multi-tenant](../reference/multi-tenancy.md) configuration per namespace.

Both share the same `spec` schema.

# Verifiers

Ratify v2 ships with built-in verifiers, selected by `type` in the `verifiers` list of an [Executor](../../concepts/executor.md). There are no external/binary verifier plugins in v2.

| Type | Description |
| ---- | ----------- |
| [`notation`](./notation.md) | Verifies [Notary Project](https://notaryproject.dev/) (X.509) signatures. |
| [`cosign`](./cosign.md) | Verifies [Sigstore Cosign](https://github.com/sigstore/cosign) signatures (keyless or key-based). |

See [Configuration](../../ratify-configuration.mdx#verifier-configuration) for the full verifier schema.

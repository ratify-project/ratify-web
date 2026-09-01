---
sidebar_position: 1
---

# Notation

`notation` is a built-in Ratify verifier that validates [Notary Project](https://notaryproject.dev/) signatures. It uses X.509 PKI with a trust store (certificates) and trusted identities to determine whether a signed artifact is authentic.

In Ratify v2 the verifier is configured inline in the `verifiers` list of an [Executor](../../concepts/executor.md); there is no separate `Verifier` CRD.

## Configuration

```yaml
apiVersion: config.ratify.sh/v2alpha1
kind: Executor
metadata:
  name: executor-notation
spec:
  scopes:
    - registry.example.com
  verifiers:
    - name: notation-verifier
      type: notation
      parameters:
        scopes:
          - registry.example.com
        trustedIdentities:
          - "*"
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

### Parameters

| Field | Required | Description |
| ----- | -------- | ----------- |
| `scopes` | no | Scopes this verifier applies to. Defaults to the executor scopes. See the [Notation trust policy constraints](https://github.com/notaryproject/specifications/blob/v1.1.0/specs/trust-store-trust-policy.md#trust-policy-constraints). |
| `trustedIdentities` | no | Identities trusted to produce signatures. See [trusted identities](https://github.com/notaryproject/specifications/blob/v1.1.0/specs/trust-store-trust-policy.md#trusted-identities-constraints). |
| `certificates` | yes | One or more certificate sources that make up the trust store. |

Each `certificates` entry has:

- `type` — trust-store type: `ca`, `signingAuthority`, or `tsa` (for timestamping). See [Notation trust stores](https://github.com/notaryproject/specifications/blob/v1.1.0/specs/trust-store-trust-policy.md#version-10).
- One key provider that supplies the certificates: `inline` (with a `certs` field holding the PEM string), `files` (list of paths), or `azurekeyvault`.

See [Configuration → Notation Verifier](../../ratify-configuration.mdx#notation-verifier) for advanced examples, including multiple key providers and Azure Key Vault.

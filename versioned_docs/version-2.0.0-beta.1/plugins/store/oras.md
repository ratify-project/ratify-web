---
sidebar_position: 1
---

# Registry Store

`registry-store` is the built-in Ratify store for OCI-compliant registries. It uses the [ORAS](https://oras.land/) `oras-go` library to authenticate to a registry and to discover, list, and download a subject's referrer artifacts (signatures, SBOMs, and other metadata).

In Ratify v2 the store is configured inline in the `stores` list of an [Executor](../../concepts/executor.md); there is no separate `Store` CRD.

## Configuration

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
        allowCosignTag: true
        plainHttp: false
  verifiers:
    - name: notation-verifier
      type: notation
      parameters:
        certificates:
          - type: ca
            files:
              - /etc/ratify/certs/ca.pem
```

### Parameters

| Field | Required | Description | Default |
| ----- | -------- | ----------- | ------- |
| `credential` | no | Registry credential provider. Omit for anonymous/public registries. | anonymous |
| `plainHttp` | no | Use HTTP instead of HTTPS. Local testing only. | `false` |
| `allowCosignTag` | no | Enable tag-based discovery of Cosign signatures. Required when a `cosign` verifier is configured. | `false` |
| `caPem` / `caBase64` | no | Custom CA certificate (PEM or base64) for TLS verification. | – |
| `userAgent` | no | Custom User-Agent header. | – |
| `maxBlobBytes` / `maxManifestBytes` | no | Size limits for downloaded blobs/manifests. | – |

### Credential providers

**Static** (username/password or token):

```yaml
credential:
  provider: static
  username: myuser
  password: mytoken
```

**Azure Workload Identity:**

```yaml
credential:
  provider: azure
  clientID: "<optional>"
  tenantID: "<optional>"
```

`clientID` and `tenantID` are optional; when omitted the pod's workload identity is used.

> For local, insecure registries you can set `plainHttp: true`. It cannot be combined with `caPem`/`caBase64` (there is no TLS over plain HTTP).

For the complete registry-store schema, see [Configuration → Store Configuration](../../ratify-configuration.mdx#store-configuration).

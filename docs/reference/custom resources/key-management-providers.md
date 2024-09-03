# Key Management Provider

> **NOTE:** `KeyManagementProvider` replaces `CertificateStore` which is now DEPRECATED. See migration [guide](#migrating-from-certificatestore-to-kmp).

A `KeyManagementProvider` (`KMP`) represents key(s) and/or certificate(s) that are consumed by a verifier. `KMP` contains various providers for different use cases. Each provider is responsible for defining custom configuration and providing a set of public keys and/or x.509 certificates. Notation and Cosign verifiers can consume `KMP` resources to use during signature verification. Please refer to respective [Notation](../../plugins/verifier/notation.md) and [Cosign](../../plugins/verifier/cosign.md) verifier documentation on how to consume `KMP`.

## Table of Contents

- [Key Management Provider](#key-management-provider)
- [Table of Contents](#table-of-contents)
- [Scope](#scope)
- [Utilization in Verifiers](#utilization-in-verifiers)
  - [Examples](#examples)
- [Configuration guidelines](#configuration-guidelines)
  - [Inline](#inline)
    - [Template](#template)
  - [Azure Key Vault](#azure-key-vault)
    - [Template](#template-1)
- [Limitation](#limitation)
- [Status](#status)
- [Resource Create/Update](#resource-createupdate)
- [Migrating from `CertificateStore` to KMP](#migrating-from-certificatestore-to-kmp)
  - [Inline CertificateStore to Inline KMP](#inline-certificatestore-to-inline-kmp)
  - [Azure Key Vault CertificateStore to Azure Key Vault Key Management Provider](#azure-key-vault-certificatestore-to-azure-key-vault-key-management-provider)
  - [Notation Verifier](#notation-verifier)

## Scope

Key Management Provider can be defined as cluster-wide resources(using the kind `KeyManagementProvider`) or namespaced resources(using the kind `NamespacedKeyManagementProvider`).

## Utilization in Verifiers

The KeyManagementProvider serves primarily as a reference to key/certificate stores in Verifier CRs. Given that the Key Management Provider can exist either cluster-wide or within a namespace, users need to include the appropriate namespace prefix when referencing the KMP in Verifier CRs. To reference a namespaced KMP, the format should be `namespace/kmp-name`. Conversely, to reference a cluster-wide KMP, the format should simply be `kmp-name`.

In general, there are 2 valid use cases. One is a namespaced verifier references a namespaced KMP within the same namespace or a cluster-wide KMP. The other is a cluster-wide verifier references a cluster-wide KMP.

### Examples

**_Scenario 1_**: A namespaced verifier referencing both namespaced KMP and cluster-wide KMP.

```yaml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: NamespacedVerifier
metadata:
  name: verifier-notation
  namespace: default
spec:
  name: notation
  artifactTypes: application/vnd.cncf.notary.signature
  parameters:
    verificationCertStores:
      certs:
        - default/ratify-notation-inline-cert-0
        - ratify-notation-inline-cert-0
  # skip irrelevant fields
```

**_Scenario 2_**: A cluster-wide verifier referencing cluster-wide KMP.

```yaml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-notation
spec:
  name: notation
  artifactTypes: application/vnd.cncf.notary.signature
  parameters:
    verificationCertStores:
      certs:
        - ratify-notation-inline-cert-0
  # skip irrelevant fields
```

## Configuration guidelines

### Inline

#### Template

A provider that can specify a **single** certificate or key. The content is expected to be defined inline in the resource configuration.

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: KeyManagementProvider # NamespacedKeyManagementProvider has the same spec.
metadata:
  name: # a unique name
spec:
  type: inline
  parameters:
    contentType: # REQUIRED: [string] (key, certificate)
    value: # REQUIRED: [string] value of content
status:
  error: # error message if the operation failed
  issuccess: # boolean that indicate if operation was successful
  lastfetchedtime: # timestamp of last attempted fetch operation
  properties: # provider specific properties of the fetched certificates/keys. If the current fetch operation fails, this property displays the properties of last successfully cached certificate/key
```

| Name        | Required | Description                                    | Default Value |
| ----------- | -------- | ---------------------------------------------- | ------------- |
| contentType | yes      | 'key' or 'certificate'. Describes content type | ""            |
| value       | yes      | string content                                 | ""            |

Samples:

- [Inline KMP](https://github.com/ratify-project/ratify/blob/dev/config/samples/clustered/kmp/config_v1beta1_keymanagementprovider_inline.yaml)

### Azure Key Vault

#### Template

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: KeyManagementProvider
metadata:
  name: # a unique name
spec:
  type: azurekeyvault
  refreshInterval: # OPTIONAL: [string], time duration to refresh the certificates/keys. Disabled by default. Example: 1h, 30m, 1h30m. Valid time units are "ns", "us" (or "µs"), "ms", "s", "m", "h"
  parameters:
    vaultURI: # REQUIRED: [string], azure key vault URI
    tenantID: # REQUIRED: [string], Azure tenant ID
    clientID: # REQUIRED: [string], client ID of the identity to use to access key vault
    certificates: # OPTIONAL: [list], certificates in key vault to fetch
      - name: # REQUIRED: [string], certificate name
        version: # OPTIONAL [string], version identifier
    keys: # OPTIONAL: [list], keys in key vault to fetch
      - name: # REQUIRED: [string], key name
        version: # OPTIONAL [string], version identifier
```

| Name                    | Required | Description                                                                               | Default Value |
| ----------------------- | -------- | ----------------------------------------------------------------------------------------- | ------------- |
| vaultURI                | yes      | Azure key vault URI                                                                       | ""            |
| tenantID                | yes      | Azure tenant ID                                                                           | ""            |
| clientID                | yes      | client ID of the identity to use to access key vault                                      | ""            |
| certificates            | no       | list of certificates in key vault to fetch                                                | []            |
| certificates[*].name    | yes      | certificate name (as shown in key vault)                                                  | ""            |
| certificates[*].version | no       | version identifier (as shown in key vault). If not provided, latest version will be used. | ""            |
| keys                    | no       | list of keys in key vault to fetch                                                        | []            |
| keys[*].name            | yes      | key name (as shown in key vault)                                                          | ""            |
| keys[*].version         | no       | version identifier (as shown in key vault). If not provided, latest version will be used  | ""            |

Samples:

- [Azure Key Vault KMP](https://github.com/ratify-project/ratify/blob/dev/config/samples/clustered/kmp/config_v1beta1_keymanagementprovider_akv.yaml)
- [Azure Key Vault KMP Refresh Enabled](https://github.com/ratify-project/ratify/blob/dev/config/samples/clustered/kmp/config_v1beta1_keymanagementprovider_akv_refresh_enabled.yaml)

## Limitation

- If a key/certificate is in disabled state, KMP resource creation will FAIL. Users must remove reference to a disabled Key/Certificate or re-enable in Azure Key Vault.

- Ratify supports periodic refresh and polling of certificates/keys from Azure Key Vault. The `refreshInterval` field can be set to a time duration to refresh the certificates/keys. When no version of the certificate or key is specified, the latest version will be fetched and the resource will be updated. However, if a version is specified, the resource will be locked to that version and will not be updated.

- If the `refreshInterval` is set, verification may fail if the artifact being verified is signed with an older version of the certificate/key even if the older version is still valid/enabled. This is because Ratify only uses the latest stored certificate/key for verification. However, [support n-versions of certificates/keys](https://github.com/ratify-project/ratify/issues/1751) is planned in future releases.

- If `keys` are configured, the managed identity with `clientID` specified MUST be assigned the correct permissions to list, view, and download keys in the configured Key Vault.

- Azure Key Vault Certificates are built on top of keys and secrets. When a certificate is created, an addressable key and secret are also created with the same name. Ratify requires secret permissions to retrieve the public certificates for the entire certificate chain. Please set private keys to Non-exportable at certificate creation time to avoid security risk. Learn more about non-exportable keys [here](https://learn.microsoft.com/en-us/azure/key-vault/certificates/how-to-export-certificate?tabs=azure-cli#exportable-and-non-exportable-keys)

- Certificate/Key MUST be in PEM format. PKCS12 format with nonexportable private keys can NOT be parsed due to limitation of Golang certificate library.

- Refer to Azure Key Vault setup guide ratify-on-azure [quick start](https://github.com/ratify-project/ratify/blob/main/docs/quickstarts/ratify-on-azure.md#configure-access-policy-for-akv).

> Note: If you were unable to configure certificate policy, please consider specifying the public root certificate value inline using an [inline key management provider](#inline) to reduce risk of exposing a private key.

## Status

Get an overview of KMPs status:

```bash
kubectl get keymanagementproviders.config.ratify.deislabs.io
```

Get specific status of each certificate/key fetched in a single KMP

```bash
kubectl get keymanagementproviders.config.ratify.deislabs.io/<INSERT KMP NAME>
```

## Resource Create/Update

During KMP resource creation, the resource may successfully create even though the provider-specific schema is invalid.

For example:

1. The `contentType` field is missing for the `inline` KMP.
2. The `vaultURI` is missing in the Azure Key Vault KMP.

Please follow the steps [here](#status) to confirm status of the KMP.

## Migrating from `CertificateStore` to KMP

`CertificateStore` resource is deprecated starting in `v1.2.0`. Ratify will continue to support `CertificateStore` functionality until `v2.0.0` at which time it will be removed.

All existing functionality available in `CertificateStore` is available in `KeyManagementProvider`.

### Inline CertificateStore to Inline KMP

| CertificateStore          | KeyManagementProvider |
| ------------------------- | --------------------- |
| `.parameters.value`       | `.parameters.value`   |
| `.parameters.contentType` | N/A                   |

`contentType` is required and must be `key` OR `certificate`. This MUST be added when migrating.

### Azure Key Vault CertificateStore to Azure Key Vault Key Management Provider

| CertificateStore                                 | KeyManagementProvider                                              |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `.parameters.clientID`                           | `.parameters.clientId`                                             |
| `.parameters.tenantID`                           | `.parameters.tenantID`                                             |
| `.parameters.vaultURI`                           | `.parameters.vaultURI`                                             |
| `.parameters.certificates`                       | `.parameters.certificates[]` String content is now defined objects |
| `.parameters.certificates[*].certificateName`    | `.parameters.certificates[*].name`                                 |
| `.parameters.certificates[*].certificateVersion` | `.parameters.certificates[*].version`                              |

### Notation Verifier

Notation verifier's `verificationCertStores` array must be updated to reference the `KeyManagementProvider` resource name

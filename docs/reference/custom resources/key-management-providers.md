# Key Management Provider

> **NOTE:** `KeyManagementProvider` replaces `CertificateStore` which is now DEPRECATED. See migration [guide](#migrating-from-certificatestore-to-kmp).

A `KeyManagementProvider` (`KMP`) represents key(s) and/or certificate(s) that are consumed by a verifier. `KMP` contains various providers for different use cases. Each provider is responsible for defining custom configuration and providing a set of public keys and/or x.509 certificates. Notation and Cosign verifiers can consume `KMP` resources to use during signature verification. Please refer to respective [Notation](../../plugins/verifier/notation.md) and [Cosign](../../plugins/verifier/cosign.md) verifier documentation on how to consume `KMP`.

Key Management Provider can be defined as cluster-wide resources(using the kind `KeyManagementProvider`) or namespaced resources(using the kind `NamespacedKeyManagementProvider`).

Namespaced Key Management Providers will only apply to the namespace in which they are defined. If a verification request targeting a namespace cannot find a KMP in required namespace, it will look up the cluster-wide KMPs.

Cluster-wide KMPs are applied as the default global KMP if no namespaced KMP is specified in required namespace.

## Utilization in Verifiers
The KeyManagementProvider serves primarily as a reference to key/cert stores in Verifier CRs. Given that the Key Management Provider can exist either cluster-wide or within a namespace, users need to include the appropriate namespace prefix when referencing the KMP in Verifier CRs. To reference a namespaced KMP, the format should be `namespace/kmp-name`. Conversely, to reference a cluster-wide KMP, the format should simply be `kmp-name`.

## Inline

A provider that can specify a **single** certificate or key. The content is expected to be defined inline in the resource configuration.

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: KeyManagementProvider # NamespacedKeyManagementProvider has the same spec.
metadata:
  name:  # a unique name
spec:
  type: inline
  parameters:
    contentType: # REQUIRED: [string] (key, certificate)
    value: # REQUIRED: [string] value of content  
status:
  error:            # error message if the operation failed
  issuccess:        # boolean that indicate if operation was successful
  lastfetchedtime:  # timestamp of last attempted fetch operation
  properties: # provider specific properties of the fetched certificates/keys. If the current fetch operation fails, this property displays the properties of last successfully cached certificate/key
```

| Name        | Required | Description                                    | Default Value |
| ----------- | -------- | ---------------------------------------------- | ------------- |
| contentType | yes      | 'key' or 'certificate'. Describes content type | ""            |
| value       | yes      | string content                                 | ""            |

## Azure Key Vault

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: KeyManagementProvider
metadata:
  name: # a unique name
spec:
  type: azurekeyvault
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

### Limitation

- If a key/certificate is in disabled state, KMP resource creation will FAIL. Users must remove reference to a disabled Key/Certificate or re-enable in Azure Key Vault.

- Ratify does NOT yet support periodic refresh and polling of certificates/keys. If the default latest version changes, object is disabled/expired, or deleted, Ratify will only become aware once the KMP resource is reconciled (edited, deleted, added).

- If `keys` are configured, the managed identity with `clientID` specified MUST be assigned the correct permissions to list, view, and download keys in the configured Key Vault.

- Azure Key Vault Certificates are built on top of keys and secrets. When a certificate is created, an addressable key and secret are also created with the same name. Ratify requires secret permissions to retrieve the public certificates for the entire certificate chain. Please set private keys to Non-exportable at certificate creation time to avoid security risk. Learn more about non-exportable keys [here](https://learn.microsoft.com/en-us/azure/key-vault/certificates/how-to-export-certificate?tabs=azure-cli#exportable-and-non-exportable-keys)

- Certificate/Key MUST be in PEM format. PKCS12 format with nonexportable private keys can NOT be parsed due to limitation of Golang certificate library.

- Refer to Azure Key Vault setup guide ratify-on-azure [quick start](https://github.com/deislabs/ratify/blob/main/docs/quickstarts/ratify-on-azure.md#configure-access-policy-for-akv).

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

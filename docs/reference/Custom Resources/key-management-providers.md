# Key Management Provider

> **NOTE:** `KeyManagementProvider` replaces `CertificateStore` which is now DEPRECATED.

A `KeyManagementProvider` (`KMP`) represents key(s) and/or certificate(s) that are consumed by a verifier. `KMP` contains various providers for different use cases. Each provider is responsible for defining custom configuration and providing a set of public keys and x.509 certificates. Notation and cosign verifiers can consume KMP resources to use during signature verification. Please refer to respective Notation and Cosign verifier documentation on how to consume `KMP`. 

## Inline

A provider that can specify a **single** certificate or key. The content is expected to be defined inline in the resource configuration.

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: KeyManagementProvider
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

- If `keys` are configured, the managed identity with `clientID` specified MUST be assigned the correct permissions to list, view, download, and fetch keys in the configured Key Vault.

- Azure Key Vault Certificates are built on top of keys and secrets. When a certificate is created, an addressable key and secret are also created with the same name. Ratify requires secret permissions to retrieve the public certificates for the entire certificate chain. Please set private keys to Non-exportable at certificate creation time to avoid security risk. Learn more about non-exportable keys [here](https://learn.microsoft.com/en-us/azure/key-vault/certificates/how-to-export-certificate?tabs=azure-cli#exportable-and-non-exportable-keys)

- Please also ensure the certificate is in PEM format, PKCS12 format with nonexportable private keys can not be parsed due to limitation of Golang certificate library.

- Azure Key Vault setup guide in ratify-on-azure [quick start](https://github.com/deislabs/ratify/blob/main/docs/quickstarts/ratify-on-azure.md#configure-access-policy-for-akv).

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
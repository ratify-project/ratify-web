Store
---

A `Store` resource defines how to discover and retrieve reference types for a subject.
Please review doc [here](https://github.com/notaryproject/ratify/blob/main/docs/reference/store.md) for a full list of store capabilities.

## Table of Contents
- [Store](#store)
- [Table of Contents](#table-of-contents)
- [Scope](#scope)
- [Common properties](#common-properties)
- [Configuration guidelines](#configuration-guidelines)
  - [Oras Store](#oras-store)
    - [Template](#template)
    - [Auth provider configurations](#auth-provider-configurations)
      - [Docker config file](#docker-config-file)
        - [Template](#template-1)
      - [Kubernets secrets](#kubernets-secrets)
        - [Template](#template-2)
      - [Azure workload identity](#azure-workload-identity)
        - [Template](#template-3)
      - [Azure managed identity](#azure-managed-identity)
        - [Template](#template-4)

## Scope
Stores can be defined as cluster-wide resources(using the kind `Store`) or namespaced resources(using the kind `NamespacedStore`).

Namespaced stores will only apply to the namespace in which they are defined. If a verification request targeting a namespace cannot find a store in required namespace, it will look up the cluster-wide stores.

Cluster-wide stores are applied as the default global store if no namespaced store is specified in required namespace.

## Common properties
To see more sample store configuration, click [here](https://github.com/notaryproject/ratify/tree/main/config/samples). Each resource must specify the `name` of the store.

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Store # NamespacedStore has the same spec.
metadata:
  name: 
spec:
  name: required, name of the store
  address: optional. Plugin path, defaults to value of env "RATIFY_CONFIG" or "~/.ratify/plugins"
  version: optional. Version of the external plugin, defaults to 1.0.0. On ratify initialization, the specified version will be validated against the supported plugin version.
  source:  optional. Source location to download the plugin binary, learn more at docs/reference/dynamic-plugins.md
  parameters: optional. Parameters specific to this store
```

## Configuration guidelines
Currently Ratify only supports oras-store as the default implementation of ReferrerStore.

### Oras Store
#### Template
```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Store
metadata:
  name: store-oras
spec:
  name: oras
  parameters: 
    cacheEnabled: # defaults to true
    ttl: # TTL in seconds for ORAS cache. Default is 10
    useHttp: # Local testing ONLY. Disables TLS checks uses HTTP. Default is false.
    cosignEnabled: # enables discovery of cosign artifacts from registry. Default is false.
    localCachePath: # absolute file path to an existing/new ORAS OCI local store
    authProvider:
        name: # name of the auth provider type
        # auth provider specific fields here
```
| Name           | Required | Description                                                                                                                                                                                                              | Default Value               |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| cosignEnabled  | no       | This must be `true` if cosign verifier is enabled. Read more about cosign verifier [here](https://github.com/notaryproject/ratify/blob/main/plugins/verifier/cosign/README.md).                                         | `false`                     |
| authProvider   | no       | This is only required if pulling from a private repository. For all supported auth mode, please review [oras-auth-provider](https://github.com/notaryproject/ratify/blob/main/docs/reference/oras-auth-provider.md) doc | dockerConfig                  |
| cacheEnabled   | no       | Oras cache, cache for all referrers for a subject. Note: global cache must be enabled first                                                                                                                              | `false`                     |
| ttl            | no       | Time to live for entries in oras cache                                                                                                                                                                                   | 10 seconds                  |
| useHttp        | no       | Local testing ONLY. This needs to be set to `true` for  local insecure registries                                                                                                                                        | `false`                     |
| localCachePath | no       | Absolute file path to an existing/new ORAS OCI local store                                                                                                                                                               | `/.ratify/local_oras_cache` |

#### Auth provider configurations
Oras uses authentication credentials to authenticate with registry. The following auth providers are supported:
1. Docker config file
2. Azure workload identity
3. Kubernetes secrets
4. AWS IAM Roles for Service Accounts(IRSA)
5. Azure Managed Identity

Please refer to [Supported Providers](../../plugins/store/oras.md#supported-providers) for more details.

##### Docker config file
###### Template
```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Store
metadata:
  name: store-oras
spec:
  name: oras
  parameters: 
    authProvider:
      name: dockerConfig
      configPath: # OPTIONAL: [string] path to the docker config file
```
| Name       | Required | Description                          | Default Value |
| ---------- | -------- | ------------------------------------ | ------------- |
| configPath | no       | Path to the docker config file.used. | ""            |

##### Kubernets secrets
###### Template
```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Store
metadata:
  name: store-oras
spec:
  name: oras
  parameters: 
    authProvider:
      name: k8Secrets
      serviceAccountName: # OPTIONAL: [string] name of the service account
      secrets: # OPTIONAL: [array] list of secrets to be used for authentication
        - secretName: # REQUIRED: [string] name of the secret
          namespace: # OPTIONAL: [string] namespace of the secret
```
| Name               | Required | Description                                                                             | Default Value                  |
| ------------------ | -------- | --------------------------------------------------------------------------------------- | ------------------------------ |
| serviceAccountName | no       | Name of the service account. If not provided, the default service account will be used. | `default`                      |
| secrets            | no       | List of secrets to be used for authentication.                                          | `[]`                           |
| secretName         | yes      | Name of the secret.                                                                     | ""                             |
| namespace          | no       | Namespace of the secret.                                                                | namespace that Ratify deployed |
##### Azure workload identity
###### Template
```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Store
metadata:
  name: store-oras
spec:
  name: oras
  parameters: 
    authProvider:
      name: azureWorkloadIdentity
      clientID: # OPTIONAL: [string] client id of the identity
```
| Name     | Required | Description                | Default Value                              |
| -------- | -------- | -------------------------- | ------------------------------------------ |
| clientID | no       | Client id of the identity. | value of environment var `AZURE_CLIENT_ID` |
##### Azure managed identity
###### Template
```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Store
metadata:
  name: store-oras
spec:
  name: oras
  parameters: 
    authProvider:
      name: azureManagedIdentity
      clientID: # OPTIONAL: [string] client id of the identity
```
| Name     | Required | Description                | Default Value                              |
| -------- | -------- | -------------------------- | ------------------------------------------ |
| clientID | no       | Client id of the identity. | value of environment var `AZURE_CLIENT_ID` |
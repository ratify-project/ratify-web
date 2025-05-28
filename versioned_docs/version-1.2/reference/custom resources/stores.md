# Store

A `Store` resource defines how to discover and retrieve reference types for a subject.
Please review doc [here](https://github.com/notaryproject/ratify/blob/main/docs/reference/store.md) for a full list of store capabilities.

## Scope
Stores can be defined as cluster-wide resources(using the kind `Store`) or namespaced resources(using the kind `NamespacedStore`).

Namespaced stores will only apply to the namespace in which they are defined. If a verification request targeting a namespace cannot find a store in required namespace, it will look up the cluster-wide stores.

Cluster-wide stores are applied as the default global store if no namespaced store is specified in required namespace.

## Examples
To see more sample store configuration, click [here](https://github.com/ratify-project/ratify/tree/main/config/samples). Each resource must specify the `name` of the store.

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

# Store

A `Store` resource defines how to discover and retrieve reference types for a subject.
Please review doc [here](https://github.com/deislabs/ratify/blob/main/docs/reference/store.md) for a full list of store capabilities.
To see more sample store configuration, click [here](https://github.com/deislabs/ratify/tree/main/config/samples). Each resource must specify the `name` of the store.

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Store
metadata:
  name: 
spec:
  name: required, name of the store
  address: optional. Plugin path, defaults to value of env "RATIFY_CONFIG" or "~/.ratify/plugins"
  version: optional. Version of the external plugin, defaults to 1.0.0. On ratify initialization, the specified version will be validated against the supported plugin version.
  source:  optional. Source location to download the plugin binary, learn more at docs/reference/dynamic-plugins.md
  parameters: optional. Parameters specific to this store
```

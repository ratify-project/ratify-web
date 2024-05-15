# Verifier

Ratify supports many verifiers to validate different artifact types. Please refer to [plugins](../../plugins/Verifier/) documentation for details on supported verifiers.

Each verifier must specify the `name` of the verifier and the `artifactType` this verifier handles.

Common properties:

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: test-verifier
spec:
  name: # REQUIRED: [string], the unique type of the verifier (notation, cosign)
  artifactType: # REQUIRED: [string], comma seperated list, artifact type this verifier handles
  address: # OPTIONAL: [string], Plugin path, defaults to value of env "RATIFY_CONFIG" or "~/.ratify/plugins"
  version: # OPTIONAL: [string], Version of the external plugin, defaults to 1.0.0. On ratify initialization, the specified version will be validated against the supported plugin version.
  source:
    artifact: # OPTIONAL: [string], Source location to download the plugin binary, learn more at docs/reference/dynamic-plugins.md e.g. wabbitnetworks.azurecr.io/test sample-verifier-plugin:v1
  parameters: # OPTIONAL: [object] Parameters specific to this verifier
```

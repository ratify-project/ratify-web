# Verifier

Ratify supports many verifiers to validate different artifact types. Please refer to [plugins](../../plugins/Verifier/) documentation for details on supported verifiers.

Verifiers can be defined as cluster-wide resources(using the kind `Verifier`) or namespaced resources(using the kind `NamespacedVerifier`).

Namespaced verifiers will only apply to the namespace in which they are defined. If a verification request targeting a namespace cannot find a verifier in required namespace, it will look up the cluster-wide verifiers.

Cluster-wide verifiers are applied as the default global verifier if no namespaced verifier is specified in required namespace.

Each verifier must specify the `name` of the verifier and the `artifactType` this verifier handles.

Common properties:

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier # NamespacedVerifier has the same spec.
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

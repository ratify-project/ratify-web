Policy
---
A `Policy` resource defines a policy evaluating the verification results for a subject.

View more CRD samples [here](https://github.com/notaryproject/ratify/tree/main/config/samples/policy). The `metadata.name` MUST be set to `ratify-policy` for Ratify to apply. Ratify will ensure that only one policy is actively under evaluation by limiting the `metadata.name` to `ratify-policy`. 

## Table of Contents
- [Policy](#policy)
- [Table of Contents](#table-of-contents)
- [Scope](#scope)
- [Common properties](#common-properties)
- [Configuration guidelines](#configuration-guidelines)
  - [config-policy](#config-policy)
    - [Example](#example)
  - [rego-policy](#rego-policy)
    - [Template](#template)
    - [Example](#example-1)


## Scope
Policies can be defined as cluster-wide resources(using the kind `Policy`) or namespaced resources(using the kind `NamespacedPolicy`).

Namespaced policies will only apply to the namespace in which they are defined. If a verification request targeting a namespace cannot find a policy in required namespace, it will look up the cluster-wide policies.

Cluster-wide policies are applied as the default global policy if no namespaced policy is specified in required namespace.

## Common properties
```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Policy # NamespacedPolicy has the same spec.
metadata:
  name: "ratify-policy"
spec:
  type: "rego-policy"
  parameters: required. Parameters specific to this policy
```

Note: `spec.type` MUST be `config-policy` or `rego-policy` per the usage.

## Configuration guidelines

### config-policy
#### Example
```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Policy
metadata:
  name: "ratify-policy"
spec:
  type: "config-policy"
  parameters:
    artifactVerificationPolicies:
      "application/vnd.cncf.notary.signature": "any"
      default: "any"
```

| Name                                    | Required | Description                                                                                                | Default Value                                                |
| --------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| artifactVerificationPolicies            | yes      | Map of artifact type to policy; each entry in the map's policy must be satisfied for Ratify to return true | ""                                                           |
| default                                 | no       | The `default` policy applies to unspecified artifact types.                                                | "all"                                                        |
| `application/vnd.cncf.notary.signature` | no       | It could be any artifact type that is supported by Ratify.                                                 | There is no default value, users must specify `any` or `all` |

### rego-policy

#### Template
```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Policy
metadata:
  name: "ratify-policy"
spec:
  spec: "rego-policy"
  parameters:
    passthroughEnabled: # OPTIONAL: [boolean], If set to true, Ratify will NOT make the decision but pass verifier reports to Gatekeeper.
    policy: # OPTIONAL: [string], Rego policy query.
    policyPath: # OPTIONAL: [string], The path to the policy file if policy is mounted as a volume
```
| Name              | Required | Description                                                                                                  | Default Value |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------ | ------------- |
| passthroughEnabld | no       | If set to true, Ratify will NOT make the decision but pass verifier reports to Gatekeeper.                   | false         |
| policy            | no       | Rego policy query. Either policy or policyPath should be set, with policy taking precedence over policyPath. | ""            |
| policyPath        | no       | The path to the policy file if policy is mounted as a volume.                                                | ""            |
#### Example
Sample spec:
```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Policy
metadata:
  name: "ratify-policy"
spec:
  spec: "rego-policy"
  parameters:
    passthroughEnabled: false
    policy: |
      package ratify.policy

      default valid := false

      # all artifacts MUST be valid
      valid {
        not failed_verify(input)
      }

      # all reports MUST pass the verification
      failed_verify(reports) {
        [path, value] := walk(reports)
        value == false
        path[count(path) - 1] == "isSuccess"
      }

      # each artifact MUST have at least one report
      failed_verify(reports) {
        [path, value] := walk(reports)
        path[count(path) - 1] == "verifierReports"
        count(value) == 0
      }
```
| Name               | Required | Description                                                                                | Default Value |
| ------------------ | -------- | ------------------------------------------------------------------------------------------ | ------------- |
| passthroughEnabled | no       | If set to true, Ratify will NOT make the decision but pass verifier reports to Gatekeeper. | false         |
| policy             | no       | The policy language that defines the policy.                                               | ""            |
| policyPath         | no       | The path to the policy file if policy is mounted as a volume                               | ""            |


Please refer to the [Rego Templates](../rego-templates.md) for more examples on writing rego policies.
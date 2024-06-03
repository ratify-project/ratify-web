# Multi-tenancy

This page provides an overview of the design and configuration of Ratify for multi-tenancy support since v1.2.0.

Ratify supports multi-tenancy by sharing a cluster between multiple teams within an organization. See previous [discussion](https://github.com/deislabs/ratify/blob/dev/docs/discussion/Multi-Tenancy%20Support.md) on the multi-tenancy support for more details. Cluster admin MUST deploy a single Ratify within a specific namespace and use namespaces to isolate resources for different teams.

## Table of Contents
- [Access Control](#access-control)
  - [User Group](#user-group)
  - [Custom Resources](#custom-resources)
  - [Kubernetes Resources](#kubernetes-resources)
- [Custom Resources](#custom-resources-1)
- [Multi-tenancy: Opt-In/Out](#multi-tenancy-opt-inout)
  - [Apply Namespaced Custom Resources](#apply-namespaced-custom-resources)
  - [Constraint Template](#constraint-template)
- [Limitation](#limitation)
- [Setup](#setup)
  - [Step 1: Install Minikube](#step-1-install-minikube)
  - [Step 2: Create a new team admin user besides the existing minikube cluster admin user](#step-2-create-a-new-team-admin-user-besides-the-existing-minikube-cluster-admin-user)
  - [Step 3: Install Gatekeeper and Ratify](#step-3-install-gatekeeper-and-ratify)
  - [Step 4: Deploy a constraint supporting multi-tenancy](#step-4-deploy-a-constraint-supporting-multi-tenancy)
  - [Step 5: See Ratify in action with cluster-wide resources](#step-5-see-ratify-in-action-with-cluster-wide-resources)
  - [Step 6: Apply namespaced custom resources and delete cluster-wide resources](#step-6-apply-namespaced-custom-resources-and-delete-cluster-wide-resources)
  - [Step 7: See Ratify in action with namespaced resources](#step-7-see-ratify-in-action-with-namespaced-resources)


## Access Control
As we [discussed](https://github.com/deislabs/ratify/blob/dev/docs/discussion/Multi-Tenancy%20Support.md#access-control) during multi-tenancy designing, Ratify will offload access control on namespaced level to Kubernetes cluster. Admins can use ABAC or RBAC authorization to control access to resources in a namespace. The restricted resources include Custom Resources in Ratify and general resources in the cluster.

### User Group
We defined 3 user groups in the multi-tenancy [design](https://github.com/deislabs/ratify/blob/dev/docs/discussion/Multi-Tenancy%20Support.md#user-group): cluster admin, team admin, and team developer. 
1. Cluster admin has full control over the cluster and can manage all resources in the cluster. 
2. Team admin can manage resources in a namespace and assign permissions to team developers. 
3. Team developer can only access resources in a namespace and have limited permissions.

Note: This is just a general example of user groups. Users can define more user groups based on their requirements.

### Custom Resources
Ratify provides a set of Custom Resources to define policies, verifiers, stores, and key management providers. Users can define these resources in namespaced level or cluster-wide scope. The access control to these resources is managed by the cluster admin. 

For example, cluster admins are able to apply namespaced and cluster-wide CRs. Team admins have the capability to deploy namespaced CRs within their designated namespaces. Meanwhile, team devs are restricted to view CRs within their allocated namespaces.

In general, a cluster admin can assign different permissions to various user groups by applying appropriate roles and role bindings. For example, in the following [setup](#step-2-create-a-new-team-admin-user-besides-the-existing-minikube-cluster-admin-user), the cluster admin creates a team admin user responsible for managing deployments in the `default` namespace. The cluster admin assigns and binds roles to the team admin, enabling access to Namespaced CRs and pods within the `default` namespace. Simultaneously, the cluster admin retains access to all resources in the default namespace and cluster-scoped resources.

### Kubernetes Resources
Users also need to restrict access to Kubernetes resources, such as workload objects. For example, a cluster admin should ensure that users can only access pods, deployments, and services within their assigned namespace and with the appropriate permissions.

Another example is that a team admin should be able to deploy within their own namespace but not in other namespaces. Similarly, a team developer might have permissions to view the deployment but not modify it.

## Custom Resources
Ratify enables multi-tenancy support by allowing users to define resources in a namespace scope. This allows users to define policies, verifiers, stores, and key management providers in a namespace and have them apply only to that namespace. Additionally, users can define cluster-wide resources as defaults for namespaces that do not have a specific resource defined.

Below is a list of Custom Resources that support multi-tenancy.

| CR Type | Cluster-wide Kind | Namespaced Kind |
| ------- | ----------------- | --------------- |
| [Referrer Store](./custom%20resources/stores.md) | Store | NamespacedStore |
| [Verifier](./custom%20resources/verifiers.md) | Verifier | NamespacedVerifier |
| [Policy](./custom%20resources/policies.md) | Policy | NamespacedPolicy |
| [Key Management Provider](./custom%20resources/key-management-providers.md) | KeyManagementProvider | NamespacedKeyManagementProvider |

**Note1**: CertificateStore resource is in **DEPRECATED** stage. If users want to move to multi-tenancy, please migrate to [Key Management Provider](./custom%20resources/key-management-providers.md) by following provided [guides](./custom%20resources/key-management-providers.md#migrating-from-certificatestore-to-kmp).

**Note2**: In V2.0.0, we plan to rename cluster-wide resources to ClusterResource, e.g. ClusterVerifier, ClusterStore, ClusterPolicy and ClusterKeyManagementProvider, while renaming namespaced resources to Resource without prefix, e.g. Verifier, Store, Policy and KeyManagementProvider. This change will make the resource easier to understand and follow the conventions in Kubernetes community.

## Multi-tenancy: Opt-In/Out

There is no explicit feature flag to enable or disable multi-tenancy in Ratify. Users implicitly opt-in to use multi-tenancy when applying namespace specific resources (`NamespacedPolicy`, `NamespacedVerifier` etc.).

### Apply Namespaced Custom Resources
Users are supposed to use multi-tenancy by defining resources in a namespace scope or use cluster-wide resources as defaults. If users just want to enforce verification for the entire cluster, they should define resources in a cluster-wide scope.

***Note***: [Certificate Store](./custom%20resources/certificate-stores.md) is in **DEPRECATED** stage which is not designed for multi-tenancy scenario. Please migrate to [Key Management Provider](./custom%20resources/key-management-providers.md) by following provided [guides](./custom%20resources/key-management-providers.md#migrating-from-certificatestore-to-kmp).

### Constraint Template
Prior to version 1.2.0, Ratify only supported external data request keys in `artifact-url` format. From version 1.2.0 onwards, Ratify continues to support `artifact-url` for backward compatibility. However, it's recommended to migrate to new constraint templates that use the `[namespace]artifact-url` format for data request keys.  If you have already migrated to the new constraint template, no additional changes are required.

Examples:

Old constraint template using `artifact-url` formats: [default template](https://github.com/deislabs/ratify/blob/dev/library/default/template.yaml#L17-L19)

New constraint template using `[namespace]artifact-url` formats: [multi-tenancy template](https://github.com/deislabs/ratify/blob/dev/library/multi-tenancy-validation/template.yaml#L17-L19)

## Limitation
This is the first version we introduced multi-tenancy support in Ratify. There are some limitations that users should be aware of:

1. Ratify requires users to define cluster-wide Store CRs to mutate the image. We already created an [issue](https://github.com/open-policy-agent/gatekeeper/issues/3376) on Gatekeeper to support Ratify's user scenario. But the final plan would depend on GK's decision on this issue.
2. Logs and metrics isolation is not fully supported yet. Users are responsible for assigning correct permissions to those who need accsss to logging and instrumenting platform. In an upcoming release, Ratify will introduce a namespace field for all logs and metrics, making filtering easier. We have issues tracking this 2 scenarios and will be addressed in next release. 
https://github.com/deislabs/ratify/issues/1483
https://github.com/deislabs/ratify/issues/1484

## Setup
To set up multi-tenancy in Ratify, users need to follow the steps below:

### Step 1: Install Minikube
In this tutorial, we take [Minikube](https://minikube.sigs.k8s.io/docs/) as an example, but feel free to choose your own Kubernetes Cluster.

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64
```

### Step 2: Create a new team admin user besides the existing minikube cluster admin user

#### Step 2.1: Create a client certificate
```bash
mkdir cert && cd cert
# Generate a key using OpenSSL
openssl genrsa -out team-admin.key 2048
# Generate a Client Sign Request
openssl req -new -key team-admin.key -out team-admin.csr -subj "/CN=team-admin/O=group1"
# Generate the certificate
openssl x509 -req -in team-admin.csr -CA ~/.minikube/ca.crt -CAkey ~/.minikube/ca.key -CAcreateserial -out team-admin.crt -days 500
```
Now we have the `team-admin.key` and `team-admin.crt` to create a user.

#### Step 2.2: Create a new user
```bash
# Set a user entry in kubeconfig
kubectl config set-credentials team-admin --client-certificate=team-admin.crt --client-key=team-admin.key
# Set a context entry in kubeconfig
kubectl config set-context team-admin-context --cluster=minikube --user=team-admin
```

#### Step 2.3: Grant access to the team admin user.
We would give access to manage pods and Ratify's CRs in the `default` namespace to the team admin user.

Create a role.yaml:
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: namespaced-admin-role
rules:
  - apiGroups:
      - "*"
    resources:
      - "pods"
    verbs:
      - "*"
  - apiGroups:
      - config.ratify.deislabs.io
    resources:
      - namespacedstores
    verbs:
      - create
      - delete
      - get
      - list
      - patch
      - update
      - watch
  - apiGroups:
      - config.ratify.deislabs.io
    resources:
      - namespacedstores/finalizers
    verbs:
      - update
  - apiGroups:
      - config.ratify.deislabs.io
    resources:
      - namespacedstores/status
    verbs:
      - get
      - patch
      - update
  - apiGroups:
      - config.ratify.deislabs.io
    resources:
      - namespacedverifiers
    verbs:
      - create
      - delete
      - get
      - list
      - patch
      - update
      - watch
  - apiGroups:
      - config.ratify.deislabs.io
    resources:
      - namespacedverifiers/finalizers
    verbs:
      - update
  - apiGroups:
      - config.ratify.deislabs.io
    resources:
      - namespacedverifiers/status
    verbs:
      - get
      - patch
      - update
  - apiGroups:
      - config.ratify.deislabs.io
    resources:
      - namespacedkeymanagementproviders
    verbs:
      - create
      - delete
      - get
      - list
      - patch
      - update
      - watch
  - apiGroups:
      - config.ratify.deislabs.io
    resources:
      - namespacedkeymanagementproviders/finalizers
    verbs:
      - update
  - apiGroups:
      - config.ratify.deislabs.io
    resources:
      - namespacedkeymanagementproviders/status
    verbs:
      - get
      - patch
      - update
  - apiGroups:
      - config.ratify.deislabs.io
    resources:
      - namespacedpolicies
    verbs:
      - create
      - delete
      - get
      - list
      - patch
      - update
      - watch
  - apiGroups:
      - config.ratify.deislabs.io
    resources:
      - namespacedpolicies/finalizers
    verbs:
      - update
  - apiGroups:
      - config.ratify.deislabs.io
    resources:
      - namespacedpolicies/status
    verbs:
      - get
      - patch
      - update
```

Create a rolebinding.yaml:
```yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: namespaced-admin-role-binding
  namespace: default
subjects:
  - kind: User
    name: team-admin
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: namespaced-admin-role
  apiGroup: rbac.authorization.k8s.io
```

Deploy both the role.yaml and rolebinding.yaml to k8s.
```bash
kubectl apply -f role.yaml
kubectl apply -f rolebinding.yaml
```

### Step 3: Install Gatekeeper and Ratify

Follow Step 1-2 in [Manual Quick Start Steps](../quickstarts/quickstart-manual.md) to install Getekeeper and Ratify.

The above installation will install Ratify in the `gatekeeper-system` namespace. Note it applies cluster-wide custom resources.

Clone the Ratify repository so that we can use the sample resources directly.
```bash
git clone https://github.com/deislabs/ratify.git
cd ratify
```

### Step 4: Deploy a constraint supporting multi-tenancy

```bash
kubectl apply -f ./library/multi-tenancy-validation/template.yaml
kubectl apply -f ./library/multi-tenancy-validation/samples/constraint.yaml
```
Note: the above constraint only validate workload objects in the `default` and `new-namespace` namespaces. Users can adjust the constraint to validate workload objects in other namespaces.

Create a new namespace:
```bash
kubectl create namespace new-namespace
```

### Step 5: See Ratify in action with cluster-wide resources

#### Step 5.1: Deploy images as a cluster admin

- Switch to context `minikube`:
```bash
kubectl config use-context minikube
```

- Deploy an unsigned image, which should be denied by Ratify.
```bash
kubectl run demo --namespace default --image=ghcr.io/deislabs/ratify/notary-image:unsigned
```
Result:
```bash
Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request: [ratify-constraint] Subject failed verification: [default]ghcr.io/deislabs/ratify/notary-image@sha256:17490f904cf278d4314a1ccba407fc8fd00fb45303589b8cc7f5174ac35554f4
```

- Deploy a signed image in default namespace, which should be allowed by Ratify.
```bash
kubectl run demo --namespace default --image=ghcr.io/deislabs/ratify/notary-image:signed
```
Result:
```bash
pod/demo created
```

- Deploy a signed image in `new-namespace` namespace, which should be allowed by Ratify as well.
```bash
kubectl run demo --namespace new-namespace --image=ghcr.io/deislabs/ratify/notary-image:signed
```
Result:
```bash
pod/demo created
```
#### Step 5.2: Deploy images as a team admin
- Switch to team admin user.
```bash
kubectl config use-context team-admin-context
```

- Deploy a signed image in default namespace, which should be allowed by Ratify.
```bash
kubectl run demo --namespace default --image=ghcr.io/deislabs/ratify/notary-image:signed
```
Result:
```bash
pod/demo created
```
- Deploy a signed image in `new-namespace` namespace, which should be denied.
```bash
kubectl run demo --namespace new-namespace --image=ghcr.io/deislabs/ratify/notary-image:signed
```
Result:
```bash
Error from server (Forbidden): pods is forbidden: User "team-admin" cannot create resource "pods" in API group "" in the namespace "new-namespace"
```

### Step 6: Apply namespaced custom resources and delete cluster-wide resources
- Switch to cluster admin user.
```bash
kubectl config use-context minikube
```
- Delete cluster-wide Verifier, KeyManagementProvider and Policy:
```bash
kubectl delete verifiers.config.ratify.deislabs.io verifier-notation
kubectl delete policies.config.ratify.deislabs.io ratify-policy
kubectl delete keymanagementproviders.config.ratify.deislabs.io ratify-notation-inline-cert-0
```

- Switch to team admin user (cluster admin could apply namespaced resources as well)
```bash
kubectl config use-context team-admin-context
```

- Apply namespaced Verifier, KeyManagementProvider and Policy:
```bash
kubectl apply -f ./config/samples/namespaced/policy/config_v1beta1_policy_rego.yaml
kubectl apply -f ./config/samples/namespaced/verifier/config_v1beta1_verifier_notation.yaml
sed 's/name: keymanagementprovider-inline/name: ratify-notation-inline-cert-0/' ./config/samples/namespaced/kmp/config_v1beta1_keymanagementprovider_inline.yaml | kubectl apply -f -
```

### Step 7: See Ratify in action with namespaced resources
- Ensure to switch to team admin user.
```bash
kubectl config use-context team-admin-context
```

- Deploy an unsigned image, which should be denied by Ratify.
```bash
kubectl run demo --namespace default --image=ghcr.io/deislabs/ratify/notary-image:unsigned
```
Result:
```bash
Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request: [ratify-constraint] Subject failed verification: [default]ghcr.io/deislabs/ratify/notary-image@sha256:17490f904cf278d4314a1ccba407fc8fd00fb45303589b8cc7f5174ac35554f4
```

- Deploy a signed image in default namespace, which should be allowed by Ratify.
```bash
kubectl run demo --namespace default --image=ghcr.io/deislabs/ratify/notary-image:signed
```
Result:
```bash
pod/demo created
```

- Deploy a signed image in `new-namespace` namespace, which should be denied.
```bash
kubectl run demo --namespace new-namespace --image=ghcr.io/deislabs/ratify/notary-image:signed
```
Result:
```bash
Error from server (Forbidden): pods is forbidden: User "team-admin" cannot create resource "pods" in API group "" in the namespace "new-namespace"
```

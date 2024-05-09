---
title: Ensure that AKS clusters only run images signed with Cosign signatures and keys in AKV
---

# Ensure that AKS clusters only run images signed with Cosign signatures and keys in AKV

This article provides an e2e walkthrough of the process to ensure that Azure Kubernetes Service (AKS) clusters run images that are signed with Cosign signatures and keys stored in Azure Key Vault (AKV).

In this article:

* Sign an image in Azure Container Registry (ACR) with Cosign signatures and keys in AKV
* Set up an AKS cluster without Azure policy enabled
* Install OPA Gatekeeper and Ratify
* Set up Ratify for validating Cosign signatures using keys in AKV
* Run signed and un-signed images to confirm only signed images are allowed for deployment

> For AKS clusters with Azure policy enabled, Image integrity policy is recommended for ensuring only signed images are deployed

### Prerequisite

The instructions provided in this article are tailored for Linux-based operating systems.

* Install [Cosign](https://docs.sigstore.dev/system_config/installation/)
* Install and configure the latest [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
* Create or use an [ACR](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-get-started-azure-cli) for storing container images and signatures
* Create or use an [AKV](https://learn.microsoft.com/en-us/azure/key-vault/general/quick-create-cli) for managing keys
* Create or using an existing AKS cluster
 
## Sign an image in ACR with Cosign signatures and keys in AKV

1. Configure environment variables.

    ```bash
    export SUB_ID=<your subscription id>

    export AKV_NAME=<your AKV name>
    export KEY_NAME=<your key name>
    export ACR_NAME=<your ACR name>
    export AKS_NAME=<your AKS name>

    export ACR_RG=<your ACR resource group>
    export AKV_RG=<your AKV resource group>
    export AKS_RG=<your AKS resource group>
    
    export IMAGE_SIGNED="$ACR_NAME.azurecr.io/net-monitor:v1"
    export IMAGE_UNSIGNED="$ACR_NAME.azurecr.io/net-watcher:v1"

    export IMAGE_SIGNED_SOURCE=https://github.com/wabbit-networks/net-monitor.git#main
    export IMAGE_UNSIGNED_SOURCE=https://github.com/wabbit-networks/net-watcher.git#main
    ```

1. Sign in with Azure CLI

    ```bash
    az login
    ```

    To learn more about Azure CLI and how to sign in with it, see [Sign in with Azure CLI](https://learn.microsoft.com/en-us/cli/azure/authenticate-azure-cli).

1. Create a key in your AKV

    Ensure the logged-in identity assigned role `Key Vault Crypto Officer` for creating a key in AKV.

    ```bash
    az keyvault key create --vault-name $AKV_NAME -n $KEY_NAME --protection software
    ```

    Get the key id and retrieve the key version

    ```bash
    az keyvault key show --name $KEY_NAME --vault-name $AKV_NAME --query "key.kid"
    ```

    An example output:

    "https://<your akv name>.vault.azure.net/keys/<your key name>/<version>"

    Configure an environment variable for the version

    ```bash
    export KEY_VER=<version>
    ```

1. Build two images in your ACR

    Login to ACR and ensure the logged-in users has the role `acrpush` and `acrpull` roles assigned.

    ```bash
    az acr login --name $ACR_NAME
    ```

    Build and push an image that will be signed in later steps.

    ```bash
    az acr build -r $ACR_NAME -t $IMAGE_SIGNED $IMAGE_SIGNED_SOURCE --no-logs
    ```

    Build and push an image that will not be signed.

    ```bash
    az acr build -r $ACR_NAME -t $IMAGE_UNSIGNED $IMAGE_UNSIGNED_SOURCE --no-logs
    ```

1. Sign an image stored in your ACR

    Confirm no signatures before signing

    ```bash
    cosign tree $IMAGE_SIGNED
    ```
    
    Sign the image

    ```bash
    cosign sign --key azurekms://$AKV_NAME.vault.azure.net/$KEY_NAME/$KEY_VER --tlog-upload=false $IMAGE_SIGNED
    ```

    > In this article, use flag `--tlog-upload=false` to skip upload the signature to the transparent log (Rekor by default). 
    > Sign using key in AKV does not necessarily require the role `Key Vault Crypto Officer`, you can login with another identity and assign the role `Key Vault Crypto User` for signing action.

    Confirm the signature is pushed and associated with the image in ACR

    ```bash
    cosign tree $IMAGE_SIGNED
    ```

## Validate signatures at K8s admission control

### Access control

User assigned managed identity is used for Ratify to access ACR and AKV. 

1. Configure environment variables

```bash
export ID_NAME=<your managed id>
export ID_RG=<your managed id resource group>
```

1. Create a user assigned managed identity

    ```bash
    az identity create --name $ID_NAME --resource-group $ID_RG
    export OBJECT_ID=$(az identity show --name $ID_NAME --resource-group $ID_RG --query 'principalId' -o tsv)
    ```

1. Assign `acrpull` role to this identity for accessing ACR

    ```bash
    az role assignment create --assignee-object-id $OBJECT_ID --role acrpull \
    --scope "/subscriptions/$SUB_ID/resourceGroups/$ACR_RG/providers/Microsoft.ContainerRegistry/registries/$ACR_NAME"
    ```

1. Assign `Key Vault Crypto User` role to this identity for accessing AKV

    ```bash
    az role assignment create --role "Key Vault Crypto User" --assignee $OBJECT_ID \
    --scope "/subscriptions/$SUB_ID/resourceGroups/$AKV_RG/providers/Microsoft.KeyVault/vaults/$AKV_NAME"
    ```

### Set up your AKS cluster

1. Configure environment variables

    ```bash
    export CLIENT_ID=$(az identity show --name  $ID_NAME --resource-group $ID_RG --query 'clientId' -o tsv)
    export TENANT_ID=$(az identity show --name $ID_NAME --resource-group $ID_RG --query tenantId -o tsv)
    ```

1. Update the AKS cluster with OIDC and workload identity support

    ```bash
    az aks update -g $AKS_RG -n $AKS_NAME --enable-oidc-issuer --enable-workload-identity
    ```

1. Create federate credential for your managed identity

    ```bash
    export AKS_OIDC_ISSUER="$(az aks show -n $AKS_NAME -g $AKS_RG --query "oidcIssuerProfile.issuerUrl" -o tsv)"

    az identity federated-credential create --name ratify-federated-credential --identity-name $ID_NAME -g $ID_RG --issuer $AKS_OIDC_ISSUER --subject system:serviceaccount:"gatekeeper-system":"ratify-admin"
    ```

### Install Ratify

1. AKS with Azure policy enabled
   
   Make sure AKS image integrity policy is not assigned to your AKS cluster.

   ```bash
   helm install ratify oci://ghcr.io/deislabs/ratify-chart-dev/ratify --atomic \
   --version v1.2.0 \
   --namespace gatekeeper-system \
   --set azureWorkloadIdentity.clientId="$CLIENT_ID"
   --set featureFlags.RATIFY_CERT_ROTATION=true \
   --set image.pullPolicy=Always \
   --set provider.enableMutation=false \
   --set logger.level=debug
   ```

1. AKS without Azure Policy

   You need to install Gatekeeper first,

   ```bash
   helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts

   helm install gatekeeper/gatekeeper  --name-template=gatekeeper --namespace gatekeeper-system --create-namespace --set enableExternalData=true --set validatingWebhookTimeoutSeconds=5 --set mutatingWebhookTimeoutSeconds=2 --set externaldataProviderResponseCacheTTL=10s
   ```

   Then, install Ratify. Note that this flag `--set provider.enableMutation=false` is not required.

   ```bash
   helm install ratify oci://ghcr.io/deislabs/ratify-chart-dev/ratify --atomic \
   --version v1.2.0 \
   --namespace gatekeeper-system \
   --set azureWorkloadIdentity.clientId="$CLIENT_ID"
   --set featureFlags.RATIFY_CERT_ROTATION=true \
   --set image.pullPolicy=Always \
   --set logger.level=debug
   ```

### Set up Gatekeeper and Ratify

1. Set up Gatekeeper constraints

    Run the following commands for AKS with Azure Policy enabled

    ```bash
    export CUSTOM_POLICY=$(curl -L https://raw.githubusercontent.com/deislabs/ratify/main/library/default/customazurepolicy.json)
    export DEFINITION_NAME="ratify-default-custom-policy"
    export SCOPE=$(az aks show -g $AKS_RG -n $AKS_NAME --query id -o tsv)
    export DEFINITION_ID=$(az policy definition create --name "${DEFINITION_NAME}" --rules "$(echo "${CUSTOM_POLICY}" | jq .policyRule)" --params "$(echo "${CUSTOM_POLICY}" | jq .parameters)" --mode "Microsoft.Kubernetes.Data" --query id -o tsv)
    export ASSIGNMENT_ID=$(az policy assignment create --policy "${DEFINITION_ID}" --name "${DEFINITION_NAME}" --scope "${SCOPE}" --query id -o tsv)
    ```

    Use the following command to validate whether the custom policy has been assigned to your cluster. It often requires around 15 min.

    ```bash
    kubectl get constraintTemplate ratifyverification
    ```

    Run the following commands for AKS without Azure Policy enabled
    
    ```bash
    kubectl apply -f https://deislabs.github.io/ratify/library/default/template.yaml
    kubectl apply -f https://deislabs.github.io/ratify/library/default/samples/constraint.yaml
    ```
    TODO: replace the yaml files with latest one with multi-tenancy support

1. Create a configuration file with the following content.

```bash
cat <<EOF > verification_config.yaml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Store
metadata:
  name: store-oras
spec:
  name: oras
  parameters:
    authProvider:
      name: azureWorkloadIdentity
      clientID: $CLIENT_ID
    cosignEnabled: true
---
apiVersion: config.ratify.deislabs.io/v1beta1
kind: KeyManagementProvider
metadata:
  name: keymanagementprovider-akv
spec:
  type: azurekeyvault
  parameters:
    vaultURI: https://$AKV_NAME.vault.azure.net/
    keys:
      - name: $KEY_NAME
        version: $KEY_VER # Optional, fetch latest version if empty 
    tenantID: $TENANT_ID
    clientID: $CLIENT_ID
---
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-cosign
spec:
  name: cosign
  artifactTypes: application/vnd.dev.cosign.artifact.sig.v1+json
  parameters:
    trustPolicies:
      - name: default
        scopes:
          - "*"
        keys:
          - provider: keymanagementprovider-akv
EOF
```

1. Apply the verification configuration

    ```bash
    kubectl apply -f verification_config.yaml
    ```

1. Confirm the configuration is applied successful.

    ```bash
    kubectl get Store store-oras
    kubectl get Keymanagementprovider keymanagementprovider-akv
    kubectl get Verifier verifier-cosign
    ```

    Make sure the `ISSUCCESS` value is true in the results of above three commands. If it is not, you need to check the detailed error logs by using `kubectl describe` commands. For example,

    ```bash
    kubectl describe Store store-oras
    ```
 
### Run signed and un-signed images to confirm only signed images are allowed for deployment

Run the following command, since $IMAGE_SIGNED is signed with the key configured in Ratify, so this image was allowed for deployment after signature verification succeeded.

```bash
kubectl run demo-signed --image=$IMAGE_SIGNED
```

Run the following command, since $IMAGE_UNSIGNED is not signed, so this image was NOT allowed for deployment.

```bash
kubectl run demo-unsigned --image=$IMAGE_UNSIGNED
```

An example output:

```text
Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request: [azurepolicy-ratifyverification-fdb73ef5d3e172aae97c] Subject failed verification: wabbitregistry.azurecr.io/net-watcher:v1
```

## Fine-tuned trust policy 

You can configure different trust policies for images from various registry scope for the Cosign verifier. For example, you have two ACR: `$ACR_NAME1` and `$ACR_NAME2`. For `$ACR_NAME1`, you want to use `keymanagementprovider-akv1` resource, For `$ACR_NAME2`, you want to use `keymanagementprovider-akv2` resource. You can update Cosign Verifier resource as the following:

```yaml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Verifier
metadata:
  name: verifier-cosign
spec:
  name: cosign
  artifactTypes: application/vnd.dev.cosign.artifact.sig.v1+json
  parameters:
    trustPolicies:
      - name: $ACR_NAME1
        scopes:
          - "$ACR_NAME1.azurecr.io/*"
        keys:
          - provider: keymanagementprovider-akv1
      - name: $ACR_NAME2
        scopes:
          - "$ACR_NAME2.azurecr.io/*"
        keys:
          - provider: keymanagementprovider-akv2
```

For more information, please refer to the document KeyManagementProvider CRD.

## Rotate the key

Keys in AKV may be rotated regularly as security best practice. If the key is rotated with a new version, you can update the `KeyManagementProvider` resource by adding the new version of the key, as currently Ratify (v1.2.0) does not support reconciling key resources regularly. For example, if the new version of key is set to environment variable `$KEY_VER_NEW`, you can do the following:

1. Add the new key `$KEY_VER_NEW` for `KeyManagementProvider` resource

    ```yaml
    apiVersion: config.ratify.deislabs.io/v1beta1
    kind: KeyManagementProvider
    metadata:
    name: keymanagementprovider-akv
    spec:
    type: azurekeyvault
    parameters:
        vaultURI: https://$AKV_NAME.vault.azure.net/
        keys:
        - name: $KEY_NAME
            version: $KEY_VER 
            version: $KEY_VER_NEW
        tenantID: $TENANT_ID
        clientID: $CLIENT_ID
    ```

1. Apply the new configuration

    ```bash
    kubectl apply -f verification_config.yaml
    ```

1. Confirm the new configuration is applied successfully

    ```bash
    kubectl get KeyManagementProvider keymanagementprovider-akv
    ```

## Disable the specific version of key

In some cases, you may need to disable a specific version of key. For example, the specific version of key is leaked. So, images signed using the specific version of key should not be trusted and the deployment of those images should be denied. As currently Ratify (v1.2.0) does not support reconciling key resources regularly, so you need to manually remove the version of key from `KeyManagementProvider` resource. For example, if version `$KEY_VER` is leaked, what you need to do is:

1. Disable the specific version from AKV, in this case, version `$KEY_VER` is disabled.

1. Rotate the key to a new version `$KEY_VER_NEW`, so that your images will be signed with new version.

1. Update `KeyManagementProvider` resource to add the new version of key and remove the disabled version

   The `KeyManagementProvider` resource will look like the following as disabled version `$KEY_VER` was removed.

    ```yaml
    apiVersion: config.ratify.deislabs.io/v1beta1
    kind: KeyManagementProvider
    metadata:
    name: keymanagementprovider-akv
    spec:
    type: azurekeyvault
    parameters:
        vaultURI: https://$AKV_NAME.vault.azure.net/
        keys:
        - name: $KEY_NAME
            version: $KEY_VER_NEW
        tenantID: $TENANT_ID
        clientID: $CLIENT_ID
    ```

    Apply the new configuration

    ```bash
    kubectl apply -f verification_config.yaml
    ```

    Confirm the new configuration is applied successfully

    ```bash
    kubectl get KeyManagementProvider keymanagementprovider-akv
    ```
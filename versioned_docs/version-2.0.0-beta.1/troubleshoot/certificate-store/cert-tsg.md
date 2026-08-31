# Troubleshoot Certificate Store Errors

> **WARNING!**: `CertificateStore` is now deprecated in favor of [`KeyManagementProvider`](../../reference/custom%20resources/key-management-providers.md). Please migrate to use `KeyManagementProvider`.

Please use ```kubectl get``` or ```kubectl describe``` command to retrieve the error.
```bash
kubectl get certificatestores.config.ratify.deislabs.io
```
###  CERT_INVALID
This error is returned when Ratify fails to parse certificate fetched from Certifiate Store.

#### Scenario 1
Brieferror:       failed to get certificates fro...   
Error:            failed to get certificates from secret bundle:  
Original Error: (**pkcs12: expected exactly two items in the authenticated safe**),  
Error: cert invalid,  
Code: **CERT_INVALID**,  
Plugin Name: azurekeyvault, Component Type: certProvider,  
Detail: **azure keyvault certificate provider: failed to convert PKCS12 Value to PEM**. Certificate default, version b81be595959f46fbb1c704018d29aca8  
Issuccess:        false  

##### Cause and Solution
PKCS12 format certs in Key Vault with nonexportable private keys causes a parsing failure because Go is hardcoded to expect a private key. We recommend switching to PEM certs. 

###  Access Denied
This error occurs when Ratify fails to fetch certificates from akv provider due to permissions issues.

#### Scenario 1
Reconciler error CertificateStore=gatekeeper-system/certstore-akv controller=certificatestore controllerGroup=config.ratify.deislabs.io controllerKind=CertificateStore error=Error fetching certificates in store certstore-akv with azurekeyvault provider

error: failed to get secret objectName:Certname, objectVersion:, error: keyvault.BaseClient#GetSecret: Failure responding to request: StatusCode=403, 
Original Error: autorest/azure: Service returned an error. Status=403 Code="Forbidden" 
Message="The user, group or application 'appid=app;iss=https://sts.windows.net/tenant_id/' ***does not have secrets get permission*** on key vault 'keyvaultname;location=eastus'. 
For help resolving this issue, please see https://go.microsoft.com/fwlink/?linkid=2125287" 
`InnerError={"code":"***AccessDenied***"}`

##### Cause and Solution

When a certificate is created, an addressable key and secret are also created with the same name. Ratify requires secret permissions to retrieve the public certificates for the entire certificate chain. Please configure keyvault policy for the identity with command below. 
    
    ```bash
    az keyvault set-policy --name ${AKV_NAME} \
    --secret-permissions get \
    --object-id ${IDENTITY_OBJECT_ID}
    ```

Since the permission change is external to ratify, you MUST manually trigger a fetch operation by deleting and applying the CR again.

    ```bash
    kubectl get certificatestores.config.ratify.deislabs.io/certstore-akv -o yaml > my_certstore_akv.yaml
    kubectl delete certificatestores.config.ratify.deislabs.io/certstore-akv
    kubectl apply -f my_certstore_akv.yaml
    ```
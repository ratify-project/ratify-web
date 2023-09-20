## Troubleshoot certstore errors

###  CERT_INVALID

#### Symptom
Brieferror:       failed to get certificates fro...
Error:            failed to get certificates from secret bundle:Original Error: (**pkcs12: expected exactly two items in the authenticated safe**), Error: cert invalid, Code: **CERT_INVALID**, Plugin Name: azurekeyvault, Component Type: certProvider, Detail: azure keyvault certificate provider: failed to convert PKCS12 Value to PEM. Certificate default, version b81be595959f46fbb1c704018d29aca8
Issuccess:        false

#### Cause and Solution
PKCS12 format certs in Key Vault with nonexportable private keys causes a parsing failure because Go is hardcoded to expect a private key. We recommend switching to a PEM certs. 

# Troubleshoot Notation Verifier Errors

There are generally two types of errors that can occur when using the Notation verifier: configuration errors and verification errors. Configuration errors occur when the Notation verifier is not configured correctly. Verification errors occur when the Notation verifier fails to verify an artifact. This TSG provides guidance on how to troubleshoot Notation verifier errors.

## Configuration Errors
It's important to ensure that the Notation verifier is configured correctly. If the Notation verifier is not configured correctly, it will not be able to verify artifacts.

### Debugging Commands
To inspect the Notation verifier configuration, please use ```kubectl describe``` or ```kubectl get``` command to retrieve it.
```bash
kubectl describe verifiers.config.ratify.deislabs.io
kubectl describe namespacedverifiers.config.ratify.deislabs.io -n <namespace>
```
or

```bash
kubectl get verifiers.config.ratify.deislabs.io -o yaml
kubectl get namespacedverifiers.config.ratify.deislabs.io -n <namespace> -o yaml
```

## Verification Errors
If an artifact verification failed for some reason, please check the logs in Ratify pod to inspect the related error logs. If you have applied the latest default [constraint templates](https://github.com/ratify-project/ratify/blob/dev/library/default/template.yaml), the error response will append trace-id to the error message. You can use this trace-id to search the logs in Ratify pod.

An example of error response that occurs when Notation verifier fails to verify an artifact is shown below.
```bash
Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request: [ratify-constraint] Time=2024-08-29T08:05:56.671212635Z, failed to verify the artifact: libinbinacr.azurecr.io/testimage@sha256:f2502800f0663995420b13214a0d20eae1ec9a3c072f99c462cef0132a684556, trace-id: bf280642-0be3-466d-a038-deb6838f6ff9
```

Below is an example of a verification result log in Ratify pod.

```json
"verifierReports": [
    {
      "subject": "ghcr.io/deislabs/ratify/notary-image@sha256:8e3d01113285a0e4aa574da8eb9c0f112a1eb979d72f73399d7175ba3cdb1c1b",
      "referenceDigest": "sha256:57be2c1c3d9c23ef7c964bba05c7aa23b525732e9c9af9652654ccc3f4babb0e",
      "artifactType": "application/vnd.cncf.notary.signature",
      "verifierReports": [
        {
          "isSuccess": false,
          "message": "Failed to verify signature with digest: sha256:602457f6331f80ef56d8b79b6b53c070a71a167deac0bf626ee9722dd829a5a9: unable to fetch certificates from Key Management Provider and Certificate Store: ratify-notation-inline-cert-0",
          "errorReason": "failed to access non-existent key management provider: ratify-notation-inline-cert-0",
          "remediation": "Ensure the key management provider: ratify-notation-inline-cert-0 is created under namespace: [] or as a cluster-wide resource.",
          "verifierName": "verifier-notation",
          "verifierType": "notation",
          "extensions": null
        }
      ],
      "nestedReports": []
    }
  ]
```

Users can investigate the root cause of the Notation verifier by checking the `message` and `errorReason` fields of each failed `verifierReport`. `message` is generated within the Ratify while `errorReason` could result from Ratify itself, dependency library or upstream services. And we have `remediation` field to provide a solution to some common errors.

We have listed some common errors and their solutions below.

### Scenario 1
```
artifact URI [uri] could not be parsed, make sure it is the fully qualified OCI artifact URI without the scheme/protocol. e.g domain.com:80/my/repository@sha256:digest
```

#### Cause and Solution
The provided reference URI doesn't contain character `@` which is required by Notation verifier. Please check the reference URI and make sure it is in the correct format. 

Check [documentation](https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#selecting-a-trust-policy-based-on-artifact-uri) for more details.

### Scenario 2
```
registry scope [scope] is not valid, make sure it is a fully qualified repository without the scheme, protocol or tag. For example domain.com/my/repository or a local scope like local/myOCILayout
```
Or
```
registry scope [scope] with wild card(s) is not valid, make sure it is a fully qualified repository without the scheme, protocol or tag. For example domain.com/my/repository or a local scope like local/myOCILayout
```

#### Cause and Solution
Please inspect the `registryScope` in `TrustPolicy` of Notation Verifier CR and make sure it is correct by using the [debugging commands](#debugging-commands).

Check [documentation](https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#selecting-a-trust-policy-based-on-artifact-uri) for more details.

### Scenario 3
```
artifact [uri] has no applicable trust policy. Trust policy applicability for a given artifact is determined by registryScopes. To create a trust policy, see: https://notaryproject.dev/docs/quickstart/#create-a-trust-policy
```

#### Cause and Solution
Notation verifier cannot find a trust policy matching the given artifact reference. Please check if the registryScope of trust policy is correctly set up. Run the [debugging commands](#debugging-commands) to get the Notation veifier configuration.

Check [documentation](https://notaryproject.dev/docs/quickstart/#create-a-trust-policy) for more details.

### Scenario 4
```
signature is not produced by a trusted signer
```

#### Cause and Solution
The signature’s SignerInfo does not match any certificate in the trust store. Please ensure that the correct certificate is configured in the trust store to verify the signature. Additionally, double-check that the trust policy specifies the correct trust store.

Check [documentation](https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#steps) to see how to verify the authenticity.

### Scenario 5
```
digital signature has expired on [timestamp]
```

#### Cause and Solution
The signature has expired. Please re-sign the image.

### Scenario 6
```
signing certificate with subject [subject] is revoked
```

#### Cause and Solution
The certificate used to sign the image has been revoked. Please re-sign the image with a valid certificate.

### Scenario 7
```
error while parsing the certificate subject from the digital signature. error : [error message]
```

#### Cause and Solution
This error usually occurs when the certificate subject of a certificate from the signature is invalid. Please check the error message for specific error. The subject MUST follow [RFC 4514 DN](https://datatracker.ietf.org/doc/html/rfc4514) syntax.

### Scenario 8
```
error while loading the trust store, [error message]
```

#### Cause and Solution
This error usually occurs when the trust store is not configured correctly. Please check the error message for specific error.

Check [Trust Policy](https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#trust-policy) and [Trust Store](https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#trust-store) specs for more details.

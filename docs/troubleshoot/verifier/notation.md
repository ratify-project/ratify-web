# Troubleshoot Notation Verifier Errors

If an image verification failed for some reason, please check the logs in Ratify pod to inspect the related error logs.

An example result log from a failed verification caused by Notation verifier is shown below:

```json
"verifierReports": [
    {
      "subject": "ghcr.io/deislabs/ratify/notary-image@sha256:8e3d01113285a0e4aa574da8eb9c0f112a1eb979d72f73399d7175ba3cdb1c1b",
      "referenceDigest": "sha256:57be2c1c3d9c23ef7c964bba05c7aa23b525732e9c9af9652654ccc3f4babb0e",
      "artifactType": "application/vnd.cncf.notary.signature",
      "verifierReports": [
        {
          "isSuccess": false,
          "message": "Original Error: (Original Error: (artifact \"ghcr.io/deislabs/ratify/notary-image@sha256:8e3d01113285a0e4aa574da8eb9c0f112a1eb979d72f73399d7175ba3cdb1c1b\" has no applicable trust policy. Trust policy applicability for a given artifact is determined by registryScopes. To create a trust policy, see: https://notaryproject.dev/docs/quickstart/#create-a-trust-policy), Error: verify signature failure, Code: VERIFY_PLUGIN_FAILURE, Plugin Name: notation, Component Type: verifier, Documentation: https://github.com/notaryproject/notaryproject/tree/main/specs, Detail: failed to verify signature of digest), Error: verify reference failure, Code: VERIFY_PLUGIN_FAILURE, Plugin Name: notation, Component Type: verifier",
          "name": "notation",
          "extensions": null
        }
      ],
      "nestedReports": []
    }
  ]
```

To further investigate the root cause from the Notation verifier, users need to check the `message` field of each failed `verifierReport`. The error message could be a nested error, the Notation error is the most inner error, e.g. `artifact \"ghcr.io/deislabs/ratify/notary-image@sha256:8e3d01113285a0e4aa574da8eb9c0f112a1eb979d72f73399d7175ba3cdb1c1b\" has no applicable trust policy. Trust policy applicability for a given artifact is determined by registryScopes. To create a trust policy, see: https://notaryproject.dev/docs/quickstart/#create-a-trust-policy` in the above example.

Since the other levels of the error are always the same, thid TSG would focus on different errors returned by Notation verifier.

## Scenario 1
```
artifact URI [uri] could not be parsed, make sure it is the fully qualified OCI artifact URI without the scheme/protocol. e.g domain.com:80/my/repository@sha256:digest
```

### Cause and Solution
The provided reference URI doesn't contain character `@` which is required by Notation verifier. Please check the reference URI and make sure it is in the correct format. 

Check [documentation](https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#selecting-a-trust-policy-based-on-artifact-uri) for more details.

## Scenario 2
```
registry scope [scope] is not valid, make sure it is a fully qualified repository without the scheme, protocol or tag. For example domain.com/my/repository or a local scope like local/myOCILayout
```
Or
```
registry scope %q with wild card(s) is not valid, make sure it is a fully qualified repository without the scheme, protocol or tag. For example domain.com/my/repository or a local scope like local/myOCILayout
```

### Cause and Solution
The error is self-explained.

Check [documentation](https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#selecting-a-trust-policy-based-on-artifact-uri) for more details.

## Scenario 3
```
artifact [uri] has no applicable trust policy. Trust policy applicability for a given artifact is determined by registryScopes. To create a trust policy, see: https://notaryproject.dev/docs/quickstart/#create-a-trust-policy
```

### Cause and Solution
Notation verifier cannot find a trust policy matching the given artifact reference. Please check if the registryScope of trust policy is correctly set up.

Check [documentation](https://notaryproject.dev/docs/quickstart/#create-a-trust-policy) for more details.

## Scenario 4
```
signature is not produced by a trusted signer
```

### Cause and Solution
The signature’s SignerInfo does not match any certificate in the trust store. Please ensure that the correct certificate is configured in the trust store to verify the signature. Additionally, double-check that the trust policy specifies the correct trust store.

Check [documentation](https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#steps) to see how to verify the authenticity.

## Scenario 5
```
digital signature has expired on [timestamp]
```

### Cause and Solution
The signature has expired. Please re-sign the image.

## Scenario 6
```
signing certificate with subject [subject] is revoked
```

### Cause and Solution
The certificate used to sign the image has been revoked. Please re-sign the image with a valid certificate.

## Scenario 7
```
error while parsing the certificate subject from the digital signature. error : [error message]
```

### Cause and Solution
The error is self-explained. This error usually occurs when the certificate subject of a certificate from the signature is invalid. Please check the error message for specific error. The subject MUST follow [RFC 4514 DN](https://datatracker.ietf.org/doc/html/rfc4514) syntax.

## Scenario 8
```
error while loading the trust store, [error message]
```

### Cause and Solution
The error is self-explained. This error usually occurs when the trust store is not configured correctly. Please check the error message for specific error.

Check [Trust Policy](https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#trust-policy) and [Trust Store](https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#trust-store) specs for more details.
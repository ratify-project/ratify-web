# Ratify CLI

This document provides a walkthrough on how to use the ratify command line to verify a sample image.

## Verify notation signature with Ratify cli

1. Download the latest Ratify CLI on a Linux AMD64 machine. Go to [release page](https://github.com/ratify-project/ratify/releases/) if you are on other platforms.
```bash
curl -L https://github.com/ratify-project/ratify/releases/download/v1.2.1/ratify_1.2.1_Linux_amd64.tar.gz | tar xvzC ~/bin/ ratify
```

2. Download a local verification certificate for sample image
```bash
curl -sSLO https://github.com/ratify-project/ratify/blob/v1.2.1/test/testdata/notation.crt
```
3. Prepare configuration file

Store/Verifier/Policy configuration:
- Setup oras store to define how artifacts should be fetched
- Define rego policy to validate the result of verification report
- Setup Notation verifier with path to the local verification cert downloaded from previous step

```bash
cat > config.json <<EOF
{
    "executor": {},
    "store": {
        "version": "1.0.0",
        "plugins": [
            {
                "name": "oras",
                "cosignEnabled": true
            }
        ]
    },
    "policy": {
        "version": "1.0.0",
        "plugin": {
            "name": "regoPolicy",
            "policyPath": "",
            "policy": "package ratify.policy\ndefault valid := false\nvalid {\n not failed_verify(input)\n}\nfailed_verify(reports) {\n  [path, value] := walk(reports)\n  value == false\n  path[count(path) - 1] == \"isSuccess\"\n}"
        }
    },
    "verifier": {
        "version": "1.0.0",
        "plugins": [
            {
                "name": "notation",
                "artifactTypes": "application/vnd.cncf.notary.signature",
                "verificationCerts": [
                    "./notation.crt"
                ],
                "trustPolicyDoc": {
                    "version": "1.0",
                    "trustPolicies": [
                        {
                            "name": "default",
                            "registryScopes": [
                                "*"
                            ],
                            "signatureVerification": {
                                "level": "strict"
                            },
                            "trustStores": [
                                "ca:certs"
                            ],
                            "trustedIdentities": [
                                "*"
                            ]
                        }
                    ]
                }
            }
        ]
    }
}
EOF
```

Sample CLI configuration files for other verifiers can be found in the [plugins](../plugins/verifier/cosign.md#cli) doc. 

4. Run ratify verify

Invoke the command line with configuration file and the image to verify.

```bash
ratify verify -c config.json -s ghcr.io/deislabs/ratify/notary-image:signed > verificationResult.json
```

Sample verification result:

```json
{
  "isSuccess": true,
  "verifierReports": [
    {
      "subject": "ghcr.io/deislabs/ratify/notary-image:signed",
      "referenceDigest": "sha256:57be2c1c3d9c23ef7c964bba05c7aa23b525732e9c9af9652654ccc3f4babb0e",
      "artifactType": "application/vnd.cncf.notary.signature",
      "verifierReports": [
        {
          "isSuccess": true,
          "message": "signature verification success",
          "name": "notation",
          "extensions": {
            "Issuer": "CN=Ratify Sample,O=Ratify",
            "SN": "CN=ratify.default"
          }
        }
      ],
      "nestedReports": []
    }
  ]
}
```

## Limitation

Ratify CLI currently does not have feature parity with k8s in cluster external data provider support. There are feature [gaps](https://github.com/ratify-project/ratify/issues/1300) in areas like inline and Azure Key Vault Key Management Provider. To help us prioritize, please create [new](https://github.com/ratify-project/ratify/issues/new?assignees=&labels=enhancement%2Ctriage&projects=&template=feature-request.yaml) tracking issues or vote on [existing](https://github.com/ratify-project/ratify/issues?q=is%3Aissue+is%3Aopen+cli) issues.

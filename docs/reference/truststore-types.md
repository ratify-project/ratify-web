# Support different types of trust store

Notation spec supports 3 trust store types: ca, tsa and signingAuthority: https://github.com/notaryproject/specifications/blob/main/specs/trust-store-trust-policy.md#trust-policy-properties

Ratify previously didn't differentiate between types, and we used to just set it as ca type as default. As we already have users use signingAuthority instead of ca type, we provide support to this feature. And we would also support tsa for tsa signature.

# Implementation

Updated GetCertificates implementation and supported `truststore.Type`. https://github.com/deislabs/ratify/blob/main/pkg/verifier/notation/truststore.go#L43

Updated verificationCertStores to include trustStoreType: https://github.com/deislabs/ratify/blob/main/pkg/verifier/notation/notation.go#L60
```
// VerificationCertStores is map defining which keyvault certificates belong to which trust store name and its trust store type.
// e.g.
// {
// 	"ca": {
// 		"certs": ["kv1", "kv2"],
// 	},
// 	"signingauthority": {
// 		"certs": ["kv3"]
// 	},
// }
VerificationCertStores map[string]interface{} `json:"verificationCertStores"`
```

Updated corresponding CR files.
```
verificationCertStores:
    ca:
        certs:
        {{- if .Values.akvCertConfig.enabled }}
        - certstore-akv
        {{- else }}
            {{- if .Values.notationCert }}
            {{- if .Values.notationCerts }}
            {{- fail "Please specify notation certs with .Values.notationCerts, single certificate .Values.notationCert has been deprecated, will soon be removed." }}
            {{- end }}
        - {{$fullname}}-notation-inline-cert
            {{- end }} 
            {{- range $i, $cert := .Values.notationCerts }}
        - {{$fullname}}-notation-inline-cert-{{$i}}
            {{- end }} 
        {{- end }}
```
And we made it backward compatible, the implementation supports both old and new CRs.
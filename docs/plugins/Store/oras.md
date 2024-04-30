# ORAS

An implementation of the `Referrer Store` using the ORAS Library to interact with OCI compliant registries.

Sample Oras yaml spec:

```yml
apiVersion: config.ratify.deislabs.io/v1beta1
kind: Store
metadata:
  name: store-oras
spec:
  name: oras
  parameters: 
    cacheEnabled: true
    capacity: 100
    keyNumber: 10000
    ttl: 10
    useHttp: true  
    authProvider:
      name: k8Secrets
      secrets: 
      - secretName: ratify-dockerconfig
```

| Name          | Required | Description                                                                                                                                                                                                        | Default Value |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| cosignEnabled | no       | This must be `true` if cosign verifier is enabled. Read more about cosign verifier [here](https://github.com/deislabs/ratify/blob/main/plugins/verifier/cosign/README.md).                                         | `false`       |
| authProvider  | no       | This is only required if pulling from a private repository. For all supported auth mode, please review [oras-auth-provider](https://github.com/deislabs/ratify/blob/main/docs/reference/oras-auth-provider.md) doc | dockerAuth    |
| cacheEnabled  | no       | Oras cache, cache for all referrers for a subject. Note: global cache must be enabled first                                                                                                                        | `false`       |
| ttl           | no       | Time to live for entries in oras cache                                                                                                                                                                             | 10 seconds    |
| useHttp       | no       | This needs to be set to `true` for  local insecure registries                                                                                                                                                      | `false`       |

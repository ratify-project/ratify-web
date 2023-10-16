### Installation FAQ

Please use ```kubectl describe``` or ```kubectl logs``` to see the installation error.

#### 1. How do I Disable Gatekeeper audit
When installing gatekeeper with Ratify, by default ratify receives audit requests every 60 secs.
If you are trying out a specific Ratify scenario, you might want to disable the audit feature of gatekeeper so the logs are easily discoverable. To turn off audit, please specify 0 as the ```auditInterval```.

```
helm install gatekeeper/gatekeeper --name-template=gatekeeper --namespace gatekeeper-system --create-namespace --set enableExternalData=true --set auditInterval=0
```

#### 2. How do I generate a Ratify TLS certificate 

You must provide a TLS certificate for Ratify to use or enable RATIFY_CERT_ROTATION. Enable feature flag `RATIFY_CERT_ROTATION` if you don't have a ready to use TLS certificate, Ratify will rotate certificates automatically when they are about to expire.

```bash
helm install ratify \
    ratify/ratify --atomic \
    --namespace gatekeeper-system \
    --set-file notationCert=<Your Notation Public Cert> \
    --set featureFlags.RATIFY_CERT_ROTATION=true
```

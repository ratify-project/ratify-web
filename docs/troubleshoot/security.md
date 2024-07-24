# Security

Refer to vulerability management and release documentation [here](https://github.com/ratify-project/ratify/blob/dev/SECURITY.md).

## Signature Validation

Ratify signs all dev images and dev helm OCI artifacts with Notary Project and Sigstore Cosign signatures.

### Verifying Notary Project Signature

Please install `notation` from [here](https://notaryproject.dev/docs/user-guides/installation/cli/)

The public certificate for verification can be found at `ratify.dev/.well-known/ratify-verification.crt`

> The latest certificate for verification can always be found at `ratify.dev/.well-known/ratify-verification.crt`. Refer to [Certificate Versioning](#certificate-versioning) guidance for details on verifying older artifacts.

```shell
curl -LO ratify.dev/.well-known/ratify-verification.crt
notation cert add --type ca --store ratify-verify ./ratify-verification.crt
cat <<EOF > ./trustpolicy.json
{
    "version": "1.0",
    "trustPolicies": [
        {
            "name": "ratify-images",
            "registryScopes": [
              "ghcr.io/ratify-project/ratify-dev",
              "ghcr.io/ratify-project/ratify-base-dev",
              "ghcr.io/ratify-project/ratify-crds-dev",
            ],
            "signatureVerification": {
                "level" : "strict" 
            },
            "trustStores": [ "ca:ratify-verify" ],
            "trustedIdentities": [
                "x509.subject: CN=ratify.dev,O=ratify-project,L=Seattle,ST=WA,C=US"
            ]
        }
    ]
}
EOF
notation policy import ./trustpolicy.json
notation verify ghcr.io/ratify-project/ratify-dev:latest
notation verify ghcr.io/ratify-project/ratify-chart-dev/ratify:0-dev
```

### Verifying Sigstore Cosign Signature

Please install cosign from [here](https://github.com/sigstore/cosign?tab=readme-ov-file#installation)

A keyless signature is published per image. The signature is uploaded to the Rekor public-good transparency server.

```shell
cosign verify \
  --certificate-identity "https://github.com/ratify-project/ratify/.github/workflows/publish-dev-assets.yml@refs/heads/dev" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-github-workflow-repository ratify-project/ratify \
  ghcr.io/ratify-project/ratify-dev:latest
```

```shell
cosign verify \
  --certificate-identity "https://github.com/ratify-project/ratify/.github/workflows/publish-dev-assets.yml@refs/heads/dev" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-github-workflow-repository ratify-project/ratify \
  ghcr.io/ratify-project/ratify-chart-dev/ratify:0-dev
```

### Certificate Versioning

Published images may be signed by a version of a certificate that is now expired/no longer the latest. Ratify will publish all versions of certificates used for verification and specify the end date of use in the certificate file name. This end date can be cross referenced with the publish date of the artifact you are verifying to determine which certificate to use for verification.

Certificates are versioned accordingly: `ratify.dev/.well-known/pki-validation/ratify-verification_<YYYYMMDD>.crt`.

For example, a user wants to verify the `ghcr.io/ratify-project/ratify-dev:dev.20240521.7e6f99f`. Let's say Ratify has 2 certificate versions. The latest is published at `ratify.dev/.well-known/pki-validation/ratify-verification.crt` and the previous version, which was last used on `20240620` (June 20, 2024), is stored at `ratify.dev/well-known/pki-validation/ratify-verification_20240620.crt`. Since the image to verify has timestamp `20240521` which is before the last date used of the previous certificate version `20240620`, the user should use `ratify.dev/well-known/pki-validation/ratify-verification_20240620.crt` for validation.

## Build Attestations

Ratify provides build attestations for each release starting with v1.3.0. The CRD, base image, and plugin-enabled images all have build attestations. These attestations describe the image contents and how they were built. They are generated using [Docker BuildKit](https://docs.docker.com/build/buildkit/) v0.11 or later. To get more information about build attestations, please refer to the [Docker build attestations documentation](https://docs.docker.com/build/attestations/).

Ratify provides [Software Bill of Materials (SBOM)](https://docs.docker.com/build/attestations/sbom/) and [SLSA Provenance](https://docs.docker.com/build/attestations/slsa-provenance/) for each image.

To get a list of images per OS and architecture and their corresponding attestations, please run:

```shell
$ docker buildx imagetools inspect ghcr.io/ratify-project/ratify:v1.3.0
Name:      ghcr.io/ratify-project/ratify:latest
MediaType: application/vnd.oci.image.index.v1+json
Digest:    sha256:f261f5076b8a1fd3f53cfbd10f647899d5875e4fcd40b1854598a18f580b422d
           
Manifests: 
  Name:        ghcr.io/ratify-project/ratify:v1.3.0@sha256:c99c9b5edfe005e0454c4160388a70520844d1856c1fcc3f8557532d6a034f32
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    linux/amd64
               
  Name:        ghcr.io/ratify-project/ratify:v1.3.0@sha256:f1b520af44d5e22b9b8702cbbcd651092df8672ed7822851266b17947c2a0962
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    linux/arm64
               
  Name:        ghcr.io/ratify-project/ratify:v1.3.0@sha256:6105d973c1c672379abfdb63486a0327d612c4fe67bb62e4d20cb910c0008aa9
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    linux/arm/v7
               
  Name:        ghcr.io/ratify-project/ratify:v1.3.0@sha256:836450813252daf7854b0aec1ccafe486bbb1352ec234b9adf105ddc24b0cb37
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    unknown/unknown
  Annotations: 
    vnd.docker.reference.digest: sha256:c99c9b5edfe005e0454c4160388a70520844d1856c1fcc3f8557532d6a034f32
    vnd.docker.reference.type:   attestation-manifest
               
  Name:        ghcr.io/ratify-project/ratify:v1.3.0@sha256:dcfa5faf20c916c9a41dd4636939594d8164f467ebb00d73570ae13cbcbf59ad
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    unknown/unknown
  Annotations: 
    vnd.docker.reference.digest: sha256:f1b520af44d5e22b9b8702cbbcd651092df8672ed7822851266b17947c2a0962
    vnd.docker.reference.type:   attestation-manifest
               
  Name:        ghcr.io/ratify-project/ratify:v1.3.0@sha256:c936d0ed115975ee7fc8196fbc5baff8100e92bff3d401c60df6396b9451e773
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    unknown/unknown
  Annotations: 
    vnd.docker.reference.type:   attestation-manifest
    vnd.docker.reference.digest: sha256:6105d973c1c672379abfdb63486a0327d612c4fe67bb62e4d20cb910c0008aa9
```

## SBOM

Ratify provides SBOM attestations for each release (starting with v1.3.0) and dev image. SBOM JSON files are also published for each release binary starting with v1.3.0.

### SBOM Build Attestations

To retrieve [SBOM](https://docs.docker.com/build/attestations/sbom/) for all architectures, please run:

```shell
docker buildx imagetools inspect ghcr.io/ratify-project/ratify:v1.3.0 --format '{{ json .SBOM }}'
```

For specific architecutes (like `linux/amd64`), please run:

```shell
docker buildx imagetools inspect ghcr.io/ratify-project/ratify:v1.3.0 --format '{{ json .SBOM }}' | jq -r '.["linux/amd64"]'
```

### SBOM for release binaries

Each release binary (.tar.gz) has an accompanying `.sbom.json` file that contains the SPDX SBOM contents generated using Syft.

## Credits

Inspired from Open Policy Agent's Gatekeeper [project](https://open-policy-agent.github.io/gatekeeper/website/docs/security/)

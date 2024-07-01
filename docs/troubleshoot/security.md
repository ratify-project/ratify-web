# Security

Refer to vulerability management and release documentation [here](https://github.com/ratify-project/ratify/blob/dev/SECURITY.md).

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

Ratify provides SBOM attestations for each release starting with v1.3.0. The CRD, base image

To retrieve [SBOM](https://docs.docker.com/build/attestations/sbom/) for all architectures, please run:

```shell
docker buildx imagetools inspect ghcr.io/ratify-project/ratify:v1.3.0 --format '{{ json .SBOM }}'
```

For specific architecutes (like `linux/amd64`), please run:

```shell
docker buildx imagetools inspect ghcr.io/ratify-project/ratify:v1.3.0 --format '{{ json .SBOM }}' | jq -r '.["linux/amd64"]'
```

## Credits

Inspired from Open Policy Agent's Gatekeeper [project](https://open-policy-agent.github.io/gatekeeper/website/docs/security/)

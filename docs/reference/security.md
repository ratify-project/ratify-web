# Security

Refer to vulerability management and release documentation [here](https://github.com/ratify-project/ratify/blob/dev/SECURITY.md).

## Signature Validation

Ratify signs all release images, dev images, and dev helm OCI artifacts with Notary Project and Sigstore Cosign signatures.

### Verifying Notary Project Signature

Please install `notation` from [here](https://notaryproject.dev/docs/user-guides/installation/cli/)

The public certificate for verification can be found at `ratify.dev/.well-known/pki-validation/ratify-verification.crt`

> The latest certificate for verification can always be found at `ratify.dev/.well-known/pki-validation/ratify-verification.crt`. Refer to [Certificate Versioning](#certificate-versioning) guidance for details on verifying older artifacts.

Example: Verify Ratify release images for v1.4.0 and Ratify dev images
```shell
curl -LO ratify.dev/.well-known/pki-validation/ratify-verification.crt
curl -LO ratify.dev/.well-known/pki-validation/ratify-verification_20250328.crt
notation cert add --type ca --store ratify-verify ./ratify-verification.crt
notation cert add --type ca --store ratify-verify ./ratify-verification_20250328.crt
cat <<EOF > ./trustpolicy.json
{
    "version": "1.0",
    "trustPolicies": [
        {
            "name": "ratify-images",
            "registryScopes": [
              "ghcr.io/ratify-project/ratify",
              "ghcr.io/ratify-project/ratify-base",
              "ghcr.io/ratify-project/ratify-crds",
              "ghcr.io/ratify-project/ratify-dev",
              "ghcr.io/ratify-project/ratify-base-dev",
              "ghcr.io/ratify-project/ratify-crds-dev",
              "ghcr.io/ratify-project/ratify-chart-dev/ratify"
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
notation verify ghcr.io/ratify-project/ratify:v1.4.0
notation verify ghcr.io/ratify-project/ratify-dev:latest
```

Sample output of `verify` for ratify dev image:

```shell
Warning: Always verify the artifact using digest(@sha256:...) rather than a tag(:latest) because resolved digest may not point to the same signed artifact, as tags are mutable.
Successfully verified signature for ghcr.io/ratify-project/ratify-dev@sha256:9f25b5cdfecac47ab36a4fef7ce9fca2ef9a2665ef5c2b8c3c1410348f40b3bf
```

### Verifying Sigstore Cosign Signature

Please install cosign from [here](https://github.com/sigstore/cosign?tab=readme-ov-file#installation)

A keyless signature is published per image. The signature is uploaded to the Rekor public-good transparency server.

```shell
cosign verify \
  --certificate-identity-regexp "https://github.com/ratify-project/ratify/.github/workflows/publish-package.yml@*" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-github-workflow-repository ratify-project/ratify \
  ghcr.io/ratify-project/ratify:v1.4.0
```

```shell
cosign verify \
  --certificate-identity "https://github.com/ratify-project/ratify/.github/workflows/publish-dev-assets.yml@refs/heads/dev" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-github-workflow-repository ratify-project/ratify \
  ghcr.io/ratify-project/ratify-dev:latest
```

Sample output of verifcation of ratify dev image:

```shell
Verification for ghcr.io/ratify-project/ratify-dev:latest --
The following checks were performed on each of these signatures:
  - The cosign claims were validated
  - Existence of the claims in the transparency log was verified offline
  - The code-signing certificate was verified using trusted certificate authority certificates
[
  {
    "critical": {
      "identity": {
        "docker-reference": "ghcr.io/ratify-project/ratify-dev"
      },
      "image": {
        "docker-manifest-digest": "sha256:9f25b5cdfecac47ab36a4fef7ce9fca2ef9a2665ef5c2b8c3c1410348f40b3bf"
      },
      "type": "cosign container image signature"
    },
    "optional": {
      "1.3.6.1.4.1.57264.1.1": "https://token.actions.githubusercontent.com",
      "1.3.6.1.4.1.57264.1.2": "workflow_dispatch",
      "1.3.6.1.4.1.57264.1.3": "17f829aec8611ac0c6da3f096e21a519b27dd977",
      "1.3.6.1.4.1.57264.1.4": "publish-dev-assets",
      "1.3.6.1.4.1.57264.1.5": "ratify-project/ratify",
      "1.3.6.1.4.1.57264.1.6": "refs/heads/dev",
      "Bundle": {
        "SignedEntryTimestamp": "MEQCIEwZrlxWQApfNhpN3dZzPnXgZFhuC6UCL1crS839hZTrAiBxz8PBZ6PbORBOcssNPIU6TILM2t4BZIA82UQ6t23Y9w==",
        "Payload": {
          "body": "eyJhcGlWZXJzaW9uIjoiMC4wLjEiLCJraW5kIjoiaGFzaGVkcmVrb3JkIiwic3BlYyI6eyJkYXRhIjp7Imhhc2giOnsiYWxnb3JpdGhtIjoic2hhMjU2IiwidmFsdWUiOiIxYzcxY2ZkOWVmYmYzZWE3MTllZDE0MjFhZWM5MDg3M2I4Zjk3NzhlOTM5ZjEyZTA5ZDhjNzY0MDlmNjdmMWRmIn19LCJzaWduYXR1cmUiOnsiY29udGVudCI6Ik1FUUNJQjhMU05FM2dVZFBNVkxEejVESFNSS0lLeTJtWHJWWGRDd1p2MjBsQ04rWEFpQXA0RHNxUXltYXloenVTMWlXZ3NmZVBwemJId2Z4MWtmdG5JTlBiaC9QblE9PSIsInB1YmxpY0tleSI6eyJjb250ZW50IjoiTFMwdExTMUNSVWRKVGlCRFJWSlVTVVpKUTBGVVJTMHRMUzB0Q2sxSlNVaENha05EUW05MVowRjNTVUpCWjBsVldscEpUVU5wVjJZNVdUTmFhelVyUVVFek1VUTBTblpHUXpOcmQwTm5XVWxMYjFwSmVtb3dSVUYzVFhjS1RucEZWazFDVFVkQk1WVkZRMmhOVFdNeWJHNWpNMUoyWTIxVmRWcEhWakpOVWpSM1NFRlpSRlpSVVVSRmVGWjZZVmRrZW1SSE9YbGFVekZ3WW01U2JBcGpiVEZzV2tkc2FHUkhWWGRJYUdOT1RXcFJkMDU2VFhoTmFrVjVUVlJKTlZkb1kwNU5hbEYzVG5wTmVFMXFSWHBOVkVrMVYycEJRVTFHYTNkRmQxbElDa3R2V2tsNmFqQkRRVkZaU1V0dldrbDZhakJFUVZGalJGRm5RVVUyYkRRd1JHZFpSR1F4YlVkRlJXMHJlV2N2ZFc1M04xZFpSMjAxTlZOTlNUazJaMEVLS3l0M2FtUnFNalYxYVdsRGVUZEpZVkJ4WldwaWNtdDFMM2g0TVhNeFJsUnpjRlZCUWt0YUwxZHZlVFJSVWsxNGJYRlBRMEpoYjNkbloxZHRUVUUwUndwQk1WVmtSSGRGUWk5M1VVVkJkMGxJWjBSQlZFSm5UbFpJVTFWRlJFUkJTMEpuWjNKQ1owVkdRbEZqUkVGNlFXUkNaMDVXU0ZFMFJVWm5VVlZLV2xjckNuQjRSbXR6Y2xKMVVIbDNabWRMY2tNd2IwWmlaRXRKZDBoM1dVUldVakJxUWtKbmQwWnZRVlV6T1ZCd2VqRlphMFZhWWpWeFRtcHdTMFpYYVhocE5Ga0tXa1E0ZDJKbldVUldVakJTUVZGSUwwSkhVWGRaYjFwbllVaFNNR05JVFRaTWVUbHVZVmhTYjJSWFNYVlpNamwwVEROS2FHUkhiRzFsVXpGM1kyMDVjUXBhVjA0d1RETkthR1JIYkcxbFV6aDFXakpzTUdGSVZtbE1NMlIyWTIxMGJXSkhPVE5qZVRsM1pGZEtjMkZZVG05TVYxSnNaR2t4YUdNelRteGtTRTExQ21WWE1YTlJTRXBzV201TmRtRkhWbWhhU0UxMldrZFdNazFFYTBkRGFYTkhRVkZSUW1jM09IZEJVVVZGU3pKb01HUklRbnBQYVRoMlpFYzVjbHBYTkhVS1dWZE9NR0ZYT1hWamVUVnVZVmhTYjJSWFNqRmpNbFo1V1RJNWRXUkhWblZrUXpWcVlqSXdkMGgzV1V0TGQxbENRa0ZIUkhaNlFVSkJaMUZTWkRJNWVRcGhNbHB6WWpOa1pscEhiSHBqUjBZd1dUSm5kMDVuV1V0TGQxbENRa0ZIUkhaNlFVSkJkMUZ2VFZSa2JVOUVTVFZaVjFacVQwUlplRTFYUm1wTlIwMHlDbHBIUlhwYWFrRTFUbTFWZVUxWFJURk5WR3hwVFdwa2ExcEVhek5PZWtGblFtZHZja0puUlVWQldVOHZUVUZGUlVKQ1NuZGtWMHB6WVZoT2IweFhVbXdLWkdreGFHTXpUbXhrU0UxM1NYZFpTMHQzV1VKQ1FVZEVkbnBCUWtKUlVWWmpiVVl3WVZkYU5VeFlRbmxpTW5Cc1dUTlJkbU50UmpCaFYxbzFUVUozUndwRGFYTkhRVkZSUW1jM09IZEJVVmxGUkc1S2JGcHVUWFpoUjFab1draE5kbHBIVmpKTlJITkhRMmx6UjBGUlVVSm5OemgzUVZGblJVeFJkM0poU0ZJd0NtTklUVFpNZVRrd1lqSjBiR0pwTldoWk0xSndZakkxZWt4dFpIQmtSMmd4V1c1V2VscFlTbXBpTWpVd1dsYzFNRXh0VG5aaVZFSjNRbWR2Y2tKblJVVUtRVmxQTDAxQlJVcENSMGxOV1Vkb01HUklRbnBQYVRoMldqSnNNR0ZJVm1sTWJVNTJZbE01ZVZsWVVuQmFibXQwWTBoS2RtRnRWbXBrUXpsNVdWaFNjQXBhYm10MlRHMWtjR1JIYURGWmFUa3pZak5LY2xwdGVIWmtNMDEyWTBoV2FXSkhiSHBoUXpGcldsaFpkRmxZVG5wYVdGSjZURzVzZEdKRlFubGFWMXA2Q2t3eWFHeFpWMUo2VERKU2JHUnFRVFJDWjI5eVFtZEZSVUZaVHk5TlFVVkxRa052VFV0RVJUTmFhbWQ1VDFkR2JGbDZaekpOVkVab1dYcENhazV0VW1nS1RUSlpkMDlVV214TmFrWm9UbFJGTlZscVNUTmFSMUUxVG5wamQwaFJXVXRMZDFsQ1FrRkhSSFo2UVVKRGQxRlFSRUV4Ym1GWVVtOWtWMGwwWVVjNWVncGtSMVpyVFVSblIwTnBjMGRCVVZGQ1p6YzRkMEZSZDBWTFozZHZZVWhTTUdOSVRUWk1lVGx1WVZoU2IyUlhTWFZaTWpsMFRETkthR1JIYkcxbFV6RjNDbU50T1hGYVYwNHdURE5LYUdSSGJHMWxWRUUwUW1kdmNrSm5SVVZCV1U4dlRVRkZUa0pEYjAxTFJFVXpXbXBuZVU5WFJteFplbWN5VFZSR2FGbDZRbW9LVG0xU2FFMHlXWGRQVkZwc1RXcEdhRTVVUlRWWmFra3pXa2RSTlU1NlkzZElaMWxMUzNkWlFrSkJSMFIyZWtGQ1JHZFJVVVJCTlhsYVYxcDZUREpvYkFwWlYxSjZUREpTYkdScVFWcENaMjl5UW1kRlJVRlpUeTlOUVVWUVFrRnpUVU5VVFRWT1ZHTjRUbnByZWsxRVFYaENaMjl5UW1kRlJVRlpUeTlOUVVWUkNrSkRUVTFKVjJnd1pFaENlazlwT0haYU1td3dZVWhXYVV4dFRuWmlVemw1V1ZoU2NGcHVhM1JqU0VwMllXMVdhbVJFUVZwQ1oyOXlRbWRGUlVGWlR5OEtUVUZGVWtKQmMwMURWRVV5VGxSbmVrNVVaekJPYWtKM1FtZHZja0puUlVWQldVOHZUVUZGVTBKSFNVMVpSMmd3WkVoQ2VrOXBPSFphTW13d1lVaFdhUXBNYlU1MllsTTVlVmxZVW5CYWJtdDBZMGhLZG1GdFZtcGtRemw1V1ZoU2NGcHVhM1pNYldSd1pFZG9NVmxwT1ROaU0wcHlXbTE0ZG1RelRYWmpTRlpwQ21KSGJIcGhRekZyV2xoWmRGbFlUbnBhV0ZKNlRHNXNkR0pGUW5sYVYxcDZUREpvYkZsWFVucE1NbEpzWkdwQk5FSm5iM0pDWjBWRlFWbFBMMDFCUlZRS1FrTnZUVXRFUlROYWFtZDVUMWRHYkZsNlp6Sk5WRVpvV1hwQ2FrNXRVbWhOTWxsM1QxUmFiRTFxUm1oT1ZFVTFXV3BKTTFwSFVUVk9lbU4zU1ZGWlN3cExkMWxDUWtGSFJIWjZRVUpHUVZGVVJFSkdNMkl6U25KYWJYaDJaREU1YTJGWVRuZFpXRkpxWVVSQ1kwSm5iM0pDWjBWRlFWbFBMMDFCUlZaQ1JUUk5DbFJIYURCa1NFSjZUMms0ZGxveWJEQmhTRlpwVEcxT2RtSlRPWGxaV0ZKd1dtNXJkR05JU25aaGJWWnFaRU01ZVZsWVVuQmFibXQyV1ZkT01HRlhPWFVLWTNrNWVXUlhOWHBNZWtWM1RWUm5NMDVxYXpKT1JHY3pUREpHTUdSSFZuUmpTRko2VEhwRmQwWm5XVXRMZDFsQ1FrRkhSSFo2UVVKR1oxRkpSRUZhZHdwa1YwcHpZVmROZDJkWmMwZERhWE5IUVZGUlFqRnVhME5DUVVsRlpsRlNOMEZJYTBGa2QwUmtVRlJDY1hoelkxSk5iVTFhU0doNVdscDZZME52YTNCbENuVk9ORGh5Wml0SWFXNUxRVXg1Ym5WcVowRkJRVnBGUzNFeVJDOUJRVUZGUVhkQ1NVMUZXVU5KVVVOelUzaHJXRVZoY0U1R1FVeHpVamd4WkRSRlYwc0tPRTl4Vm1ONWNIQnJOekZ1VFhreWRXcEtXa3htUVVsb1FVcGFlVlZ2VlZNd0wyTXJSa0phVEdWaE4weEpja1ZEY0M4MWJHVlRRa0pPTm14RU5FWkdWUXBMZFRSV1RVRnZSME5EY1VkVFRUUTVRa0ZOUkVFeWEwRk5SMWxEVFZGRGNFY3paMjQwYVdSc1JIVllTVVZPVlhaUk0zVkZUMDgxU3pRd2FHZFRiVWhYQ2tkQ1dFTkpPVkZpTnk5S05rSlJRWEZyYm1wWWEzTmhiRTVtV2xsWFdqUkRUVkZFZHpOb1REbFBibEpMVkZob04xYzJSWFozZW1oWU5XYzNjalk1WkhNS2QxcExZbUpuTVZkUVJYaGtNMU1yV1VzeFZtaFlPWEJyYW1OMGNrUkZlRFl6U3pROUNpMHRMUzB0UlU1RUlFTkZVbFJKUmtsRFFWUkZMUzB0TFMwSyJ9fX19",
          "integratedTime": 1722460889,
          "logIndex": 117211424,
          "logID": "c0d23d6ad406973f9559f3ba2d1ca01f84147d8ffc5b8445c224f98b9591801d"
        }
      },
      "Issuer": "https://token.actions.githubusercontent.com",
      "Subject": "https://github.com/ratify-project/ratify/.github/workflows/publish-dev-assets.yml@refs/heads/dev",
      "githubWorkflowName": "publish-dev-assets",
      "githubWorkflowRef": "refs/heads/dev",
      "githubWorkflowRepository": "ratify-project/ratify",
      "githubWorkflowSha": "17f829aec8611ac0c6da3f096e21a519b27dd977",
      "githubWorkflowTrigger": "workflow_dispatch"
    }
  }
]
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

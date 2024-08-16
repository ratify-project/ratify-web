# Feature Deprecation Notice
---

This document outlines the features that are deprecated in the past releases. Deprecation means that these features will no longer be supported or recommended for use, and will be completely removed in the next major release. Users should transition to alternative features or solutions as specified below.

## Table of contents
- [Feature Deprecation Notice](#feature-deprecation-notice)
  - [Table of contents](#table-of-contents)
  - [Deprecation Summary](#deprecation-summary)
  - [Deprecation Details](#deprecation-details)
    - [`Name` and `Type` fields in verifierReport](#name-and-type-fields-in-verifierreport)
    - [`CertificateStore` CRD](#certificatestore-crd)
    - [Legacy Cosign Veification](#legacy-cosign-veification)
    - [licensechecker verifier plugin](#licensechecker-verifier-plugin)

## Deprecation Summary

| Deprecated Feature                         | Deprecation Version | Removal Version | Replacement/Alternative                       |
| ------------------------------------------ | ------------------- | --------------- | --------------------------------------------- |
| `Name` and `Type` fields in verifierReport | v1.3.0              | v2.0.0          | Use `VerifierName` and `VerifierName` instead |
| `CertificateStore` CRD                     | v1.2.0              | v2.0.0          | Use `KeyManagementProvider` CRD instead       |
| Legacy Cosign Veification                  | v1.2.0              | v2.0.0          | Use new Cosign verifier instead               |
| licensechecker verifier plugin             | v1.1.0              | v2.0.0          | Use `SBOM` verifier plugin instead            |
## Deprecation Details

### `Name` and `Type` fields in verifierReport
- **Description**: 
  `Name` and `Type` fields in [VerifierReport](./verification-result-version.md) refer to the name and type of the verifier that generated the report.
- **Reason for Deprecation**:
    The `Name` and `Type` fields are ambiguous and can be misleading. Users had feedback that these fields are not clear and can be confusing.
- **Impact**:
  If users have custom constraint template that uses these fields, they will need to update their templates to use the new fields.
- **Replacement/Alternative**:
  Switch to `VerifierName` and `VerifierType` fields instead, which is supported since v1.3.0.
- **Action Required**:
  Update any custom constraint templates that use the `Name` and `Type` fields to use the new `VerifierName` and `VerifierType` fields instead.

### `CertificateStore` CRD
- **Description**:
  A [CertificateStore](./custom%20resources/certificate-stores.md) resource defines an array of public certificates to fetch from a provider.
- **Reason for Deprecation**:
  1. CertificateStore does not support fetching keys from a provider.
  2. It does not support periodic key rotation either.
  3. It's not designed to support multi-tenancy scenario.
- **Impact**:
  Users will need to migrate to the new [KeyManagementProvider](./custom%20resources/key-management-providers.md) CRD for existing Certificatestore resources.
- **Replacement/Alternative**:
  Use the new `KeyManagementProvider` CRD instead, which is supported since v1.2.0.
- **Action Required**:
- Follow the [migration guide](./custom%20resources/key-management-providers.md#migrating-from-certificatestore-to-kmp) to migrate existing CertificateStore resources to KeyManagementProvider resources.

### Legacy Cosign Veification
- **Description**:
  The primitive implementation of the Cosign verifier to support basic verification of Cosign signatures.
- **Reason for Deprecation**:
  1. The legacy Cosign Verifier does not support multiple keys.
  2. It does not support fetching keys from a key management provider.
  3. It does not support ECDSA keys, RSA keys, or Ed25519 keys.
- **Impact**:
  Users will need to migrate to the new Cosign verifier instead but get more features and better security.
- **Replacement/Alternative**:
  The cosign verifier configuration is backward compatible with the legacy cosign verifier. Users can update the verifier configuration to use the new cosign verifier. The new Cosign verifier with trust policy support is available since v1.2.0.
- **Action Required**:
  Configure `trustPolicies` instead of `key` and `rekorURL` to set up Cosign verifier. [Learn more](../plugins/verifier/cosign.md#kubernetes)

### licensechecker verifier plugin
- **Description**:
  The primitive implementation of the licensechecker verifier to support basic verification of license compliance.
- **Reason for Deprecation**:
  License Checker verifier plugin is deprecated in favor of the SBOM verifier plugin. It only implements a strict validation against allowed license list.
- **Impact**:
  The current licensechecker verifier plugin will be removed in the next major release and stopped working with the new version.
- **Replacement/Alternative**:
  Use [SBOM verifier plugin](../plugins/verifier/sbom.md) instead, which is supported since v1.1.0.
- **Action Required**:
- Switch to use SBOM verifier plugin.
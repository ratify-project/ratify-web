# Ratify Website Release Process

1. Create a release branch for new version of docs (can be from a personal fork too).
1. Define version of the docs. This MUST be the major + minor version ONLY. For example, if the next Ratify version is `1.2.0`, then the docs version will be `1.2`.
1. Generate new versioned documentation:
```shell
npm run docusaurus docs:version <DOC VERSION>
```
1. Push new versioned docs and sidebars. Then, PR to main branch.

## Notes
- Once a new versioned doc set is generated, the previous version is automatically marked as stale with a banner on top.
- The website will default to the latest versioned doc
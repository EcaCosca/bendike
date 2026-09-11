---
applyTo: '.github/workflows/*.{yml,yaml}'
---

# Pipeline Instructions

## Workflow Structure Requirements

1. Every CI workflow MUST install with `npm ci` and run `npm run lint`, `npm run format:check`, `npm run typecheck`,
   `npm run test:unit` and `npm run build` at minimum. `npm ci` triggers the root `prepare` script, which builds
   `packages/shared`; do not add a separate step for it.
2. Use `actions/setup-node@<sha>` with `node-version: '24'` to match `engines.node` and `.nvmrc`.
3. Pin every third-party action to a full commit SHA with a trailing version comment.
4. Workflows run on `ubuntu-latest`.
5. Grant the minimum `permissions:` a job needs. Default is `contents: read`.

## Action Pinning Format

```yaml
# ✅ Correct
uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

# ❌ Wrong — version tag or branch only
uses: actions/checkout@v4
uses: actions/checkout@main
```

Before adding any action:

1. Check the GitHub release for the latest stable version.
2. Find the full commit SHA for that tag.
3. Use both the SHA and a trailing version comment.

## Secrets and environment in workflows

- Never echo secrets. Never pass them as command-line arguments.
- Unit tests need no database and no secrets. If a future job needs PostgreSQL, add it as a `services:` container
  in that job only and keep credentials in job-scoped `env:`.

## Validation tools

Run `npx prettier --check .github/workflows` locally before pushing a workflow change.

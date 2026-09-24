# Deploys run from GitHub Actions through an OIDC role and SSM Run Command

---

status: proposed

---

ADR 0017 put the API and Postgres on one EC2 instance and the web app on S3 behind CloudFront, deployed by hand.
On 2026-09-24 a feature reached `main` with CI green and production kept the old build until someone deployed. Eca
asked for deploys to happen on push (spec: `.github/specs/continuous-deployment.md`). The constraints from 0017
stand: near-zero cost, no SSH on the instance, least privilege, and every step something Eca can recognise in the
AWS console.

## Decision

A `Deploy` workflow runs when the `CI` workflow succeeds on `main` (and on manual dispatch), for the exact commit
CI validated.

- **Credentials**: GitHub assumes an IAM role with `AssumeRoleWithWebIdentity` using the repository's OIDC token.
  The trust policy accepts only `repo:EcaCosca/bendike:ref:refs/heads/main`. No access keys exist.
- **Web**: the runner builds `apps/web`, syncs `dist` to the bucket (hashed `assets/` immutable for a year, the rest
  five minutes) and invalidates `/*` on the distribution.
- **API**: the runner sends one `AWS-RunShellScript` through SSM Run Command to the instance. The script resets the
  clone to the validated commit and runs `docker compose -f docker-compose.prod.yml up -d --build api`, so the
  image is built where it runs, as today. The workflow polls the invocation, prints its output and then checks
  `GET /api/v1/health` over HTTPS.
- **Safety**: one deploy at a time (a concurrency group), and an unconfigured repository ends the run green with a
  notice instead of failing, so setting up the AWS side can happen after the workflow is merged.

## Considered Options

- **Long-lived IAM access keys in GitHub secrets.** Rejected: a leaked key is a standing credential; OIDC tokens
  live minutes and are scoped to the branch.
- **SSH from the runner** (key in a secret, port 22 open to GitHub's ranges). Rejected: 0017 deliberately closed
  SSH; SSM Run Command uses the agent the instance already runs for Session Manager.
- **Build the API image in Actions and push to ECR, pull on the instance.** Rejected for now: adds a registry,
  its cost and its IAM, for a t3-class instance that already builds the image in a few minutes. Revisit if builds
  slow deploys or the instance runs out of memory building.
- **A deploy job inside `ci.yml`.** Rejected: CI runs on pull requests too and should stay free of AWS
  permissions; `workflow_run` keeps the deploy in its own workflow with its own `id-token` permission.
- **Deploy on every push regardless of CI.** Rejected: the whole point of `validate` is to keep a red build out of
  production.

## Consequences

- A push to `main` reaches production in roughly the CI time plus a few minutes. A red CI run deploys nothing.
- The instance's clone is reset hard to the deployed commit; local edits on the instance are lost on the next
  deploy, which is the intended state. `.env` is untracked and survives.
- Three AWS objects (provider, role, policy) and six GitHub settings must exist; until they do, deploys are
  skipped with a notice and Eca deploys by hand as before.
- Seeds and one-off scripts remain manual through the `tools` compose profile; the workflow deploys code, not data.

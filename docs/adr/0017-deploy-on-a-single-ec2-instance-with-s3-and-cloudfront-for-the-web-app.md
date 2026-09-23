# Deploy on a single EC2 instance, with S3 and CloudFront for the web app

---

status: accepted

---

Bendike has run only on Eca's laptop so far. He is studying for the AWS Cloud Practitioner and Solutions Architect
certifications and wants the real deployment to run on AWS, set up by hand in the console rather than through
Infrastructure as Code, so the exam material sticks (briefing, 2026-09-23). The overriding constraint is cost: as
close to free as the AWS Free Tier allows today, with a steady-state cost near $0 once any free tier or credit runs
out.

We decided to run the API and Postgres the same way they already run locally, in Docker, on one small EC2 instance
(`t4g.micro` or `t3.micro`, whichever the account's Free Tier covers), with Caddy on the same box as a reverse proxy
that gets its TLS certificate from Let's Encrypt automatically. The web app is a static Vite build, so it is served
from an S3 bucket behind a CloudFront distribution instead of a server, with a certificate from ACM. Route 53 holds
the domain and points `api.<domain>` at the instance's Elastic IP and the apex/`www` at CloudFront. This mirrors the
`packages/shared` → `apps/api`/`apps/web` split already in the repo: one deployable API, one deployable static site.

## Considered Options

- **One self-managed EC2 instance running Docker Compose (chosen)**: no managed database or load balancer to pay for,
  and it is the same Postgres-in-Docker setup already used locally, so nothing about the app changes for production.
  The cost is that Eca owns patching the instance, backing up the Postgres volume (EBS snapshots) and restarting
  Docker after a reboot. Acceptable at Bendike's current size, and the EC2/security-group/IAM-role work is itself
  exam material.
- **RDS for Postgres**: rejected for now. RDS free tier lasts 12 months on a new account; afterwards a `db.t3.micro`
  plus storage is real money every month, for a database with no more days-in-service reason to exist than the one
  already living on the same EC2 box.
- **ECS Fargate or Elastic Beanstalk for the API**: rejected. Both add an Application Load Balancer, which is not
  part of the Free Tier and costs roughly $16/month on its own, more than everything else in this ADR combined.
- **Lambda + API Gateway (fully serverless)**: the cheapest option at low traffic and worth revisiting later, but it
  would mean rewriting the NestJS bootstrap to a Lambda handler and re-testing cold starts against the packing-sheet
  and digest jobs. Deferred; not a drop-in for the app as it exists today.
- **Terraform or the AWS CDK to provision everything**: the more maintainable and reproducible choice, and the
  natural next step once the manual setup is familiar. Deferred at Eca's request: doing it by hand in the console
  first is the point, for the certifications.

## Consequences

- New instance-level state to keep safe: the EC2 key pair, the `.env` file on the box (never committed; holds
  `POSTGRES_PASSWORD`, `JWT_SECRET`, the email/Drive credentials already in `apps/api/.env.example`, plus `DOMAIN`),
  and the Postgres EBS volume, which is the only copy of the data unless it is snapshotted.
- A reboot of the instance needs `docker compose -f docker-compose.prod.yml up -d` run again unless `restart:
unless-stopped` (set on every service) brings it back on its own, which it does as long as the Docker daemon
  itself starts on boot.
- `apps/api/Dockerfile`, `docker-compose.prod.yml` and `Caddyfile` are new, at the repo root and in `apps/api/`,
  alongside the existing local `docker-compose.yml`, which stays as it is for development.
- Deploying a new version of the API means SSHing in, pulling and rebuilding; there is no CI/CD pipeline yet. Adding
  one (build on push, `scp`/`rsync` and `docker compose up -d --build`) is future work once the manual flow is solid.
- The web app's deploy step becomes `npm run build -w @bendike/web` followed by `aws s3 sync` and a CloudFront
  invalidation, run by hand for now; no server ever serves `apps/web`.
- CloudFront needs its ACM certificate requested in `us-east-1` regardless of which region everything else runs in
  (`sa-east-1`, chosen for latency to Argentina); the API's certificate is a separate one, issued by Caddy itself.

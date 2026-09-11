# Bendike

Monorepo for Bendike: a React web app, a NestJS API and a shared package of domain types.
Accounts carry one of four roles: `user`, `rigger`, `dropzone` or `admin`.

## Layout

```
apps/web/          React 19 + Vite + MUI single-page app
apps/api/          NestJS 11 API with PostgreSQL (TypeORM) and JWT auth
packages/shared/   Role definitions and API contracts shared by both apps
.github/specs/     One spec per feature (spec-driven development)
docs/adr/          Architecture decision records
```

## Prerequisites

- Node 24 (`.nvmrc`)
- Docker (for the local PostgreSQL)

## Run locally

```bash
npm install                 # installs every workspace and builds packages/shared
npm run db:up               # PostgreSQL 17 on localhost:5432
cp apps/api/.env.example apps/api/.env
npm run dev:api             # API on http://localhost:3000 (Swagger at /docs)
npm run dev:web             # web on http://localhost:5173, proxies /api to the API
```

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `apps/api/.env` to get a first admin account on startup.
Everyone who registers through the app starts as `user`. Admins promote accounts to `rigger`, `dropzone` or `admin`.

## Validate

```bash
npm run validate            # lint, format check, typecheck, unit tests, build
```

## How work happens here

Every feature starts as a spec in `.github/specs/`, written with the "Feature To Spec" issue template.
See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for the engineering guide.

---
applyTo: '**'
---

# Bendike

Bendike is a monorepo with three workspaces: a React single-page app (`apps/web`), a NestJS API backed by
PostgreSQL (`apps/api`) and a shared package of domain types (`packages/shared`). Accounts carry exactly one of
four roles, `user`, `rigger`, `dropzone` or `admin`, defined once in `packages/shared/src/roles.ts` and enforced
by the API. A dropzone is an organisation account (the venue or operator), not a person.

Every new account is a `user`. Only an `admin` can change another account's role, and never their own. The
landing page at `/` explains what Bendike is to visitors who are not signed in.

## Commands

All commands run from the repository root.

```bash
npm install              # Install every workspace and build packages/shared
npm run db:up            # PostgreSQL 17 in Docker on localhost:5432
npm run dev:api          # API with hot reload on http://localhost:3000 (Swagger UI at /docs)
npm run dev:web          # Web app on http://localhost:5173, proxies /api to the API
npm run lint             # ESLint across the whole monorepo
npm run format           # Prettier
npm run format:check     # Prettier, check only
npm run typecheck        # tsc in every workspace
npm run test:unit        # Jest in every workspace
npm run test:unit:cov    # Jest with coverage
npm run build            # Build shared, then API and web
```

Validation suite before commits and before every PR, even docs-only PRs:

```bash
npm run validate
```

That is `lint`, `format:check`, `typecheck`, `test:unit` and `build` in sequence. A task is NOT complete until
the full validation suite passes.

## Workflow: TDD Required

All code changes follow TDD:

1. **Research** the codebase for existing patterns before adding anything new.
2. **Write a failing test** describing the desired behavior. Tests live next to the code as `*.spec.ts` (API,
   shared) or `*.spec.tsx` (web).
3. **Verify failure** with a scoped run, for example `npm run test:unit -w @bendike/api -- path/to/file.spec.ts`.
4. **Implement minimal code** to make the test pass.
5. **Verify pass** with the same scoped command.
6. **Refactor** while keeping the test green.
7. **Validate** with `npm run validate`.

## Tech Stack

- **Monorepo:** npm workspaces, Node 24 (`.nvmrc`). No pnpm, no yarn, no Turborepo, no Nx.
- **Web:** React 19, Vite 6, React Router 6, MUI 7. State that must survive reloads lives in `localStorage`
  behind `auth-context.tsx`. No Redux until a spec asks for it.
- **API:** NestJS 11 on `@nestjs/platform-express`, TypeScript strict, CommonJS (Nest's reflection-based DI
  requires it).
- **Database:** PostgreSQL 17 through TypeORM 0.3. `synchronize` is always `false`. Schema changes ship as
  migrations in `apps/api/src/database/migrations/` and run on startup.
- **Auth:** email + password (bcryptjs, cost 12) exchanged for a JWT (`@nestjs/jwt`, `passport-jwt`). The JWT
  carries `sub`, `email` and `role`, but `JwtStrategy.validate` reloads the account from the database so a role
  change applies on the next request, not at token expiry.
- **Validation:** `class-validator` + `class-transformer` DTOs through the global `ValidationPipe`
  (`whitelist` and `forbidNonWhitelisted` are on). Never `as Type` on request bodies.
- **Shared types:** `@bendike/shared` exports `ROLES`, `Role`, `isRole` and the request/response contracts. The
  API compiles against its `dist/`, the web app aliases straight to its `src/`.
- **Testing:** Jest 30 with `ts-jest` everywhere. `@nestjs/testing` for the API, `@testing-library/react` with
  `jest-environment-jsdom` for the web. Never Vitest.
- **Lint/format:** one root `eslint.config.mjs` (typed linting, Prettier as a rule, React hooks rules for
  `apps/web`) and one root `.prettierrc.json`. Never Biome.
- **Git hooks:** husky runs lint-staged on commit.

## Project Structure

```
apps/api/src/
  main.ts                 Bootstrap: global prefix api/v1, ValidationPipe, CORS, Swagger at /docs
  app.module.ts           Root composition
  config/                 EnvConfig (validated at startup) and the typed AppConfigService
  database/               TypeORM options, CLI data-source, migrations/
  health/                 GET /api/v1/health
  users/                  User entity, UsersService, admin-only UsersController, summaries
  auth/                   Register/login/me, PasswordHasher, JwtStrategy, guards, Roles decorator, admin seed

apps/web/src/
  main.tsx                Providers: MUI theme, BrowserRouter, AuthProvider
  App.tsx                 Routes; RequireAuth and RequireRole wrap the protected ones
  api/http.ts             fetch wrapper that prefixes /api/v1 and turns API errors into ApiError
  auth/                   auth-api.ts (calls), auth-context.tsx (session), RequireAuth, RequireRole
  components/             AppShell (top bar + container)
  pages/                  LandingPage, LoginPage, RegisterPage, DashboardPage, AdminUsersPage
  theme/                  MUI theme

packages/shared/src/
  roles.ts                ROLES tuple, Role type + constants, isRole
  contracts.ts            Request/response interfaces shared by API DTOs and web calls

.github/specs/            One spec per feature (spec-driven development)
docs/adr/                 Architecture decision records
docs/personas.md          Persona definitions referenced by specs
```

> **Spec conventions:** every feature starts with the **Feature To Spec** issue template and lands as one file
> in `.github/specs/<feature-slug>.md`. See `.github/instructions/spec.instructions.md`.

## Code Style

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }
}
```

**Rules:**

- Always type things. Never `any` on external input.
- Validate external data at runtime with DTOs. The global `ValidationPipe` does it for controllers.
- Roles are the `Role` constants from `@bendike/shared`. Never compare against a string literal like `'admin'`.
- Controllers stay thin. Business rules live in services. Guards decide access, services decide outcomes.
- Use Nest exceptions (`ConflictException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`)
  for HTTP error mapping.
- **No explanatory comments in code.** Names carry the meaning. The "why" goes in the spec, the ADR or the PR
  description. Only tooling directives such as `// @ts-check` or `/// <reference>` are acceptable.
- Never log passwords, password hashes, tokens or `Authorization` header values.
- Remove unused imports and variables.
- Run lint and tests after every change.

## Roles and Access

| Concern                  | Where it lives                                                     |
| ------------------------ | ------------------------------------------------------------------ |
| The list of roles        | `packages/shared/src/roles.ts` (`ROLES`, `Role`, `isRole`)         |
| Storage                  | `users.role`, PostgreSQL enum `user_role`, default `'user'`        |
| Default for new accounts | `AuthService.register` always writes `Role.User`                   |
| Promotion / demotion     | `PATCH /api/v1/users/:id/role`, admin only, self-change forbidden  |
| Route protection (API)   | `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.Admin)`      |
| Route protection (web)   | `<RequireAuth />` then `<RequireRole roles={[Role.Admin]} />`      |
| First admin              | `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` env, `AdminSeedService` |

Adding a rigger-only, dropzone-only or admin-only capability means: a `@Roles(...)` on the API handler, a `RequireRole` on the
web route, and tests for the allowed and the forbidden role in the same PR.

## Constraints

- **Avoid vague appeals to "best practices."** Be specific about what and why.
- **Never introduce new linters, test runners, build tools or package managers** unless the user asks. Use the
  existing stack: Jest, ESLint, Prettier, Vite, Nest CLI, npm workspaces.
- **Never commit secrets.** `apps/api/.env` is git-ignored. Verify with `git diff --staged` before every commit.
- **Never `synchronize: true`.** Every schema change is a migration.
- **Branch naming:** `<type>/<short-kebab-description>` where type is `feat`, `fix`, `docs`, `chore` or
  `refactor`, for example `feat/landing-page-copy`. If a GitHub issue exists, add its number:
  `feat/12-landing-page-copy`.
- **Commits:** Conventional Commits (`feat | fix | docs | style | refactor | perf | test | chore`), imperative
  mood, subject 50 characters or fewer. Never commit to `main`.

## Integration with Specs

When implementing a spec task:

1. Read the full spec at `.github/specs/<feature-slug>.md` before starting. One file per feature holds the
   EARS requirements, the Mermaid diagrams and the task checklist. There is no separate plan or tasks file.
2. Write the failing test first, then the implementation.
3. Run only the verification commands listed in the task, then `npm run validate` before the PR.
4. Update only the files listed in "Affected files" unless adding tests.
5. Tick the task's checkboxes in the spec in the same PR that delivers the work.
6. Record any architectural decision the task forces in `docs/adr/` with the next sequence number.

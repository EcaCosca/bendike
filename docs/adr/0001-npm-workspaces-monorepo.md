# Bendike is one npm-workspaces monorepo with a shared types package

---

status: accepted

---

Bendike ships a React web app and a NestJS API from one repository. We decided (project kickoff, 2026-09-11)
to use **plain npm workspaces** with three packages: `apps/web`, `apps/api` and `packages/shared`. The shared
package holds the role list and the request/response contracts so the two apps cannot drift apart. There is no
task runner on top of npm: root scripts fan out with `npm run <script> --workspaces`.

## Considered Options

- **Two repositories**: rejected. The role enum and API payloads would be duplicated and versioned separately,
  which is the exact drift the shared package prevents.
- **pnpm or yarn workspaces**: rejected for now. They add a tool the EPDM repos this project takes its
  conventions from do not use, and npm 11 workspaces cover what is needed. Revisit only if install time hurts.
- **Turborepo or Nx**: rejected. Three packages do not need a build graph or remote caching.
- **npm workspaces with `packages/shared` (chosen)**: one lockfile, one lint config, one Prettier config, one
  CI job, and a compile-time guarantee that the API DTOs implement the same interfaces the web app imports.

## Consequences

- `packages/shared` must be built before the API compiles (`npm install` does it through the root `prepare`
  script). The web app aliases straight to the shared `src/` so Vite and Jest never need the build.
- Root `eslint.config.mjs` uses typed linting across all three packages; every TypeScript file must belong to a
  tsconfig, including test files and config files.
- Adding a fourth workspace means adding it to the root `build` script order if anything depends on it.

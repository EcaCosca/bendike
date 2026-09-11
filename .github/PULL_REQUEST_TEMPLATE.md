## Type of change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Enhanced testing (non-breaking change adding new tests)
- [ ] Chore / documentation (style update, tooling or documentation improvement)
- [ ] Database migration included

## Spec

- Spec file: `.github/specs/<feature-slug>.md`
- Tasks delivered by this PR: Task N, Task M
- [ ] The task checkboxes in the spec are ticked in this PR.
- [ ] Out-of-scope items are documented in the spec.

## Roles

- [ ] Every role-gated behaviour has a test for an allowed role and a forbidden role.
- [ ] Web affordances hidden by role are also guarded on the API.

## Testing

- [ ] `npm run validate` passes locally (lint, format check, typecheck, unit tests, build).
- [ ] New or changed behaviour is covered by unit tests next to the code.
- [ ] Manual check in the browser for web changes (describe below).

## Code quality and process

- [ ] No explanatory comments were added to code; the rationale is in this description.
- [ ] No secrets in the diff (`git diff --staged` reviewed).
- [ ] Any architectural decision is recorded in `docs/adr/`.
- [ ] Commits follow Conventional Commits.

## Why

<!-- The reasoning that would otherwise have gone into code comments. -->

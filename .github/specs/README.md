# Specifications Directory

This directory contains feature specifications created through the spec-driven development workflow.
One file per feature. No production code changes without a spec here.

## Workflow Overview

1. **Create a Spec Issue** — Use the "Feature To Spec" issue template to define your feature, or run the
   `/feature-to-spec` skill in Claude Code (`.claude/skills/feature-to-spec/SKILL.md`) for the same interview in chat
2. **Auto-Assignment** — Issues with the `copilot-ready` label trigger the coding agent
3. **Spec Creation** — The agent (or a human) creates a structured specification in this directory
4. **Implementation** — Follow the tasks in the spec, ticking checkboxes in the same PR that delivers the work

## Specs

| Spec                                                                               | Status                                                                     |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [user-accounts-and-roles.md](./user-accounts-and-roles.md)                         | Implemented in the initial scaffold                                        |
| [landing-page.md](./landing-page.md)                                               | Implemented from the 2026-09-11 briefing; photo and Spanish version open   |
| [about-page.md](./about-page.md)                                                   | Superseded 2026-09-14 by about-page-scroll-story.md                        |
| [about-page-scroll-story.md](./about-page-scroll-story.md)                         | Built 2026-09-14; awaiting Eca's raw assets for the verification pass      |
| [product-catalog.md](./product-catalog.md)                                         | Specified 2026-09-11; awaiting prices and content-reuse confirmation       |
| [cart-and-whatsapp-checkout.md](./cart-and-whatsapp-checkout.md)                   | Specified 2026-09-11; depends on product-catalog                           |
| [notifications-inbox.md](./notifications-inbox.md)                                 | Specified 2026-09-11; automated reminders deferred to a gear-tracking spec |
| [user-profile-and-email-verification.md](./user-profile-and-email-verification.md) | Specified 2026-09-11; email provider to choose                             |
| [gear-tracking.md](./gear-tracking.md)                                             | Specified 2026-09-11; repack cycle default to confirm                      |
| [rigger-profile-and-license.md](./rigger-profile-and-license.md)                   | Specified 2026-09-11; photo storage to choose                              |
| [google-sign-in.md](./google-sign-in.md)                                           | Specified 2026-09-11; needs a Google Cloud client id                       |

## Spec File Structure

Each spec follows this structure (full template in `.github/instructions/spec.instructions.md`):

```markdown
# Feature: <name>

> Issue: #<n> · Branch: `<type>/<n>-<slug>`

## Problem Statement

## Personas

## Value Assessment

## User Stories

### Story 1: <Title>

#### Acceptance Criteria (EARS)

---

## Design

### Role Access

### Components Affected

### Dependencies

### Data Model Changes

### Diagrams (mermaid)

### Open Questions

---

## Tasks

### Task 1: <Title>

**Objective** / **Context** / **Affected files** / **Requirements** / **Verification** / **Done when**

## Out of Scope

## Future Considerations
```

## EARS Syntax for Acceptance Criteria

| Pattern      | Template                                                             | Use When                |
| ------------ | -------------------------------------------------------------------- | ----------------------- |
| Ubiquitous   | The `<system>` shall `<response>`                                    | Always true             |
| Event-driven | When `<trigger>`, the `<system>` shall `<response>`                  | Responding to event     |
| State-driven | While `<state>`, the `<system>` shall `<response>`                   | During a condition      |
| Optional     | Where `<feature>` is enabled, the `<system>` shall `<response>`      | Configurable capability |
| Unwanted     | If `<condition>`, then the `<system>` shall `<response>`             | Error handling          |
| Complex      | While `<state>`, when `<trigger>`, the `<system>` shall `<response>` | Combining conditions    |

## Related Files

- `.github/ISSUE_TEMPLATE/feature-to-spec.yml` — Issue template for creating specs
- `.claude/skills/feature-to-spec/SKILL.md` — Claude Code skill running the same interview locally
- `.github/workflows/assign-copilot.yml` — Workflow for mentioning the coding agent
- `.github/instructions/spec.instructions.md` — Detailed instructions for spec writing
- `docs/personas.md` — Personas referenced by every spec
- `docs/adr/` — Architecture decisions the specs build on

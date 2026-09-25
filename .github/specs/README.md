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

| Spec                                                                               | Status                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [user-accounts-and-roles.md](./user-accounts-and-roles.md)                         | Implemented in the initial scaffold                                                                                                                                                                                                                                                                                |
| [landing-page.md](./landing-page.md)                                               | Implemented from the 2026-09-11 briefing; photo and Spanish version open                                                                                                                                                                                                                                           |
| [about-page.md](./about-page.md)                                                   | Superseded 2026-09-14 by about-page-scroll-story.md                                                                                                                                                                                                                                                                |
| [about-page-scroll-story.md](./about-page-scroll-story.md)                         | Built 2026-09-14; awaiting Eca's raw assets for the verification pass                                                                                                                                                                                                                                              |
| [product-catalog.md](./product-catalog.md)                                         | Built 2026-09-19 (Tasks 1-16: catalog, FlySight/Vigil, used gear with sold filter and photo upload); awaiting DeepL key for ES/PT copy, category-tree and stock confirmations                                                                                                                                      |
| [cart-and-whatsapp-checkout.md](./cart-and-whatsapp-checkout.md)                   | Specified 2026-09-11, extended 2026-09-17 for locale-aware WhatsApp messages and 2026-09-18 so checkout requires sign-in; depends on product-catalog                                                                                                                                                               |
| [notifications-inbox.md](./notifications-inbox.md)                                 | Specified 2026-09-11; automated reminders deferred to a gear-tracking spec                                                                                                                                                                                                                                         |
| [user-profile-and-email-verification.md](./user-profile-and-email-verification.md) | Specified 2026-09-11, extended 2026-09-18 for picture/country/address and rigs/service-request panels; email provider to choose                                                                                                                                                                                    |
| [gear-tracking.md](./gear-tracking.md)                                             | Built 2026-09-19 (Tasks 1-9: rigs, components, parts, model rules, append-only log, due dates, unverified work grounds the rig, fleet import); repack cycle and yellow windows to confirm                                                                                                                          |
| [rigger-workspace.md](./rigger-workspace.md)                                       | Built 2026-09-19 (Tasks 1-9: links, work queue, quick logging, inspections, QR label, phone and language)                                                                                                                                                                                                          |
| [repack-reminders.md](./repack-reminders.md)                                       | Built 2026-09-19 (Tasks 1-6: daily digest, WhatsApp links, secret-guarded job, console and Resend adapters); needs a Resend account and domain to send for real                                                                                                                                                    |
| [service-bulletins-and-grounding.md](./service-bulletins-and-grounding.md)         | Built 2026-09-19 (Tasks 1-9: bulletins, matching with needs-review, groundings, rigger review, owner and dropzone views)                                                                                                                                                                                           |
| [rigger-profile-and-license.md](./rigger-profile-and-license.md)                   | Specified 2026-09-11; photo storage to choose                                                                                                                                                                                                                                                                      |
| [google-sign-in.md](./google-sign-in.md)                                           | Built 2026-09-19 (sign-in, linking, admin column; complete-profile step moved to the profile spec); needs a Google Cloud client id to try live                                                                                                                                                                     |
| [manual-library.md](./manual-library.md)                                           | Built 2026-09-20 (Tasks 1-5: Library section for riggers and admins, manuals kept in Google Drive behind a storage port with a local-disk fallback); needs Eca's one-time Drive authorisation to store in Drive                                                                                                    |
| [packing-sheets.md](./packing-sheets.md)                                           | Built 2026-09-20 (Tasks 1-6: guided pack job with the CIAC/ANAC checklist, notes for anything missing, signing that writes the repack entry, one-page print, digital logbook); Eca to review the Spanish and English wording                                                                                       |
| [rig-photos-and-history.md](./rig-photos-and-history.md)                           | Built 2026-09-20 (Tasks 1-4: rig photos through the storage port with client-side shrink, covers on the dashboard, a filterable rig history timeline with packing-sheet links); photos join the repack job page later                                                                                              |
| [cookie-consent-and-footer.md](./cookie-consent-and-footer.md)                     | Built 2026-09-20 (Tasks 1-5: cookie bar with accept, reject and manage that really gates preferences and Google sign-in, a cookie policy page checked against the code, a fuller site footer); text is English only for now                                                                                        |
| [rigging-services.md](./rigging-services.md)                                       | Phase 1 built 2026-09-18 (public services section, admin page, peso prices); phase 2 (requests) waits for gear-tracking                                                                                                                                                                                            |
| [shop-order-tracking.md](./shop-order-tracking.md)                                 | Specified 2026-09-18, not started; depends on cart-and-whatsapp-checkout and product-catalog; order-number scheme to confirm                                                                                                                                                                                       |
| [authority-oversight.md](./authority-oversight.md)                                 | Built 2026-09-20 (Tasks 1-4: authority role, register of riggers, a rigger's virtual log, read-only enforcement)                                                                                                                                                                                                   |
| [authority-rig-register.md](./authority-rig-register.md)                           | Built 2026-09-20 (Tasks 1-3: country on every account, register of packed rigs filtered by where the owner lives)                                                                                                                                                                                                  |
| [aws-deployment.md](./aws-deployment.md)                                           | Specified 2026-09-23; deploy on a single EC2 instance plus S3/CloudFront, built by hand in the AWS console; Tasks 2-5 in progress                                                                                                                                                                                  |
| [continuous-deployment.md](./continuous-deployment.md)                             | Workflow built 2026-09-24 (deploy on green CI: S3 + CloudFront for the web, SSM Run Command for the API, OIDC role); waits for Eca to create the role and set the GitHub secret and variables                                                                                                                      |
| [currency-selector.md](./currency-selector.md)                                     | Built 2026-09-25 (Tasks 1-3: displayFigures in shared, consent-aware CurrencyProvider under LocaleLayout, CurrencySwitcher beside the language switcher, Price and ServicePrice converted); whole-peso rounding still to decide                                                                                    |
| [education-and-media.md](./education-and-media.md)                                 | Built 2026-09-24 (Tasks 1-7: shared vocabulary and embed parser, API with links and collections, admin API and seed, Learn page with URL filters and WhatsApp suggestion box, item page with consent-gated player and affiliate buy link, product and rig sections, admin page); Amazon Associates account to open |

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

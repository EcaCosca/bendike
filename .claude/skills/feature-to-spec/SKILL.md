---
name: feature-to-spec
description: >
  Turn a feature idea into a Bendike spec in .github/specs/ before any code is written. Same three questions as
  the "Feature To Spec" GitHub issue template (Context & Goal, Acceptance Criteria, Roles involved), run as a
  conversation, then a spec that follows .github/instructions/spec.instructions.md exactly. Trigger phrases:
  "/feature-to-spec", "write a spec for", "spec this", "new feature", "I want to add", "feature to spec".
---

# feature-to-spec

You are the product management pair described in `.github/instructions/spec.instructions.md`. Your output is one
spec file. You write no production code in this skill, and you never skip the spec to "just build it".

`$ARGUMENTS` may hold a feature title, a GitHub issue number, a path to a briefing file, or nothing.

## 1. Load the ground rules

Read, in this order, before asking anything:

1. `.github/instructions/spec.instructions.md` (structure, EARS, task sizing, ADR rule)
2. `.github/copilot-instructions.md` (roles, commands, standards the Design section must respect)
3. `docs/personas.md` (the five personas: Visitor, User, Rigger, Dropzone, Admin)
4. `.github/specs/README.md` and the titles of every file in `.github/specs/` (avoid a duplicate, find the spec
   to update instead of creating a second one)
5. `ls docs/adr` (next ADR number, decisions already taken)

## 2. Gather the input

The GitHub issue template asks three things. Get the same three, in the user's own words:

| Field               | What you need                                                                      |
| ------------------- | ---------------------------------------------------------------------------------- |
| Context & Goal      | The problem, who has it (which personas), which part of the monorepo it touches    |
| Acceptance Criteria | Observable behaviours, one per line, testable                                      |
| Roles involved      | Every persona that can see or use the feature, including Visitor when it is public |

Sources, by priority:

- If `$ARGUMENTS` is an issue number, run `gh issue view <n> --repo EcaCosca/bendike --json title,body,number`
  and lift the three fields from the body. The public repo is readable with any GitHub account.
- If `$ARGUMENTS` is a file path, read it as the briefing.
- Otherwise, take what the user already said in the conversation (Eca often dictates a briefing in one go).

Then interview for the gaps only. Ask at most three questions per turn, and challenge as a PM pair would: the
underlying problem before the requested solution, the error states, the edge cases, the scope. Stop asking when
you can fill every section of the template without inventing facts. Anything still unknown goes into Open
Questions, not into an assumption.

## 3. Write the spec

Create or update exactly one file, `.github/specs/<kebab-slug>.md`, whose H1 matches the slug. Follow the
template in `spec.instructions.md` section by section. Non-negotiables:

- Blockquote under the H1: `> Issue: #<n> · Branch: \`<type>/<n>-<slug>\``when an issue exists, otherwise`> Issue: none yet · Branch: \`<type>/<slug>\``. Note who briefed it and the date.
- Every acceptance criterion in EARS form. Rewrite the user's lines rather than pasting them.
- Personas table with Positive/Negative/Neutral impact for every persona the feature touches.
- Value Assessment against the five value types, primary and secondary named.
- Role Access table with all five rows: Visitor, User, Rigger, Dropzone, Admin.
- At least two ```mermaid diagrams: a flow or data-flow diagram and a sequence diagram. Never ASCII art.
- Components Affected as real paths in this monorepo (`apps/web/src/...`, `apps/api/src/...`,
  `packages/shared/src/...`). Look at the existing folders before naming new ones.
- Data Model Changes: name the entity, the TypeORM migration and the enum or column changes, or write "None".
- Tasks sized for one agent session (1 to 3 files, roughly 200 to 300 lines), sequenced, first task the smallest
  vertical slice, each with Objective, Context, Affected files, Requirements, Verification (runnable commands such
  as `npm run test:unit -w @bendike/api`) and Done when. Every role-gated behaviour gets a test for an allowed
  role and a forbidden role. More than 7 to 10 tasks means the feature needs phases.
- Out of Scope and Future Considerations, both filled.

If the spec forces an architectural choice (new dependency, new storage shape, new integration, new external
service), write `docs/adr/NNNN-<slug>.md` with the next number, status Proposed, in the shape of the existing
ADRs, and link it from the spec's Design section.

Add a row for the spec to the table in `.github/specs/README.md` with a status such as "Specced <date>, not
started".

## 4. Check and hand off

- Run `npx prettier --write` on the files you touched, then `npx prettier --check` on them.
- Re-read the spec once as the coding agent would: can each task be started from the spec alone?
- Reply with: the spec path, the ADR path if any, the open questions that block a task, and the branch name the
  implementer should use. Ask which task to start. Do not start it inside this skill.

## Style

- Plain sentences, no marketing. The spec is read by Eca and by a coding agent.
- No explanatory comments in any code snippet you include.
- Keep Eca's wording when he gave copy or names (Bendike, Ben and Ike, WhatsApp handoff, USD base pricing).
- The repo is public: never write passwords, tokens or personal phone numbers of customers into a spec.

# Bendike

Read [`.github/copilot-instructions.md`](.github/copilot-instructions.md) first. It is the single engineering
guide for this monorepo and every agent (Claude Code, GitHub Copilot, Codex) follows it.

Then, depending on what you touch:

- Writing or changing a spec: [`.github/instructions/spec.instructions.md`](.github/instructions/spec.instructions.md)
- Writing tests: [`.github/instructions/test.instructions.md`](.github/instructions/test.instructions.md)
- Layering and where code lives: [`.github/instructions/software-architecture.instructions.md`](.github/instructions/software-architecture.instructions.md)
- CI workflows: [`.github/instructions/pipeline.instructions.md`](.github/instructions/pipeline.instructions.md)

Spec-driven development is mandatory: no production code changes without a spec in `.github/specs/`.
Architectural decisions are recorded in `docs/adr/`.

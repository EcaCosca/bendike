# Riggers reach gear through confirmed links to owners, and dropzones own fleets

---

status: accepted

---

Eca's first customers are riggers (briefing, 2026-09-19). A rigger looks after one or more dropzones and after
individual skydivers, and needs one work queue across all of them. The first gear design let any rigger add
maintenance entries to any account's gear, which is too wide: it would show every skydiver's phone number to every
rigger and let anyone with the role touch gear nobody asked them to look after. We decided that a rigger's scope is
exactly the set of owners who are linked to them, that a link needs both sides to agree, and that a dropzone is an
ordinary owner of gear, like a skydiver, so its fleet uses the same tables.

A `rigger_links` row joins an owner account (role `user` or `dropzone`) to a rigger account. Either side can start
it: a user or dropzone picks a rigger, or a rigger adds a customer or dropzone by email or phone. The other side
confirms before it becomes `active`. While a link is active the rigger can see that owner's rigs and components,
add maintenance entries, record inspections, ground and clear, and see the owner's contact details. Admins see
everything.

## Considered Options

- **Any rigger sees all gear (first design)**: rejected. It exposes every owner's contact details and gives no
  answer to "who is responsible for this rig".
- **Scope by dropzone only**: rejected. Many of Eca's customers are individual skydivers with their own rig who
  never appear on a dropzone's fleet.
- **A link created by one side without confirmation**: rejected. A rigger could add any account to read its contact
  details, and an owner could push responsibility for a rig onto a rigger who never agreed to it.
- **Dropzone staff accounts under a dropzone**: deferred. One login per dropzone stays the rule
  (`docs/personas.md`); staff accounts arrive with a later spec.
- **Confirmed links between an owner and a rigger (chosen)**: one table covers dropzone to rigger and user to
  rigger, in either direction, and doubles as the consent record for sharing contact details.

## Consequences

- `rigger_links (owner_id, rigger_id, status, initiated_by, created_at, confirmed_at, ended_at)` with a partial
  unique index on `(owner_id, rigger_id)` where `status IN ('pending', 'active')`.
- `rigs.owner_id` and `gear_items.owner_id` may point at a `dropzone` account; nothing else changes in ADR 0004's
  shape. Dropzones can create and edit their own rigs and components but cannot write maintenance entries.
- Ending a link removes the rigger's access immediately. Entries the rigger wrote stay, attributed to them.
- The rigger workspace, the digest email and the bulletin matching all start from "owners with an active link to
  this rigger", so that one query is the security boundary and is tested first.
- Only accounts with an approved rigger profile can be offered as riggers in the picker
  (`rigger-profile-and-license.md`).

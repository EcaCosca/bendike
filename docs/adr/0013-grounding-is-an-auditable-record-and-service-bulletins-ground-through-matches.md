# Grounding is an auditable record, and service bulletins ground through matches

---

status: accepted

---

Riggers must be able to stop a rig from being used until they say otherwise, and dropzones and owners must see that
state and why (briefing, 2026-09-19). Manufacturers also issue service bulletins that apply to some models, serial
ranges or manufacture dates, and Eca wants to enter each bulletin once and have every affected component found.
Bendike cannot physically stop a jump, so grounding is a record everyone can see, not a lock. We decided to model it
as its own table of events, with the current state derived from it, and to link bulletins to gear through stored
matches that a rigger resolves one by one.

A `groundings` row says "this rig, or this component, is grounded, for this reason, by this rigger, at this time",
and stays open until a linked rigger or an admin closes it with a note. A rig is grounded while any open grounding
exists on it or on one of its components. A `service_bulletins` row carries the manufacturer, reference, severity
and required action, with one or more targets (model, serial range, manufacture-date range). Publishing a bulletin
(admin only) creates a `bulletin_matches` row for every component that fits, per rigger scope. A match starts
`open`. The rigger resolves it as `complied` (with a maintenance entry or note) or `not_applicable` (with a
reason). A bulletin with severity `grounding` opens a grounding on every matched rig at publication; that grounding
can only be closed by resolving its match.

## Considered Options

- **A boolean `grounded` on the rig**: rejected. It carries no reason, author or time, and leaves no history for the
  question "why was this rig down in March".
- **Grounding as a kind of maintenance entry**: rejected. An entry is something that happened; grounding is a state
  that lasts until cleared, and the dashboard needs the state, not the latest entry.
- **Riggers enter their own bulletins**: rejected by Eca (2026-09-19). Bulletins are entered once, centrally, so
  every rigger sees the same set.
- **Fuzzy matching by model name**: rejected. A missed match is unsafe and a wrong one wastes a rigger's day.
  Matching normalises manufacturer and model (case, spaces, hyphens) and compares exactly; a component whose model
  or serial cannot be compared (free-text serial such as `VR-360 007284`, empty model) becomes a match marked
  `needs_review` instead of being silently skipped.
- **An auditable grounding table plus stored bulletin matches (chosen)**.

## Consequences

- Only an admin creates or edits bulletins; only a linked rigger or an admin opens or closes a grounding; owners
  and dropzones read.
- Adding or editing a component re-runs matching for it against published bulletins, so gear added later is caught.
- The rig read model gains `groundingState` (`airworthy` or `grounded`) with the open reasons; the dashboard,
  the dropzone catalogue and the digest email all use it.
- Every state change writes a row with actor and time; nothing is deleted.
- The UI states plainly that grounding is advisory: Bendike records the decision and shows it, and the dropzone
  and rigger remain responsible for acting on it.

## Amendment (2026-09-19)

An inspection with the result `grounded` does not create a `groundings` row: the inspection entry in the maintenance log
is already an auditable record, so the rig reports it as a reason until a later `passed` inspection is recorded. The
`groundings` table therefore holds two sources, `manual` and `bulletin`.

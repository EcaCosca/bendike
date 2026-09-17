# A rig is four gear items, each with its own detail table, and every date comes from the maintenance log

---

status: accepted

---

Eca asked (2026-09-11) for skydivers to keep their rigs in Bendike: a rig bundles a container, a main canopy, a
reserve canopy and an AAD, each component carries notes, and maintenance done to any of them (a reline, a kill-line
change, a repack, an AAD battery) is logged so the next due dates are visible. We decided to model this as one
`gear_items` table that every component shares (kind, owner, current rig, manufacturer, model, serial, date of
manufacture, notes, retired date), one small detail table per kind for the fields only that kind has, and one
`maintenance_entries` table pointing at a gear item. A rig is a row in `rigs` plus the gear items whose `rig_id`
points at it, at most one per kind. Due dates are computed from the latest maintenance entry of the relevant kind
plus a cycle stored on the component, never typed as a separate "next due" field.

## Considered Options

- **Four independent component tables, rig holds four foreign keys**: rejected. Maintenance entries would need a
  polymorphic reference that PostgreSQL cannot enforce, and "everything that happened to this rig" becomes four
  queries. It also makes moving a component between rigs a two-table update.
- **One `components` table with a JSON blob per kind**: rejected. Reserve repack cycles, AAD battery dates and
  canopy line types are the data the whole product is about; they deserve typed columns, constraints and indexes.
- **Store `next_repack_due` on the reserve**: rejected. It duplicates what the log already says and drifts the
  first time someone logs a repack without updating it. Compute it.
- **Base table plus per-kind detail tables plus one log (chosen)**: enforceable foreign keys everywhere, one query
  for a rig's history, typed kind-specific fields, and components that can move between rigs or be retired while
  keeping their history.

## Consequences

- `gear_items.kind` is a PostgreSQL enum `gear_kind` (`container`, `main`, `reserve`, `aad`), mirrored by a shared
  `GEAR_KINDS` tuple like `ROLES`.
- A partial unique index on `gear_items (rig_id, kind) WHERE rig_id IS NOT NULL` guarantees one of each kind per
  rig. Assigning a component to a rig that already has that kind is a 409.
- `maintenance_entries.kind` is an enum (`repack`, `reline`, `kill_line`, `inspection`, `repair`, `battery`,
  `aad_service`, `assembly`, `other`); the reserve's next repack is the latest `repack` entry date plus
  `reserve_details.repack_cycle_days`; the AAD's battery due is the latest `battery` entry plus
  `aad_details.battery_cycle_months`, falling back to the dates typed when the AAD is created.
- Owners write to their own gear; riggers and admins may add maintenance entries to anyone's gear (they are the ones
  doing the work) and are recorded as `performed_by`.
- The automated `repack_due` and `aad_service` notifications in `notifications-inbox.md` read these computed dates.

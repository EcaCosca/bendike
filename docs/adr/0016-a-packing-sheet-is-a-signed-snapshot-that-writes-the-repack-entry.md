# A packing sheet is a signed snapshot that writes the repack entry

---

status: accepted

---

In Argentina a reserve repack is recorded on the CIAC/ANAC "Planilla plegados" checklist, signed by the rigger
(briefing, 2026-09-20). Bendike already records repacks as entries in the append-only maintenance log
([ADR 0004](./0004-gear-items-and-maintenance-log.md)), and every due date is derived from that log. The checklist
adds much more than the log entry: the ticks, the notes, the component details at that moment, the manual followed
and the rigger's licence. We decided to model the sheet as its own record, worked on as a draft and then signed, and
to make signing the only way a sheet writes the `repack` entry.

A draft can be saved as often as the rigger likes. Signing runs in one transaction: it numbers the sheet, snapshots the
reserve, container and AAD details and what was missing, locks the sheet, and adds the repack entry signed off by the
rigger. After that the sheet never changes; a mistake is corrected by voiding the sheet, which voids its entry, and
signing a new one.

## Considered Options

- **Put the checklist into the maintenance entry's description**: rejected. It is free text nobody can query, print
  or check for completeness, and the entry table stays small on purpose.
- **Edit the sheet after signing**: rejected. A signed record that can change is not a logbook; void and replace keeps
  the trail, the same rule as the rest of the log.
- **Reference live gear records instead of snapshotting**: rejected. Components get swapped ("changed AAD"), and the
  sheet must keep showing what was in the rig on the day it was packed.
- **Require every box ticked**: rejected. A rig may legitimately have no MARD or no RSL. Instead, anything unticked
  is listed to the rigger before signing and must be explained in the notes, and the list is stored on the sheet.
- **A server-generated PDF**: deferred. A print-styled page prints the same form with no new dependency.

## Consequences

- The checklist is a versioned template in the shared package (`ciac-anac-1`); a sheet stores its version and the ids
  ticked, so a new template never changes an old sheet.
- Sheet numbers ("HOJA #") are per rigger, assigned at signing, so abandoned drafts leave no gaps.
- The maintenance log stays the source of truth for due dates: signing is what makes the reserve's next repack date move.
- The sheet holds the owner's name, phone and email as they were, so it is readable only by people who can read the
  rig's gear.

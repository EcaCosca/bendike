# Service requests are server-persisted records, priced flat in USD, that resolve into a gear maintenance entry

---

status: proposed

---

Eca offers rigging services beyond the retail shop: reserve repacks, AAD send-in for repair/battery/manufacturer
service, patchwork and relines (briefing, 2026-09-17). Unlike a Squirrel product, a service has no manufacturer list
price to mark up — Eca sets what he charges directly. And unlike the shop's cart, a service request is not anonymous
or ephemeral: it names a specific piece of the customer's tracked gear (`gear-tracking.md`'s `gear_items`), and once
Eca does the work, that work has to land in the gear's maintenance log without being typed twice.

## Considered Options

**Where the price comes from** (amended 2026-09-18)

- **Optional amount plus currency, set by an admin (chosen)**: a service stores `price_amount` and `price_currency`
  (`ARS` or `USD`), both null when the price varies. Eca quotes what he does in pesos (sport reserve repack AR$55.000,
  tandem AR$90.000) and prices patchwork and AAD service per job, so the shop's USD-first rule does not fit. The
  other currencies are derived at display time from the stored exchange rates, the same way the shop does it.
  Neither the markup nor the "cannot activate without a price" rule applies: there is no manufacturer price to mark
  up, and a service that varies is still worth listing.
- **Flat USD price, like the shop (first version, superseded)**: assumed Eca thinks in dollars. He does not, and a
  peso price converted to dollars and back would show him a figure that drifts with the exchange rate.
- **Reuse `bendikePriceUsd(listPrice, markup)` (rejected)**: that function exists because Bendike buys Squirrel gear
  at a list price and adds a margin. A service's price is Eca's own labor.

**How a request is initiated and recorded**

- **WhatsApp-only, no server record (rejected)**: matches the cart's pattern, but the customer answered explicitly
  (briefing, 2026-09-17) that requesting a service must create a maintenance-log entry, which requires knowing
  _which_ gear item and account the request is for — state WhatsApp's chat history does not give Bendike back.
- **A server-persisted `service_requests` row plus a WhatsApp handoff (chosen)**: creating the request is an
  authenticated, server-side action (the visitor must be a signed-in `User` with a matching gear item), so the
  gear item, the service and the account are known before WhatsApp opens. The WhatsApp message is still the
  immediate human channel to Eca, exactly like checkout, but it stops being the only record.
- **A full booking/scheduling system (rejected)**: no calendar, no time slots yet. `service_requests.status`
  (`requested`, `scheduled`, `in_progress`, `completed`, `cancelled`) is enough to track a request without building
  a scheduler nobody asked for.

**Linking a request to the maintenance log**

- **`service_requests.maintenance_entry_id` set on completion (chosen)**: when a rigger or admin marks a request
  `completed` with a performed-on date and description, the API inserts one row into `gear-tracking.md`'s
  `maintenance_entries` (kind taken from the service's category, `performed_by` the rigger) and stores its id back
  on the request. `gear-tracking.md`'s schema is untouched; the foreign key lives entirely on the new table.
- **Store the maintenance fields on `service_requests` and duplicate them (rejected)**: `DueDatesService` in
  `gear-tracking.md` already reads `maintenance_entries` to compute next-repack and battery-due dates; a second
  place holding the same fact would drift.
- **Cancelling a request never touches `maintenance_entries`**: a cancelled request has no maintenance fact to
  record.

## Consequences

- `packages/shared/src/services.ts` defines `SERVICE_CATEGORIES = ['repack', 'aad_service', 'repair', 'reline']`
  (a subset of `gear-tracking.md`'s `MAINTENANCE_KINDS`) and `SERVICE_REQUEST_STATUSES`.
- This feature cannot be built ahead of `gear-tracking.md`: `service_requests.gear_item_id` and the completion flow
  both require `gear_items` and `maintenance_entries` to exist. `rigging-services.md`'s Task 2 depends on
  `gear-tracking.md` Task 2, and its Task 6 depends on `gear-tracking.md` Task 4.
- A service the customer requests without a matching gear item on file cannot be started; the web app points them at
  adding the gear first (`gear-tracking.md`), rather than accepting a free-text description the server cannot act on.
- A service with no price is listed as "Price varies, ask on WhatsApp"; it is not hidden.
- Delivery is phased (`rigging-services.md`): the public section and admin editing first, requests once `gear-tracking.md`
  exists.

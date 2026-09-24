# Learning resources are curated links with consent-gated embeds

---

status: proposed

---

Eca wants a public Education and media section (spec: `.github/specs/education-and-media.md`) holding the videos,
channels, podcasts, articles and books he recommends, findable by topic, format, level and language, and linked from
the shop and from a skydiver's own gear. The material belongs to manufacturers and creators (Squirrel, Brian Germain,
FlySight, Vigil, podcast hosts) and is published by them in the open.

## Decision

Bendike stores **only the link and its metadata**, never the content. An item is a URL plus title, summary, author,
source, format, topics, level, content language, duration and date. A pure function in `packages/shared` recognises
YouTube, Spotify and Vimeo addresses and derives the embed id, so the web app can offer a player.

The player is an `<iframe>` to the provider's embed domain (`youtube-nocookie.com`, `open.spotify.com/embed`,
`player.vimeo.com`) and is loaded **only after the visitor allows third-party services** in the existing cookie
consent, with the same in-place "allow and load" pattern as Google sign-in. Until then the page shows the poster and
the link to the source. The embed providers are listed in the cookie-policy storage inventory.

Items point at shop products, brands and gear models through a small polymorphic link table
(`learn_item_links(item_id, target_kind, target_id)`), validated by the service rather than by foreign keys, so a
product page can show "Learn before you buy" and a rig page "Learn about your gear" without touching the catalogue or
gear schemas.

## Considered Options

- **Store copies of the media.** Rejected: copyright, storage cost, and the manual library already exists for the one
  case where a copy is justified (manuals that manufacturers take down).
- **Load embeds unconditionally.** Rejected: YouTube, Spotify and Vimeo set cookies and load scripts; the consent
  feature promises that nothing third-party loads before permission, and a test enforces the inventory.
- **Foreign keys per target** (three nullable columns or three join tables). Rejected for now: three tables for one
  concept, and the set of targets may grow (services, collections). The service checks existence on write.
- **Fetch metadata from provider APIs** (YouTube Data API, Spotify Web API). Rejected for the first version: needs
  API keys and quotas for a handful of items a week; an admin types the title and summary. Can be added behind a
  port later.
- **Tags as a free-text list.** Rejected: findability depends on a small fixed vocabulary that the filters can render
  in three languages; free tags drift.

## Consequences

- Every item stays correct only as long as the source exists. The admin page shows the source link so dead links are
  easy to spot; a link checker is possible later.
- Titles and summaries are Eca's words, in `LocalizedText` with the same translation overrides as products, so the
  Spanish and Portuguese pages read naturally.
- The polymorphic link table means no cascade on delete: deactivating a product leaves a dangling link that the
  service filters out at read time.
- Adding a provider means extending `parseEmbed`, the allowed iframe domains and the storage inventory, in one
  change with tests.

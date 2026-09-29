# One language source per surface, and per-area translation files

---

status: proposed

---

The public catalogue pages take their language from a URL prefix (ADR 0007). The landing page and the About story
carry their copy as typed `Record<Locale, ...>` objects. Everything else was English. Eca asked for the whole site
and the whole signed-in app in Spanish, English and Portuguese (spec: `.github/specs/site-wide-localisation.md`).
Two questions had to be settled: where each kind of page gets its language from, and how several hundred new
strings are organised so that a missing translation is caught before it ships.

## Decision

**Language source, by surface.**

- Pages under `/:locale/` read the URL, as before.
- Public pages without a prefix (`/`, `/login`, `/register`, `/cookies`, the 404) read the stored choice
  (`bendike.locale`, a necessary item) or the browser languages. The selector on those pages stores and re-renders;
  it does not navigate.
- Pages under `/app/` read the account's `locale`. The app bar carries a selector that saves the account language
  through the existing contact update and re-renders. Login and registration do not switch the page language; the
  first `/app` page does.

**Translation files, by area.** The common `locales/<lng>.json` stays for the shop, nav and Learn. Every other area
of the app gets one file per language, `locales/<lng>/<area>.json`, whose only top-level key is the area's
namespace (`gear`, `work`, `library`, `packing`, `bulletins`, `admin`, `auth`, `consent`, `app`). `i18n.ts` merges
them into the single `translation` bundle at start-up. A unit test compares the key sets of the three languages per
file, rejects empty values and duplicate namespaces, and rejects keys no source file references.

**Vocabularies as key maps.** Fixed lists (gear kinds, maintenance kinds, severities) map to translation keys, not
to English labels, and components render them with `t()`.

**Dates through one helper** using `Intl.DateTimeFormat(language)`.

## Considered Options

- **Move everything under `/:locale/`, including `/app`.** Rejected: the app is per account, not per link; a rigger
  who set Portuguese should not be switched to Spanish because a customer sent them an `/es/app/...` link, and every
  internal link in the app would need the prefix threaded through.
- **One giant `en.json`.** Rejected: five areas edited in parallel would collide on one file, and a missing key
  would be found by a reader, not by a test.
- **Keep the typed `Record<Locale, Copy>` pattern for the app.** Rejected for the app: it suits long editorial copy
  (landing, About) where the compiler catching a missing paragraph is the point, but the app has hundreds of short
  labels with plurals and interpolation, which is what i18next does well. The two patterns coexist by intent.
- **Translate with DeepL at build time.** Rejected: the glossary work of the backfill showed machine output needs a
  rigger's eye ("reserve" is not "reservar"); the strings are written by hand, in the Argentine register the site
  already uses.

## Consequences

- Adding a string means adding it three times, and the test says so if you forget. That is the cost of the promise.
- Existing specs keep asserting English because the test i18n instance starts in `en`.
- The account language and the stored public language are the same concept for one person; the app bar selector
  updates both so a logout does not flip the language.
- API error messages remain English until the API grows its own localisation; the web app shows them as received.

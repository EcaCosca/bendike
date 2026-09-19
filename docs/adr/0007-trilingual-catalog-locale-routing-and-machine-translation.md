# The shop and cart are trilingual behind a URL locale prefix, with product copy machine-translated at import

---

status: proposed

---

Bendike's Squirrel catalog (briefing, 2026-09-17: 53 products across wingsuits, tracking suits, BASE and skydiving
canopies, containers, pilot chutes, stash bags, accessories, sliders, travel bags and a book) ships in English,
Spanish and Portuguese (Brazil). Eca wants a URL that carries the language (`/en/...`, `/es/...`, `/pt/...`) and
copy that is translated automatically when a product is imported, with room for him to correct a translation by
hand afterwards without it being overwritten by the next import run.

## Considered Options

**Locale in the URL**

- **Path prefix (`/en/shop`, `/es/shop/freak6`, chosen)**: a shared link reproduces the language, search engines can
  index each locale separately, and React Router already supports a param-driven layout route.
- **Manual switcher with no URL change**: rejected by Eca — a shared WhatsApp or Instagram link should open in the
  language it was shared in, not whatever the last visitor's browser happened to prefer.
- **Query string (`?lang=es`)**: rejected. Same drawback as a manual switcher for anyone who strips query params, and
  worse for indexing.

Scope: only the shop and cart routes take the prefix for now (`/:locale/shop`, `/:locale/shop/:slug`,
`/:locale/cart`). The landing page, about story and authenticated app are not part of this decision; translating them
is a separate, larger effort and stays out of scope until Eca asks for it.

**Translation storage**

- **A `product_translations` / `category_translations` join table per locale (rejected)**: correct for an open-ended
  set of locales, but Bendike has exactly three, fixed by this ADR, and a join table means three extra queries or a
  join on every catalog read for no benefit at this scale (~50 products, ~12 categories).
- **`jsonb` column per translatable field, keyed by locale (chosen)**: `products.name`, `products.summary`,
  `products.description_md`, and `categories.name` become `jsonb` shaped `{ "en": "...", "es": "...", "pt": "..." }`
  (`@bendike/shared`'s `LocalizedText`). One row per product, no join, and Postgres `jsonb` indexes if search ever
  needs it.
- **Overwrite protection**: a sibling `jsonb` column, `translation_overrides` (shaped `{ "es": ["summary"] }`), lists
  the locale/field pairs an admin has hand-edited. Re-running the importer fills every field that is not listed
  there; it never overwrites an override.

**Machine translation provider**

- **DeepL API (chosen)**: distinguishes `PT-BR` from `PT-PT` as a target, which matters for Brazilian Portuguese, and
  its free tier (500,000 characters/month) covers 52 products' worth of name/summary/description with room to spare.
  Configuration is `DEEPL_API_KEY` and `DEEPL_API_URL` (defaults to the free-tier host), following the
  `EXCHANGE_RATE_PROVIDER_URL` pattern from ADR 0003.
- **An LLM-based translation call**: rejected for now. Higher cost per character and non-deterministic phrasing
  makes a second import run produce a different translation for the same English source, which fights the
  importer's idempotency goal.
- **No automatic translation, admin types everything**: rejected. Fifty-two products in three languages is the kind
  of typing Eca is trying to avoid; the ADR keeps the door open to turn this off per product via
  `translation_overrides`.
- **If DeepL is unreachable or the quota is exhausted**: the importer keeps the English text in the untranslated
  locale's field and does not fail the import; the product is still usable, just not yet translated, which the admin
  catalog UI (a later spec) can surface as a to-do.

**Slugs**

- Product and category slugs stay locale-invariant (derived once, from the English name, e.g. `freak6`,
  `base-canopies`). A slug is a URL identifier, not a translation; keeping it fixed means switching the locale
  prefix on a product page never 404s and never needs a redirect map.

## Consequences

- `packages/shared/src/locale.ts` defines `LOCALES = ['en', 'es', 'pt'] as const`, `Locale`, `isLocale`, and
  `LocalizedText<T = string> = Record<Locale, T>`. `catalog.ts` types (`ProductSummary`, `ProductDetail`, `Category`)
  use `LocalizedText` for `name`, `summary` and `description_md` instead of plain strings.
- The web app depends on `i18next` and `react-i18next` (new dependency) for static UI strings (nav labels, filter
  labels, empty states, the WhatsApp message's fixed phrases); product and category copy comes from the API's
  `LocalizedText` fields, not from i18next resource bundles.
- `apps/web/src/i18n/` holds the i18next setup, the `en.json` / `es.json` / `pt.json` UI string bundles, and a
  `LocaleProvider` that reads `:locale` from the route and falls back to `en` for an unknown or missing segment.
- Bare (unprefixed) shop/cart URLs redirect once to a detected locale (`Accept-Language`, falling back to `en`) and
  are not otherwise supported; every internal link is generated with the current locale.
- `apps/api/src/translation/` holds the DeepL client and a `translateProductCopy` function called from the importer
  and from the admin catalog write endpoints when a name/summary/description changes without an accompanying
  override.
- The WhatsApp checkout message (`cart-and-whatsapp-checkout.md`) is generated in the visitor's current locale: its
  fixed phrases come from the same UI string bundles, and product names come from `LocalizedText[locale]` falling
  back to English when a translation is missing.

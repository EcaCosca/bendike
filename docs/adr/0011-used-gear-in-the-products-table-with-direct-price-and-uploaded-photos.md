# Used gear lives in the products table with a direct price, and its photos are uploaded to local disk

---

status: proposed

---

Eca sells used gear next to the new Squirrel, Vigil and FlySight stock (briefing, 2026-09-19) and wants it in the
shop filters. A used item is not a manufacturer product: it is a one-off, priced by Eca in pesos or dollars with no
manufacturer list price to mark up, and it has to carry his own photos of the actual item, which no vendor CDN
hosts.

## Considered Options

**Where used items live**

- **The `products` table with a `condition` column (chosen)**: `condition` is `new` or `used`. Every read path the
  shop already has (listing, filters, search, pagination, product page, related products, brand and category
  navigation) works unchanged, and a new filter is one more `WHERE`. Used items carry a direct price (below) and
  a `sold_at` timestamp; new items keep `list_price_usd` plus markup.
- **A separate `used_items` table**: rejected. It would duplicate the whole catalog read model, or force every
  listing query into a `UNION` with different columns, to show two kinds of item in one grid.

**Price of a used item**

- **`price_amount` plus `price_currency` (`ARS` or `USD`) on the product (chosen)**: the same shape and the same
  derived-currency display as a service (ADR 0008). Products with `list_price_usd` are untouched, and the check
  that an active product has a price now accepts either form.
- **Reuse `list_price_usd` with a 0% markup**: rejected. It cannot express a peso price, and Eca quotes used gear
  in whatever currency the buyer is thinking in.

**Sold items**

- **`sold_at` timestamp; excluded from listings unless asked for (chosen)**: a sold item keeps its URL, shows a
  "Sold" badge and can be found with an "Include sold" filter. A boolean would lose when it sold.
- **Deactivate on sale**: rejected by Eca; dead links for something a buyer may have bookmarked.

**Photos**

- **Uploaded to local disk under `UPLOADS_DIR`, served at `/uploads/products/...` (chosen)**: the mechanism
  ADR 0009 already chose for avatars (multer via `@nestjs/platform-express`, Express static handling), so there is
  one uploads directory and one static route for the whole API, and no new package.
- **Pasted image links**: rejected by Eca; he would have to host the photos somewhere first.
- **Object storage (S3, R2)**: deferred for the reasons in ADR 0009. The `product_images.url` column already holds
  a full URL or a site-relative path, so moving later means rewriting rows, not the schema.

## Consequences

- `products` gains `condition` (default `new`), `price_amount`, `price_currency` and `sold_at`; the check
  `chk_products_active_needs_price` becomes "an active product has `list_price_usd` or `price_amount`".
- `@bendike/shared` exports `priceFigures`, the peso/dollar/real derivation that services already used, so products
  and services share it (`servicePriceFigures` is renamed).
- Price sorting uses one expression that converts every price to USD (list price with markup, or a direct price
  through the stored ARS rate), so used and new items sort together correctly.
- Uploaded files are validated by their leading bytes (JPEG, PNG or WebP), not by the client's claimed type, and
  are written under server-generated names, never a client-supplied filename.
- The same limits as ADR 0009 apply: a redeploy that wipes the filesystem loses the photos, which is acceptable
  while the API runs as one long-lived process.

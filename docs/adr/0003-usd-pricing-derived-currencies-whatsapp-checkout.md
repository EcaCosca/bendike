# Prices live in US dollars with a 20% markup, pesos and reais are derived, and checkout hands off to WhatsApp

---

status: accepted

---

Bendike retails gear from manufacturers that publish US-dollar list prices (Squirrel, Vigil, FlySight). Eca decided
(briefing, 2026-09-11) that every product stores one number, the manufacturer's retail price in USD, and that
Bendike's selling price is that number plus 20%. Argentine pesos and Brazilian reais are never typed in: they are
computed at display time from a stored USD exchange rate per currency, labelled as indicative with the rate's
source and date. Because shipping varies by destination and product, there is no online payment: when a shopper
wants to check out, the cart hands them to a WhatsApp conversation with Eca (`https://wa.me/5493413955408`) with
the cart contents prefilled, and the sale is closed person to person.

## Considered Options

- **Store a price per currency**: rejected. Three prices per product and per variant drift immediately in an
  economy where the peso moves daily, and nobody would keep 10,000 Squirrel variant rows current.
- **Store the marked-up price**: rejected. The manufacturer's retail price is the fact we import; the markup is
  Bendike's policy and may change. Storing the fact and computing the policy keeps the import idempotent.
- **Live exchange rates on every request**: rejected. External rate APIs have quotas and go down; a stored rate
  refreshed once a day (and overridable by an admin) is enough for an indicative figure.
- **Which peso rate**: Argentina has several. The default provider (open.er-api.com, free, keyless) returns the
  official market rate; an admin can override the ARS rate with the figure Eca actually sells at. dolarapi.com
  exposes oficial, blue, MEP and others if we later want to pick one automatically.
- **Online payment (Mercado Pago, Stripe)**: deferred. Shipping is quoted per order and Eca wants the
  conversation. Adding a provider later is a new ADR, not a tweak.
- **USD fact + markup policy + derived currencies + WhatsApp handoff (chosen)**.

## Consequences

- `products.list_price_usd` and `products.markup_percent` (default 20) are the only price inputs;
  `bendikePriceUsd` and the ARS/BRL figures are computed in `@bendike/shared` so the API and the web app agree.
- `exchange_rates` holds one row per currency (`ARS`, `BRL`) with `usd_rate`, `source`, `fetched_at` and
  `manual_override`; a refresh skips overridden rows.
- Variant prices are also USD list prices; a variant without its own price inherits the product's.
- The cart is client-side state; there is no order table until a payment decision exists. The WhatsApp message is
  the order record for now.
- The WhatsApp number is configuration in the web content module, not scattered through components.

# Feature: Cart and WhatsApp checkout

> Issue: none yet · Branch: `feat/product-catalog` · ADR:
> [0003](../../docs/adr/0003-usd-pricing-derived-currencies-whatsapp-checkout.md),
> [0007](../../docs/adr/0007-trilingual-catalog-locale-routing-and-machine-translation.md),
> [0010](../../docs/adr/0010-checkout-requires-sign-in.md) · Depends on: `product-catalog.md` · Checkout step
> extended 2026-09-18 by `shop-order-tracking.md`

## Problem Statement

Shipping for wingsuits, parachutes and AADs varies by destination and product, so Eca does not sell online. A
shopper still needs a way to gather what they want and hand it to Eca in one message. The cart collects items and
the checkout step creates an order and opens a WhatsApp conversation with Eca with the cart prefilled, instead of
taking payment. Browsing and building a cart need no account; checking out does, so the order created at that step
always has an owner — see `shop-order-tracking.md` and
[ADR 0010](../../docs/adr/0010-checkout-requires-sign-in.md).

## Personas

| Persona  | Impact   | Notes                                                                  |
| -------- | -------- | ---------------------------------------------------------------------- |
| Visitor  | Neutral  | Can build a cart without an account; asked to sign in only at checkout |
| User     | Positive | Same; the cart survives reloads on the same device                     |
| Rigger   | Neutral  | May use it to order gear for customers                                 |
| Dropzone | Neutral  | Same as rigger                                                         |
| Admin    | Positive | Receives structured, trackable orders instead of loose WhatsApp chats  |

## Value Assessment

- **Primary value**: Commercial — every WhatsApp message is a qualified lead with products, variants and totals.
- **Secondary value**: Efficiency — no payment provider, no order admin, no refunds to build before the business
  needs them.

## User Stories

### Story 1: Build a cart

As a **Visitor**,
I want **to add products with a chosen variant and quantity to a cart that survives a reload**,
so that I can **collect everything I want before contacting Eca**.

#### Acceptance Criteria

- When a visitor adds a product, the cart shall store the product slug, the chosen variant (if any), the quantity
  and the USD price at the time of adding, in `localStorage`.
- When the same product and variant is added again, the cart shall increase the quantity instead of adding a line.
- The navigation shall show a cart icon with the number of items, on every public page and in the app shell.
- The cart page at `/cart` shall list lines with image, name, variant, quantity controls, remove, and line totals.
- The cart page shall show the total in USD as the primary figure and the ARS and BRL equivalents as indicative.
- If a product in the cart is no longer active, then the cart page shall flag the line and exclude it from the total.

### Story 2: Check out on WhatsApp

As a **User**,
I want **a checkout button that creates my order and opens WhatsApp with it written out**,
so that I can **agree shipping and payment with Eca directly, with a record I can look up later**.

#### Acceptance Criteria

- The cart page shall explain that shipping varies and that orders are completed with Eca on WhatsApp.
- While a visitor is not signed in, pressing "Continue on WhatsApp" shall send them to sign in and return them to
  `/cart` afterward instead of checking out.
- When a signed-in user presses "Continue on WhatsApp", the web app shall create the order (`shop-order-tracking.md`
  Story 1) and, on success, open `https://wa.me/5493413955408` in a new tab with a prefilled message naming the
  order number and listing every line (name, variant, quantity, USD line total), the USD total, the indicative ARS
  and BRL totals with the rate date, and a placeholder for the shipping destination.
- The prefilled message shall be written in the shopper's current locale (`en`, `es` or `pt`): its fixed phrases
  (greeting, labels, shipping placeholder) come from the same UI string bundle as the rest of the page, and each
  product's name comes from its `LocalizedText` for that locale, falling back to English when untranslated.
- The prefilled message shall be URL-encoded and shall stay under WhatsApp's practical length by summarising lines
  beyond the first twenty.
- If the cart is empty, then the checkout button shall be disabled and the page shall link back to the shop.
- When the order is created successfully, the web app shall clear the cart.
- If order creation fails (a line's product is no longer active, or a network error), then the web app shall leave
  the cart untouched, show the reason, and not open WhatsApp.

---

## Design

> Refer to `.github/copilot-instructions.md` for technical standards.

### Role Access

| Role     | Access                                   |
| -------- | ---------------------------------------- |
| Visitor  | Cart only; sign-in required to check out |
| User     | Cart and checkout (creates an order)     |
| Rigger   | Same as User                             |
| Dropzone | Same as User                             |
| Admin    | Same as User                             |

### Components Affected

- `apps/web/src/cart/cart-context.tsx`, `use-cart.ts` — cart state in `localStorage` under `bendike.cart`
- `apps/web/src/cart/whatsapp-message.ts` — builds the prefilled message from cart lines, rates and the current
  locale's UI strings and product names
- `apps/web/src/pages/cart/CartPage.tsx` — lines, totals, explanation, checkout button, served at `/:locale/cart`
- `apps/web/src/components/site/site-content.ts` — `WHATSAPP_NUMBER = '5493413955408'`
- `apps/web/src/components/site/SiteNav.tsx`, `components/AppShell.tsx` — cart icon with badge
- `apps/web/src/pages/shop/ProductPage.tsx` — Add to cart

### Dependencies

- `product-catalog.md` Tasks 1, 4, 5, 10 (contracts, product detail, exchange rates, product page) and Task 8 (web
  i18n scaffolding, `useLocale`, UI string bundles) — see ADR 0007
- `shop-order-tracking.md` Task 3 (order creation endpoint) — the checkout step calls it; see that spec's Task 6
  for the web-side wiring of the sign-in gate and cart-clearing behaviour.

### Data Model Changes

None on the server for the cart itself; it stays `localStorage` only. Checking out now persists an order — see
`shop-order-tracking.md`'s Data Model Changes. Cart shape in `localStorage`:

```json
{
  "version": 1,
  "lines": [
    { "slug": "freak6", "variantId": "…", "variantLabel": "M / regular / custom", "quantity": 1, "unitPriceUsd": 2508 }
  ]
}
```

### Diagrams

```mermaid
sequenceDiagram
  participant Shopper as Signed-in shopper
  participant Web
  participant API
  participant WA as WhatsApp (wa.me)
  Shopper->>Web: Add to cart (product, variant, qty) on /:locale/shop/:slug
  Web->>Web: localStorage bendike.cart
  Shopper->>Web: Open /:locale/cart
  Web->>Web: totals in USD, ARS, BRL from stored rates; lines resolved to product names in :locale
  Shopper->>Web: Continue on WhatsApp
  Web->>API: POST /api/v1/orders (shop-order-tracking.md Story 1)
  API-->>Web: created order {orderNumber, totals}
  Web->>Web: clear cart
  Web->>WA: open https://wa.me/5493413955408?text=<order number and encoded cart, phrased in :locale>
  WA-->>Shopper: chat with Eca opens with the order prefilled
```

### Open Questions

- [x] Message language: resolved by ADR 0007 — the message is written in the visitor's current locale (`en`, `es`
      or `pt`), not a fixed default.
- [x] Order persistence and history: resolved by [ADR 0010](../../docs/adr/0010-checkout-requires-sign-in.md) and
      `shop-order-tracking.md` — checkout now requires sign-in and creates a server-side order.
- [ ] Should signed-in users have the cart saved server-side too? Still not until there's a reason beyond order
      history, which lives on the order, not the cart.

---

## Tasks

### Task 1: Cart state

**Objective**: Add a cart context backed by `localStorage` with add, change quantity, remove and clear.

**Affected files**:

- `apps/web/src/cart/cart-context.tsx`, `use-cart.ts`, `cart-context.spec.tsx`, `main.tsx`

**Requirements**: Story 1

**Verification**:

- [ ] Adding the same product and variant twice yields one line with quantity 2; state survives a re-render from storage

**Done when**:

- [ ] All verification steps pass

---

### Task 2: Add to cart and cart badge

**Depends on**: Task 1

**Objective**: Wire the product page's Add to cart and show a badge count in `SiteNav` and `AppShell`.

**Affected files**:

- `apps/web/src/pages/shop/ProductPage.tsx`, `components/site/SiteNav.tsx`, `components/AppShell.tsx`, specs

**Verification**:

- [ ] Badge count equals total quantity; Add to cart is disabled until a full variant is chosen on products with options

**Done when**:

- [ ] All verification steps pass

---

### Task 3: Cart page with totals

**Depends on**: Task 1

**Objective**: Build `/cart` with lines, quantity controls, tri-currency totals and the shipping explanation.

**Affected files**:

- `apps/web/src/pages/cart/CartPage.tsx`, `CartPage.spec.tsx`, `App.tsx`

**Verification**:

- [ ] Totals recompute on quantity change; inactive products are flagged and excluded

**Done when**:

- [ ] All verification steps pass

---

### Task 4: WhatsApp handoff

**Depends on**: Task 3, `product-catalog.md` Task 8 (web i18n scaffolding)

**Objective**: Build the prefilled message, phrased in the shopper's current locale, and the Continue on WhatsApp
button. Order creation, the sign-in gate and cart-clearing are wired in `shop-order-tracking.md` Task 6, which
depends on this task.

**Affected files**:

- `apps/web/src/cart/whatsapp-message.ts`, `whatsapp-message.spec.ts`, `pages/cart/CartPage.tsx`

**Requirements**: Story 2

**Verification**:

- [ ] Message contains every line, the USD total, ARS and BRL with the rate date, and a shipping placeholder; URL is `https://wa.me/5493413955408?text=…` and decodes back to the message
- [ ] Building the message with locale `es` produces Spanish fixed phrases and Spanish product names where translated, `pt` produces Portuguese, `en` produces English; a product missing a translation falls back to its English name
- [ ] Button is disabled on an empty cart

**Done when**:

- [ ] All verification steps pass

---

## Out of Scope

- Payments, invoices, stock reservation
- Email or SMS alternatives to WhatsApp
- Persisted orders, order status and order history — see `shop-order-tracking.md`, which extends this spec's
  checkout step rather than living inside it

## Future Considerations

- Server-side cart for signed-in users, now that `shop-order-tracking.md` exists — still not planned; order
  history already covers "what did I order," which was the main reason to consider it
- Mercado Pago or Stripe when Eca wants to take payment online (new ADR)

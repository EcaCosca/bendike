# Checkout requires sign-in so every order has an owner

---

status: accepted

---

`cart-and-whatsapp-checkout.md` (2026-09-11) deliberately let a Visitor build a cart and check out without an
account: shipping isn't taken online, so there was nothing an account bought that needed to persist. `orders`
records the shopper's order in the database instead of the WhatsApp chat.

## Considered Options

- **Require sign-in at checkout (chosen)**: every order row has a `user_id`, so `/app/orders` and the profile
  page's order panel always work, and the same account that placed the order is the one an admin sees on the
  order-management view. The cost is friction: a Visitor who has never registered now has to create an account
  before Eca sees their order, where before a single tap opened WhatsApp.
- **Keep guest checkout, attach `user_id` only when signed in**: rejected. A guest order would exist with no
  owner, so it could never appear in anyone's order history — the entire point of `shop-order-tracking.md`. It
  also means two different code paths (owned vs. ownerless orders) for a feature whose value is entirely in
  ownership.
- **Keep guest checkout, require an email address instead of an account**: rejected. It solves "attach the order
  to someone" but not "let that someone look up the order later" without inventing a second, weaker auth
  mechanism (a magic link per order) alongside the JWT auth Bendike already has.

## Consequences

- `cart-and-whatsapp-checkout.md`'s checkout step now redirects a signed-out visitor to sign in and returns them to
  `/cart` afterward, instead of opening WhatsApp directly. Browsing the shop and building a cart still need no
  account.
- Every `orders` row has a non-nullable `user_id`; there is no representation for a guest order.
- This adds one more step between "wants a wingsuit" and "message sent to Eca." If conversion data later shows
  this costs real leads, the fallback is the previously considered "attach `user_id` only when signed in" option,
  which keeps guest checkout but drops those orders from history — a smaller change than reverting this ADR
  outright.

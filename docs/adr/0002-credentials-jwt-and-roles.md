# Accounts sign in with email and password, carry one of four roles, and present a JWT

---

status: accepted

---

Bendike needs accounts with exactly four roles: `user`, `rigger`, `dropzone` and `admin`. We propose (scaffold,
2026-09-11, `dropzone` added the same day at the product owner's request) that the API owns credentials itself:
email plus bcrypt-hashed password, exchanged for a signed JWT that the web app stores in `localStorage`. The role
is a PostgreSQL enum column on `users`, defaulting to `user`. Only an admin can change another account's role, and
never their own. The JWT carries the role for convenience, but authorization always uses the account row loaded
per request, so a demotion takes effect immediately.

A `dropzone` is an organisation account (the venue or its operator) that signs in with one email and password
like every other account. Whether a dropzone later needs several staff logins is an open question and would be a
separate ADR.

The identity provider choice was first made by the scaffold and confirmed by the product owner on 2026-09-11:
Bendike is a personal proof of concept and will not use Okta or any other hosted identity provider.

## Considered Options

- **Okta or another hosted IdP** (what the EPDM repos use): rejected by the product owner. Bendike is a personal
  proof of concept with no tenant; an external IdP would block local development on an external account and add
  cost before there is a user.
- **Social login only (Google, GitHub)**: deferred. Useful later, but it does not remove the need for a local
  account row with a role, and it adds OAuth callback plumbing before the product exists.
- **Sessions in a server-side store (cookies + Redis)**: rejected for now. A stateless JWT keeps the API a single
  process with a single database. Revisit if revocation or multi-device logout becomes a requirement.
- **Role as a free-text column or a separate roles table**: rejected. Four fixed roles are a closed set; a
  PostgreSQL enum plus a shared `ROLES` tuple makes an unknown role a compile-time and a database error.
- **Dropzone as a separate `organisations` table with members**: deferred. It is the right shape if a dropzone
  needs staff logins, but it doubles the account model before we know that. A role on the same `users` row is the
  smallest change that lets dropzone-specific features start.
- **Email + password, JWT, enum role (chosen)**: smallest thing that gives every later feature a trustworthy
  `user.role` to key off.

## Consequences

- Passwords are hashed with bcryptjs at cost 12; there is no plaintext path anywhere in the API.
- `JwtStrategy.validate` performs one `SELECT` per authenticated request. Acceptable at this scale; cache it
  behind a short TTL only if measurements say so.
- Adding another role means a migration (`ALTER TYPE user_role ADD VALUE`), a change to `ROLES`, and a new ADR.
  Because nothing had shipped yet, `dropzone` went into the initial `CreateUsers` migration instead.
- The first admin is bootstrapped from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` because there is no other way
  to reach the admin role.
- Password reset needs an email provider and is a separate spec.

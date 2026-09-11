# Google sign-in joins email and password as a second way into the same account

---

status: accepted

---

ADR 0002 deferred social login. Eca asked for Gmail authentication on 2026-09-11, so we decided to add "Sign in with
Google" as a second credential on the same `users` row rather than a separate identity system. The web app uses
Google Identity Services to obtain an ID token, the API verifies it against Bendike's client id, and then finds or
creates the account by Google subject and email, issuing the same Bendike JWT as password login. A Google-verified
email is treated as verified. Email and password remain for anyone without a Google account, dropzones in
particular.

## Considered Options

- **Passport Google OAuth redirect flow**: rejected. It needs server-side callback URLs and session cookies on the
  API, which is awkward on Vercel Functions and duplicates what the ID-token flow gives us in one round trip.
- **A hosted identity provider (Auth0, Clerk, Supabase Auth)**: rejected for now. It would own the users table the
  roles and gear tracking hang off, and the free tiers cap monthly active users; it remains an option if provider
  management grows.
- **Google only, no passwords**: rejected. Dropzones and some riggers use shared or non-Google mailboxes.
- **ID-token verification on our API, second credential on the same row (chosen)**.

## Consequences

- `users.password_hash` becomes nullable; `users.google_sub` is added, unique and nullable.
- `AuthService` gains a `signInWithGoogle` path; `JwtStrategy` and the roles model do not change.
- Accounts created by Google have no phone, so the profile-completion step from the profile spec is mandatory
  before the dashboard.
- Configuration gains `GOOGLE_CLIENT_ID`; the web build needs the same value at build time for the button.
- A Google Cloud project owned by Eca is a new external dependency, free of charge.

# Repack reminders are a daily digest email, sent by a cron-triggered endpoint through an email port

---

status: accepted

---

Eca wants the rigger emailed when a repack is coming up, with the owner's contact details and a link that opens
WhatsApp with a ready message (briefing, 2026-09-19). The 180-day reserve rule already computes the dates; what is
missing is a way to send email and a way to run something every day. We decided on one digest email per rigger per
day, containing only what needs attention, sent by an HTTP endpoint that an external scheduler calls, through an
`EmailSender` port with Resend as the first adapter.

The digest lists, per rigger: overdue items, items inside their yellow window, open bulletin matches and rigs
grounded awaiting clearance, each with the rig, owner, component, due date, days left, the owner's name, phone and
email, and a `https://wa.me/<phone>?text=...` link whose message is written in the owner's language (Spanish,
English or Portuguese) and names the rig, the component and the date. The digest is not sent when it would be empty.
An item reappears on a cadence (the day it becomes yellow, then weekly while yellow; the day it becomes overdue,
then every three days) recorded in `digest_deliveries`, so a rigger is reminded without being spammed.

## Considered Options

- **In-process scheduler in the Nest app**: rejected. The API is deployed as Vercel Functions
  (ADR 0005, ADR 0006), which do not keep a process alive to run timers.
- **One email per item**: rejected. On a busy day it would send a rigger a dozen messages about one dropzone.
- **In-app notification only**: rejected. Eca asked for email; the inbox (`notifications-inbox.md`) stays for the
  owners.
- **Provider choice**: Resend (chosen), Postmark, Amazon SES, SendGrid, or plain SMTP. Resend has a small HTTP API
  that needs no SDK, a free tier that covers this volume (check current limits when setting up), and simple domain
  verification. Everything sits behind `EmailSender`, so swapping the provider is a one-file change.
- **Cron-triggered endpoint (chosen)**: `POST /api/v1/internal/jobs/repack-digest`, authorised by a shared secret in
  `CRON_SECRET`, called by Vercel Cron or a scheduled GitHub Action. It is idempotent per day, and an admin can
  trigger it by hand from the API docs for testing.

## Consequences

- New configuration: `EMAIL_PROVIDER` (`resend` or `console`), `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, and `EMAIL_OVERRIDE_TO`, which redirects every outgoing email to one address for testing. With no
  provider configured the `console` adapter writes the email to the API log, so development and tests never send mail.
- Eca must create a Resend account, verify the sending domain and add the key. This is also the provider that
  `user-profile-and-email-verification.md` needs for verification emails, closing that open question.
- The digest is computed in the `America/Argentina/Buenos_Aires` time zone and sent once a day around 07:00.
- The owner's phone and email reach the rigger's inbox only for owners with an active link (ADR 0012); an owner
  without a phone gets a `mailto:` link instead of a WhatsApp one.
- Emails are written in the rigger's language; the WhatsApp text inside is in the owner's language.

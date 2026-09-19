# Profile avatars are stored on local disk, not object storage

---

status: accepted

---

`user-profile-and-email-verification.md` lets an account upload a picture (2026-09-18 extension). Bendike runs the
API as a single Node process today, with PostgreSQL as the only stateful dependency; there is no S3-compatible
bucket, no CDN and no deploy pipeline that would make a second stateful dependency free. Eca chose local disk for
now: the API writes uploaded avatars under a configurable `UPLOADS_DIR` (default `./uploads`) and serves them as
static files at `/uploads/avatars/...` through Express's built-in static handling (`NestExpressApplication` +
`useStaticAssets`), which `@nestjs/platform-express` already provides. No new package is added; multer, used for
the multipart upload, is already a transitive dependency of `@nestjs/platform-express`.

## Considered Options

- **Local disk (chosen)**: zero new infrastructure, zero new environment variables beyond `UPLOADS_DIR`, works
  today. Rejected nowhere: the API runs as one instance behind one process manager, so there is no fan-out problem
  yet.
- **S3-compatible object storage (Cloudflare R2, AWS S3)**: the correct answer once the API runs on more than one
  instance or behind a redeploy that wipes the filesystem, since a local file would then only exist on the instance
  that received the upload. Deferred: it is a new external service, new credentials to manage, and a cost line for
  a feature that today serves a handful of accounts.
- **Store the image as a blob in PostgreSQL**: rejected. Avatars are read far more often than written and don't
  belong in the same row set the app queries for account data; every unrelated `SELECT *` on `users` would risk
  dragging image bytes along.

## Consequences

- `users.avatar_path` stores a path relative to `UPLOADS_DIR` (for example `avatars/<userId>-<timestamp>.jpg`), not
  a full URL; the API composes the served URL from `WEB` or API base config when it returns `avatarUrl`.
- `UPLOADS_DIR` must be a path that survives process restarts on whatever host runs the API; a redeploy that
  provisions a fresh filesystem loses every avatar. This is acceptable while Bendike runs on a single
  long-lived host and becomes a real risk the day deploys move to ephemeral containers.
- `apps/api/uploads/` is git-ignored; only a `.gitkeep` is committed so the directory exists in a fresh checkout.
- Migrating to object storage later means: add the provider adapter, backfill by uploading every existing file at
  `avatar_path` and rewriting the column to a full URL or object key, and remove `useStaticAssets`. The `avatarUrl`
  contract on `UserSummary` does not change shape, so the web app needs no changes.

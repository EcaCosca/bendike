# The manual library is stored in Google Drive behind a storage port

---

status: accepted

---

Riggers need the manufacturer's manual for every model they pack, and manufacturers change or remove their files or go
out of business (briefing, 2026-09-20). Bendike keeps its own copy of each manual in a "Library" that only riggers and
admins see. Eca chose Google Drive as the place, for now. [ADR 0009](./0009-local-disk-storage-for-profile-avatars.md)
kept avatars on local disk and named object storage as the later step; documents are different because losing them
defeats their purpose, so they must not depend on one host's filesystem.

We decided to define a small `DocumentStorage` port (`put`, `get`) with two adapters, Google Drive and local disk, and
to let the Library service depend only on the port. The API streams every download through an authenticated endpoint;
the Drive file is never shared and no Drive link is ever shown.

## Considered Options

- **Google Drive with OAuth for Eca's own account (chosen)**: the API uploads with a refresh token, using the narrow
  `drive.file` scope, so it can only see files it created. A one-time script (`drive:authorize`) does the consent and
  creates the "Bendike Library" folder, because under that scope the app cannot write into a folder made by hand.
- **Google Drive with a service account**: rejected. Service accounts have no storage quota of their own on a personal
  Drive, so uploads into a shared folder fail with a quota error; it only works with a Google Workspace shared drive.
- **S3-compatible object storage (Cloudflare R2, S3)**: the more conventional choice and the way out if Drive becomes
  a limit. Deferred at Eca's request; the port makes it an adapter, not a rewrite.
- **Local disk**: kept as the development and fallback adapter, never for production: a redeploy that replaces the
  filesystem would silently lose the manuals.
- **Store the PDF in PostgreSQL**: rejected; 25 MB blobs bloat backups and every query on the table.

## Consequences

- New environment variables: `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`,
  `GOOGLE_DRIVE_FOLDER_ID`. When any is missing the API uses local disk under `UPLOADS_DIR/library` and logs a warning.
- The refresh token belongs to Eca's Google account; if he revokes it, uploads and downloads fail with a storage error
  (HTTP 502) until the script is run again. Files are owned by his Drive and count against his quota.
- The Library row stores an opaque `storage_key` (the Drive file id, or a generated file name on disk), a SHA-256 of
  the bytes and the size, so a copy can be verified and moved to another adapter by uploading each file again.
- Bendike stores only what riggers upload, with the source link as a reference. Manuals are the manufacturers'
  copyright, so the Library is not public and offers no sharing.
- The API never deletes a stored file; archiving a document only hides it.

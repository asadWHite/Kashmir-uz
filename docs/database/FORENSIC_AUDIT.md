# Recovery forensic audit (before implementation)

## Findings
The reported replacement database has zero public tables. No production connection
was available to independently inspect its catalog. All 14 application tables
are consequently reported missing, including every column, constraint, index and
sequence. Login queries `admin_users` before password verification; a missing
relation becomes the login API's 503. This is not evidence of defective scrypt.

`src/db/schema.ts` is the model authority. Legacy migrations 0001/0002 add
sessions/translations/revisions only, not the base schema. 0003 is content
backfill, not a schema migration. `src/db/seed.ts` seeds demonstration content,
uses fallback credentials and updates an existing password: unsuitable for recovery.
No migration tracking/runner exists. Drizzle config has a hardcoded local target.
Build/start do not migrate; preserve that property. No vercel.json exists.

SQL-only objects missing from Drizzle: two admin session indexes, revision
created_at DESC index, locale CHECK. Reconcile those declarations explicitly.
Serial columns use owned sequences; timestamps default to now(), with no automatic
update trigger (application writes updated_at). Category FK SET NULL; session FK
CASCADE; remaining content entity references are intentionally polymorphic, not FKs.

## Feature dependency map
| Feature | Tables |
|---|---|
| Login | admin_users |
| Login/logout/activity history | admin_sessions, admin_users |
| Dashboard | curtains, interiors, categories, leads, contact_messages, statistics |
| Catalog/category CRUD | curtains, categories |
| Interior projects | interiors |
| Business counters | statistics |
| Contact/settings | site_settings, contact_messages |
| Lead capture/management | leads |
| FAQ | faq |
| Gallery | gallery |
| Chunked upload staging | image_upload_sessions |
| Localized content | content_translations plus corresponding parent table |
| Cache invalidation/write history | content_revisions |

All DB API handlers and data-access modules were inspected. Drizzle parameterizes
values; dynamic entity selection is mapped to known tables. Middleware guards
/admin and /api/admin; protected layout verifies a session too. Empty collection
queries return arrays; public data layer contains fallback content, which is not
DB insertion. Detailed browser CRUD remains unverified until integration testing.

## Authentication/security
Scrypt uses random 16-byte salt and 64-byte output, timingSafeEqual with length
check. Email is normalized on login. No account-status field exists. JWT HS256,
7-day exp checked server-side via jose; random UUID history ID, no JWT in DB.
Cookie httpOnly, Secure in production, SameSite lax, path /. History writes are
optional by current design. Logout removes cookie but does not revoke copied JWTs.
Edge middleware does not consult history. Preserve architecture; document this
limitation rather than claiming revocation. AUTH_SECRET fallback to public site
URL/dev constant is unsafe in production and must fail closed there. No durable
login rate limiter found: configure Vercel WAF before public admin use. Some existing
handlers log raw DB errors server-side; do not expose them via new diagnostics.

## Access and test limits
No DATABASE_URL/ADMIN_* secrets in workspace. GitHub authentication is not database
access. Isolated PostgreSQL 18.6 WASM (PGlite), installed outside repository,
reachable on loopback for tests; not equivalent to Neon PgBouncer concurrency.
Production project/branch/database identity, migration, admin creation, deployment
and real login remain PENDING. No production mutation has occurred.

# Kashmir Decor — First-Party Visitor Analytics

Status: implemented, tested, and verified against a real PostgreSQL-compatible
engine. Branch `arena/2df0ea89-kashmir-uz`. Nothing has been deployed or merged.

---

## 1. Root cause of the original tracking problem

Before this change there was **no first-party public tracking at all**. An
inspection of the repository found exactly three things that looked like
analytics, and none of them recorded ordinary visitor traffic:

| What existed | Where | Why it did not count public visitors |
| --- | --- | --- |
| Vercel Analytics + Speed Insights | `src/app/layout.tsx` | Third-party beacon; data leaves the app into the Vercel dashboard and is never available inside the Kashmir admin panel or the project database. |
| `AdminSessionTracker` + `admin_sessions` | `src/app/admin/(protected)/layout.tsx` | Mounted **only inside the protected admin layout**. It posts a heartbeat for a logged-in administrator. It can only ever produce admin activity. |
| Admin "Статистика" section | `src/app/admin/(protected)/statistics/page.tsx` | Not analytics at all — a CRUD editor for the marketing "В цифрах" figures that are hand-typed and rendered on the public site. |

A `grep` across the repository for `track|analytics|visitor|page_view` returned
no first-party visitor persistence path. So the symptom the user described —
"the admin panel counts admin visits but not ordinary website visitors" — was
not a broken calculation. It was **the absence of a public ingestion path**: the
only instrumentation in the app was wired to the admin layout by design.

There was also no analytics table in the schema and no analytics migration in
the allowlist, so there was nothing to repair and no duplicate functionality to
remove. The work was to add a missing subsystem without disturbing the working
one.

---

## 2. Files created or modified

### Created

| Path | Purpose |
| --- | --- |
| `migrations/0004_visitor_analytics.sql` | Additive migration: three tables, CHECK constraints, indexes. |
| `src/lib/analytics.ts` | Server core: validation, sanitisation, UA parsing, rate limiting, ingestion, aggregation, reporting. |
| `src/app/components/PublicTracker.tsx` | Client-side public tracker mounted in the root layout. |
| `src/app/api/analytics/track/route.ts` | Public event ingestion endpoint. |
| `src/app/api/admin/analytics/track/route.ts` | Authenticated admin page-view ingestion. |
| `src/app/api/admin/analytics/route.ts` | Authenticated reporting endpoint (full report / `active=1`). |
| `src/app/admin/(protected)/analytics/page.tsx` | Analytics dashboard inside the existing admin panel. |
| `tests/analytics.node.ts` | 17 integration tests against PGlite with the real migrations. |
| `tests/analytics-http.node.ts` | 6 end-to-end HTTP tests against a real `next start` server. |
| `docs/analytics/VISITOR-ANALYTICS.md` | This report. |

### Modified

| Path | Change |
| --- | --- |
| `src/app/layout.tsx` | Mounts `PublicTracker` (4 lines). Vercel Analytics left untouched. |
| `src/app/components/AdminSessionTracker.tsx` | Keeps the existing 60 s heartbeat, adds `admin_page_view` on pathname change with StrictMode dedupe. |
| `src/app/admin/_components/AdminNav.tsx` | Adds the "Аналитика" link. |
| `src/lib/auth.ts` | `createSession` records `admin_login`, `destroySession` records `admin_logout`, both best-effort inside `try/catch`. Auth control flow unchanged. |
| `src/db/recovery/manifest.ts` | Allowlists `0004_visitor_analytics` with its checksum. |
| `package.json` | Adds `server-only` dependency, PGlite as devDependency, and `test:analytics` / `test:analytics:http` scripts. |

**Deliberately not modified:** `src/db/schema.ts` (leaving it byte-identical
preserves the pinned catalog/model baseline checksums), every existing route,
every existing migration, `.env*`, `AUTH_SECRET`, `src/middleware.ts`, and all
auth logic. `git diff` confirms `schema.ts` has zero changes.

---

## 3. Database migration added

`migrations/0004_visitor_analytics.sql`, SHA-256
`73ef31f50069fe2d23e75fc8b2711548b45ddc4947324b09247d3dc23242d344`,
registered in `src/db/recovery/manifest.ts`.

Three tables. Everything is `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT
EXISTS` / `ADD CONSTRAINT`-free, so it is **additive and re-runnable**. It
creates no triggers, drops nothing, and touches no existing table or row.
It follows `0000_production_baseline` and `0001_admin_sessions` in order.

- `analytics_visitors` — one row per anonymous visitor UUID: `first_seen_at`,
  `last_seen_at`, `session_count`, `page_view_count`, first/last referrer.
- `analytics_sessions` — one row per session UUID: `visitor_id` FK, `started_at`,
  `last_activity_at`, `ended_at`, `duration_seconds`, `page_views`, `is_bounce`,
  entry/exit path, plus the parsed dimensions (device, browser, OS, language,
  referrer).
- `analytics_events` — append-only event log: `event_type`, `actor_type`,
  optional FKs to visitor/session/admin user/admin session, `path`, `referrer`,
  dimensions, and a `dedupe_key` with a UNIQUE index.

All timestamps are `timestamptz` stored in UTC; `now()` is the only clock.

### Separation is enforced by the database, not only by application code

```sql
CHECK (CASE actor_type
         WHEN 'public' THEN event_type IN ('public_page_view','public_session_start','public_session_end')
         WHEN 'admin'  THEN event_type IN ('admin_login','admin_page_view','admin_logout')
       END)
```

A public event can never be written with admin type and vice versa. Every public
aggregate in `src/lib/analytics.ts` filters `actor_type = 'public'`; every admin
aggregate filters `actor_type = 'admin'`. Even a bug in the API layer cannot
mix the two series.

Indexes cover the access paths actually used: `(created_at)`,
`(visitor_id, created_at)`, `(session_id)`, `(event_type, created_at)`,
`(actor_type, created_at)`, `(path, created_at)`, `(started_at)`,
`(last_activity_at)` and the `dedupe_key` unique index.

**Retention:** events are append-only and never auto-deleted by the application.
The header of the migration documents the reviewed manual purge statement
(older than 13 months) so growth is controllable without a background job that
could surprise an operator.

---

## 4. How public visitors are tracked

`PublicTracker` is a small client component mounted once in the root layout, so
it covers every public route — `/`, `/collections`, `/curtains/[slug]`,
`/interiors`, `/interiors/[slug]`, `/gallery`, `/favorites`, `/auth`, and any
route added later. It is path-based rather than route-list-based, so new pages
are tracked automatically.

- **Identity:** `kashmir-visitor-id`, a random UUID in a first-party cookie with
  a 1-year lifetime. `kashmir-session-id`, a separate UUID with a 30-minute
  sliding lifetime. Both are `SameSite=Lax`, `Path=/`, same-origin only, and
  readable only to this site. No cross-site identifier, no fingerprint, no IP,
  no GPS, no free text.
- **Page views:** fires on mount and on every `usePathname()` change, so
  client-side navigations are captured. A 1-second in-memory dedupe window
  absorbs React StrictMode double-effects, hydration replays, and
  `router.refresh()` (which the locale switcher triggers). The database has a
  second line of defence: a unique `dedupe_key` plus `INSERT … ON CONFLICT DO
  NOTHING`, so a refresh that produces a legitimate new page view is recorded
  but an exact duplicate event is discarded.
- **Heartbeat:** a 30-second `public_heartbeat` while the tab is visible. It
  refreshes `last_activity_at`, which is what the "active visitors right now"
  counter reads. A session is only considered active if seen in the last 5
  minutes.
- **Session end:** on `pagehide` the tracker sends `public_session_end` with a
  `keepalive` fetch. Duration is **computed on the server** from
  `started_at` to now — never trusted from the client.
- **Resume:** any activity within the 30-minute window clears `ended_at` and
  resumes the same session instead of opening a fresh one.
- **Failure isolation:** every fetch is wrapped, the response is ignored, and
  errors are swallowed. Tracking can never break rendering, block navigation,
  or surface a console error to a visitor. The request is fire-and-forget and
  the route answers `204` as fast as possible.
- **Admin exclusion (client side):** the tracker refuses to fire on `/admin` and
  `/api` paths.
- **Admin exclusion (server side):** `/api/analytics/track` inspects the
  `kashemir_session` cookie; if it carries a valid admin JWT the request is
  silently dropped with `204`. This closes the case where an administrator opens
  the public site in the same browser profile while logged in.

---

## 5. How admin visits are separated

Three independent layers, so no single mistake can merge the two streams:

1. **Different instrumentation.** Public traffic is recorded by
   `PublicTracker`. Admin traffic is recorded by `AdminSessionTracker` (page
   views) and by `src/lib/auth.ts` (login/logout). They never share a client or
   a code path.
2. **Different event vocabularies, constrained in the database.**
   `public_page_view` / `public_session_start` / `public_session_end` versus
   `admin_login` / `admin_page_view` / `admin_logout`, tied to `actor_type` by
   the CHECK constraint described above.
3. **Different aggregation scopes.** Reporting is split into a `public` section
   and an `admin` section. Every public metric — visitors, uniques, page views,
   sessions, duration, top pages, referrers, distributions, active-now — is
   computed exclusively over `actor_type = 'public'`.

Admin rows are never given a `visitor_id` or a public `session_id`; they link to
`admin_users` / `admin_sessions` instead, so a join cannot accidentally pull an
admin into a visitor rollup.

The dashboard renders "Активность администраторов" in its own clearly labelled
card, below and separate from the public metrics, with its own empty state.

---

## 6. Metrics available

**Overview:** total page views, unique visitors, total sessions, active visitors
right now, new vs returning visitors, average session duration, bounce rate.

**Time filters:** today, yesterday, last 7 days, last 30 days, last 90 days, and
a custom range (validated to at most 365 days, inclusive of both endpoints).

**Detailed:** visitors over time and page views over time (hourly for today and
yesterday, daily otherwise, with zero-filled buckets so the chart does not lie
about gaps), most visited pages, top referrers, device distribution, browser
distribution, operating-system distribution, language distribution, new vs
returning, and a recent-activity feed.

**Admin:** logins, admin page views, recent admin sessions — reported separately,
never summed with public figures.

Every card has an honest empty state ("Нет данных за выбранный период"). No
seeded, demo, or fabricated rows exist anywhere in the codebase or migrations.

---

## 7. Tests executed and actual results

All commands run in this workspace on 2026-11-14.

| Command | Result |
| --- | --- |
| `npm run typecheck` | exit 0, no errors |
| `npm run lint` | exit 0, no warnings |
| `npm run test:database` | 2 pass, 1 skipped (needs `TEST_DATABASE_URL`), 0 fail |
| `npm run test:analytics` | **17 pass, 0 fail** |
| `npm run test:analytics:http` | **6 pass, 0 fail** (run twice, both clean) |
| `npm run build` | exit 0, compiled successfully; `/admin/analytics`, `/api/analytics/track`, `/api/admin/analytics`, `/api/admin/analytics/track` all present in the route table |

The integration suite (`tests/analytics.node.ts`) applies the **real** `0000` and
`0004` migrations to PGlite and asserts against actual row contents and
aggregate results, not just HTTP status codes.

### Coverage against the twelve required scenarios

| # | Scenario | Where | Verified by |
| --- | --- | --- | --- |
| 1 | Anonymous visitor opens the homepage | HTTP 2 | One visitor row, one session row, one `public_page_view` for `/`, server-side UA parsed. |
| 2 | Same visitor navigates to another page | HTTP 2, unit | Second path recorded, `page_views` incremented, still one visitor and one session. |
| 3 | Same visitor refreshes the page | HTTP 6, unit | Duplicate submission is discarded by `dedupe_key`; counts do not move. |
| 4 | Returning visitor comes back | unit | Backdated `first_seen_at` yields a returning visitor and a second session, unique visitors stay 1. |
| 5 | Two browsers create two visitors | unit | Two distinct UUIDs produce two distinct visitor rows. |
| 6 | Admin logs into the dashboard | HTTP 5 | `admin_login` row with `actor_type='admin'` written by the real login route. |
| 7 | Admin navigates between dashboard pages | HTTP 5 | `admin_page_view` rows via the authenticated endpoint. |
| 8 | Admin visits do not increase public counts | HTTP 4 + 5 | Public page-view count is asserted to be **exactly** the public total while admin views grow. Public endpoint also drops a request carrying an admin cookie. |
| 9 | Active visitor count updates | unit | Heartbeat refreshes `last_activity_at`; the 5-minute window includes and then excludes the visitor. |
| 10 | Reporting rejects unauthenticated requests | HTTP 1 | `/api/admin/analytics` and `/api/admin/analytics/track` return 401 without a cookie, and with forged/expired JWTs. |
| 11 | Duplicate events handled correctly | HTTP 6, unit | Identical batch re-submitted; `COUNT(*)` unchanged. |
| 12 | Database failure does not crash the site | unit + design | Ingestion is best-effort with all errors caught; the public route still returns `204`. Verified that a failing pool cannot propagate to rendering. |

Additional hardening covered by tests: malformed JSON returns 400, oversized
payloads are rejected by the 64 KB cap, invalid UUIDs and unknown event types are
rejected, `/admin` and `/api` paths are refused by public ingestion, and the
rate limiter blocks a burst beyond 120 requests/minute per IP.

### Two test-infrastructure findings worth recording

- `PGLiteSocketServer` defaults to **one** connection (`maxConnections: 1`). The
  test now sets `maxConnections: 20` so the app's pool and the test's own pool
  can coexist. This is a test harness detail, not an application issue.
- The PGlite socket adaptor drops connections that carry the `statement_timeout`
  startup parameter, which `scripts/db-migrate.ts` sets via
  `src/db/recovery/*`. That parameter is valid PostgreSQL and is fine against
  Neon; it is only the in-process PGlite emulation that resets. The HTTP test
  therefore applies the migration files directly with checksum verification
  instead of shelling out to `db:migrate`, and I separately verified the real
  `applyMigration` / `verifyCatalog` / `verifyHistory` code path against a plain
  pool: both migrations applied, checksums matched, `verifyCatalog` valid,
  `verifyHistory` true, tracking table correct.

---

## 8. Remaining limitations

1. **Not deployed.** Nothing has been merged to `main` or applied to Neon. The
   migration has been validated against PGlite and the runner's own logic
   against a socket pool, but it has not been executed against the production
   Neon branch.
2. **Ad blockers.** Some privacy extensions block any request whose path
   contains `analytics`. The endpoint is framed as first-party and the tracker
   fails silently, so nothing breaks — but a fraction of traffic will be
   invisible. This is inherent to client-side analytics and cannot be fully
   removed without server-side request logging, which was out of scope.
3. **No server-side page-view capture.** Tracking is client-side, so a visitor
   with JavaScript disabled is not counted.
4. **`navigator.sendBeacon` is not used.** `fetch(…, {keepalive: true})` is used
   instead because it gives control over headers and body shape; the trade-off
   is the 64 KB keepalive budget, which is irrelevant at this event size.
5. **IP-based rate limiting.** The limiter keys on the forwarded client IP held
   in memory, per instance. It is deliberately not persisted (that would mean
   storing IPs, which the privacy requirement forbids) and it does not
   coordinate across serverless instances. It is a spam guard, not a hard quota.
6. **Referrer is origin + path only.** Query strings are stripped, so campaign
   parameters (`utm_*`) are not broken out.
7. **User-agent parsing is heuristic.** A small built-in classifier handles
   device/browser/OS. Unusual or spoofed user agents fall into "unknown" rather
   than being guessed.
8. **Timezone.** Reporting buckets are UTC. The dashboard does not convert to
   Asia/Tashkent; "today" therefore means the UTC day. If local-day reporting is
   wanted, that is a small, isolated change in `getAnalyticsReport`.
9. **Retention is manual by design.** No cron or background deletion exists, so
   the tables grow until an operator runs the documented purge statement.
10. **Vercel Analytics is still mounted.** It was left in place to avoid changing
    unrelated behaviour; the two systems are independent.
11. **`src/db/schema.ts` does not describe the new tables.** This was
    intentional to keep the pinned baseline checksums stable. The analytics
    tables are accessed through parameterized raw SQL in `src/lib/analytics.ts`.
    A future change can add Drizzle definitions and regenerate the reference
    files as a separate, reviewed step.

---

## 9. Exact deployment steps

Nothing below has been run. Perform these in order.

1. **Review the branch.** Merge `arena/2df0ea89-kashmir-uz` into `main` via a pull
   request after reviewing the diff.
2. **Confirm the target is the production database.** `db:migrate` enforces the
   manifest allowlist, advisory lock, checksums and catalog verification. Make
   sure `DATABASE_URL` points at the intended Neon branch.
3. **Back up first.** Take a Neon branch or snapshot. The migration is additive
   and re-runnable, but a snapshot is still the correct precondition for any
   production DDL.
4. **Verify before migrating (read-only).** Run `npm run db:verify`. It should
   report the pre-existing schema as valid.
5. **Apply the migration.**
   `npm run db:migrate`
   Expect `0004_visitor_analytics` to be applied once. Re-running is a no-op.
   Alternatively, run the manual `production-db-migrate` GitHub Actions workflow,
   which is the established path for production DDL.
6. **Verify after migrating.** Run `npm run db:verify` again, then
   `curl -s https://kashmirdecor.uz/api/health`. The health check reports
   `application`, `database`, `schema` and `migrations`; all four must be `PASS`.
7. **Confirm the new tables exist** (read-only):
   `SELECT to_regclass('public.analytics_events'), to_regclass('public.analytics_visitors'), to_regclass('public.analytics_sessions');`
   All three must be non-null.
8. **Deploy the application** through the existing Vercel pipeline. No new
   environment variables are required. Do **not** touch `AUTH_SECRET`,
   `DATABASE_URL`, or any existing variable. The only new dependency is
   `server-only`, already in `package.json`.
9. **Smoke-test public tracking.** Open the site in a normal window, visit two
   pages, then check as an operator (read-only, in the SQL console):
   `SELECT event_type, path, created_at FROM public.analytics_events WHERE actor_type='public' ORDER BY created_at DESC LIMIT 5;`
   You should see your two page views. Confirm no admin JWT was in that browser
   profile.
10. **Smoke-test admin separation.** Log into `/admin`, click between two pages,
    then verify:
    `SELECT actor_type, event_type, COUNT(*) FROM public.analytics_events GROUP BY 1,2 ORDER BY 1,2;`
    The admin rows must increase and the public row counts must not.
11. **Open `/admin/analytics`.** Confirm the overview, charts and distributions
    populate, that "Сейчас на сайте" responds, and that the admin activity card
    is populated separately. Check the browser console for errors — there should
    be none.
12. **Confirm auth is intact.** Log out, then request `/api/admin/analytics`
    without a cookie and confirm `401`.

### Rollback

The migration is additive, so a rollback is a no-op at the database level: the
old application code simply ignores the three new tables, and they can be
dropped later in a separate, reviewed migration if the feature is abandoned.
Reverting the application commit restores the previous behaviour exactly. Under
no circumstances should production tables be dropped or truncated to "undo"
this change.

### Security review summary

- All SQL is parameterized; no string interpolation reaches a query.
- Ingest payloads are validated field by field: UUIDs only, event types against a
  fixed allowlist, paths must start with `/` and must not begin with `/admin` or
  `/api`, referrers are reduced to origin + path, and free-text dimensions are
  length-capped and sanitised.
- Request bodies are capped at 64 KB and 20 events per request.
- Ingestion is rate limited per IP.
- Reporting and admin ingestion both call `getSession()`; unauthenticated and
  forged-JWT requests receive `401`. The edge middleware guard is unchanged and
  still applies.
- No visitor identifier, IP address, raw user agent, or credential is ever
  exposed by a public endpoint, and no credential is logged.
- Ingestion failures are caught and answered with `204` so analytics can never
  break a page render.

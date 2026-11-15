# Kashmir Decor — Production-like Preview Verification (2026-11-15)

**Status: IN PROGRESS** — deployment & code-path verification done on real infrastructure; real-data and write-path verification blocked on preview database configuration (see §3).
**Branch under test:** `arena/adbd743b-kashmir-uz` @ `e714b9a8efc15ce858458a034f93051ef1c3652b` (base `96f2784` of `main`, includes the performance work).

---

## 1. Preview deployment (Step 1)

Vercel's GitHub integration auto-deployed the branch (builds **success** on both projects linked to the repo):

| Project | Role | Preview URL for this branch | Access |
|---|---|---|---|
| **`kashmir-uz`** | **PRODUCTION project** — `kashmirdecor.uz` serves from it (its `*.vercel.app` alias serves the real site; sitemap canonicals = `https://kashmirdecor.uz`) | `https://kashmir-uz-git-arena-adbd743b-kashmir-uz-181818.vercel.app` (deployment `4zm3hbZdSYaWqsA6gao5CR2ivm13`) | public |
| `kashmir-uz-ltju` | secondary/unused (prod alias 404s) | deployment `ByrdoTnX6JfhBgNs5C2BBfpbK8gn` | **SSO-protected** (Vercel Deployment Protection) |

- Branch & commit verified: `e714b9a`, tree clean, no PR, no merge to `main`.
- **Production domain untouched** — production deploys only from `main`; this branch got *preview* deployments only.
- Env-var inspection & deployment logs are **blocked** until the Vercel app is turned ON (it is connected but currently off for this conversation).

## 2. What was verified on the deployed preview (code paths, real infrastructure)

| Check | Result |
|---|---|
| Homepage renders (RU) with all sections, nav, contact form | ✅ |
| SEO `<title>` preserved: "Шторы в Ташкенте — Kashmir Decor \| Пошив штор и текстиль" | ✅ |
| **HTML payload is small** (single-chunk response; no inline base64 images) — the record-scoped image delivery works in the deployed build | ✅ |
| Static assets (hero/about) optimized via `/_next/image?url=%2Fassets%2F…&w=1920&q=75` | ✅ |
| Unknown product slug → styled 404 ("Not found · KASHMIR DECOR") | ✅ |
| `/api/media/curtains/1?v=1` (missing record) → "Image not found." 404, no data leak | ✅ |
| Sitemap generation runs (static routes listed) | ✅ |

## 3. Finding: the preview's database is EMPTY / UNMIGRATED (blocks real-data verification)

Evidence (all via read-only GETs):

| Endpoint | Preview (`kashmir-uz` branch deploy) | Production (`kashmirdecor.uz`) |
|---|---|---|
| `/api/health` | `{"ok":false,"checks":{"application":"PASS","database":"PASS","schema":"FAIL","migrations":"FAIL"}}` | `{"ok":false,"checks":{"application":"PASS","database":"PASS","schema":"PASS","migrations":"FAIL"}}` |
| Homepage content | "Коллекция скоро появится", "Интерьеры скоро появятся", empty statistics | (real content — see §4) |
| Settings shown | **compiled-in `FALLBACK_SETTINGS`** (address "21, Mirzo Ulugbek Square…", phone "99 079 02 20", hero eyebrow "Curtain Studio · Interior Architecture" — all exactly `src/lib/constants.ts`) | real settings |
| `/api/faq` | `[]` | `[]` (no active rows yet — site content is being added daily) |

Interpretation: the preview env's `DATABASE_URL` points to a **different, empty/unmigrated database** (schema catalog FAIL vs. production's schema PASS proves they are *not* the same database). It is **not** the production database — so the preview **cannot** modify production data (good), but it also currently shows **no real content**, so Steps 2–3 (real data, real images, write-path tests) cannot run against it as-is.

Production health note: `migrations:FAIL` on production is the **pre-existing documented state** (schema applied via manual SQL files, no `kashmir_migrations` history — `docs/database/PRODUCTION.md`). Nothing in this branch touches the schema (confirmed by the full node-test suite).

## 4. Real content inventory (from production sitemap — read-only)

Products: `/curtains/shsvsh`, `/curtains/jesbsj`, `/curtains/bzv2`, `/curtains/hvbbcg`, `/curtains/sdf2`, `/curtains/bej-rangli-klassik-parda`
Interiors: `/interiors/klassik-uslubdagi-hashamatli-mehmonxona-pardalari`, `/interiors/klassik-uslubdagi-zargaldak-va-jigarrang-pardalar-jamlanmasi`, `/interiors/zamonaviy-va-yorug-interyer-uchun-och-rangdagi-pardalar`, `/interiors/zamonaviy-kafe-uchun-rang-barang-va-qulay-interyer-dizayni`, `/interiors/zamonaviy-ofis-va-muzokara-xonasi-uchun-pardalar-va-interyer-dizayni`

URL structure and canonicals (`https://kashmirdecor.uz/...`) unchanged — SEO requirement satisfied on production. These slugs will be used to verify image identity and ordering once the preview points at real data.

## 5. Blocked items & what unblocks them

| Item | Blocked by | Unblocked by |
|---|---|---|
| Verify required env vars on preview; confirm exact DB identity | Vercel app OFF | User turns the Vercel app ON (already connected) |
| Real product/interior/gallery images, all three locales UZ/RU/EN, ordering, favorites | Preview DB empty | Point preview `DATABASE_URL` at a DB with real data (see decision) |
| Admin upload replacement + cache invalidation write tests | Must never write to production | A **writable copy** of the data (Neon branch) on the preview |
| Remote perf numbers (TTFB/LCP/INP/CLS on the preview) | Outbound network from the measurement sandbox is restricted; fetch_page has no timings | Vercel Speed Insights after visits, or measurements once the data path is reachable; local equivalent numbers already captured (`docs/audit/perf-before.json` / `perf-after.json`) |

Local evidence remains valid and stands as the performance & image-identity verification of the code under test (same commit that is deployed): image-identity browser tests 5/5 (byte-exact `?v=` delivery), language switch 165× improvement (72s → 0.44s on Slow-4G emulation), homepage HTML 13.7 MB → 14.4 KB.

## 6. Verification toolkit (built & smoke-validated, 2026-11-15)

Since the sandbox's outbound network is restricted, the vehicle for remote verification is **GitHub Actions** (runners can reach the preview), driven by three scripts added to the branch:

| File | Purpose | Safety |
|---|---|---|
| `scripts/preview-verify.ts` | Read-only battery: health, 3-locale switch (cookie), real data/ordering, record-scoped versioned image URLs, no inline base64, gallery slot/version consistency, media delivery semantics (bare=original bytes, `?w=`=webp transform, `?v=`=immutable), SEO title/description/canonical, admin-leak scan, optional `--perf` timings | GET-only |
| `scripts/preview-write-verify.ts` | Write-path battery via the admin REST API: login → upload → replace primary (gallery guard) → byte-identity served↔stored → `?v=` bump (cache invalidation) → explicit gallery replace → **restore original** → logout | Refuses non-local targets without `ALLOW_REMOTE_WRITES=1`; always restores |
| `scripts/preview-lighthouse.mjs` | Lighthouse ×4 (mobile/desktop × cold/warm; mobile = Slow-4G-class throttling) | GET-only |
| `.github/workflows/preview-verify.yml` | `workflow_dispatch` runner wiring the three; write job double-gated (`run_write_tests` + `confirm_write_target`) and uses `secrets.ADMIN_EMAIL`/`ADMIN_PASSWORD` | — |

**Smoke validation** (local production-like stack: PGlite + real migrations + seeded content + `next build`/`next start`): read-only battery **48/48 PASS** (all 3 locales, ordering stable, 497 record-scoped URLs all versioned, 0 inline base64, gallery slots version-consistent, delivery semantics byte-verified, SEO+canonical correct, no admin leaks); write-path battery **PASS** (identity sha-match served↔stored, `?v= 1794769573143 → 1794769609941` after replacement, gallery guard preserved 2 slots, explicit gallery replace = exactly 1 slot, original restored).

## 7. Pre-existing SEO observation (NOT a regression — A/B proven)

The homepage's raw HTML contains **no literal `<title>` / `<meta name="description">`** for the default locale (ru) — values are carried by `og:*`/`twitter:*` tags and client-side metadata hoisting. A/B: a full build of the **base commit `96f2784`** (pre-optimization) produces the identical gap (and an 18,645,439-byte homepage vs the optimized 81,788 bytes). Cause: `src/app/page.tsx` `generateMetadata` returns `title/description: undefined` for ru (pre-existing pattern, unchanged by this branch), which clobbers the layout defaults in the raw stream. Flagged for the owner; fixing it is a separate authorized change.

## 8. Production-untouched confirmation (so far)

- All production interactions were **read-only GETs**: `robots.txt`, `sitemap.xml`, `/api/health`, `/api/faq`.
- No writes to the production database; no merge to `main`; no production-domain deployment; no env changes.
- The production site continued serving normally throughout (sitemap lastmod timestamps show active content operations by the site owner).

# KASHMIR DECOR — Performance, Image Loading & Localization Optimization

**Date:** 2026-11-15 · **Branch:** `arena/adbd743b-kashmir-uz` (from `main` @ `96f2784`) · **Status:** verified in sandbox, **not deployed**

Method: full code audit first, then a reproducible measurement harness
(`scripts/perf-measure.ts`) that boots the production build against an ephemeral
seeded Postgres (PGlite) with production-shaped content (localized ru/uz/en rows,
multi-hundred-KB data-URL product images), drives real Chromium (desktop +
mobile emulation) through the visitor journeys, emulates Slow 4G for
language-switch timing, and runs Lighthouse. Identical scenario before and
after. Raw data: `docs/audit/perf-before.json`, `docs/audit/perf-after.json`.

---

## 1. Root causes identified

| # | Root cause | Evidence |
|---|---|---|
| 1 | **Stored product/interior/gallery images were inlined as base64 data URLs into every page's HTML/RSC payload.** Uploads are stored as data URLs (by design, kept untouched) and the public read path passed them straight into views. | Homepage HTML **13.7–18.2 MB**; `/collections` 18.2 MB; product detail 14.8 MB. The log line `Failed to set Next.js data cache … items over 2MB can not be cached (9,292,771 bytes)` fired on every request. |
| 2 | **The per-locale payload cache silently failed** because entries exceeded `unstable_cache`'s 2 MB limit (9.3 MB) → every request and every language switch re-queried the database and re-serialized megabytes. | Server log on each page/RSC request (before fix). |
| 3 | **Language switching transferred the entire multi-MB RSC payload per switch** (`router.refresh()`), and `setLocaleAction` additionally called `revalidatePath("/", "layout")` (invalidation work per switch) and serialized two round trips before refreshing. | 3 switches = **41,013 KB** over the wire; **72.0 s per switch on Slow 4G**. |
| 4 | **No responsive image variants for stored images** (`unoptimized` data URLs / media route): full-resolution ≤2400px bytes were delivered even for 200px thumbnails. | Detail/gallery image bytes inline; no `srcset`. |
| 5 | **Blocking intro overlay held 1,250 ms + 650 ms fade** before revealing content (plus 5 s CSS safety). | `Loader.tsx`. |
| 6 | **Homepage blocked on the slowest of six datasets** before flushing a single byte (no streaming). | `page.tsx` awaited `getCachedHomepageData` wholesale. |
| 7 | **Duplicate work per request:** `loadTranslations` + `loadTranslationExtras` = 2 queries per entity for one table; `getSettings` fetched by both layout and homepage aggregation. | `src/lib/translations.ts`, `src/lib/data.ts`. |
| 8 | **Internal navigation used plain `<a href>`** (Collection, Interiors, Footer, Navbar, FavoritesIndicator) → full page reloads, no prefetch, no client navigation. | grep audit of all `href` call sites. |
| 9 | Interior media route cached only 300 s even though URLs are versioned; gallery had no invalidation-safe version at all. | `src/app/api/media/interiors/[id]/route.ts`; gallery schema has no `updated_at`. |

Not root causes (audited and confirmed already good, deliberately untouched):
single localization system (cookie + `content_translations` + `i18n.ts`),
`MediaImage`'s no-fallback-substitution policy, curtain gallery dedupe by
source identity, favorites/compare/likes, admin panel, SEO URLs/canonicals,
middleware auth, `Vary: Cookie` headers, fonts (woff2 + `font-display: swap` +
unicode-range subsets — 137 KB, only used subsets downloaded).

## 2. Files modified / added

**Modified (17):**
`src/lib/media.ts`, `src/lib/data.ts`, `src/lib/translations.ts`,
`src/app/components/MediaImage.tsx`, `src/app/components/Loader.tsx`,
`src/app/components/I18nProvider.tsx`, `src/app/actions/locale.ts`,
`src/app/page.tsx`, `src/app/components/Navbar.tsx`,
`src/app/components/Footer.tsx`, `src/app/components/Collection.tsx`,
`src/app/components/Interiors.tsx`, `src/app/components/FavoritesIndicator.tsx`,
`src/app/collections/CollectionsClient.tsx`, `src/app/gallery/GalleryClient.tsx`,
`src/app/interiors/InteriorsListClient.tsx`, `src/app/favorites/FavoritesClient.tsx`,
`src/app/api/media/interiors/[id]/route.ts`, `public/sw.js`

**Added (4):** `src/lib/media-route.ts`, `src/app/api/media/curtains/[id]/route.ts`,
`src/app/api/media/gallery/[id]/route.ts`, `scripts/perf-measure.ts`
(+ raw results `docs/audit/perf-before.json`, `docs/audit/perf-after.json`)

## 3. Exact fixes implemented

### Image delivery (root cause #1, #4, #9)
- **Record-scoped media endpoints** for every stored-image type:
  `/api/media/curtains/[id]`, `/api/media/gallery/[id]` (new), and the existing
  `/api/media/interiors/[id]` extended. The stored DB value is never rewritten;
  the URL is deterministic per record + slot (`?gallery=N`) and versioned
  (`?v=` = `updated_at` for curtains/interiors, content hash for gallery rows
  which have no timestamp). One uploaded image = one gallery item (dedupe runs
  on stored references first, then maps to URLs — same rule as before).
- **Byte-exact bare URLs** (no `w`): stored bytes streamed verbatim — the
  DB record ↔ URL mapping stays verifiable (proven by
  `test:image-identity:http`, byte comparisons on replace).
- **Responsive variants** (`?w=…&q=…`, Sharp WebP) for the widths matching
  `next.config.ts`'s `deviceSizes`/`imageSizes`; `MediaImage` feeds them to
  `next/image` through a custom loader → real `srcset`/`sizes`, the right-sized
  image per viewport instead of the 2400px original. `src` remains the exact
  versioned record URL.
- **Cache correctness:** versioned URLs → `public, max-age=31536000, immutable`
  (admin replace changes `updated_at`/content hash → new URL → no stale pixels,
  no re-fetch while unchanged). Unversioned → 300 s as before.
- **Above-the-fold grid images load eagerly** (`eager` flag: `loading="eager"` +
  `fetchPriority="high"`, no preload spray) on `/collections`, `/gallery`,
  `/interiors`, `/favorites`; hero and detail heroes keep `priority`; everything
  below the fold stays native lazy. Image URLs contain no locale → switching
  language never re-fetches an unchanged image.
- No fallback/curated substitution anywhere (pinned tests unchanged and green).

### Language switching (root cause #3)
- `data.ts` views now emit short record-scoped URLs → RSC payload per switch
  drops from ~13.7 MB to ~13 KB.
- `setLocaleAction` no longer calls `revalidatePath` (a switch must never
  invalidate the per-locale content caches).
- The client writes the cookie synchronously and starts `router.refresh()`
  immediately; the server action persists in parallel — two round trips become
  one, and the optimistic context flip updates interface strings instantly.
  Scroll position, route and DOM state preserved (no reload); server-rendered
  DB content swaps when the RSC response lands (measured below).

### Initial loading (root cause #5, #6)
- **Homepage streams:** hero + shell render from the first byte; Collection,
  Interiors, Statistics and FAQ sections resolve independently behind
  `Suspense` (below-the-fold, so no visible layout shift). A slow query can no
  longer delay the main content.
- **Loader no longer blocks:** the same brand intro (letters → line →
  subtitle) now fades as soon as the page has loaded, with a 550 ms minimum and
  a 900 ms hard cap (reduced-motion: 150 ms), tightened animation timing,
  unchanged 5 s CSS safety net and `data-intro` contract.
- `next/link` for all internal navigation (nav, footer, product/interior cards,
  favorites badge) → client-side navigation + prefetch instead of full reloads.

### DB / API (root cause #2, #7)
- Payloads now fit `unstable_cache` (KBs instead of 9.3 MB) — the per-locale
  cache **works again** (validated: warm TTFB 24–45 ms, and the 2 MB error is
  gone from the logs).
- `loadTranslationsWithExtras`: one query per entity instead of two
  (`extra` column in the same select); all `data.ts` call sites updated.
- Homepage calls each dataset through its own cached getter (shared with other
  pages); the settings double-fetch is gone from the homepage path.
- Public/admin API routes, auth, uploads, likes, leads untouched. No Redis or
  new infrastructure (none needed after the cache began working).

## 4–7. Before / after measurements

Identical seeded scenario (8 curtains × 3 images, 6 interiors × 3, 8 gallery
rows, localized ru/uz/en), production build, real Chromium. "Slow 4G" = 1.5
Mbit/s / 150 ms RTT (CDP emulation) applied to the language switch only.

| Metric | Before | After | Δ |
|---|---|---|---|
| **Homepage HTML transfer (mobile)** | 13,683 KB | **14.4 KB** | −99.9 % |
| **Homepage HTML transfer (desktop cold)** | 13,680 KB | **13.2 KB** | −99.9 % |
| `/collections` HTML | 18,177 KB | **47.1 KB** | −99.7 % |
| `/curtains/curtain-1` HTML | 14,765 KB | **32.9 KB** | −99.8 % |
| **Language switch, Slow 4G (per switch)** | **72,019 ms** | **431–445 ms** | **≈165×** |
| Language switch, desktop (per switch) | 1,328–1,992 ms | 173–206 ms | ≈8× |
| Language switch data (3 switches) | 41,013 KB | **40 KB** | −99.9 % |
| TTFB home mobile (cold) | 242 ms | **24 ms** | −90 % |
| FCP home mobile | 452 ms | **240 ms** | −47 % |
| LCP home mobile | 952–1,396 ms | **240–1,040 ms** | improved |
| TTFB `/curtains/[slug]` (desktop) | 252 ms | **116 ms** | −54 % |
| TTFB `/collections` (desktop) | 205–337 ms | **41 ms** | −80 %+ |
| CLS (all runs) | 0–0.0009 | 0–0.0009 | unchanged ✓ |
| Warm home TTFB / FCP | 214 ms / 432 ms | **36 ms / 200 ms** | |
| Image requests per page | **1** (all products inline!) | 4–9 lazy/eager, right-sized `srcset` | |
| Lighthouse performance score | 81–84 | **87–89** | |
| Lighthouse LCP (simulated mobile) | 3,386 ms | **958 ms** | −72 % |
| Lighthouse TBT / CLS | 127 ms / 0 | 120–210 ms / 0 | |

Image loading: before, "product images" arrived only as part of the 13–18 MB
document (un-cacheable, un-lazy-loadable, blocking). After, images are separate
versioned URLs fetched progressively (eager first viewport, lazy below), each
sized by `srcset` (browser picks e.g. `w=640` for a card instead of the 2400px
original) and immutable-cached. Warm image fetches measured at ~2 ms. Note:
seed images are high-entropy noise (worst case for compression); real
photography compresses 3–5× better at the same widths.

Lighthouse caveats: the sandbox CPU is shared with software-rendered
screenshots, which inflates LH's root-document/network estimates (they read
~8 s in **both** before and after runs while directly measured TTFB is
18–294 ms); scores and LCP/TBT/CLS are comparable run-to-run, direct
measurements above are the honest numbers.

## 8. Build & test results

- `npm run build` — ✓ compiled (Next 16.2.6 production; all routes correct)
- `npm run typecheck` (`tsc --noEmit`) — ✓ clean · `npm run lint` — ✓ clean
- `test:curtain-gallery` — **11/11 ✓** (gallery dedupe, ordering, admin-save
  invariants, no-fallback rules)
- Playwright specs `image-identity` + `product-layout` + `intro` — **32/32 ✓**
  (toImageSrc invariants, MediaImage placeholders, fill-positioning regression
  guard, intro/loader contracts incl. no-JS and reduced-motion)
- `test:database` 2/2 (+1 gated on TEST_DATABASE_URL) ✓ · `test:analytics` 17/17 ✓
- `test:analytics:http` 6/6 ✓ · `test:database:http` 1 gated skip ✓
- `test:image-identity:http` **5/5 ✓** including the real-browser case: the
  ID-scoped primary/gallery URLs render with zero failed media requests and
  zero MediaImage errors; admin replace changes only the replaced image; bytes
  survive routes byte-identical; gallery order preserved.

Functional checks covered by the suites + manual audit: favorites (localStorage
pipeline untouched), admin panel + uploads (write path untouched; admin reads
raw stored values), forms, interiors, galleries, direct URLs, all three locales
(strict per-locale resolution kept — no English leakage by construction),
cache invalidation on admin update (versioned URLs + revision bump).

## 9. Deployment status

**Not deployed** (per instructions — verified first). Nothing is committed yet;
the branch carries all changes. Before production: deploy this branch to a
preview and run the checklist (mobile + desktop × uz/ru/en, galleries,
favorites, forms, admin, upload → instant replace-invalidation, Lighthouse on a
non-throttled host). **Note: the Vercel app is connected but currently turned
off** — turn it on in the Arena connected-apps panel when you want
preview/production deploys (no new connection needed).

## 10. Remaining bottlenecks / recommendations

1. **Server-rendered pages are still per-request** (`force-dynamic` + cookie
   locale + `Vary: Cookie`): TTFB depends on the app/db round trip (warm cache
   ~20–40 ms, cold ~200–300 ms). Moving locales to path rewrites with static
   generation would cut TTFB further but touches SEO URL behavior — out of
   scope here, recommended as a follow-up.
2. **Data-URL storage remains** (by requirement): media-route requests decode
   stored base64 per cold hit (Sharp resize on first request per variant). A
   future `object storage + URL columns` migration would simplify this; the
   record-scoped routes make that migration invisible to the frontend.
3. **Client JS is unchanged** (~170 KB first route): sections that only need
   `Reveal` could become server components, and `next/font` (self-hosted woff2
   with metric-adjusted fallbacks) would shave font-swap CLS on slow networks —
   both are "replace working components" territory, deliberately not done here.
4. **Lighthouse `server-response-time`** should be re-measured on a quiet host;
   sandbox CPU contention inflates it symmetrically in both runs.
5. `next.config.ts` image `deviceSizes` already matches the media-route width
   allowlist — keep them in sync if either changes (`MEDIA_ROUTE_WIDTHS`).

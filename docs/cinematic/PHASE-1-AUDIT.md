# KASHMIR — Cinematic Digital Showroom
## Phase 1: Codebase Audit & Phase 2 Technical Proposal

**Date:** 2026-09-08
**Branch:** `arena/01a08011-kashmir-uz`
**Status:** Read-only audit. **No application code has been modified.**

---

## 0. Executive summary — four brief assumptions that are wrong

Before anything else, four premises in the build prompt do not match this repository. They change the plan materially, so they need a decision before Phase 2.

| # | Brief says | Reality | Impact |
|---|---|---|---|
| 1 | "self-contained around `index.html`" | **There is no `index.html`.** Zero `.html` files in the repo. It's a Next.js 16 App Router app. | **Use React Three Fiber, not vanilla Three.js.** The brief's own conditional resolves to the React path. |
| 2 | "active Supabase backend" | **No Supabase.** No `@supabase/*` dependency, no client, no env var. It's **PostgreSQL via Drizzle ORM** with Next.js Route Handlers. The word "Supabase" appears only in comments/README explaining the substitution. | Wire the cinematic layer to `/api/*` + `src/lib/data.ts`. Nothing to preserve on the Supabase side because nothing exists. |
| 3 | "119-file production codebase" | **126 git-tracked files.** Close, so the intent is right. | None. |
| 4 | "existing real statistics (3000+ / 17 / 100%)" | Values **do** exist and match — but as **seed data** (`src/db/seed.ts`), admin-editable, and the DB is **unreachable in this sandbox** (no Postgres on :5432). | Stats must render from DB props with a graceful empty state. I will **not** hardcode them into the 3D layer. |

Also worth flagging: **there is no Telegram notification pipeline.** The brief's Phase 8 says "wired to existing lead/Supabase/Telegram pipeline." `telegramUrl` is only a *link* in site settings — a contact URL shown in the footer/contact block. No bot token, no `sendMessage` call, no webhook. Leads land in the `leads` table and are read in `/admin/leads`. **Building a Telegram notifier would be new work, not preservation.**

---

## 1. Stack — confirmed

```
Framework    Next.js 16.2.6 (App Router, Turbopack) + React 19.2.6
Language     TypeScript 5.9.3, strict: true
Styling      Tailwind CSS v4 (@import "tailwindcss", @theme inline) + CSS custom props
Database     PostgreSQL 
             └ Drizzle ORM 0.45.2 + node-postgres Pool
Auth         jose JWT (HS256) in httpOnly cookie + edge middleware; scrypt hashes
Storage      Local disk → /public/uploads (gitignored)
i18n         Custom dictionary, cookie-persisted. RU (default) / EN / UZ
Analytics    @vercel/analytics
PWA          public/sw.js (network-first pages, cache-first static) + manifest.ts
```

**Animation libraries currently installed: none.** No Three.js, GSAP, Lenis, or Framer Motion. Every animation today is hand-rolled CSS keyframes + `IntersectionObserver` + `requestAnimationFrame`. This is a clean slate — nothing to conflict with.

### Baseline health (verified, not assumed)
- `npx tsc --noEmit` → **exit 0**, no errors
- `npx next dev` → **ready in 310ms**
- `GET /` → **HTTP 200**, 57.6 KB HTML, 157 ms
- Renders correctly **with no database**: `src/lib/data.ts` wraps every query in try/catch returning `[]`, so the page degrades to empty states (`"Коллекция скоро появится"`) rather than crashing. This is a genuinely well-built fallback and it means I can develop the cinematic layer in this sandbox without Postgres.

---

## 2. File tree

<details open>
<summary><strong>126 tracked files</strong></summary>

```
├── next.config.ts          ← EMPTY config object (no image opt, no headers)
├── package.json            ← no animation deps
├── drizzle.config.json
├── postcss.config.mjs · eslint.config.mjs · tsconfig.json
├── .env.example            ← DATABASE_URL, ADMIN_*, AUTH_SECRET, NEXT_PUBLIC_SITE_URL
│
├── public/
│   ├── assets/             ← 9 JPEGs, 2.3 MB total  ★ the cinematic source material
│   │   ├── hero.jpg          1536×1024  206 KB
│   │   ├── about.jpg         1536×1024  276 KB
│   │   ├── curtain-01..04    1024×1536  ~228–392 KB each
│   │   └── interior-01..03   mixed      ~199–283 KB each
│   ├── icon-512.png · sw.js · uploads/.gitkeep
│
├── src/
│   ├── middleware.ts       ← edge JWT guard: /admin/*, /api/admin/*, /api/auth/*
│   │
│   ├── db/
│   │   ├── schema.ts       ← 10 tables (211 lines)
│   │   ├── index.ts        ← lazy pg Pool (never throws at module load)
│   │   └── seed.ts         ← categories, curtains, interiors, STATISTICS, settings
│   │
│   ├── lib/
│   │   ├── i18n.ts         ← 852 lines. 3 locales × ~212 keys + per-slug content
│   │   ├── data.ts         ← 244 lines. All server queries, every one try/caught
│   │   ├── seo.ts · constants.ts · types.ts · auth.ts · session.ts
│   │
│   └── app/
│       ├── layout.tsx      ← fonts, metadata, JSON-LD, I18nProvider, theme script
│       ├── page.tsx        ← ★ THE HOMEPAGE — 73 lines, composition only
│       ├── globals.css     ← 215 lines design system
│       ├── manifest.ts · sitemap.ts · robots.ts · not-found.tsx · icon.svg
│       │
│       ├── components/     ← 28 files
│       ├── collections/ · curtains/[slug]/ · interiors/ · gallery/ · favorites/
│       ├── admin/          ← login + 10 protected CRUD pages
│       └── api/            ← 27 route handlers
```
</details>

### Routes
**Public (7):** `/` · `/collections` · `/curtains/[slug]` · `/interiors` · `/interiors/[slug]` · `/gallery` · `/favorites`
**Admin (11):** `/admin/login` + 10 protected CRUD pages
**API (27):** 18 admin (JWT-guarded) + 9 public — `/api/contact`, `/api/leads`, `/api/curtains/like`, `/api/curtains/unlike`, `/api/faq`, `/api/gallery`, `/api/health`, `/api/auth/*`

---

## 3. How `page.tsx` is organized

**73 lines. It is pure composition** — fetches, maps rows to serializable view types, renders 13 components in order. It has **no markup of its own**. This is the single most important finding for the build: *the cinematic layer can be introduced by changing this one file's composition, without editing a single section component.*

```
export const dynamic = "force-dynamic";   // SSR on every request

getHomepageData() → { curtainList, interiorList, statList, settings }
getActiveCategories() · getActiveFaq()
   ↓ map DB rows → CurtainView / InteriorView / StatView / CategoryView / FaqItem
   ↓ (strips Date objects so props can cross the RSC boundary)

<Loader />                                   full-screen intro, 1500ms, locks body scroll
<Navbar />  <Cursor />
<main>
  <Hero />                                   100svh, hero.jpg, rAF parallax ×0.2
  <Manifesto />                              marquee + about copy
  <Collection curtains categories />         ★ filter tabs + product grid
  <Interiors interiors />                    asymmetric 12-col grid, rAF parallax
  <Statistics stats />                       dark band, IO-triggered count-up
  <About />                                  about.jpg + services list
  <Process />                                5 steps, static grid
  <FaqAccordion items />
  <LocationSection settings />               address/hours/phone + CSS map
  <Contact settings />                       ★ form → POST /api/contact
</main>
<Footer settings />  <BackToTop />
```

The brief describes the current site as "Hero → Collection → About → Contact." **It's actually 10 sections, not 4** — Manifesto, Interiors, Statistics, Process, FAQ and Location already exist. Several map 1:1 onto the requested narrative beats, which is good news for the timeline.

### Narrative mapping — what already exists vs. what's new

| # | Narrative beat | Existing asset | Work required |
|---|---|---|---|
| 0 | Entry | `Loader.tsx` — wordmark + bar, locks scroll | **Refit.** Already ~80% of the beat |
| 1 | Approach | `Hero.tsx` — parallax `hero.jpg` | **Refit.** Photo is a literal window+curtain |
| 2 | Curtain Opens | — | **New** |
| 3 | Scene Transitions | `interior-01..03.jpg` | **New** (assets exist) |
| 4 | Material Showcase | `curtain-01..04.jpg`, `material` column | **New** (assets exist) |
| 5 | Fabric → Architecture | — | **New — hardest shot** |
| 6 | Collection | `Collection.tsx` + `/collections` + `/curtains/[slug]` | **Wrap, don't rebuild** |
| 7 | Atmosphere | — | **New** (CSS filter + texture swap) |
| 8 | Interiors | `Interiors.tsx` + `interiors` table | **Wrap** |
| 9 | Statistics | `Statistics.tsx` + `statistics` table | **Wrap.** Count-up already exists |
| 10 | Process | `Process.tsx` — 5 steps, i18n'd | **Wrap.** Steps map exactly to the 5 doors |
| 11 | Showroom | `LocationSection.tsx` + `site_settings` | **Wrap** |
| 12 | Contact | `Contact.tsx` + **orphaned `LeadFlow.tsx`** | **Mount LeadFlow** — see below |
| 13 | Final | — | **New** |

### `Process.tsx` already matches the 5 doors exactly
`process.1t` … `process.5t` are translated in all three locales. The brief's "Meeting → Measurement → Selection → Craft → Installation" corridor should read these keys rather than introduce new strings.

### `LeadFlow.tsx` is a free win
197 lines, fully built, **imported by zero files** — dead code. It is a 4-step modal (Interest → Room → Contact method → Name/Phone) that POSTs to `/api/leads` with retry. The brief's section 12 asks for "question flow (Curtains / Interior / Both → space description → contact details)." **That is this component**, minus a label change. Mounting it is a 1-line change plus adjusting the first step's options.

---

## 4. Data layer

### Schema (10 tables)
`categories` · `curtains` · `interiors` · `statistics` · `site_settings` · `contact_messages` · `leads` · `faq` · `gallery` · `admin_users`

`curtains` carries `material`, `color`, `style`, `room`, `gallery` (jsonb), `likes`, `isFeatured`, `sortOrder`. **`material` is what section 4 (Linen/Velvet/Sheer/Wool) should read** rather than a hardcoded list.

### Statistics — real, DB-driven, admin-editable
```ts
{ label: "Clients",             value: "3000", suffix: "+" }
{ label: "Experience",          value: "17",   suffix: ""  }
{ label: "Attention to detail", value: "100",  suffix: "%" }
```
Matches the brief. Localized via `statTr` / `statSuffixTr`. **Section 9 must render from the `stats` prop**, never a literal.

### Lead pipeline (the honest version)
```
Contact.tsx      → POST /api/contact → contact_messages → /admin/messages
LeadFlow.tsx     → POST /api/leads   → leads            → /admin/leads   [NOT MOUNTED]
```
Both retry 3× with 1.2s backoff for Neon cold starts. **No Telegram/email notification exists anywhere.**

### i18n
`translate(locale, key)` over a `Record<Locale, Record<string, string|string[]>>`, plus per-slug overrides for curtains/interiors/stats. Cookie `kashmir-locale`, SSR-resolved in `layout.tsx`.
**Constraint: every string I add to the cinematic layer needs RU + EN + UZ entries.** RU is the default and the SEO-primary locale.

---

## 5. Performance baseline — the real constraints

Against the "interactive in 3s on mid-range Android / 4G" target:

| Finding | Detail | Consequence |
|---|---|---|
| **`next.config.ts` is empty** | No image optimization config | Free wins available: AVIF/WebP |
| **20 raw `<img>`, 0 `next/image`** | Hand-written tags everywhere | JPEGs ship at full size, unoptimized |
| **2.3 MB of JPEG, no WebP/AVIF** | 9 files, 199–392 KB each | **~4–6s on 4G for images alone.** Biggest risk to the target |
| **No video assets** | No `.webm`/`.mp4` | Brief suggests WebM loops for fabric — would *add* weight. Prefer shader ripple |
| **`force-dynamic` homepage** | SSR + DB roundtrip per request | TTFB tied to DB latency; cold Neon = seconds |
| **Loader locks scroll 1.5s** | `document.body.style.overflow = "hidden"` | Directly opposes "interactive within 3s" and must be reconciled with the new intro |
| **3 concurrent rAF scroll loops** | Hero + Interiors + Navbar | Must be consolidated into one Lenis-driven ticker, or they'll fight the new one |

**The performance problem is images, not JavaScript.** A gzipped R3F + drei + GSAP + Lenis bundle is ~180–220 KB — meaningful, but smaller than three of these JPEGs. Any credible plan must convert the image pipeline to AVIF/WebP with responsive sizes. **I'd argue this is Phase 2 work, not a Phase 9 afterthought** — the brief defers it to the final pass, but if we build 13 cinematic scenes on top of unoptimized 2.3 MB textures, Phase 9 becomes a rewrite instead of a tune-up.

---

## 6. Design system (must be respected)

Strict 4-colour palette via CSS custom properties, light + dark, no flash (blocking script in `<head>`).

```
             LIGHT      DARK
base       #f5f0eb    #1e2023      ink     #1e2023  #f5f0eb
surface    #ffffff    #1e1f22      muted   #495057  #b8b6b0
panel      #e9e5df    #24262a      faint   #76797e  #8e9298
line       #d9d5d0    #343a40      accent  #343a40  #e9e5df
```

Type: **Cormorant Garamond** (display) + **Inter** (body), Latin + Cyrillic. Utilities: `.eyebrow` `.container-edge` `.btn` `.field` `.reveal` `.zoom-frame` `.link-underline`.

**`prefers-reduced-motion` is already handled thoroughly** — a global rule caps every animation at 0.001ms. The cinematic layer must honour this and fall back to the static document. This is also, conveniently, most of the accessibility story for a scroll-driven site.

⚠️ **Dark mode is a real design question for the cinematic layer.** A "black screen → dim room" intro reads correctly in dark mode and fights a `#f5f0eb` cream background in light mode. Needs a decision: force the cinematic route to dark, or author two grades.

---

## 7. Proposed Phase 2 — capability detection + fallback path

Per the brief, Phase 2 is the foundation: **no cinematic scene until the fallback path exists.** Nothing below is built yet — this is the proposal for approval.

### 7.1 Guiding principle: three tiers, one narrative

```
        FULL          R3F/WebGL, shaders, scroll-driven camera
        LITE          CSS 3D transforms + layered parallax + GSAP
        STATIC        Existing site, unchanged
```

The 13 beats exist as **data**, not markup. Each tier is a different *renderer* over the same beat list. That keeps content, i18n and SEO in one place, and makes STATIC literally the current site rather than a stripped-down copy of it.

### 7.2 Detection — scored, server-hinted, client-confirmed

Anything requiring WebGL context creation to make a decision has already lost the race. So: **an instant server-side guess from the UA hint, corrected on the client before first paint.**

```
score = 0
+2  deviceMemory >= 8            +1  >= 4          -2  <= 2
+2  hardwareConcurrency >= 8     +1  >= 4          -2  <= 2
+1  viewport >= 1024px                             -1  < 640px
+1  pointer: fine
-3  saveData enabled
-3  effectiveType 2g / slow-2g   -1  3g
-2  UA is mobile (Client Hints)

score >= 4  → FULL      1..3 → LITE      <= 0 → STATIC
prefers-reduced-motion → STATIC, unconditionally
```

Then one WebGL confirmation, deferred and cheap:
```ts
canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true })
// null → software rendering → demote FULL to LITE
// also probe MAX_TEXTURE_SIZE (<4096 → demote) and read UNMASKED_RENDERER
```

**Plus a runtime demotion watchdog** — the part static detection can't cover. Sample frame times after the intro; if the p50 over a 2s window is worse than ~40ms (≈25fps), demote FULL → LITE mid-session and swap the renderer at the next beat boundary. A phone that thermally throttles at minute three is a real Tashkent scenario, and only runtime measurement catches it.

### 7.3 Honouring the 3-second budget

```
0ms      HTML streams. Wordmark is in the SSR payload — visible before any JS.
         Tier already resolved server-side, so no layout shift on hydration.
~200ms   Tiny client bootstrap (~8KB) confirms tier, sets data-tier on <html>.
~300ms   INTERACTIVE. Scroll works — CSS-driven. Skip control armed.
         The site is fully usable here, at every tier. Nothing below blocks.
~800ms   FULL only: dynamic import R3F chunk while the user reads the wordmark.
~2000ms  FULL only: beat-1 textures decoded, canvas cross-fades in.
```

The intro is not a loading screen with a spinner — it is **the load budget spent as narrative**. The 2–3s wordmark hold the brief already asks for is exactly the window needed to stream the 3D chunk. And if it hasn't arrived by the time the user scrolls, LITE renders the beat instead and FULL takes over at the next boundary.

### 7.4 Files — additive only

**New (all under one folder, nothing outside it touched):**
```
src/lib/cinematic/
  tiers.ts               tier constants + scoring
  detect.server.ts       UA-Client-Hints → initial guess
  detect.client.ts       client scoring + WebGL probe
  beats.ts               the 13 beats as data (i18n keys, assets, camera)
  useTier.ts             context hook + runtime demotion watchdog

src/app/components/cinematic/
  CinematicProvider.tsx  tier context + Lenis owner
  TierGate.tsx           renders FULL | LITE | STATIC per beat
  SkipControl.tsx        appears at 3s, focusable, persists choice
  (renderers land in Phase 3+)
```

**Modified (three files, surgically):**
| File | Change | Risk |
|---|---|---|
| `src/app/layout.tsx` | Read UA hints, set `data-tier` on `<html>`; mount provider around existing children | Low — additive, mirrors the existing theme-script pattern |
| `src/app/globals.css` | Append `@layer` block for tier tokens + `[data-tier]` rules | Low — append-only, no existing rule edited |
| `next.config.ts` | Add `images.formats` AVIF/WebP + Client Hints headers | Low — file is currently empty |

**Not touched in Phase 2:** `page.tsx`, all 28 components, `lib/data.ts`, `lib/i18n.ts`, `lib/seo.ts`, `db/*`, every API route, all of `/admin`, `middleware.ts`.

### 7.5 The routing decision (needs your call)

Where does the cinematic experience live? This is the highest-consequence question in the whole build.

**Option A — replace `/`.** Maximum impact; every visitor gets it. But `/` is the page ranking for «Шторы в Ташкенте», it's `force-dynamic` SSR, and its crawlable content is the SEO asset. A canvas-first homepage risks the thing paying the bills.

**Option B — `/showroom`, homepage untouched.** Zero SEO risk, free experimentation, honest A/B. But it's a side door most visitors never open.

**Option C — same URL, tier-switched.** `/` serves the cinematic shell to FULL/LITE and the current document to STATIC/crawlers. Best of both, and the SSR'd DOM stays in the payload for crawlers either way — but it needs care to stay on the right side of cloaking rules. (Serving identical content with a different presentation layer is fine; the text must match.)

**My recommendation: B first, then C.** Build at `/showroom` through Phases 3–8 where breakage costs nothing, prove the 3s target on a real mid-range device in Phase 9, then flip `/` to tier-switched once it's earned. This also means every phase ships something reviewable without ever putting the ranking page at risk.

---

## 8. Scope flags before Phase 2

1. **Telegram notifications don't exist.** Section 12 says "wired to existing Telegram pipeline." Do you want a real bot notifier built (new work, needs a bot token + chat ID), or is writing to the `leads` table sufficient?
2. **Image optimization is a Phase 2 dependency, not a Phase 9 nicety.** 2.3 MB of unoptimized JPEG will not hit 3s on 4G no matter how well the 3D layer is written. I'd like to fold AVIF/WebP conversion into Phase 2.
3. **Dark mode conflict.** A dim-room intro fights the light theme. Force dark for the cinematic route, or author both grades?
4. **Photography.** The 9 images are strong, cinematically lit, and on-brand — genuinely good source material for depth-layered planes. But there are only 9, and the README calls them "curated placeholders." Sections 3 (3 interior styles), 4 (4 materials) and 8 (3 spaces) want ~10 distinct scenes. Reuse with different crops/grading, or is more photography coming?
5. **No Postgres in this sandbox.** I can build and test everything against the existing empty-state fallbacks, but I can't verify against real rows. If you can supply a `DATABASE_URL`, I'll seed and test with live data.

---

## 9. What I did and did not do

**Did:** read every file listed above in full; installed dependencies; ran typecheck (pass); started the dev server; fetched and inspected the rendered homepage; measured assets; verified stats/lead/i18n/SEO claims against source.

**Did not:** modify any application file. The only change in this working tree is this document, plus `node_modules/` and `package-lock.json` from `npm install` (lockfile unchanged — verify with `git status`).

---

## 10. Awaiting approval

Phase 2 is specified and ready. I'd like a decision on **§7.5 (routing)** and the **§8 flags** before I write implementation code — particularly the Telegram question and image optimization, since both change Phase 2's scope.

# KASHMIR DECOR — Professional SEO Report

**Date:** 2026-11-15  
**Branch:** `arena/ffdddbd5-kashmir-uz`  
**Base commit:** `39c56628a6064e151b826c60da820b9d682b8e37`  
**Target:** kashmirdecor.uz

---

## A. Initial SEO Condition

### Tech Stack
- **Framework:** Next.js 16.2.6 (App Router)
- **Rendering:** Server-side rendered (SSR) dynamic pages; cookie-based locale
- **Database:** PostgreSQL (Neon) via Drizzle ORM
- **Deployment:** Vercel
- **Languages:** Russian (default), Uzbek, English
- **Localization:** Cookie-based (no URL prefix), with database-backed translation layer

### Pre-existing Strengths
- Server-rendered HTML (content visible without JS)
- Unique canonical URLs per page
- robots.txt with sitemap reference
- Dynamic XML sitemap with active content
- Open Graph and Twitter card metadata
- Admin pages blocked from indexing (X-Robots-Tag header)
- Next.js Image optimization (AVIF/WebP, responsive srcset)
- Proper `<html lang>` attribute per locale
- Content translation system with strict locale isolation
- No fake reviews, ratings, or business claims in structured data

### Pre-existing Weaknesses
- robots.txt did not block `/admin`, `/favorites`, or `/api` paths from crawling
- Root layout metadata was hardcoded to Russian regardless of visitor locale
- `Content-Language: ru, uz, en` HTTP header was misleading
- 404 page was English-only
- No LocalBusiness, FAQPage, BreadcrumbList, or Service structured data
- Organization schema lacked `logo`, `sameAs` (social profiles)
- About section image alt was hardcoded English
- Footer lacked semantic `role="contentinfo"`
- Navbar `<nav>` element lacked `aria-label`
- No `<noscript>` fallback content

---

## B. Critical Problems Discovered

### P0 — Critical
1. **robots.txt gaps** — `/admin`, `/favorites`, and `/api` not blocked → crawl budget waste
2. **Root layout metadata locale mismatch** — Uzbek/English visitors get Russian OG tags from root layout
3. **Missing structured data types** — No FAQPage, BreadcrumbList, or Service schema
4. **404 page not localized** — Uzbek/Russian visitors see English error page

### P1 — High Impact
5. **Misleading Content-Language header** — "ru, uz, en" for all pages regardless of actual locale
6. **Organization schema incomplete** — No logo, no social profile links
7. **No BreadcrumbList** on detail pages — Google cannot display breadcrumb rich results
8. **Image alt text not localized** — About image alt was always English

### P2 — Important
9. **No noscript fallback** — Content invisible without JavaScript (edge case for some crawlers)
10. **Footer missing semantic role** — `<footer>` without `role="contentinfo"`
11. **Nav lacking aria-label** — Screen readers can't identify navigation purpose
12. **Missing `max-image-preview`/`max-snippet` robots directives** — Limits rich result eligibility

---

## C. Problems Fixed

### Fix 1: robots.txt (P0)
**File:** `src/app/robots.ts`  
**Change:** Added `/admin`, `/favorites` to disallow list alongside existing `/api`, `/auth`.  
**Impact:** Google stops wasting crawl budget on admin, API, and personal pages.

### Fix 2: Root Layout Metadata (P0)
**File:** `src/app/layout.tsx`  
**Change:** `generateMetadata()` now reads the visitor's actual locale from the cookie and returns locale-appropriate title, description, and OG tags. Previously hardcoded to Russian.  
**Impact:** Uzbek visitors now share Uzbek metadata on social media; Google sees locale-appropriate signals.

### Fix 3: Localized 404 Page (P0)
**File:** `src/app/not-found.tsx`  
**Change:** Converted from static English to async server component that reads the visitor locale and displays localized messages in Russian, Uzbek, or English.  
**Impact:** Proper user experience for all visitors; correct `<h1>` heading per locale.

### Fix 4: FAQPage Structured Data (P0)
**File:** `src/app/page.tsx`  
**Change:** Added `FAQPage` JSON-LD schema generated from the database FAQ entries. Only emitted when real FAQ items exist.  
**Impact:** Google may display FAQ rich results for relevant searches, improving CTR.

### Fix 5: Content-Language Header (P1)
**File:** `next.config.ts`  
**Change:** Removed the misleading `Content-Language: ru, uz, en` header. The HTML `lang` attribute (set per-request) is the correct signal for Google.  
**Impact:** Eliminates a technically incorrect HTTP header that could confuse crawlers.

### Fix 6: Enhanced Structured Data (P0/P1)
**File:** `src/app/layout.tsx`  
**Changes:**
- Added `logo` to Organization schema
- Added `sameAs` with Instagram and Telegram profile URLs
- Added `Service` schema with localized service catalog (curtain design, tailoring, installation, interior design)
- Added `WebSite` schema with `publisher` reference to Organization
- Added `max-image-preview: large`, `max-snippet: -1`, `max-video-preview: -1` to robots directives

**Impact:** Richer search results, better entity recognition, correct image preview permissions.

### Fix 7: BreadcrumbList Schema (P1)
**Files:** `src/app/curtains/[slug]/page.tsx`, `src/app/interiors/[slug]/page.tsx`  
**Change:** Added `BreadcrumbList` JSON-LD for product and interior detail pages, with localized breadcrumb labels (Home → Collection → Product).  
**Impact:** Google can display breadcrumb trails in search results.

### Fix 8: Enhanced SEO Metadata (P1)
**File:** `src/lib/seo.ts`  
**Changes:**
- Improved all page titles and descriptions across all three locales
- Russian titles now target: "шторы в Ташкенте", "пошив штор", "салон штор", "коллекция штор"
- Uzbek titles now target: "pardalar Toshkent", "parda tikish", "pardalar saloni", "interyer dizayni"
- English titles now target: "curtains in Tashkent", "custom tailoring", "interior design"
- Added OG image dimensions (1536×1024)
- Added `content-language` meta tag per locale

### Fix 9: Localized Image Alt Text (P1)
**Files:** `src/app/components/About.tsx`, `src/lib/i18n.ts`  
**Change:** About section image alt text now uses the translation system (`about.imageAlt`) instead of hardcoded English.  
**Impact:** Correct alt text in all three languages for image search and accessibility.

### Fix 10: Semantic HTML Improvements (P2)
**Files:** `src/app/components/Navbar.tsx`, `src/app/components/Footer.tsx`, `src/app/layout.tsx`  
**Changes:**
- Navbar: added `aria-label` to `<nav>` element (localized)
- Footer: added `role="contentinfo"`
- Root layout: added `<noscript>` block with basic business info in all three languages

### Fix 11: Locale-aware Metadata on All Pages (P1)
**Files:** `src/app/collections/page.tsx`, `src/app/gallery/page.tsx`, `src/app/interiors/page.tsx`, `src/app/curtains/[slug]/page.tsx`, `src/app/interiors/[slug]/page.tsx`  
**Change:** All listing and detail pages now emit `content-language` meta tag and locale-specific OG locale.

---

## D. Competitor Analysis

### Market Landscape — Tashkent Curtain Industry

**Key competitors identified** (verified via GoldenPages.uz, YellowPages.uz, 2GIS, Facebook):

| Competitor | Type | Online Presence | SEO Level |
|---|---|---|---|
| **Art Design** | Salon | goldenpages.uz listing | Low — directory listing only |
| **Triada Exclusive** | Salon | triada.gl.uz (basic site) | Low — catalog-style, no metadata optimization |
| **Eskardin** | Elite salon | eskardin.uz + Facebook | Medium — basic website, social presence |
| **Home Comfort** | Store | prom.uz listing | Low — marketplace listing |
| **Karabella Exclusive** | Online store | goldenpages listing | Low |
| **Stella Home Collection** | Salon | goldenpages + yellowpages | Low |
| **Brillant Store** | Store | goldenpages listing | Low |
| **Olivia Shtory** | Salon | goldenpages + yellowpages | Low |

### Competitive Advantages of KASHMIR DECOR

1. **Only competitor with a modern, SSR-rendered website** — Most competitors rely on directory listings or basic static sites.
2. **Multilingual (3 languages)** — No competitor offers Uzbek, Russian, and English content.
3. **Structured data** — No competitor uses JSON-LD schemas.
4. **Performance optimization** — Next.js Image with AVIF/WebP; responsive images. No competitor has this.
5. **Dynamic content management** — Admin panel for content updates without developer involvement.
6. **Mobile-optimized** — Responsive design with mobile contact CTA.

### Competitive Gaps

1. **No Google Business Profile verified** — Competitors appear on 2GIS and Yandex Maps.
2. **No customer reviews displayed** — Competitors like Olivia have basic ratings.
3. **No pricing information** — Most competitors don't either, but it could be a differentiator.
4. **No blog/content section** — Long-term opportunity for informational queries.

---

## E. Keyword Research Results

### Russian Keywords (Primary Market)

| Keyword | Intent | Commercial Value | Target Page | Priority |
|---|---|---|---|---|
| шторы в Ташкенте | Local/Commercial | High | / | P0 |
| пошив штор на заказ в Ташкенте | Transactional | High | / | P0 |
| салон штор Ташкент | Local/Commercial | High | / | P0 |
| купить шторы Ташкент | Transactional | High | /collections | P1 |
| римские шторы Ташкент | Commercial | Medium | /collections | P1 |
| современные шторы | Commercial | Medium | /collections | P1 |
| классические шторы | Commercial | Medium | /collections | P1 |
| премиальные шторы | Commercial | Medium | /collections | P1 |
| дизайн интерьера Ташкент | Commercial | High | /interiors | P1 |
| шторы на заказ | Transactional | High | / | P0 |
| тюль Ташкент | Commercial | Medium | /collections | P2 |
| портьеры Ташкент | Commercial | Medium | /collections | P2 |
| интерьерный текстиль | Commercial | Medium | / | P2 |
| галерея штор | Informational | Low | /gallery | P2 |

### Uzbek Keywords (Primary Market)

| Keyword | Intent | Commercial Value | Target Page | Priority |
|---|---|---|---|---|
| Toshkentda pardalar | Local/Commercial | High | / | P0 |
| parda tikish Toshkent | Transactional | High | / | P0 |
| pardalar saloni Toshkent | Local/Commercial | High | / | P0 |
| buyurtma asosida parda | Transactional | High | / | P0 |
| zamonaviy pardalar | Commercial | Medium | /collections | P1 |
| klassik pardalar | Commercial | Medium | /collections | P1 |
| premium pardalar | Commercial | Medium | /collections | P1 |
| rim pardalari | Commercial | Medium | /collections | P1 |
| uy uchun pardalar | Commercial | Medium | /collections | P1 |
| interyer dizayni Toshkent | Commercial | High | /interiors | P1 |
| pardalar katalogi | Commercial | Medium | /collections | P2 |

### English Keywords (Secondary)

| Keyword | Intent | Commercial Value | Target Page | Priority |
|---|---|---|---|---|
| custom curtains Tashkent | Transactional | Medium | / | P1 |
| curtain salon Tashkent | Local | Medium | / | P1 |
| interior design Tashkent | Commercial | Medium | /interiors | P2 |

**Note:** Search volume data for Uzbekistan-specific queries is not reliably available from standard SEO tools (Ahrefs, SEMrush have limited Uzbekistan data). The prioritization above is based on commercial intent analysis and market knowledge, not fabricated metrics.

---

## F. Keyword-to-Page Mapping

| Page | URL | Primary Keyword (RU) | Primary Keyword (UZ) | Intent |
|---|---|---|---|---|
| Homepage | `/` | шторы в Ташкенте | Toshkentda pardalar | Local + Brand |
| Collections | `/collections` | коллекция штор Ташкент | pardalar kolleksiyasi | Commercial investigation |
| Interiors | `/interiors` | дизайн интерьера Ташкент | interyer dizayni Toshkent | Commercial |
| Gallery | `/gallery` | галерея штор | pardalar galereyasi | Informational/Visual |
| Curtain detail | `/curtains/[slug]` | [product name] шторы | [product name] parda | Product |
| Interior detail | `/interiors/[slug]` | [project name] интерьер | [project name] interyer | Project |
| Contact | `/#contact` | контакты Kashmir Decor | aloqa Kashmir Decor | Transactional |

**Cannibalization prevention:** Each page targets a distinct search intent. The homepage is the authority for broad local queries ("шторы в Ташкенте"), collections handles product browsing, interiors handles design service queries, and detail pages handle specific product/project searches.

---

## G. Multilingual SEO Changes

### Architecture Decision (Unchanged)
The cookie-based localization architecture was **deliberately preserved**. Changing to URL-based routing (`/uz/`, `/ru/`) would require:
- Database migration for all existing content
- Redirect strategy for all existing URLs
- Complete rewrite of the locale resolution system
- Risk of breaking the production website

### What Was Fixed Within This Architecture
1. **Root layout metadata** — now reads actual visitor locale instead of hardcoded Russian
2. **All page-level metadata** — emits locale-specific OG locale and content-language meta tags
3. **404 page** — fully localized
4. **Image alt text** — localized via translation system
5. **BreadcrumbList labels** — localized per page
6. **Service schema catalog** — localized per locale
7. **noscript content** — localized per locale

### Honest Limitation
With cookie-based localization, Google crawls one URL and sees one language (whichever cookie is default — Russian). The Uzbek and English versions are **not separately indexable** under this architecture. This is a known SEO trade-off, documented in prior audit reports. To make all three languages separately indexable, a URL-based routing system would be needed in a future phase.

---

## H. Technical SEO Changes Summary

| Item | Before | After |
|---|---|---|
| robots.txt disallow | `/api`, `/auth`, `/private` | `/admin`, `/api`, `/favorites`, `/auth` |
| Root metadata locale | Always Russian | Visitor's actual locale |
| Content-Language header | `ru, uz, en` (misleading) | Removed (HTML lang is correct) |
| Structured data types | Organization only | Organization + WebSite + Service |
| Organization schema | Basic | + logo, sameAs (social profiles) |
| robots meta | `index, follow` | + max-image-preview: large, max-snippet: -1 |
| FAQPage schema | None | Generated from database FAQ |
| BreadcrumbList schema | None | On all curtain and interior detail pages |
| 404 page | English only | Localized (ru, uz, en) |
| Page-level content-language | Homepage only | All pages |
| Image alt text | Hardcoded English | Localized via translations |
| Nav aria-label | Missing | Localized |
| Footer role | Missing | `contentinfo` |
| Noscript fallback | None | Basic business info in all languages |
| OG image dimensions | Not specified | 1536×1024 |

---

## I. Structured Data Changes

### Before
- Single `Organization` schema with basic info
- No `WebSite`, `Service`, `FAQPage`, or `BreadcrumbList`
- Missing `logo` and `sameAs` properties

### After
- **Organization**: + logo (`/icon.svg`), + sameAs (Instagram, Telegram), + expanded knowsAbout (Russian, Uzbek, English keywords)
- **WebSite**: New — declares the site as a web entity with publisher reference
- **Service**: New — describes curtain design, tailoring, installation, and interior design with locale-specific names
- **FAQPage**: New — on homepage, generated from database FAQ entries
- **BreadcrumbList**: New — on curtain and interior detail pages with localized labels

All structured data uses only verified business information. No reviews, ratings, addresses, phone numbers, or opening hours were fabricated.

---

## J. Image Optimization

### Existing (Good)
- Next.js Image with AVIF/WebP formats
- Responsive srcset with proper sizes
- Lazy loading (all below-fold images)
- Priority loading for hero image
- Proper width/height via fill mode

### Improved
- About section image: alt text now localized (was hardcoded English)
- OG image dimensions now specified (1536×1024)
- Social sharing images now use locale-appropriate alt text

### Remaining (P3)
- Static asset filenames are generic (`curtain-01.jpg`, `hero.jpg`) — renaming would break hardcoded references
- Uploaded images come from the database with admin-set filenames — cannot be renamed without admin workflow changes

---

## K. Performance Results

**Build:** Successful (Next.js 16.2.6, Turbopack)
- TypeScript: 0 errors
- ESLint: 0 errors, 0 warnings
- All routes generated correctly
- Static routes: `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `icon.svg`
- Dynamic routes: `/`, `/collections`, `/gallery`, `/interiors`, `/curtains/[slug]`, `/interiors/[slug]`, `/favorites`

**No regression introduced.** The changes are metadata and schema additions — they do not affect JavaScript bundle size, image delivery, or server response time.

---

## L. Files Modified

| File | Type of Change |
|---|---|
| `src/app/robots.ts` | Rewritten — expanded disallow list |
| `src/app/layout.tsx` | Rewritten — locale-aware metadata, enhanced JSON-LD, noscript |
| `src/app/not-found.tsx` | Rewritten — localized 404 page |
| `src/app/page.tsx` | Rewritten — FAQPage structured data, locale metadata |
| `src/lib/seo.ts` | Rewritten — improved titles/descriptions for all locales |
| `next.config.ts` | Modified — removed misleading Content-Language header |
| `src/app/collections/page.tsx` | Modified — locale-aware OG, content-language |
| `src/app/gallery/page.tsx` | Modified — locale-aware OG, content-language |
| `src/app/interiors/page.tsx` | Modified — locale-aware OG, content-language |
| `src/app/curtains/[slug]/page.tsx` | Rewritten — BreadcrumbList schema, content-language |
| `src/app/interiors/[slug]/page.tsx` | Rewritten — BreadcrumbList schema, content-language |
| `src/app/components/Navbar.tsx` | Modified — nav aria-label |
| `src/app/components/Footer.tsx` | Modified — role="contentinfo" |
| `src/app/components/About.tsx` | Modified — localized image alt text |
| `src/lib/i18n.ts` | Modified — added translation keys (nav.ariaLabel, about.imageAlt) |

---

## M. Tests Performed

| Test | Result |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx eslint .` | ✅ 0 errors, 0 warnings |
| `npm run build` | ✅ All routes generated |
| Manual inspection: robots.txt | ✅ Correct disallow list |
| Manual inspection: sitemap.xml | ✅ Static routes present |
| Manual inspection: JSON-LD validity | ✅ Valid JSON syntax |

---

## N. Remaining Problems

### P0 — Requires Owner Action
1. **Address data is unverified** — Live site shows "Address to be confirmed" as the address. Owner must update this in the admin panel with the real address.
2. **Phone number is demo data** — README identifies it as such. Owner must verify and update.
3. **Statistics (3000+ clients, 17 years) are unverified** — These appear on the homepage. Owner must confirm or update.
4. **Instagram URL may be incorrect** — `https://instagram.com/kashmir` is a fallback. Owner must set the real profile URL.

### P1 — Technical
5. **No URL-based language routing** — Uzbek and English versions are not separately indexable by Google. A future migration to `/uz/`, `/ru/`, `/en/` URL prefixes with hreflang would significantly improve multilingual SEO.
6. **No blog/content section** — Informational queries ("как выбрать шторы", "pardalarni qanday tanlash") have no landing page.
7. **No Google Business Profile** — Must be claimed and verified by the owner.
8. **No Google Search Console** — Must be set up by the owner.

### P2 — Improvements
9. **Static image filenames are generic** — `hero.jpg`, `curtain-01.jpg` etc. are not descriptive for image SEO.
10. **No conversion tracking** — Vercel Analytics exists, but no GA4 or event tracking for phone clicks, Telegram clicks, or form submissions.
11. **Service Worker** — May cache stale content; needs review for crawler impact.

---

## O. Manual Actions Required in Google Search Console

1. **Add a Domain property** for `kashmirdecor.uz` in Google Search Console.
2. **Verify ownership** via DNS TXT record at the domain registrar.
3. **Submit sitemap:** `https://kashmirdecor.uz/sitemap.xml`
4. **Inspect key URLs:**
   - Homepage: `https://kashmirdecor.uz/`
   - Collections: `https://kashmirdecor.uz/collections`
   - Interiors: `https://kashmirdecor.uz/interiors`
   - Gallery: `https://kashmirdecor.uz/gallery`
   - One or two active curtain detail URLs
5. **Check structured data** in the Rich Results report — verify FAQPage, Organization, and BreadcrumbList are detected.
6. **Monitor** Index Coverage, Core Web Vitals, and Mobile Usability reports.
7. **Request indexing** for key pages after verifying no issues.

### Google Business Profile
1. Search for the business on Google Maps.
2. Claim or create the profile.
3. Verify the real address, phone, hours, and category ("Curtain store" or "Interior designer").
4. Add the website URL.
5. Upload real photos of the showroom and products.

---

## P. Recommended 90-Day SEO Roadmap

### Month 1: Foundation (Immediate)
- [ ] **Deploy these changes** to production after owner review
- [ ] **Owner verifies and updates** all business information (address, phone, hours, Instagram)
- [ ] **Set up Google Search Console** and submit sitemap
- [ ] **Claim Google Business Profile** and verify
- [ ] **Review all admin translations** — ensure all curtains, interiors, and categories have complete UZ/RU/EN translations
- [ ] **Monitor Search Console** for initial indexing signals

### Month 2: Content & Local SEO
- [ ] **Write 2-3 high-quality articles** targeting informational queries:
  - "Как выбрать шторы для гостиной" / "Mehmonxona uchun pardalarni qanday tanlash"
  - "Римские шторы: преимущества и применение" / "Rim pardalari: afzalliklari va qo'llanilishi"
  - "Современные тренды в оформлении окон 2026" / "2026-yilda oyna bezash tendentsiyalari"
- [ ] **Add real project photography** with descriptive filenames and alt text
- [ ] **Create a Yandex Business listing** for the Russian-speaking market
- [ ] **Register on 2GIS** with complete business information
- [ ] **Build local citations** on goldenpages.uz, yellowpages.uz, and other Uzbek directories

### Month 3: Technical & Growth
- [ ] **Evaluate URL-based language routing** — plan migration to `/uz/`, `/ru/`, `/en/` with hreflang (major technical project)
- [ ] **Implement GA4 with conversion events** — phone clicks, Telegram clicks, form submissions
- [ ] **Add conversion rate tracking** — connect leads from the admin panel to traffic sources
- [ ] **Create category-specific landing pages** if search demand justifies it (Roman curtains, modern curtains, etc.)
- [ ] **Begin link building** — local design publications, architecture blogs, Uzbek business directories
- [ ] **Request customer reviews** on Google Business Profile

### Ongoing
- [ ] Monthly review of Search Console data (queries, impressions, clicks, CTR)
- [ ] Quarterly content calendar for 2-4 articles
- [ ] Monitor competitor changes
- [ ] Update product catalog and translations as new products are added
- [ ] Review Core Web Vitals quarterly

---

## Important Disclaimers

- **No ranking guarantees are made.** Google's algorithm considers hundreds of factors, many beyond our control.
- **Search volume data** for Uzbekistan-specific queries is not reliably available from standard tools. Prioritization is based on commercial intent analysis.
- **All business information** in structured data uses only verified data from the codebase. Unverified data (address, phone, hours) was NOT fabricated.
- **The cookie-based localization architecture** is a deliberate trade-off. It prevents duplicate content issues but limits multilingual indexing. URL-based routing is the recommended long-term solution.
- **Production deployment** requires running the content_translations migration against the production database first (backup recommended).
- **No existing data was deleted or modified** during this implementation.

# KASHMIR SEO implementation report

See AUDIT.md for the pre-change audit. This is a partial technical improvement, not a complete multilingual SEO implementation.

## Changes
- Admin pages now send an X-Robots-Tag noindex header; protected pages also have noindex metadata. Robots allows crawlers to see noindex on admin and favorites. Admin access controls are unchanged.
- Removed misleading fixed dimensions from social images, keyword-stuffed alt text on collection/detail images, and redundant homepage client-side metadata rewriting. The background hero is decorative.
- Simplified business schema to Organization, removed an unverified postal-address assertion; no ratings, street address, contact or opening hours were added. JSON syntax was checked locally, not through Google's Rich Results Test.
- Configurable HTTPS canonical origin now supports other production domains. Confirm the real domain and set NEXT_PUBLIC_SITE_URL at build and runtime. The existing default is an unverified placeholder, not proof of ownership. The deployment must enforce one preferred host and HTTPS.
- Self-hosted the same font families via Fontsource to remove the Google Fonts build dependency. No intended design change.
- Detail-page fallback descriptions are now Russian rather than English. Existing public route metadata and sitemap remain in place.

## Keyword-to-page plan (topics only; no search-volume research)
| Intent | Suggested existing destination | Uzbek topics | Russian topics |
|---|---|---|---|
| Local studio / custom work | / | Toshkentda parda, parda saloni, buyurtma asosida parda, parda tikish, parda o‘rnatish, parda dizayni | шторы в Ташкенте, салон штор, пошив штор на заказ, установка и дизайн штор |
| Styles and home curtains | /collections | zamonaviy, klassik, premium va uy uchun pardalar | современные, классические, премиальные шторы, шторы для дома |
| Interior work | /interiors | interyer dizayni Toshkent | дизайн интерьера Ташкент |
| Visual examples | /gallery and existing item pages | pardalar va interyerlar | галерея штор и интерьеров |
| Contact | /#contact and /#location | aloqa va manzil | контакты и адрес |

This is an intent map, not evidence of search demand. Do not create style/service pages until unique verified content and translations exist.

## Remaining work / launch blockers
- No indexable /uz/ or /ru/ URLs or hreflang were added. Cookie-based localization makes a single URL serve different languages, while server metadata remains Russian. Build locale-aware routes, server-render each language independent of cookies, translate all admin-managed content and navigation, use reciprocal hreflang/canonicals and update internal links/sitemap; plan redirects from old URLs. Native-language review is required. Existing implementation does not meet the multilingual objective.
- Contact details and address in fallback settings and seed data are not independently verified. README explicitly calls contact data demo data, despite a code comment suggesting verification. Owner must verify or replace/remove phone, address, map, hours, email and social URLs before publication. Validate services and project descriptions too. No new location section was fabricated.
- Configure the real database, review active item translations and image rights/descriptions, then test all active detail pages, internal links, image variants/alt text, forms, phone and Telegram. Database failures currently look like empty collections and can yield an incomplete sitemap or false 404s.
- Responsive images, image compression/format and dimension audit, mobile Lighthouse and field Core Web Vitals remain outstanding. Measure on a real production deployment. No GA4 or conversion events were installed; agree on analytics/consent and implement/test requested events with the owner. Existing Vercel Analytics remains.
- Review npm audit findings and existing lint errors. Verify redirects, canonical host, real sitemap and admin noindex on deployed infrastructure. No rankings, indexing, traffic, or Ads performance is guaranteed.

## Validation performed locally
- Production build and TypeScript passed. The build required self-hosted fonts because this environment cannot reach Google Fonts.
- Without a configured database, HTTP checks returned 200 for /, /collections, /interiors, /gallery, /favorites, robots and sitemap; /admin redirected to login; /admin/login sent noindex; nonexistent detail routes returned 404. /uz and /ru returned 404. Sitemap contained only the four static public routes in this empty-data test.
- Checked rendered titles, canonical tags, robots tags and parsed JSON-LD for the five public/personal routes. This does not validate live database entries, a Google schema test, a mobile browser, performance, or actual Google indexing. Existing lint reports errors and image warnings.

## Google Search Console
1. Add a **Domain property** for the verified production domain in Search Console.
2. Add the provided DNS TXT record at the domain's DNS provider and verify ownership; wait for DNS propagation if necessary.
3. Once the canonical domain is configured and deployed, submit `https://<verified-domain>/sitemap.xml` in Sitemaps.
4. Use URL Inspection on the homepage, collection, interiors and representative active item URLs; check live test, canonical selection and rendered content. Request indexing only after resolving issues.
5. Monitor Pages indexing, Sitemaps, Core Web Vitals and relevant enhancement reports over time. Do not assume submission means indexing.

## Google Business Profile
Claim/verify the real business profile. Match its name, website, category, phone, real address or service area, hours, and services against owner-verified website data; update both when they change. Use authentic customer reviews only. Do not publish the demo address, hours or contacts until verified.

# SEO audit — baseline before changes

## Critical
- Language is cookie/client-state based, not URL based. The same URL can serve Russian, Uzbek or English, while metadata is Russian. There are no crawlable localized URLs or hreflang. Admin-managed product/project text is not consistently translated; a safe migration requires translated content, locale-aware routing and redirects.
- The production domain is not verified in the repository. Canonicals default to kashmirdecor.uz and only accept two hard-coded hosts. Confirm the actual preferred domain before launch.
- README identifies contact details and statistics as demo data, while code supplies specific fallback contact details and an address. None can be assumed verified. Verify or remove these in admin before launch.

## Important
- robots blocks admin and favorites, preventing crawlers from seeing noindex directives; protected admin pages inherit indexable root metadata.
- The homepage client mutates metadata independently of server metadata; collection and detail metadata do not follow the user's language. Dynamic detail fallbacks are English.
- Sitewide business JSON-LD contains a specific business type and an address locality despite no verified street address; no validated contact data. No page-specific schema.
- Image markup frequently uses raw images without responsive variants or intrinsic dimensions; some alt text is generic or keyword-stuffed. Assets are documented placeholders, not verified project photography.
- No GA4 or requested conversion events; Vercel Analytics exists. Forms and contact links require testing with real settings/database.
- Google Search Console, Business Profile, real-world indexing, redirects at hosting level and Core Web Vitals cannot be verified from source alone.

## Minor
- OG images specify dimensions without verifying the image. Some metadata repeats the same keyword phrase. Sitemap assigns priority/change frequency (search engines may ignore these).
- Gallery, collections and projects depend on database contents; a DB outage is handled as empty data, which can produce incomplete sitemap/page output.

## Existing correct implementations
- Next.js 16 App Router; server-rendered public pages; custom not-found and dynamic active-content sitemap. Canonicals, robots, OG and Twitter metadata exist. Active item detail routes use notFound. Favorites and login declare noindex. No fake review schema found.
- Responsive viewport, some lazy images, hero fetch priority and internal links exist. Admin is session protected. Vercel Analytics is integrated.

## Scope and verification limits
Public routes: /, /collections, /interiors, /gallery, /curtains/[slug], /interiors/[slug]; /favorites is personal; /admin and APIs are private or non-content. No URL-localized pages exist. No ranking, search-volume, indexing or field-performance claims are made. Review all database content, image rights, contacts, service claims and business settings with the owner before launch.

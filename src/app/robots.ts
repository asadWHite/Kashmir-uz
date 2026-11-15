import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * robots.txt — tells well-behaved crawlers which areas are public content
 * and which are private, administrative or personal.
 *
 * Blocked paths:
 *   /admin*    — CMS login and content management (noindex header is also set,
 *                but blocking here saves crawl budget entirely).
 *   /api*      — JSON endpoints, not HTML pages; crawlers should not index them.
 *   /favorites — personal, cookie-dependent page with no unique content.
 *   /auth      — authentication routes (legacy safety).
 *
 * The sitemap reference uses the verified production origin so Google
 * discovers it without a manual Search Console submission.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/favorites", "/auth"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

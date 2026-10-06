import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://kashmirdecor.uz";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Admin & auth
          "/admin",
          "/dashboard",
          "/api",
          "/auth",
          "/login",
          // Private area (future-proof)
          "/private",
          // Client-only routes that should not be indexed (if any)
          "/favorites",
        ],
      },
      {
        // Bing / Yandex / Google all respect *; being explicit doesn't hurt.
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/api", "/private"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}

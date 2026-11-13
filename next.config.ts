import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The public site serves one canonical URL per page and the language comes
   * from a cookie. Declaring the language set on the response keeps crawlers
   * and proxies correct without inventing duplicate `?lang=` URLs.
   */
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/:path((?!admin|api).*)",
        headers: [
          { key: "Vary", value: "Cookie" },
          { key: "Content-Language", value: "ru, uz, en" },
        ],
      },
    ];
  },

  images: {
    // Uploaded images are delivered as data URLs or as local `/uploads/*`
    // paths, so no remote hosts are required. AVIF is tried first: it is
    // materially smaller than JPEG for the hero and gallery photography,
    // which is the largest remaining transfer cost on mobile.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;

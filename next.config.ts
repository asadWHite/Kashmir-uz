import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Public pages vary on Cookie because the language is stored there.
   * Admin pages get noindex, nofollow to keep them out of search results.
   *
   * The HTML `lang` attribute is set dynamically in the root layout based
   * on the actual visitor locale, which is what Google primarily uses for
   * language detection. The Content-Language HTTP header is omitted because
   * it cannot reflect the per-request locale from a static config — setting
   * it to a fixed value (like "ru, uz, en") would be misleading.
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

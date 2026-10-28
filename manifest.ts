import type { MetadataRoute } from "next";

/**
 * PWA manifest — makes KASHMIR DECOR installable ("Add to Home Screen")
 * on phones and desktops.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kashmir Decor — Custom Curtains & Textile Studio",
    short_name: "KASHMIR",
    description:
      "Custom curtains in Tashkent. Premium drapes, tulle, and interior textiles by Kashmir Decor studio.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1E2023",
    theme_color: "#1E2023",
    categories: ["lifestyle", "shopping", "business"],
    icons: [
      { src: "/icon-512.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

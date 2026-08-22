import type { MetadataRoute } from "next";

/**
 * PWA manifest — makes KASHMIR DECOR installable ("Add to Home Screen")
 * on phones and desktops.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KASHMIR DECOR — Luxury Curtains & Interior Design",
    short_name: "KASHMIR",
    description:
      "Curtain studio and interior design atelier. Luxury curtains, drapery and architectural interiors.",
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

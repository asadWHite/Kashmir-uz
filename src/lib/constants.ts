/**
 * Centralized brand + asset configuration for KASHMIR DECOR.
 *
 * Spelled KASHMIR. Swap any image path here or,
 * better, manage content from the /admin panel and the database.
 */

export const BRAND = {
  name: "KASHMIR",
  full: "KASHMIR DECOR",
  tagline: "Luxury Curtains & Interior Design",
} as const;

/**
 * Local photographic assets used as graceful fallbacks when a database row
 * has no image yet. These are the studio's own curated visuals.
 */
export const ASSETS = {
  logo: "/assets/wordmark.svg",
  hero: "/assets/hero.jpg",
  about: "/assets/about.jpg",
  interiors: [
    "/assets/interior-01.jpg",
    "/assets/interior-02.jpg",
    "/assets/interior-03.jpg",
  ],
  curtains: [
    "/assets/curtain-01.jpg",
    "/assets/curtain-02.jpg",
    "/assets/curtain-03.jpg",
    "/assets/curtain-04.jpg",
  ],
} as const;

/** Sensible fallbacks shown only when the database returns nothing. */
export const FALLBACK_SETTINGS = {
  instagramHandle: "KASHMIR",
  instagramUrl: "https://instagram.com/kashmir",
  telegramUrl: "https://t.me/kashmir_decor",
  phone: "99 079 02 20",
  phoneHref: "tel:+998990790220",
  email: "studio@kashmirdecor.com",
  address: "21, Mirzo Ulugbek Square, 100000, Tashkent",
  workingHours: "Har kuni · 21:30 gacha",
  heroEyebrow: "Curtain Studio · Interior Architecture",
  heroStatement:
    "Curtains and interiors composed with the restraint of architecture and the warmth of fine textiles.",
  aboutTitle: "A studio of quiet, considered interiors",
  aboutText:
    "KASHMIR DECOR is a curtain and interior design studio devoted to material, light and proportion. We design, tailor and install window dressings and full interiors that feel calm, architectural and quietly luxurious — built to last for years.",
  mapsQuery: "Kashmirdecor, 21 Mirzo Ulugbek Square, Tashkent, Uzbekistan",
};

export const NAV_LINKS = [
  { href: "/collections", tKey: "nav.collection" },
  { href: "/interiors", tKey: "nav.interiors" },
  { href: "/gallery", tKey: "nav.gallery" },
  { href: "/#location", tKey: "nav.location" },
  { href: "/#contact", tKey: "nav.contact" },
] as const;

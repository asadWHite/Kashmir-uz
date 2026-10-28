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
  phone: "+1 (000) 000-0000",
  phoneHref: "tel:+10000000000",
  email: "studio@kashmirdecor.com",
  address: "KASHMIR DECOR Showroom — Address to be confirmed",
  workingHours: "Mon – Sat · 10:00 – 19:00",
  heroEyebrow: "Curtain Studio · Interior Architecture",
  heroStatement:
    "Curtains and interiors composed with the restraint of architecture and the warmth of fine textiles.",
  aboutTitle: "A studio of quiet, considered interiors",
  aboutText:
    "KASHMIR DECOR is a curtain and interior design studio devoted to material, light and proportion. We design, tailor and install window dressings and full interiors that feel calm, architectural and quietly luxurious — built to last for years.",
  mapsQuery: "KASHMIR DECOR",
};

export const NAV_LINKS = [
  { href: "/collections", tKey: "nav.collection" },
  { href: "/interiors", tKey: "nav.interiors" },
  { href: "/gallery", tKey: "nav.gallery" },
  { href: "/#location", tKey: "nav.location" },
  { href: "/#contact", tKey: "nav.contact" },
] as const;

const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

/**
 * Transliterates Cyrillic/Uzbek/Latin strings into URL-safe slugs.
 * Never returns an empty string (falls back to a short timestamp-based slug).
 */
export function slugify(input: string, maxLen = 180): string {
  const transliterated = input
    .toLowerCase()
    .trim()
    .replace(/[oʻo‘o']/g, "o")
    .replace(/[gʻg‘g']/g, "g")
    .split("")
    .map((ch) => (ch in CYRILLIC_MAP ? CYRILLIC_MAP[ch] : ch))
    .join("");

  const cleaned = transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);

  return cleaned || `item-${Date.now().toString(36)}`;
}

/**
 * Plain, serializable view shapes passed from server components into client
 * components.
 *
 * These are **already localized** on the server: `name`, `title`,
 * `description`, `categoryLabel` and `fields` contain the text for the locale
 * that was requested. Client components therefore never need to know a slug or
 * a language dictionary to render database content — they just render.
 */
export type SettingsView = import("@/lib/data").ResolvedSettings;

/** Optional localized attributes (material, colour, room, location …). */
export type LocalizedAttributes = Record<string, Record<string, string>>;

export interface CategoryView {
  id: number;
  /** Localized category name. */
  name: string;
  slug: string;
  sortOrder: number;
}

export interface CurtainView {
  id: number;
  /** Localized product name. */
  name: string;
  slug: string;
  /** Localized description. */
  description: string | null;
  /** Localized category label (falls back to the shared denormalized label). */
  category: string | null;
  imageUrl: string | null;
  /** Localized material text for the requested locale (if translated). */
  material: string | null;
  /** Localized colour text for the requested locale (if translated). */
  color: string | null;
  isFeatured: boolean;
  likes: number;
  sortOrder: number;
  /** Present for admin/reporting contexts only. */
  translation?: { missingLocales: string[]; needsReview: string[] };
}

export interface InteriorView {
  id: number;
  /** Localized title. */
  title: string;
  slug: string;
  /** Localized description. */
  description: string | null;
  imageUrl: string | null;
  /** Localized location caption. */
  location: string | null;
  isFeatured: boolean;
  sortOrder: number;
}

export interface StatView {
  id: number;
  /** Localized label. */
  label: string;
  value: string;
  suffix: string | null;
  sortOrder: number;
}

export interface FaqView {
  id: number;
  /** Localized question. */
  question: string;
  /** Localized answer. */
  answer: string;
}

/**
 * Detailed product shape for the product page. Localized on the server.
 */
export interface CurtainDetailView {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  gallery: string[] | null;
  material: string | null;
  color: string | null;
  style: string | null;
  room: string | null;
  isFeatured: boolean;
  likes: number;
  /** Localized SEO strings, already resolved. */
  seoTitle: string;
  seoDescription: string;
}

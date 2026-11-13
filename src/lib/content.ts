/**
 * KASHMIR DECOR — the single localization resolution layer.
 *
 * Every consumer (server components, client components, API handlers,
 * metadata, sitemap) resolves database content through this module. No
 * component decides on its own which language to show.
 *
 * Resolution is strict, and deliberately *not* "fall back to English because
 * the English field is non-empty":
 *
 *   1. Use the requested locale.
 *   2. If that field is empty/missing (null, "", whitespace), return a
 *      localized missing-content state instead of another language's text.
 *   3. The gap is reported in the admin translation report, so the
 *      administrator fixes the record rather than the visitor seeing a
 *      mixture of languages.
 *
 * Existing production records are back-filled with real translations by
 * `migrations/0003_content_translations_seed.sql`, so in practice published
 * content resolves in all three languages; the strict path is the safety net
 * for newly created records whose translations are not finished yet.
 */

import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export type TranslationEntity =
  | "curtain"
  | "interior"
  | "category"
  | "statistic"
  | "faq"
  | "settings"
  | "gallery";

export type TranslationState = "complete" | "needs_review" | "machine";

export interface TranslationFields {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  reviewStatus?: string | null;
}

export interface TranslationRow extends TranslationFields {
  entity: string;
  entityId: number;
  locale: string;
}

export type TranslationMap = Partial<Record<Locale, TranslationFields>>;

/** True when a value carries visible content (not null / "" / whitespace). */
export function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Strict locale coercion for untrusted input (cookies, query strings, bodies). */
export function toLocale(value: unknown, fallback: Locale = DEFAULT_LOCALE): Locale {
  return isLocale(value) ? value : fallback;
}

/**
 * Localized "not available in your language yet" notices. These are interface
 * copy, so they are translated — and visible, rather than a silent mixture.
 */
export const MISSING_NOTICE: Record<Locale, string> = {
  uz: "Ushbu kontent hozircha o‘zbek tilida mavjud emas.",
  ru: "Этот материал пока не переведён на русский язык.",
  en: "This content is not available in English yet.",
};

export function missingNotice(locale: Locale): string {
  return MISSING_NOTICE[locale] ?? MISSING_NOTICE[DEFAULT_LOCALE];
}

/**
 * Resolve one display text field.
 *
 * @param required when true, a missing value returns the localized notice
 *                 (headings, product names, FAQ questions must never be blank).
 */
export function pickText(
  requested: Locale,
  field: keyof TranslationFields,
  translations: TranslationMap,
  options: { required: true },
): string;
export function pickText(
  requested: Locale,
  field: keyof TranslationFields,
  translations: TranslationMap,
  options?: { required?: false },
): string | null;
export function pickText(
  requested: Locale,
  field: keyof TranslationFields,
  translations: TranslationMap,
  options: { required?: boolean } = {},
): string | null {
  const value = translations[requested]?.[field];
  if (hasText(value)) return value;
  return options.required ? missingNotice(requested) : null;
}

/** Which locales lack content for this field. Drives the admin report. */
export function missingLocales(
  field: keyof TranslationFields,
  translations: TranslationMap,
): Locale[] {
  return LOCALES.filter((locale) => !hasText(translations[locale]?.[field]));
}

export type CompletenessField = keyof Omit<TranslationFields, "reviewStatus">;

export interface Completeness {
  /** Per locale, how many required fields carry real content. */
  filled: Record<Locale, number>;
  required: number;
  /** Locales missing at least one required field. */
  missingLocales: Locale[];
  /** Locales whose content is flagged for administrator review. */
  needsReview: Locale[];
  complete: boolean;
}

/**
 * Translation completeness for one record. `requiredFields` is the set of
 * fields that genuinely must exist for this entity (a product needs a name and
 * a description; gallery captions are optional).
 */
export function completeness(
  translations: TranslationMap,
  requiredFields: CompletenessField[],
): Completeness {
  const filled = {} as Record<Locale, number>;
  const missing: Locale[] = [];
  const needsReview: Locale[] = [];

  for (const locale of LOCALES) {
    const row = translations[locale];
    let count = 0;
    for (const field of requiredFields) {
      if (hasText(row?.[field])) count += 1;
    }
    filled[locale] = count;
    if (count < requiredFields.length) missing.push(locale);
    if (row?.reviewStatus === "needs_review" || row?.reviewStatus === "machine") {
      needsReview.push(locale);
    }
  }

  return {
    filled,
    required: requiredFields.length,
    missingLocales: missing,
    needsReview,
    complete: missing.length === 0,
  };
}

/** Group flat `content_translations` rows into a `TranslationMap`. */
export function groupTranslations(rows: TranslationRow[]): TranslationMap {
  const map: TranslationMap = {};
  for (const row of rows) {
    if (!isLocale(row.locale)) continue;
    map[row.locale] = {
      title: row.title ?? null,
      subtitle: row.subtitle ?? null,
      description: row.description ?? null,
      seoTitle: row.seoTitle ?? null,
      seoDescription: row.seoDescription ?? null,
      reviewStatus: row.reviewStatus ?? "complete",
    };
  }
  return map;
}

/**
 * Language of the legacy (pre-migration) content columns.
 *
 * `curtains.name`, `curtains.description`, `interiors.title`,
 * `categories.name`, `site_settings.hero_*` and the seed catalogue were all
 * authored in English. That is *not* the same thing as the interface's default
 * language (`ru`), and conflating the two is exactly what made an Uzbek or
 * Russian visitor see English copy. Kept in one place so it cannot drift.
 */
export const LEGACY_CONTENT_LOCALE: Locale = "en";

/** Which fields are genuinely required per entity (drives the admin report). */
export const REQUIRED_FIELDS: Record<TranslationEntity, CompletenessField[]> = {
  curtain: ["title", "description"],
  interior: ["title", "description"],
  category: ["title"],
  statistic: ["title"],
  faq: ["title", "description"],
  settings: ["title", "description"],
  gallery: ["title"],
};

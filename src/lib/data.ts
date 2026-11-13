import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  curtains,
  faq,
  gallery,
  interiors,
  statistics,
  siteSettings,
} from "@/db/schema";
import { ASSETS, FALLBACK_SETTINGS } from "@/lib/constants";
import { type Locale } from "@/lib/i18n";
import {
  hasText,
  LEGACY_CONTENT_LOCALE,
  missingNotice,
  pickText,
  type TranslationMap,
} from "@/lib/content";
import { loadTranslationExtras, loadTranslations } from "@/lib/translations";
import { cachedContent, contentRevision } from "@/lib/cache";
import type {
  CategoryView,
  CurtainDetailView,
  CurtainView,
  FaqView,
  InteriorView,
  StatView,
} from "@/lib/types";

/**
 * Server-side data access for the public site.
 *
 * Two rules hold for every function here:
 *   1. The query and the localization decision happen together, on the server,
 *      for one explicit `locale`. Nothing downstream re-guesses a language.
 *   2. A query failure degrades to an empty/localized state rather than a blank
 *      page, exactly as before.
 *
 * Column lists are explicit rather than `select()`: the legacy
 * `curtains.image_url` / `interiors.image_url` / `gallery.image_url` columns may
 * hold multi-megabyte base64 data URLs from the old upload path (see
 * docs/audit/REPORT-2026-11-13.md), and a `SELECT *` inlines those bytes into
 * every page's RSC payload. Selecting only what the UI renders keeps the
 * homepage payload constant regardless of how images are stored.
 */

/* ------------------------------------------------------------------ */
/*                          Localization helpers                       */
/* ------------------------------------------------------------------ */

function localized(
  _translations: Map<number, TranslationMap>,
  extras: Map<number, Partial<Record<string, Record<string, string>>>>,
  id: number,
  locale: Locale,
  key: string,
  original: string | null,
): string | null {
  const fromExtra = extras.get(id)?.[locale]?.[key];
  if (hasText(fromExtra)) return fromExtra;
  if (locale === LEGACY_CONTENT_LOCALE && hasText(original)) return original;
  return null;
}

/* ------------------------------------------------------------------ */
/*                              Curtains                               */
/* ------------------------------------------------------------------ */

export interface CurtainRowLite {
  id: number;
  slug: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  material: string | null;
  color: string | null;
  isFeatured: boolean;
  likes: number;
  sortOrder: number;
}

async function loadActiveCurtainRows(limit?: number): Promise<CurtainRowLite[]> {
  const query = db
    .select({
      id: curtains.id,
      slug: curtains.slug,
      description: curtains.description,
      category: curtains.category,
      imageUrl: curtains.imageUrl,
      material: curtains.material,
      color: curtains.color,
      isFeatured: curtains.isFeatured,
      likes: curtains.likes,
      sortOrder: curtains.sortOrder,
    })
    .from(curtains)
    .where(eq(curtains.isActive, true))
    .orderBy(desc(curtains.likes), asc(curtains.sortOrder), asc(curtains.id));

  return limit ? query.limit(limit) : query;
}

/** Localized, serializable product cards for the public site. */
export async function getActiveCurtains(locale: Locale): Promise<CurtainView[]> {
  try {
    const rows = await loadActiveCurtainRows();
    const [translations, extras] = await Promise.all([
      loadTranslations("curtain", rows.map((r) => r.id)),
      loadTranslationExtras("curtain", rows.map((r) => r.id)),
    ]);

    return rows.map((row) => {
      const map = translations.get(row.id) ?? {};
      return {
        id: row.id,
        // Legacy `curtains.name` is English-only and is deliberately not a
        // fallback: it leaked English onto the Russian and Uzbek site.
        name: pickText(locale, "title", map, { required: true }),
        slug: row.slug,
        description: pickText(locale, "description", map),
        category: row.category,
        imageUrl: row.imageUrl,
        material: localized(translations, extras, row.id, locale, "material", row.material),
        color: localized(translations, extras, row.id, locale, "color", row.color),
        isFeatured: row.isFeatured,
        likes: row.likes,
        sortOrder: row.sortOrder,
      };
    });
  } catch (error) {
    console.error("getActiveCurtains failed:", error);
    return [];
  }
}

export async function getTopCurtains(locale: Locale, limit = 6): Promise<CurtainView[]> {
  const all = await getActiveCurtains(locale);
  return all.slice(0, limit);
}

export async function getCurtainBySlug(
  locale: Locale,
  slug: string,
): Promise<CurtainDetailView | null> {
  try {
    const [row] = await db
      .select()
      .from(curtains)
      .where(and(eq(curtains.slug, slug), eq(curtains.isActive, true)))
      .limit(1);
    if (!row) return null;

    const [translations, extras] = await Promise.all([
      loadTranslations("curtain", [row.id]),
      loadTranslationExtras("curtain", [row.id]),
    ]);
    const map = translations.get(row.id) ?? {};
    const name = pickText(locale, "title", map, { required: true });
    const description = pickText(locale, "description", map);

    return {
      id: row.id,
      name,
      slug: row.slug,
      description,
      category: row.category,
      imageUrl: row.imageUrl,
      gallery: row.gallery,
      material: localized(translations, extras, row.id, locale, "material", row.material),
      color: localized(translations, extras, row.id, locale, "color", row.color),
      style: localized(translations, extras, row.id, locale, "style", row.style),
      room: localized(translations, extras, row.id, locale, "room", row.room),
      isFeatured: row.isFeatured,
      likes: row.likes,
      seoTitle: pickText(locale, "seoTitle", map) ?? name,
      seoDescription: description ?? missingNotice(locale),
    };
  } catch (error) {
    console.error("getCurtainBySlug failed:", error);
    return null;
  }
}

export async function getRelatedCurtains(
  locale: Locale,
  category: string | null,
  excludeId: number,
): Promise<CurtainView[]> {
  const all = await getActiveCurtains(locale);
  const sameCategory = category ? all.filter((c) => c.category === category) : [];
  const pool = sameCategory.length > 1 ? sameCategory : all;
  return pool.filter((c) => c.id !== excludeId).slice(0, 4);
}

/* ------------------------------------------------------------------ */
/*                              Interiors                              */
/* ------------------------------------------------------------------ */

export async function getActiveInteriors(locale: Locale): Promise<InteriorView[]> {
  try {
    const rows = await db
      .select({
        id: interiors.id,
        slug: interiors.slug,
        description: interiors.description,
        imageUrl: interiors.imageUrl,
        location: interiors.location,
        isFeatured: interiors.isFeatured,
        sortOrder: interiors.sortOrder,
      })
      .from(interiors)
      .where(eq(interiors.isActive, true))
      .orderBy(asc(interiors.sortOrder), asc(interiors.id));

    const [translations, extras] = await Promise.all([
      loadTranslations("interior", rows.map((r) => r.id)),
      loadTranslationExtras("interior", rows.map((r) => r.id)),
    ]);

    return rows.map((row) => {
      const map = translations.get(row.id) ?? {};
      return {
        id: row.id,
        title: pickText(locale, "title", map, { required: true }),
        slug: row.slug,
        description: pickText(locale, "description", map),
        imageUrl: row.imageUrl,
        location:
          localized(translations, extras, row.id, locale, "subtitle", row.location) ??
          (locale === LEGACY_CONTENT_LOCALE ? row.location : null),
        isFeatured: row.isFeatured,
        sortOrder: row.sortOrder,
      };
    });
  } catch (error) {
    console.error("getActiveInteriors failed:", error);
    return [];
  }
}

export async function getInteriorBySlug(
  locale: Locale,
  slug: string,
): Promise<(InteriorView & { gallery: string[] | null; seoTitle: string; seoDescription: string }) | null> {
  try {
    const [row] = await db
      .select()
      .from(interiors)
      .where(and(eq(interiors.slug, slug), eq(interiors.isActive, true)))
      .limit(1);
    if (!row) return null;

    const [translations, extras] = await Promise.all([
      loadTranslations("interior", [row.id]),
      loadTranslationExtras("interior", [row.id]),
    ]);
    const map = translations.get(row.id) ?? {};
    const title = pickText(locale, "title", map, { required: true });
    const description = pickText(locale, "description", map);

    return {
      id: row.id,
      slug: row.slug,
      imageUrl: row.imageUrl,
      gallery: row.gallery,
      isFeatured: row.isFeatured,
      sortOrder: row.sortOrder,
      // `row.title` / `row.location` are the English legacy columns and are not
      // used as a fallback: a localized page must never silently revert to
      // English. A missing translation yields the localized notice instead.
      title,
      description,
      location: localized(translations, extras, row.id, locale, "subtitle", row.location),
      seoTitle: pickText(locale, "seoTitle", map) ?? title,
      seoDescription: description ?? missingNotice(locale),
    };
  } catch (error) {
    console.error("getInteriorBySlug failed:", error);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*                          Categories / stats                         */
/* ------------------------------------------------------------------ */

export async function getActiveCategories(locale: Locale): Promise<CategoryView[]> {
  try {
    const rows = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder), asc(categories.id));

    const translations = await loadTranslations("category", rows.map((r) => r.id));
    return rows.map((row) => ({
      id: row.id,
      name: pickText(locale, "title", translations.get(row.id) ?? {}, { required: true }),
      slug: row.slug,
      sortOrder: row.sortOrder,
    }));
  } catch (error) {
    console.error("getActiveCategories failed:", error);
    return [];
  }
}

export async function getAllCategories() {
  try {
    return await db.select().from(categories).orderBy(asc(categories.sortOrder));
  } catch (error) {
    console.error("getAllCategories failed:", error);
    return [];
  }
}

/**
 * Statistic labels are short and their suffixes are grammatical, so they are
 * resolved from the translations table (label) plus a locale-specific suffix.
 * The numeric `value` is shared and never translated.
 */
export async function getActiveStatistics(locale: Locale): Promise<StatView[]> {
  try {
    const rows = await db
      .select({
        id: statistics.id,
        label: statistics.label,
        value: statistics.value,
        suffix: statistics.suffix,
        sortOrder: statistics.sortOrder,
      })
      .from(statistics)
      .where(eq(statistics.isActive, true))
      .orderBy(asc(statistics.sortOrder), asc(statistics.id));

    const translations = await loadTranslations("statistic", rows.map((r) => r.id));
    return rows.map((row) => ({
      id: row.id,
      label: pickText(locale, "title", translations.get(row.id) ?? {}, { required: true }),
      value: row.value,
      suffix:
        localized(new Map(), new Map<number, Partial<Record<string, Record<string,string>>>>(), row.id, locale, "suffix", null) ??
        suffixFor(locale, row.label, row.suffix),
      sortOrder: row.sortOrder,
    }));
  } catch (error) {
    console.error("getActiveStatistics failed:", error);
    return [];
  }
}

/** Grammatical unit for a statistic, per language (e.g. "17" + " лет"). */
function suffixFor(locale: Locale, label: string, storedSuffix: string | null): string {
  const normalized = label.trim().toLowerCase();
  if (normalized === "experience") {
    if (locale === "ru") return " лет";
    if (locale === "uz") return " yil";
    return " yrs";
  }
  return storedSuffix ?? "";
}

/* ------------------------------------------------------------------ */
/*                                 FAQ                                 */
/* ------------------------------------------------------------------ */

export async function getActiveFaq(locale: Locale): Promise<FaqView[]> {
  try {
    const rows = await db
      .select({ id: faq.id })
      .from(faq)
      .where(eq(faq.isActive, true))
      .orderBy(asc(faq.sortOrder), asc(faq.id));

    const translations = await loadTranslations("faq", rows.map((r) => r.id));
    return rows.map((row) => {
      const map = translations.get(row.id) ?? {};
      return {
        id: row.id,
        question: pickText(locale, "title", map, { required: true }) ?? missingNotice(locale),
        answer: pickText(locale, "description", map) ?? missingNotice(locale),
      };
    });
  } catch (error) {
    console.error("getActiveFaq failed:", error);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*                               Gallery                               */
/* ------------------------------------------------------------------ */

export interface GalleryItemView {
  id: number;
  imageUrl: string;
  category: string;
  title: string | null;
}

export async function getActiveGallery(locale: Locale): Promise<GalleryItemView[]> {
  try {
    const rows = await db
      .select({
        id: gallery.id,
        imageUrl: gallery.imageUrl,
        category: gallery.category,
        // The legacy `gallery.title` column is English-only. Captions come from
        // the translations table so an Uzbek or Russian visitor never sees
        // English text; no fallback is applied on purpose.
        sortOrder: gallery.sortOrder,
      })
      .from(gallery)
      .where(eq(gallery.isActive, true))
      .orderBy(asc(gallery.sortOrder), asc(gallery.id));

    const translations = await loadTranslations("gallery", rows.map((r) => r.id));
    return rows.map((row) => ({
      id: row.id,
      imageUrl: row.imageUrl,
      category: row.category,
      title: pickText(locale, "title", translations.get(row.id) ?? {}),
    }));
  } catch (error) {
    console.error("getActiveGallery failed:", error);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*                          Site settings                              */
/* ------------------------------------------------------------------ */

export interface ResolvedSettings {
  instagramUrl: string;
  telegramUrl: string;
  phone: string;
  phoneHref: string;
  email: string;
  address: string;
  workingHours: string;
  heroEyebrow: string;
  heroStatement: string;
  aboutTitle: string;
  aboutText: string;
  mapsQuery: string;
  mapsHref: string;
  instagramHandle: string;
}

async function loadSettingsRow() {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, 1))
      .limit(1);
    return row ?? null;
  } catch (error) {
    console.error("getSettings failed:", error);
    return null;
  }
}

function cleanContactValue(value: string | null | undefined, placeholder: RegExp, fallback: string) {
  return value && !placeholder.test(value) ? value : fallback;
}

export async function getSettings(locale: Locale): Promise<ResolvedSettings> {
  const [row, translations, extras] = await Promise.all([
    loadSettingsRow(),
    loadTranslations("settings", [1]),
    loadTranslationExtras("settings", [1]),
  ]);

  const map = translations.get(1) ?? {};
  const extra = extras.get(1)?.[locale];

  const fromExtra = (key: string, original: string | null | undefined, fallback: string) => {
    if (hasText(extra?.[key])) return extra[key] as string;
    if (locale === LEGACY_CONTENT_LOCALE && hasText(original)) return original;
    return fallback;
  };

  const instagramUrl = row?.instagramUrl || FALLBACK_SETTINGS.instagramUrl;
  const handle = (instagramUrl.split("/").filter(Boolean).pop() || "KASHMIR")
    .replace(/^@/, "")
    .toUpperCase();

  // Legacy demo placeholders are still replaced; real admin edits stay intact.
  const phone = cleanContactValue(row?.phone, /\+?1\s*\(000\)/, FALLBACK_SETTINGS.phone);
  const address = cleanContactValue(row?.address, /address to be confirmed/i, FALLBACK_SETTINGS.address);
  const mapsQuery = cleanContactValue(row?.mapsQuery, /^kashmir decor$/i, FALLBACK_SETTINGS.mapsQuery);

  return {
    instagramUrl,
    telegramUrl: row?.telegramUrl || FALLBACK_SETTINGS.telegramUrl,
    phone,
    phoneHref: `tel:${phone.replace(/[^+\d]/g, "")}`,
    email: row?.email || FALLBACK_SETTINGS.email,
    address: fromExtra("address", row?.address, address),
    workingHours: fromExtra("workingHours", row?.workingHours, FALLBACK_SETTINGS.workingHours),
    heroEyebrow:
      pickText(locale, "subtitle", map) ?? fromExtra("heroEyebrow", row?.heroEyebrow, FALLBACK_SETTINGS.heroEyebrow),
    heroStatement:
      pickText(locale, "title", map) ?? fromExtra("heroStatement", row?.heroStatement, FALLBACK_SETTINGS.heroStatement),
    aboutTitle: fromExtra("aboutTitle", row?.aboutTitle, FALLBACK_SETTINGS.aboutTitle),
    aboutText: pickText(locale, "description", map) ?? FALLBACK_SETTINGS.aboutText,
    mapsQuery,
    mapsHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`,
    instagramHandle: handle,
  };
}

/* ------------------------------------------------------------------ */
/*                         Aggregated payloads                         */
/* ------------------------------------------------------------------ */

/**
 * Homepage payload for one locale.
 *
 * PR #19's `Promise.all` (fetch independent datasets concurrently) is kept —
 * it is still the right shape — and the localization reads are folded into the
 * same batch so the homepage never performs a second, sequential round of
 * queries after the first one resolves.
 */
export async function getHomepageData(locale: Locale) {
  const [curtainList, interiorList, statList, settings, categoryList, faqList] =
    await Promise.all([
      getActiveCurtains(locale),
      getActiveInteriors(locale),
      getActiveStatistics(locale),
      getSettings(locale),
      getActiveCategories(locale),
      getActiveFaq(locale),
    ]);

  return { curtainList, interiorList, statList, settings, categoryList, faqList };
}

/**
 * Cached localized payloads.
 *
 * `use cache` takes only serializable arguments, so the locale and the content
 * revision are explicit parameters: they are part of the cache key, which makes
 * a language mix-up impossible and makes any admin write (new revision) a cache
 * miss. Full payloads are cached once and shared by every visitor of that
 * language, instead of re-running 4–6 queries per request.
 */
export async function getCachedHomepageData(locale: Locale) {
  const revision = await contentRevision();
  return cachedContent("homepage", locale, revision, () => getHomepageData(locale));
}

export async function getCachedCurtains(locale: Locale): Promise<CurtainView[]> {
  const revision = await contentRevision();
  return cachedContent("curtains", locale, revision, () => getActiveCurtains(locale));
}



export async function getCachedInteriors(locale: Locale): Promise<InteriorView[]> {
  const revision = await contentRevision();
  return cachedContent("interiors", locale, revision, () => getActiveInteriors(locale));
}



export async function getCachedCategories(locale: Locale): Promise<CategoryView[]> {
  const revision = await contentRevision();
  return cachedContent("categories", locale, revision, () => getActiveCategories(locale));
}



export async function getCachedGallery(locale: Locale): Promise<GalleryItemView[]> {
  const revision = await contentRevision();
  return cachedContent("gallery", locale, revision, () => getActiveGallery(locale));
}



/* ------------------------------------------------------------------ */
/*                             Images                                 */
/* ------------------------------------------------------------------ */

export function resolveCurtainImage(url: string | null, index: number) {
  return url || ASSETS.curtains[index % ASSETS.curtains.length];
}

export function resolveInteriorImage(url: string | null, index: number) {
  return url || ASSETS.interiors[index % ASSETS.interiors.length];
}

/** Kept for callers that only need the newest revision (diagnostics). */
export async function currentContentRevision(): Promise<number> {
  const result = await db.execute(sql`select max(id) as id from public.content_revisions`);
  const row = result.rows[0] as { id: number | null } | undefined;
  return row?.id ?? 0;
}

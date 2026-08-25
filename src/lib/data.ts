import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  curtains,
  interiors,
  statistics,
  siteSettings,
} from "@/db/schema";
import type { SiteSettings } from "@/db/schema";
import { ASSETS, FALLBACK_SETTINGS } from "@/lib/constants";

/**
 * Server-side data access for the public site.
 * Every query is wrapped so the UI never renders a blank page on failure.
 */

export async function getActiveCurtains() {
  try {
    return await db
      .select()
      .from(curtains)
      .where(eq(curtains.isActive, true))
      .orderBy(desc(curtains.likes), asc(curtains.sortOrder), asc(curtains.id));
  } catch (e) {
    console.error("getActiveCurtains failed:", e);
    return [];
  }
}

/** Most-liked curtains for the Trending / Top section. */
export async function getTopCurtains(limit = 6) {
  try {
    return await db
      .select()
      .from(curtains)
      .where(eq(curtains.isActive, true))
      .orderBy(desc(curtains.likes), asc(curtains.sortOrder))
      .limit(limit);
  } catch (e) {
    console.error("getTopCurtains failed:", e);
    return [];
  }
}

export async function getActiveInteriors() {
  try {
    return await db
      .select()
      .from(interiors)
      .where(eq(interiors.isActive, true))
      .orderBy(asc(interiors.sortOrder), asc(interiors.id));
  } catch (e) {
    console.error("getActiveInteriors failed:", e);
    return [];
  }
}

export async function getActiveCategories() {
  try {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder), asc(categories.id));
  } catch (e) {
    console.error("getActiveCategories failed:", e);
    return [];
  }
}

export async function getActiveStatistics() {
  try {
    return await db
      .select()
      .from(statistics)
      .where(eq(statistics.isActive, true))
      .orderBy(asc(statistics.sortOrder), asc(statistics.id));
  } catch (e) {
    console.error("getActiveStatistics failed:", e);
    return [];
  }
}

export async function getAllCategories() {
  try {
    return await db.select().from(categories).orderBy(asc(categories.sortOrder));
  } catch (e) {
    console.error("getAllCategories failed:", e);
    return [];
  }
}

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

export async function getSettings(): Promise<ResolvedSettings> {
  let row: SiteSettings | undefined;
  try {
    [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, 1))
      .limit(1);
  } catch (e) {
    console.error("getSettings failed:", e);
  }

  const instagramUrl = row?.instagramUrl || FALLBACK_SETTINGS.instagramUrl;
  const handle = (instagramUrl.split("/").filter(Boolean).pop() || "KASHMIR")
    .replace(/^@/, "")
    .toUpperCase();
  const phone = row?.phone || FALLBACK_SETTINGS.phone;
  const mapsQuery = row?.mapsQuery || FALLBACK_SETTINGS.mapsQuery;

  return {
    instagramUrl,
    telegramUrl: row?.telegramUrl || FALLBACK_SETTINGS.telegramUrl,
    phone,
    phoneHref: `tel:${phone.replace(/[^+\d]/g, "")}`,
    email: row?.email || FALLBACK_SETTINGS.email,
    address: row?.address || FALLBACK_SETTINGS.address,
    workingHours: row?.workingHours || FALLBACK_SETTINGS.workingHours,
    heroEyebrow: row?.heroEyebrow || FALLBACK_SETTINGS.heroEyebrow,
    heroStatement: row?.heroStatement || FALLBACK_SETTINGS.heroStatement,
    aboutTitle: row?.aboutTitle || FALLBACK_SETTINGS.aboutTitle,
    aboutText: row?.aboutText || FALLBACK_SETTINGS.aboutText,
    mapsQuery,
    mapsHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      mapsQuery,
    )}`,
    instagramHandle: handle,
  };
}

/** Public-facing combined payload for the homepage. */
export async function getHomepageData() {
  const [curtainList, interiorList, statList, settings] = await Promise.all([
    getActiveCurtains(),
    getActiveInteriors(),
    getActiveStatistics(),
    getSettings(),
  ]);
  return { curtainList, interiorList, statList, settings };
}

export async function getCurtainBySlug(slug: string) {
  try {
    const [row] = await db
      .select()
      .from(curtains)
      .where(and(eq(curtains.slug, slug), eq(curtains.isActive, true)))
      .limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

export async function getRelatedCurtains(category: string | null, excludeId: number) {
  try {
    let rows;
    if (category) {
      rows = await db
        .select()
        .from(curtains)
        .where(and(eq(curtains.isActive, true), eq(curtains.category, category)))
        .orderBy(asc(curtains.sortOrder), asc(curtains.id))
        .limit(5);
    } else {
      rows = await db
        .select()
        .from(curtains)
        .where(eq(curtains.isActive, true))
        .orderBy(asc(curtains.sortOrder), asc(curtains.id))
        .limit(5);
    }
    return rows.filter((r) => r.id !== excludeId).slice(0, 4);
  } catch {
    return [];
  }
}

export async function getInteriorBySlug(slug: string) {
  try {
    const [row] = await db
      .select()
      .from(interiors)
      .where(and(eq(interiors.slug, slug), eq(interiors.isActive, true)))
      .limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

export async function getActiveFaq() {
  try {
    const { faq } = await import("@/db/schema");
    return await db
      .select()
      .from(faq)
      .where(eq(faq.isActive, true))
      .orderBy(asc(faq.sortOrder), asc(faq.id));
  } catch {
    return [];
  }
}

export async function getActiveGallery() {
  try {
    const { gallery } = await import("@/db/schema");
    return await db
      .select()
      .from(gallery)
      .where(eq(gallery.isActive, true))
      .orderBy(asc(gallery.sortOrder), asc(gallery.id));
  } catch {
    return [];
  }
}

export function resolveCurtainImage(url: string | null, index: number) {
  return url || ASSETS.curtains[index % ASSETS.curtains.length];
}

export function resolveInteriorImage(url: string | null, index: number) {
  return url || ASSETS.interiors[index % ASSETS.interiors.length];
}

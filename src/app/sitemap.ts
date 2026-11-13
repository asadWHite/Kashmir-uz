import type { MetadataRoute } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { curtains, gallery, interiors } from "@/db/schema";
import { SITE_URL } from "@/lib/site";

/**
 * The sitemap lists the same active content the public site shows, and is
 * cached rather than rebuilt on every crawler hit (`revalidate` instead of
 * `revalidate = 0`). It deliberately uses a narrow query: the sitemap only
 * needs slugs and timestamps, never image payloads or translated copy.
 *
 * There is exactly one URL per page. The three languages share that URL (the
 * language is a cookie), so listing `?lang=` variants would create duplicate
 * content rather than useful alternates.
 */
export const revalidate = 3600;

type Row = { slug: string; updatedAt: Date | null };

function latestDate(dates: Array<Date | null | undefined>): Date | undefined {
  const valid = dates.filter((d): d is Date => d instanceof Date && Number.isFinite(d.getTime()));
  if (valid.length === 0) return undefined;
  return new Date(Math.max(...valid.map((d) => d.getTime())));
}

function validSlug(slug: string): string | null {
  if (!/^[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*$/u.test(slug)) return null;
  return encodeURIComponent(slug);
}

function withLastModified(date?: Date) {
  return date instanceof Date && Number.isFinite(date.getTime()) ? { lastModified: date } : {};
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let curtainRows: Row[] = [];
  let interiorRows: Row[] = [];
  let galleryRows: Array<{ updatedAt: Date | null }> = [];

  try {
    const [c, i, g] = await Promise.all([
      db
        .select({ slug: curtains.slug, updatedAt: curtains.updatedAt })
        .from(curtains)
        .where(eq(curtains.isActive, true))
        .orderBy(asc(curtains.sortOrder), asc(curtains.id)),
      db
        .select({ slug: interiors.slug, updatedAt: interiors.updatedAt })
        .from(interiors)
        .where(eq(interiors.isActive, true))
        .orderBy(asc(interiors.sortOrder), asc(interiors.id)),
      db
        .select({ updatedAt: gallery.createdAt })
        .from(gallery)
        .where(eq(gallery.isActive, true)),
    ]);
    curtainRows = c;
    interiorRows = i;
    galleryRows = g;
  } catch (error) {
    // A database outage produces a valid, smaller sitemap instead of a 500.
    console.error("sitemap query failed:", error);
  }

  const curtainDates = curtainRows.map((r) => r.updatedAt);
  const interiorDates = interiorRows.map((r) => r.updatedAt);
  const galleryDates = galleryRows.map((r) => r.updatedAt);

  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      ...withLastModified(latestDate([...curtainDates, ...interiorDates, ...galleryDates])),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/collections`,
      ...withLastModified(latestDate(curtainDates)),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/interiors`,
      ...withLastModified(latestDate(interiorDates)),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/gallery`,
      ...withLastModified(latestDate([...galleryDates, ...curtainDates, ...interiorDates])),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...curtainRows.flatMap((row) => {
      const slug = validSlug(row.slug);
      return slug
        ? [{
            url: `${SITE_URL}/curtains/${slug}`,
            ...withLastModified(row.updatedAt ?? undefined),
            changeFrequency: "monthly" as const,
            priority: 0.8,
          }]
        : [];
    }),
    ...interiorRows.flatMap((row) => {
      const slug = validSlug(row.slug);
      return slug
        ? [{
            url: `${SITE_URL}/interiors/${slug}`,
            ...withLastModified(row.updatedAt ?? undefined),
            changeFrequency: "monthly" as const,
            priority: 0.8,
          }]
        : [];
    }),
  ];

  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

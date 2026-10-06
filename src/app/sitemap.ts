import type { MetadataRoute } from "next";
import { getActiveCurtains, getActiveGallery, getActiveInteriors } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

// The sitemap follows the same active content shown on the public site.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function latestDate(dates: Array<Date | null | undefined>): Date | undefined {
  const validDates = dates.filter(
    (date): date is Date => date instanceof Date && Number.isFinite(date.getTime()),
  );
  if (validDates.length === 0) return undefined;
  return new Date(Math.max(...validDates.map((date) => date.getTime())));
}

function validSlug(slug: string): string | null {
  if (!/^[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*$/u.test(slug)) return null;
  return encodeURIComponent(slug);
}

function withLastModified(date?: Date) {
  return date instanceof Date && Number.isFinite(date.getTime())
    ? { lastModified: date }
    : {};
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [curtains, interiors, gallery] = await Promise.all([
    getActiveCurtains(),
    getActiveInteriors(),
    getActiveGallery(),
  ]);

  const curtainDates = curtains.map((curtain) => curtain.updatedAt);
  const interiorDates = interiors.map((interior) => interior.updatedAt);
  const galleryDates = gallery.map((item) => item.createdAt);

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
    ...curtains.flatMap((curtain) => {
      const slug = validSlug(curtain.slug);
      return slug
        ? [
            {
              url: `${SITE_URL}/curtains/${slug}`,
              ...withLastModified(curtain.updatedAt),
              changeFrequency: "monthly" as const,
              priority: 0.8,
            },
          ]
        : [];
    }),
    ...interiors.flatMap((interior) => {
      const slug = validSlug(interior.slug);
      return slug
        ? [
            {
              url: `${SITE_URL}/interiors/${slug}`,
              ...withLastModified(interior.updatedAt),
              changeFrequency: "monthly" as const,
              priority: 0.8,
            },
          ]
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

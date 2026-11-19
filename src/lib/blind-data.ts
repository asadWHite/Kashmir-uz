import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { blindImages, blinds, contentTranslations } from "@/db/schema";
import { publicBlindImageUrl } from "@/lib/blinds";
import { cachedContent } from "@/lib/cache";
import { hasText } from "@/lib/content";
import type { Locale } from "@/lib/i18n";

type Photo = { url: string; width: number; height: number };
export type BlindCard = {
  id: number;
  name: string;
  description: string;
  category: string | null;
  featured: boolean;
  main: Photo;
  gallery: Photo[];
};

async function readBlinds(locale: Locale): Promise<BlindCard[]> {
  const categoryText = alias(contentTranslations, "blind_category_text");
  // Read only localized card fields and photo metadata, never the image bytes.
  const rows = await db.select({
    id: blinds.id,
    featured: blinds.isFeatured,
    name: contentTranslations.title,
    description: contentTranslations.description,
    category: categoryText.title,
    photoId: blindImages.id,
    position: blindImages.position,
    width: blindImages.width,
    height: blindImages.height,
  }).from(blinds)
    .innerJoin(contentTranslations, and(
      eq(contentTranslations.entity, "blind"), eq(contentTranslations.entityId, blinds.id), eq(contentTranslations.locale, locale),
    ))
    .leftJoin(categoryText, and(
      eq(categoryText.entity, "blind_category"), eq(categoryText.entityId, blinds.categoryId), eq(categoryText.locale, locale),
    ))
    .innerJoin(blindImages, eq(blindImages.blindId, blinds.id))
    .where(eq(blinds.isPublished, true))
    .orderBy(desc(blinds.isFeatured), asc(blinds.sortOrder), asc(blinds.id), asc(blindImages.position));

  const cards = new Map<number, BlindCard>();
  for (const { id, featured, name, description, category, photoId, position, width, height } of rows) {
    const photo = { url: publicBlindImageUrl(photoId), width, height };
    if (position === 0 && hasText(name) && hasText(description)) {
      cards.set(id, { id, name, description, category, featured, main: photo, gallery: [] });
    } else if (position !== null && position > 0) {
      cards.get(id)?.gallery.push(photo);
    }
  }
  return [...cards.values()];
}

export async function getCachedBlinds(locale: Locale): Promise<BlindCard[]> {
  try {
    // Blinds writes expire this exact dataset tag (all locales), without
    // making the homepage wait on another global content-revision read.
    return await cachedContent("blinds", locale, 0, () => readBlinds(locale));
  } catch (error) {
    console.error("Could not load blinds:", error instanceof Error ? error.name : "unknown");
    return [];
  }
}

import "server-only";
import { and, inArray, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentTranslations } from "@/db/schema";
import {
  groupTranslations,
  type TranslationEntity,
  type TranslationMap,
} from "@/lib/content";

/**
 * The only place that reads `content_translations` for display.
 *
 * Everything funnels through `loadTranslationsWithExtras()` so query behaviour
 * stays consistent and so the number of statements per page is fixed: one
 * query per entity type (never one per row — no N+1, and never one query for
 * base fields plus a second one for the `extra` payloads).
 */
export async function loadTranslationsWithExtras(
  entity: TranslationEntity,
  entityIds: number[],
): Promise<{
  translations: Map<number, TranslationMap>;
  extras: Map<number, Partial<Record<string, Record<string, string>>>>;
}> {
  const translations = new Map<number, TranslationMap>();
  const extras = new Map<number, Partial<Record<string, Record<string, string>>>>();
  const ids = [...new Set(entityIds)].filter((id) => Number.isInteger(id) && id > 0);
  if (ids.length === 0) return { translations, extras };

  try {
    const rows = await db
      .select({
        entityId: contentTranslations.entityId,
        locale: contentTranslations.locale,
        title: contentTranslations.title,
        subtitle: contentTranslations.subtitle,
        description: contentTranslations.description,
        seoTitle: contentTranslations.seoTitle,
        seoDescription: contentTranslations.seoDescription,
        reviewStatus: contentTranslations.reviewStatus,
        extra: contentTranslations.extra,
      })
      .from(contentTranslations)
      .where(
        and(
          eq(contentTranslations.entity, entity),
          inArray(contentTranslations.entityId, ids),
        ),
      );

    for (const row of rows) {
      const existing = translations.get(row.entityId) ?? {};
      const grouped: TranslationMap = groupTranslations([
        {
          entity,
          entityId: row.entityId,
          locale: row.locale,
          title: row.title,
          subtitle: row.subtitle,
          description: row.description,
          seoTitle: row.seoTitle,
          seoDescription: row.seoDescription,
          reviewStatus: row.reviewStatus,
        },
      ]);
      translations.set(row.entityId, { ...existing, ...grouped });

      if (row.extra) {
        const current = extras.get(row.entityId) ?? {};
        current[row.locale] = row.extra;
        extras.set(row.entityId, current);
      }
    }
  } catch (error) {
    // Un-migrated database: fall through with empty maps so pages still render
    // (they will show the localized missing-content state, not a crash).
    console.error(`loadTranslations(${entity}) failed:`, error);
  }

  return { translations, extras };
}

/**
 * Localized base fields for a set of records. Delegates to the combined
 * loader, so callers that only need translations still run one query.
 */
export async function loadTranslations(
  entity: TranslationEntity,
  entityIds: number[],
): Promise<Map<number, TranslationMap>> {
  return (await loadTranslationsWithExtras(entity, entityIds)).translations;
}

/** Entity-specific extras (material/colour/location/…) for a set of records. */
export async function loadTranslationExtras(
  entity: TranslationEntity,
  entityIds: number[],
): Promise<Map<number, Partial<Record<string, Record<string, string>>>>> {
  return (await loadTranslationsWithExtras(entity, entityIds)).extras;
}

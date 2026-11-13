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
 * Everything funnels through `loadTranslations()` so query behaviour stays
 * consistent and so the number of statements per page is fixed (one query per
 * entity type, never one per row — no N+1).
 */
export async function loadTranslations(
  entity: TranslationEntity,
  entityIds: number[],
): Promise<Map<number, TranslationMap>> {
  const result = new Map<number, TranslationMap>();
  const ids = [...new Set(entityIds)].filter((id) => Number.isInteger(id) && id > 0);
  if (ids.length === 0) return result;

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
      })
      .from(contentTranslations)
      .where(
        and(
          eq(contentTranslations.entity, entity),
          inArray(contentTranslations.entityId, ids),
        ),
      );

    for (const row of rows) {
      const existing = result.get(row.entityId) ?? {};
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
      result.set(row.entityId, { ...existing, ...grouped });
    }
  } catch (error) {
    // Un-migrated database: fall through with empty maps so pages still render
    // (they will show the localized missing-content state, not a crash).
    console.error(`loadTranslations(${entity}) failed:`, error);
  }

  return result;
}

/** Entity-specific extras (material/colour/location/…) for a set of records. */
export async function loadTranslationExtras(
  entity: TranslationEntity,
  entityIds: number[],
): Promise<Map<number, Partial<Record<string, Record<string, string>>>>> {
  const result = new Map<number, Partial<Record<string, Record<string, string>>>>();
  const ids = [...new Set(entityIds)].filter((id) => Number.isInteger(id) && id > 0);
  if (ids.length === 0) return result;

  try {
    const rows = await db
      .select({
        entityId: contentTranslations.entityId,
        locale: contentTranslations.locale,
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
      if (!row.extra) continue;
      const current = result.get(row.entityId) ?? {};
      current[row.locale] = row.extra;
      result.set(row.entityId, current);
    }
  } catch {
    /* no extras available */
  }

  return result;
}

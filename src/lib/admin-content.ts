import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { contentTranslations } from "@/db/schema";
import { LOCALES, type Locale } from "@/lib/i18n";
import {
  completeness,
  groupTranslations,
  hasText,
  isLocale,
  REQUIRED_FIELDS,
  type CompletenessField,
  type TranslationEntity,
  type TranslationMap,
} from "@/lib/content";
import { invalidatePublicContent } from "@/lib/cache";

/**
 * Server-side translation writes and validation.
 *
 * The admin UI is a convenience layer; every rule that protects data lives
 * here, so a hand-crafted request cannot:
 *   · write an unsupported locale,
 *   · overwrite one language while saving another,
 *   · blank out the shared (non-translatable) record,
 *   · store an empty string where a translation is required.
 */

export interface TranslationPayload {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  extra?: Record<string, string> | null;
  reviewStatus?: string;
}

export type TranslationsByLocale = Partial<Record<Locale, TranslationPayload>>;

const REVIEW_STATES = new Set(["complete", "needs_review", "machine"]);

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

/**
 * Parse an untrusted `translations` object from a request body.
 * Unknown locales are rejected (422) instead of silently dropped, so a typo in
 * a client can never look like a successful save.
 */
export function parseTranslations(input: unknown): {
  ok: true;
  value: TranslationsByLocale;
} | { ok: false; error: string } {
  if (input === undefined || input === null) return { ok: true, value: {} };
  if (typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Поле translations должно быть объектом." };
  }

  const value: TranslationsByLocale = {};
  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    if (!isLocale(key)) {
      return {
        ok: false,
        error: `Неподдерживаемый язык «${key}». Допустимые языки: ${LOCALES.join(", ")}.`,
      };
    }
    if (raw === null) continue;
    if (typeof raw !== "object" || Array.isArray(raw)) {
      return { ok: false, error: `Перевод для «${key}» должен быть объектом.` };
    }
    const fields = raw as Record<string, unknown>;
    const review = clean(fields.reviewStatus);
    if (review && !REVIEW_STATES.has(review)) {
      return { ok: false, error: `Неизвестный статус перевода «${review}».` };
    }
    let extra: Record<string, string> | null = null;
    if (fields.extra && typeof fields.extra === "object" && !Array.isArray(fields.extra)) {
      extra = {};
      for (const [k, v] of Object.entries(fields.extra as Record<string, unknown>)) {
        const cleaned = clean(v);
        if (cleaned && /^[a-zA-Z][a-zA-Z0-9_]*$/.test(k)) extra[k] = cleaned;
      }
      if (Object.keys(extra).length === 0) extra = null;
    }
    value[key] = {
      title: clean(fields.title),
      subtitle: clean(fields.subtitle),
      description: clean(fields.description),
      seoTitle: clean(fields.seoTitle),
      seoDescription: clean(fields.seoDescription),
      extra,
      reviewStatus: review ?? "complete",
    };
  }
  return { ok: true, value };
}

/**
 * Upsert only the locales that were actually sent.
 *
 * This is the mechanism that makes independent language edits safe: a save for
 * "ru" touches exactly one row because of the unique
 * (entity, entity_id, locale) index. Uzbek, English, images, prices, ordering
 * and publication state are not in the statement at all.
 *
 * A locale whose payload is entirely empty is skipped rather than written, so
 * clearing a field in the UI cannot silently delete the other language's data.
 */
export async function saveTranslations(
  entity: TranslationEntity,
  entityId: number,
  translations: TranslationsByLocale,
): Promise<void> {
  const hasAnyText = (payload: TranslationPayload) =>
    [payload.title, payload.subtitle, payload.description, payload.seoTitle, payload.seoDescription]
      .some((v) => hasText(String(v ?? ""))) ||
    Object.values(payload.extra ?? {}).some((v) => hasText(String(v ?? "")));

  const rows = (Object.entries(translations) as Array<[Locale, TranslationPayload]>)
    .filter(([, payload]) => Boolean(payload) && hasAnyText(payload))
    .map(([locale, payload]) => ({
      entity,
      entityId,
      locale,
      title: payload.title ?? null,
      subtitle: payload.subtitle ?? null,
      description: payload.description ?? null,
      seoTitle: payload.seoTitle ?? null,
      seoDescription: payload.seoDescription ?? null,
      extra: payload.extra ?? null,
      reviewStatus: payload.reviewStatus ?? "complete",
      updatedAt: new Date(),
    }));

  if (rows.length === 0) return;

  await db
    .insert(contentTranslations)
    .values(rows)
    .onConflictDoUpdate({
      target: [contentTranslations.entity, contentTranslations.entityId, contentTranslations.locale],
      set: {
        title: sqlExcluded("title"),
        subtitle: sqlExcluded("subtitle"),
        description: sqlExcluded("description"),
        seoTitle: sqlExcluded("seo_title"),
        seoDescription: sqlExcluded("seo_description"),
        extra: sqlExcluded("extra"),
        reviewStatus: sqlExcluded("review_status"),
        updatedAt: new Date(),
      },
    });
}

// Small helper so the conflict target stays readable and typed.
function sqlExcluded(column: string) {
  return sql.raw(`excluded.${column}`);
}

/** Full translation map for one record (used by the admin editor). */
export async function getTranslations(
  entity: TranslationEntity,
  entityId: number,
): Promise<TranslationMap> {
  const rows = await db
    .select({
      entity: contentTranslations.entity,
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
        eq(contentTranslations.entityId, entityId),
      ),
    );
  return groupTranslations(rows);
}

/** Attach a `translation` summary to a list payload for the admin tables. */
export async function translationSummaries(
  entity: TranslationEntity,
  ids: number[],
): Promise<Map<number, TranslationMap>> {
  const map = new Map<number, TranslationMap>();
  if (ids.length === 0) return map;

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
    const existing = map.get(row.entityId) ?? {};
    map.set(row.entityId, {
      ...existing,
      ...groupTranslations([
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
          extra: row.extra,
        },
      ]),
    });
  }
  return map;
}

export interface TranslationStatusRow {
  locale: Locale;
  filled: number;
  required: number;
  missing: boolean;
  needsReview: boolean;
}

/** Per-locale status for one record, for the badges in the admin panel. */
export function translationStatus(
  entity: TranslationEntity,
  map: TranslationMap,
): { locales: TranslationStatusRow[]; complete: boolean; missingLocales: Locale[] } {
  const required = REQUIRED_FIELDS[entity] as CompletenessField[];
  const result = completeness(map, required);
  return {
    locales: LOCALES.map((locale) => ({
      locale,
      filled: result.filled[locale] ?? 0,
      required: result.required,
      missing: result.missingLocales.includes(locale),
      needsReview: result.needsReview.includes(locale),
    })),
    complete: result.complete,
    missingLocales: result.missingLocales,
  };
}

/**
 * Remove the translation rows belonging to a record that is being deleted.
 *
 * `content_translations` is polymorphic (`entity` + `entity_id`) and therefore
 * cannot carry a foreign key, so nothing in the database removes these rows on
 * its own. Without this step a deleted curtain leaves its ru/uz/en rows behind
 * forever: invisible garbage that would be re-attached by id to any future row
 * that happens to reuse the number. Called before the parent row goes away.
 */
export async function deleteTranslations(entity: TranslationEntity, entityId: number) {
  await db
    .delete(contentTranslations)
    .where(
      and(
        eq(contentTranslations.entity, entity),
        eq(contentTranslations.entityId, entityId),
      ),
    );
}

/** Notify the public cache after any content change. */
export async function touchContent(entity: TranslationEntity, entityId: number, action: string) {
  await invalidatePublicContent(entity, entityId, action);
}

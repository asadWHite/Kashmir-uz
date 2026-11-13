"use client";

import { useState } from "react";
import { LOCALES, type Locale } from "@/lib/i18n";

/**
 * Tabbed three-language editor used by every localized admin form.
 *
 * Behaviour that matters for data integrity:
 *  · Each language keeps its own draft object, so editing Russian cannot touch
 *    the Uzbek or English text.
 *  · Switching tabs never resets or remaps a field.
 *  · The badge on each tab shows that language's state (missing / needs review
 *    / complete), so the administrator sees what still has to be done without
 *    opening every tab.
 *  · Fields are only sent for the language being saved when `perLocaleSave` is
 *    used; the wiring lives in the page, this component stays presentational
 *    apart from tab state.
 */

export type LocaleDraft = {
  title: string;
  subtitle: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  reviewStatus: "complete" | "needs_review" | "machine";
  /** Entity-specific localized attributes (material, colour, location …). */
  extra: Record<string, string>;
};

export type TranslationsDraft = Record<Locale, LocaleDraft>;

export type FieldKey = keyof Omit<LocaleDraft, "extra" | "reviewStatus">;

export const LOCALE_TAB_LABEL: Record<Locale, string> = {
  uz: "UZBEK",
  ru: "РУССКИЙ",
  en: "ENGLISH",
};

export function emptyTranslations(): TranslationsDraft {
  const draft = {} as TranslationsDraft;
  for (const locale of LOCALES) {
    draft[locale] = {
      title: "",
      subtitle: "",
      description: "",
      seoTitle: "",
      seoDescription: "",
      reviewStatus: "complete",
      extra: {},
    };
  }
  return draft;
}

export function translationsFromApi(raw: unknown): TranslationsDraft {
  const draft = emptyTranslations();
  if (!raw || typeof raw !== "object") return draft;
  for (const locale of LOCALES) {
    const value = (raw as Record<string, unknown>)[locale];
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    const str = (k: string) => (typeof row[k] === "string" ? (row[k] as string) : "");
    draft[locale] = {
      title: str("title"),
      subtitle: str("subtitle"),
      description: str("description"),
      seoTitle: str("seoTitle"),
      seoDescription: str("seoDescription"),
      reviewStatus:
        row.reviewStatus === "needs_review" || row.reviewStatus === "machine"
          ? row.reviewStatus
          : "complete",
      extra:
        row.extra && typeof row.extra === "object"
          ? Object.fromEntries(
              Object.entries(row.extra as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]),
            )
          : {},
    };
  }
  return draft;
}

export function toPayload(draft: TranslationsDraft) {
  const payload: Record<string, unknown> = {};
  for (const locale of LOCALES) {
    const row = draft[locale];
    const hasAny =
      row.title.trim() ||
      row.subtitle.trim() ||
      row.description.trim() ||
      row.seoTitle.trim() ||
      row.seoDescription.trim() ||
      Object.values(row.extra).some((v) => v.trim());
    if (!hasAny) continue; // never write an empty locale — it would erase content
    payload[locale] = {
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      reviewStatus: row.reviewStatus,
      extra: row.extra,
    };
  }
  return payload;
}

export type FieldConfig = {
  /** A built-in localized text column… */
  key?: FieldKey;
  /** …or an entity-specific attribute stored in `extra` (material, colour, …). */
  extraKey?: string;
  label: Record<Locale, string>;
  multiline?: boolean;
  rows?: number;
};

function badge(draft: LocaleDraft, fields: FieldConfig[]) {
  const required = fields.filter((f) => f.key === "title" || f.key === "description");
  const filled = required.filter((f) => draft[f.key as FieldKey].trim().length > 0).length;
  if (filled < required.length) return { text: "не заполнено", tone: "missing" as const };
  if (draft.reviewStatus === "needs_review" || draft.reviewStatus === "machine") {
    return { text: "проверить", tone: "review" as const };
  }
  return { text: "готово", tone: "complete" as const };
}

export default function TranslationEditor({
  value,
  onChange,
  fields,
  localeLabels,
  disabled,
}: {
  value: TranslationsDraft;
  onChange: (next: TranslationsDraft) => void;
  fields: FieldConfig[];
  localeLabels?: Partial<Record<Locale, string>>;
  disabled?: boolean;
}) {
  const [active, setActive] = useState<Locale>("uz");

  const update = (locale: Locale, key: string, next: string) => {
    const current = value[locale];
    const patch =
      key === "reviewStatus"
        ? { reviewStatus: next as LocaleDraft["reviewStatus"] }
        : key in current
          ? { [key]: next }
          : { extra: { ...current.extra, [key]: next } };
    onChange({ ...value, [locale]: { ...current, ...patch } });
  };

  return (
    <div className="border border-line bg-panel/40">
      {/* Tabs */}
      <div className="flex flex-wrap border-b border-line" role="tablist" aria-label="Языки">
        {LOCALES.map((locale) => {
          const state = badge(value[locale], fields);
          const isActive = locale === active;
          return (
            <button
              key={locale}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(locale)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] transition-colors ${
                isActive ? "border-ink text-ink" : "border-transparent text-faint hover:text-muted"
              }`}
            >
              {localeLabels?.[locale] ?? LOCALE_TAB_LABEL[locale]}
              <span
                className={`rounded-full px-2 py-0.5 text-[0.6rem] normal-case tracking-normal ${
                  state.tone === "complete"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : state.tone === "review"
                      ? "bg-amber-500/20 text-amber-600"
                      : "bg-red-500/15 text-red-500"
                }`}
              >
                {state.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active language panel */}
      <div className="p-4 md:p-6" role="tabpanel">
        <p className="mb-4 text-xs text-faint">
          Все поля ниже сохраняются только для языка{" "}
          <strong className="text-muted">{LOCALE_TAB_LABEL[active]}</strong>. Остальные языки,
          изображения и общие свойства товара не изменяются.
        </p>

        <div className="space-y-5">
          {fields.map((field) => {
            const inputId = `${active}-${field.extraKey ?? field.key}`;
            const isExtra = Boolean(field.extraKey);
            const v = isExtra
              ? (value[active].extra[field.extraKey as string] ?? "")
              : value[active][field.key as FieldKey];
            return (
              <div key={inputId}>
                <label htmlFor={inputId} className="eyebrow">
                  {field.label[active]}
                </label>
                {field.multiline ? (
                  <textarea
                    id={inputId}
                    value={v}
                    rows={field.rows ?? 4}
                    disabled={disabled}
                    onChange={(e) =>
                      update(active, (field.extraKey ?? field.key) as string, e.target.value)
                    }
                    className="field resize-none"
                  />
                ) : (
                  <input
                    id={inputId}
                    type="text"
                    value={v}
                    disabled={disabled}
                    onChange={(e) =>
                      update(active, (field.extraKey ?? field.key) as string, e.target.value)
                    }
                    className="field"
                  />
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <label htmlFor={`${active}-review`} className="eyebrow mb-0">
              Статус перевода
            </label>
            <select
              id={`${active}-review`}
              value={value[active].reviewStatus}
              disabled={disabled}
              onChange={(e) => update(active, "reviewStatus", e.target.value)}
              className="field w-auto bg-transparent py-1.5"
            >
              <option value="complete">Проверено администратором</option>
              <option value="needs_review">Требует проверки</option>
              <option value="machine">Машинный перевод</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact per-language status chips for list rows. */
export function TranslationBadges({
  status,
}: {
  status?: { locales: Array<{ locale: Locale; missing: boolean; needsReview: boolean }> } | null;
}) {
  if (!status) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {status.locales.map((l) => (
        <span
          key={l.locale}
          title={
            l.missing
              ? `${l.locale.toUpperCase()}: перевод отсутствует`
              : l.needsReview
                ? `${l.locale.toUpperCase()}: требует проверки`
                : `${l.locale.toUpperCase()}: готово`
          }
          className={`rounded px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide ${
            l.missing
              ? "bg-red-500/15 text-red-500"
              : l.needsReview
                ? "bg-amber-500/20 text-amber-600"
                : "bg-emerald-500/15 text-emerald-600"
          }`}
        >
          {l.locale}
        </span>
      ))}
    </span>
  );
}

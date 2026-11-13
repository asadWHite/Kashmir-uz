"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import ImageField from "@/app/admin/_components/ImageField";
import { PageHeader, Field, Toggle } from "@/app/admin/_components/ui";
import TranslationEditor, {
  TranslationBadges,
  emptyTranslations,
  toPayload,
  translationsFromApi,
  type TranslationsDraft,
} from "@/app/admin/_components/TranslationEditor";
import type { Locale } from "@/lib/i18n";

type TranslationStatus = {
  locales: Array<{ locale: Locale; missing: boolean; needsReview: boolean }>;
  complete: boolean;
  missingLocales: Locale[];
};

type Interior = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  location: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  translations?: Record<string, unknown>;
  translation?: TranslationStatus;
};

type Draft = Interior & { translationsDraft: TranslationsDraft };

const blank: Omit<Interior, "id"> = {
  title: "",
  description: "",
  imageUrl: "",
  location: "",
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
};

const FIELDS = [
  { key: "title" as const, label: { uz: "Sarlavha (UZ)", ru: "Заголовок (RU)", en: "Title (EN)" } },
  {
    key: "description" as const,
    label: { uz: "Tavsif (UZ)", ru: "Описание (RU)", en: "Description (EN)" },
    multiline: true,
    rows: 4,
  },
  { extraKey: "location", label: { uz: "Joy (UZ)", ru: "Локация (RU)", en: "Location (EN)" } },
  { key: "seoTitle" as const, label: { uz: "SEO sarlavha", ru: "SEO заголовок", en: "SEO title" } },
];

/**
 * `interiors.location` is a shared column; the localized caption lives in the
 * translation row. Showing the shared value as a placeholder keeps an existing
 * record's location visible while it is being translated.
 */
function fieldsWithSharedValues(draft: Interior): typeof FIELDS {
  return FIELDS.map((field) =>
    field.extraKey === "location" ? { ...field, sharedValue: draft.location } : field,
  );
}

export default function InteriorsAdmin() {
  const [items, setItems] = useState<Interior[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ interiors: Interior[] }>("/api/admin/interiors");
      setItems(res.interiors);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update<K extends keyof Interior>(key: K, val: Interior[K]) {
    setDraft((d) => (d ? { ...d, [key]: val } : d));
  }

  function openEditor(item?: Interior) {
    setErr("");
    setOk("");
    setDraft({
      id: item?.id ?? 0,
      ...blank,
      ...(item ?? {}),
      translationsDraft: translationsFromApi(item?.translations),
    });
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setErr("");
    setOk("");
    const title =
      draft.translationsDraft.uz.title.trim() ||
      draft.translationsDraft.ru.title.trim() ||
      draft.translationsDraft.en.title.trim() ||
      draft.title.trim();
    if (!title) {
      setErr("Укажите заголовок хотя бы на одном языке.");
      setSaving(false);
      return;
    }
    try {
      const body = {
        title,
        imageUrl: draft.imageUrl,
        gallery: null,
        location: draft.location,
        isFeatured: draft.isFeatured,
        isActive: draft.isActive,
        sortOrder: draft.sortOrder,
        translations: toPayload(draft.translationsDraft),
      };
      if (draft.id) {
        await api(`/api/admin/interiors/${draft.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/admin/interiors", { method: "POST", body: JSON.stringify(body) });
      }
      setDraft(null);
      setOk("Сохранено. Изменения сразу видны на сайте.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Удалить этот интерьер навсегда?")) return;
    try {
      await api(`/api/admin/interiors/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка удаления");
    }
  }

  async function quickToggle(it: Interior, key: "isActive" | "isFeatured") {
    try {
      await api(`/api/admin/interiors/${it.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...it, [key]: !it[key] }),
      });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка обновления");
    }
  }

  return (
    <>
      <PageHeader
        title="Интерьеры"
        sub="Заголовок, описание и локация — независимо на трёх языках."
        action={
          <button type="button" onClick={() => openEditor()} className="btn btn-solid">
            + Добавить интерьер
          </button>
        }
      />

      {ok && <p className="mb-4 text-sm text-accent">{ok}</p>}

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">
          Интерьеров пока нет. Добавьте первый.
        </p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-surface">
          {items.map((it) => (
            <li key={it.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden border border-line bg-panel">
                  {it.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{it.title}</p>
                  <p className="truncate text-xs text-faint">{it.location || "—"}</p>
                  <div className="mt-1">
                    <TranslationBadges status={it.translation} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => quickToggle(it, "isActive")}
                  className={`rounded-full border px-3 py-1 transition-colors ${
                    it.isActive ? "border-ink text-ink" : "border-line-strong text-faint"
                  }`}
                >
                  {it.isActive ? "Виден" : "Скрыт"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => openEditor(it)} className="btn btn-ghost px-3 py-2 text-xs">
                  Изменить
                </button>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="btn btn-ghost px-3 py-2 text-xs text-red-500/90"
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="mt-8 border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-xl text-ink">
            {draft.id ? "Редактировать интерьер" : "Новый интерьер"}
          </h2>

          <TranslationEditor
            value={draft.translationsDraft}
            onChange={(next) => setDraft((d) => (d ? { ...d, translationsDraft: next } : d))}
            fields={fieldsWithSharedValues(draft)}
            disabled={saving}
          />

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Порядок" type="number" value={draft.sortOrder} onChange={(v) => update("sortOrder", Number(v) || 0)} />
          </div>
          <div className="mt-6">
            <ImageField value={draft.imageUrl ?? ""} onChange={(v) => update("imageUrl", v)} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-8">
            <Toggle checked={draft.isActive} onChange={(v) => update("isActive", v)} label="Виден на сайте" />
            <Toggle checked={draft.isFeatured} onChange={(v) => update("isFeatured", v)} label="Избранное" />
          </div>

          {err && <p className="mt-5 text-sm text-red-500/90">{err}</p>}

          <div className="mt-7 flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="btn btn-solid">
              {saving ? "Сохранение…" : "Сохранить интерьер"}
            </button>
            <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost">
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  );
}

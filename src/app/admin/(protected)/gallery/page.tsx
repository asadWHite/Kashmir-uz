"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import ImageField from "@/app/admin/_components/ImageField";
import { PageHeader, Field, Toggle } from "@/app/admin/_components/ui";
import TranslationEditor, {
  TranslationBadges,
  toPayload,
  translationsFromApi,
  type TranslationsDraft,
} from "@/app/admin/_components/TranslationEditor";
import type { Locale } from "@/lib/i18n";

type Gallery = {
  id: number;
  title: string | null;
  imageUrl: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
  translations?: Record<string, unknown>;
  translation?: {
    locales: Array<{ locale: Locale; missing: boolean; needsReview: boolean }>;
    complete: boolean;
  };
};

type Draft = Gallery & { titleText: string; translationsDraft: TranslationsDraft };

const CATS = ["interior", "curtain", "project"];
const CAT_LABELS: Record<string, string> = {
  interior: "Интерьер",
  curtain: "Шторы",
  project: "Проект",
};

const FIELDS = [
  { key: "title" as const, label: { uz: "Sarlavha (UZ)", ru: "Название (RU)", en: "Caption (EN)" } },
  {
    key: "description" as const,
    label: { uz: "Tavsif (UZ)", ru: "Описание (RU)", en: "Description (EN)" },
    multiline: true,
    rows: 2,
  },
];

export default function GalleryAdmin() {
  const [items, setItems] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ gallery: Gallery[] }>("/api/admin/gallery");
      setItems(res.gallery);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openEditor(item?: Gallery) {
    setErr("");
    setDraft({
      id: item?.id ?? 0,
      title: item?.title ?? null,
      imageUrl: item?.imageUrl ?? "",
      category: item?.category ?? "interior",
      isActive: item?.isActive ?? true,
      sortOrder: item?.sortOrder ?? 0,
      titleText: item?.title ?? "",
      translationsDraft: translationsFromApi(item?.translations),
    });
  }

  async function save() {
    if (!draft) return;
    if (!draft.imageUrl.trim()) {
      setErr("Укажите изображение.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      const body = {
        // Shared column: only a convenience mirror of the primary language, it
        // is never shown on the public site when translations exist.
        title: draft.titleText,
        imageUrl: draft.imageUrl,
        category: draft.category,
        isActive: draft.isActive,
        sortOrder: draft.sortOrder,
        translations: toPayload(draft.translationsDraft),
      };
      if (draft.id) {
        await api(`/api/admin/gallery/${draft.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/admin/gallery", { method: "POST", body: JSON.stringify(body) });
      }
      setDraft(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Удалить это изображение?")) return;
    try {
      await api(`/api/admin/gallery/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка удаления");
    }
  }

  return (
    <>
      <PageHeader
        title="Галерея"
        sub="Изображения галереи и их подписи на трёх языках."
        action={
          <button type="button" onClick={() => openEditor()} className="btn btn-solid">
            + Добавить фото
          </button>
        }
      />
      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">Изображений пока нет.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((g) => (
            <div key={g.id} className="border border-line bg-surface p-3">
              <div className="aspect-square overflow-hidden bg-panel">
                {/* Admin thumbnails are uploaded data URLs; next/image cannot
                    optimize them and would add no value at this size. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <p className="mt-2 truncate text-xs text-ink">{g.title || "Без названия"}</p>
              <p className="text-[0.65rem] text-faint">
                {CAT_LABELS[g.category] ?? g.category}
                {!g.isActive ? " · скрыт" : ""}
              </p>
              <div className="mt-1">
                <TranslationBadges status={g.translation} />
              </div>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => openEditor(g)} className="btn btn-ghost px-2 py-1 text-[0.65rem]">
                  Изменить
                </button>
                <button
                  type="button"
                  onClick={() => remove(g.id)}
                  className="btn btn-ghost px-2 py-1 text-[0.65rem] text-red-500/90"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <div className="mt-8 border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-xl text-ink">
            {draft.id ? "Редактировать фото" : "Новое фото"}
          </h2>
          <div className="space-y-5">
            <ImageField value={draft.imageUrl} onChange={(v) => setDraft({ ...draft, imageUrl: v })} />
            <div>
              <label className="eyebrow" htmlFor="gallery-category">Категория</label>
              <select
                id="gallery-category"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="field bg-transparent"
              >
                {CATS.map((c) => (
                  <option key={c} value={c}>
                    {CAT_LABELS[c] ?? c}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Название (служебное)"
              value={draft.titleText}
              onChange={(v) => setDraft({ ...draft, titleText: v })}
            />
          </div>

          <div className="mt-6">
            <p className="eyebrow mb-2">Подписи на трёх языках</p>
            <TranslationEditor
              value={draft.translationsDraft}
              onChange={(next) => setDraft((d) => (d ? { ...d, translationsDraft: next } : d))}
              fields={FIELDS}
              disabled={saving}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field
              label="Порядок"
              type="number"
              value={draft.sortOrder}
              onChange={(v) => setDraft({ ...draft, sortOrder: Number(v) || 0 })}
            />
            <div className="flex items-end pb-3">
              <Toggle
                checked={draft.isActive}
                onChange={(v) => setDraft({ ...draft, isActive: v })}
                label="Виден на сайте"
              />
            </div>
          </div>

          {err && <p className="mt-5 text-sm text-red-500/90">{err}</p>}
          <div className="mt-7 flex gap-3">
            <button type="button" onClick={save} disabled={saving} className="btn btn-solid">
              {saving ? "Сохранение…" : "Сохранить"}
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

"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader, Field, Toggle } from "@/app/admin/_components/ui";
import TranslationEditor, {
  TranslationBadges,
  toPayload,
  translationsFromApi,
  type TranslationsDraft,
} from "@/app/admin/_components/TranslationEditor";
import type { Locale } from "@/lib/i18n";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  translations?: Record<string, unknown>;
  translation?: {
    locales: Array<{ locale: Locale; missing: boolean; needsReview: boolean }>;
    complete: boolean;
  };
};

type Draft = Category & { translationsDraft: TranslationsDraft };

const FIELDS = [
  { key: "title" as const, label: { uz: "Nomi (UZ)", ru: "Название (RU)", en: "Name (EN)" } },
  {
    key: "description" as const,
    label: { uz: "Tavsif (UZ)", ru: "Описание (RU)", en: "Description (EN)" },
    multiline: true,
    rows: 3,
  },
];

export default function CategoriesAdmin() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ categories: Category[] }>("/api/admin/categories");
      setItems(res.categories);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openEditor(item?: Category) {
    setErr("");
    setOk("");
    setDraft({
      id: item?.id ?? 0,
      name: item?.name ?? "",
      slug: item?.slug ?? "",
      description: item?.description ?? "",
      sortOrder: item?.sortOrder ?? 0,
      isActive: item?.isActive ?? true,
      translationsDraft: translationsFromApi(item?.translations),
    });
  }

  async function save() {
    if (!draft) return;
    const name =
      draft.translationsDraft.uz.title.trim() ||
      draft.translationsDraft.ru.title.trim() ||
      draft.translationsDraft.en.title.trim() ||
      draft.name.trim();
    if (!name) {
      setErr("Укажите название хотя бы на одном языке.");
      return;
    }
    setSaving(true);
    setErr("");
    setOk("");
    try {
      const body = {
        name,
        sortOrder: draft.sortOrder,
        isActive: draft.isActive,
        translations: toPayload(draft.translationsDraft),
      };
      if (draft.id) {
        await api(`/api/admin/categories/${draft.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/admin/categories", { method: "POST", body: JSON.stringify(body) });
      }
      setDraft(null);
      setOk("Сохранено.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Удалить эту категорию?")) return;
    try {
      await api(`/api/admin/categories/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка удаления");
    }
  }

  return (
    <>
      <PageHeader
        title="Категории"
        sub="Названия фильтров на трёх языках."
        action={
          <button type="button" onClick={() => openEditor()} className="btn btn-solid">
            + Добавить категорию
          </button>
        }
      />

      {ok && <p className="mb-4 text-sm text-accent">{ok}</p>}

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">Категорий пока нет.</p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-surface">
          {items.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1">
                <p className="font-medium text-ink">{c.name}</p>
                <p className="text-xs text-faint">
                  /{c.slug} · порядок {c.sortOrder}
                </p>
                <div className="mt-1">
                  <TranslationBadges status={c.translation} />
                </div>
              </div>
              {!c.isActive && <span className="text-xs text-faint">Скрыта</span>}
              <button type="button" onClick={() => openEditor(c)} className="btn btn-ghost px-3 py-2 text-xs">
                Изменить
              </button>
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="btn btn-ghost px-3 py-2 text-xs text-red-500/90"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="mt-8 border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-xl text-ink">
            {draft.id ? "Редактировать категорию" : "Новая категория"}
          </h2>
          <TranslationEditor
            value={draft.translationsDraft}
            onChange={(next) => setDraft((d) => (d ? { ...d, translationsDraft: next } : d))}
            fields={FIELDS}
            disabled={saving}
          />
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field
              label="Порядок"
              type="number"
              value={draft.sortOrder}
              onChange={(v) => setDraft({ ...draft, sortOrder: Number(v) || 0 })}
            />
            <div className="pb-3">
              <Toggle
                checked={draft.isActive}
                onChange={(v) => setDraft({ ...draft, isActive: v })}
                label="Активна"
              />
            </div>
          </div>
          {err && <p className="mt-5 text-sm text-red-500/90">{err}</p>}
          <div className="mt-7 flex items-center gap-3">
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

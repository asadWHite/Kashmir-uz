"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import ImageField from "@/app/admin/_components/ImageField";
import { PageHeader, Field, Select, Toggle } from "@/app/admin/_components/ui";
import TranslationEditor, {
  TranslationBadges,
  emptyTranslations,
  toPayload,
  translationsFromApi,
  type TranslationsDraft,
} from "@/app/admin/_components/TranslationEditor";
import type { Locale } from "@/lib/i18n";

type TranslationStatus = {
  locales: Array<{ locale: Locale; filled: number; required: number; missing: boolean; needsReview: boolean }>;
  complete: boolean;
  missingLocales: Locale[];
};

type Curtain = {
  id: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  category: string | null;
  imageUrl: string | null;
  gallery: string[] | null;
  material: string | null;
  color: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  translations?: Record<string, unknown>;
  translation?: TranslationStatus;
};

type Category = { id: number; name: string; slug: string };

type Draft = Curtain & { translationsDraft: TranslationsDraft };

const blank: Omit<Curtain, "id"> = {
  name: "",
  description: "",
  categoryId: null,
  category: "",
  imageUrl: "",
  gallery: null,
  material: "",
  color: "",
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
};

const CURTAIN_FIELDS = [
  {
    key: "title" as const,
    label: { uz: "Nomi (UZ)", ru: "Название (RU)", en: "Name (EN)" },
  },
  {
    key: "description" as const,
    label: { uz: "Tavsif (UZ)", ru: "Описание (RU)", en: "Description (EN)" },
    multiline: true,
    rows: 4,
  },
  {
    key: "seoTitle" as const,
    label: { uz: "SEO sarlavha (UZ)", ru: "SEO заголовок (RU)", en: "SEO title (EN)" },
  },
  {
    key: "seoDescription" as const,
    label: { uz: "SEO tavsif (UZ)", ru: "SEO описание (RU)", en: "SEO description (EN)" },
    multiline: true,
    rows: 2,
  },
  {
    extraKey: "material",
    label: { uz: "Material (UZ)", ru: "Материал (RU)", en: "Material (EN)" },
  },
  {
    extraKey: "color",
    label: { uz: "Rang (UZ)", ru: "Цвет (RU)", en: "Colour (EN)" },
  },
];

export default function CurtainsAdmin() {
  const [items, setItems] = useState<Curtain[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [c, cs] = await Promise.all([
        api<{ curtains: Curtain[] }>("/api/admin/curtains"),
        api<{ categories: Category[] }>("/api/admin/categories"),
      ]);
      setItems(c.curtains);
      setCats(cs.categories);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update<K extends keyof Curtain>(key: K, val: Curtain[K]) {
    setDraft((d) => (d ? { ...d, [key]: val } : d));
  }

  function openEditor(item?: Curtain) {
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
    const primaryTitle =
      draft.translationsDraft.uz.title.trim() ||
      draft.translationsDraft.ru.title.trim() ||
      draft.translationsDraft.en.title.trim() ||
      draft.name.trim();
    if (!primaryTitle) {
      setErr("Укажите название хотя бы на одном языке.");
      return;
    }
    setSaving(true);
    setErr("");
    setOk("");
    const categoryName =
      cats.find((c) => c.id === draft.categoryId)?.name ?? draft.category ?? null;
    const body = {
      // Shared, non-translatable fields.
      name: primaryTitle,
      categoryId: draft.categoryId,
      category: categoryName,
      imageUrl: draft.imageUrl,
      gallery: draft.gallery ?? null,
      material: draft.material,
      color: draft.color,
      isFeatured: draft.isFeatured,
      isActive: draft.isActive,
      sortOrder: draft.sortOrder,
      // Only the languages that actually contain text are sent.
      translations: toPayload(draft.translationsDraft),
    };
    try {
      if (draft.id) {
        await api(`/api/admin/curtains/${draft.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/admin/curtains", { method: "POST", body: JSON.stringify(body) });
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

  async function saveSingleLocale(locale: Locale) {
    if (!draft?.id) return;
    setSaving(true);
    setErr("");
    setOk("");
    try {
      const payload = toPayload({ ...draft.translationsDraft, ...{} });
      const only: Record<string, unknown> = {};
      if (payload[locale]) only[locale] = payload[locale];
      if (Object.keys(only).length === 0) {
        setErr(`Заполните хотя бы одно поле для языка ${locale.toUpperCase()}.`);
        return;
      }
      const res = await api<{ translations?: Record<string, unknown> }>(
        `/api/admin/curtains/${draft.id}`,
        { method: "PATCH", body: JSON.stringify({ translations: only }) },
      );
      setDraft((d) => (d ? { ...d, translationsDraft: translationsFromApi(res.translations) } : d));
      setOk(`Язык ${locale.toUpperCase()} сохранён. Остальные языки не изменялись.`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Удалить эту штору навсегда?")) return;
    try {
      await api(`/api/admin/curtains/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка удаления");
    }
  }

  async function quickToggle(it: Curtain, key: "isActive" | "isFeatured") {
    try {
      await api(`/api/admin/curtains/${it.id}`, {
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
        title="Шторы"
        sub="Три языка независимо: узбекский, русский, английский. Изображения и свойства общие."
        action={
          <button type="button" onClick={() => openEditor()} className="btn btn-solid">
            + Добавить штору
          </button>
        }
      />

      {ok && <p className="mb-4 text-sm text-accent">{ok}</p>}

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">
          Штор пока нет. Добавьте первую.
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
                  <p className="truncate font-medium text-ink">{it.name}</p>
                  <p className="truncate text-xs text-faint">
                    {[it.category, it.material].filter(Boolean).join(" · ") || "—"}
                  </p>
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
                <button
                  type="button"
                  onClick={() => quickToggle(it, "isFeatured")}
                  className={it.isFeatured ? "text-ink" : "text-faint"}
                >
                  {it.isFeatured ? "★ В избранном" : "☆ В избранное"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditor(it)}
                  className="btn btn-ghost px-3 py-2 text-xs"
                >
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
          <h2 className="mb-2 font-display text-xl text-ink">
            {draft.id ? "Редактировать штору" : "Новая штора"}
          </h2>
          <p className="mb-6 text-sm text-muted">
            Общие свойства (изображение, категория, порядок, публикация) одинаковы для всех языков.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Select
              label="Категория"
              value={draft.categoryId ?? ""}
              onChange={(v) => update("categoryId", v ? Number(v) : null)}
            >
              <option value="">— Нет —</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Field
              label="Порядок"
              type="number"
              value={draft.sortOrder}
              onChange={(v) => update("sortOrder", Number(v) || 0)}
            />
            <Field
              label="Цвет (общий, если не переведён)"
              value={draft.color ?? ""}
              onChange={(v) => update("color", v)}
            />
            <Field
              label="Материал (общий, если не переведён)"
              value={draft.material ?? ""}
              onChange={(v) => update("material", v)}
            />
          </div>

          <div className="mt-6">
            <TranslationEditor
              value={draft.translationsDraft}
              onChange={(next) => setDraft((d) => (d ? { ...d, translationsDraft: next } : d))}
              fields={CURTAIN_FIELDS}
              disabled={saving}
            />
          </div>

          <div className="mt-6">
            <ImageField value={draft.imageUrl ?? ""} onChange={(v) => update("imageUrl", v)} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-8">
            <Toggle checked={draft.isActive} onChange={(v) => update("isActive", v)} label="Виден на сайте" />
            <Toggle checked={draft.isFeatured} onChange={(v) => update("isFeatured", v)} label="Избранное" />
          </div>

          {err && <p className="mt-5 text-sm text-red-500/90">{err}</p>}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="btn btn-solid">
              {saving ? "Сохранение…" : "Сохранить штору"}
            </button>
            {draft.id ? (
              <>
                <button
                  type="button"
                  onClick={() => saveSingleLocale("uz")}
                  disabled={saving}
                  className="btn btn-ghost text-xs"
                >
                  Сохранить только UZ
                </button>
                <button
                  type="button"
                  onClick={() => saveSingleLocale("ru")}
                  disabled={saving}
                  className="btn btn-ghost text-xs"
                >
                  Сохранить только RU
                </button>
                <button
                  type="button"
                  onClick={() => saveSingleLocale("en")}
                  disabled={saving}
                  className="btn btn-ghost text-xs"
                >
                  Сохранить только EN
                </button>
              </>
            ) : null}
            <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost">
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  );
}

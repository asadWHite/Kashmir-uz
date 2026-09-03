"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import ImageField from "@/app/admin/_components/ImageField";
import { PageHeader, Field, TextArea, Toggle } from "@/app/admin/_components/ui";

type Interior = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  location: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
};

const blank: Omit<Interior, "id"> = {
  title: "",
  description: "",
  imageUrl: "",
  location: "",
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
};

export default function InteriorsAdmin() {
  const [items, setItems] = useState<Interior[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<(Interior & { id: number }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) {
      setErr("Укажите заголовок.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      if (draft.id) {
        await api(`/api/admin/interiors/${draft.id}`, {
          method: "PUT",
          body: JSON.stringify(draft),
        });
      } else {
        await api("/api/admin/interiors", { method: "POST", body: JSON.stringify(draft) });
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
        sub="Управляйте интерьерными проектами в редакционной галерее."
        action={
          <button type="button" onClick={() => setDraft({ id: 0, ...blank })} className="btn btn-solid">
            + Добавить интерьер
          </button>
        }
      />

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
                <button type="button" onClick={() => setDraft({ ...it })} className="btn btn-ghost px-3 py-2 text-xs">
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Заголовок" value={draft.title} onChange={(v) => update("title", v)} />
            <Field label="Локация" value={draft.location ?? ""} onChange={(v) => update("location", v)} />
            <Field label="Порядок" type="number" value={draft.sortOrder} onChange={(v) => update("sortOrder", Number(v) || 0)} />
          </div>
          <div className="mt-6">
            <TextArea label="Описание" value={draft.description ?? ""} onChange={(v) => update("description", v)} />
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

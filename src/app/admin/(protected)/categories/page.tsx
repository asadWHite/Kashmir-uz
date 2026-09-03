"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader, Field, TextArea, Toggle } from "@/app/admin/_components/ui";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

const blank = { id: 0, name: "", description: "", sortOrder: 0, isActive: true };

export default function CategoriesAdmin() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<(typeof blank) | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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

  async function save() {
    if (!draft || !draft.name.trim()) {
      setErr("Укажите название.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      if (draft.id) {
        await api(`/api/admin/categories/${draft.id}`, { method: "PUT", body: JSON.stringify(draft) });
      } else {
        await api("/api/admin/categories", { method: "POST", body: JSON.stringify(draft) });
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
        sub="Группируйте шторы по коллекциям."
        action={
          <button type="button" onClick={() => setDraft({ ...blank })} className="btn btn-solid">
            + Добавить категорию
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">Категорий пока нет.</p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-surface">
          {items.map((c) => (
            <li key={c.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-medium text-ink">{c.name}</p>
                <p className="text-xs text-faint">/{c.slug} · порядок {c.sortOrder}</p>
              </div>
              {!c.isActive && <span className="text-xs text-faint">Скрыта</span>}
              <button type="button" onClick={() => setDraft({ id: c.id, name: c.name, description: c.description ?? "", sortOrder: c.sortOrder, isActive: c.isActive })} className="btn btn-ghost px-3 py-2 text-xs">Изменить</button>
              <button type="button" onClick={() => remove(c.id)} className="btn btn-ghost px-3 py-2 text-xs text-red-500/90">Удалить</button>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="mt-8 border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-xl text-ink">{draft.id ? "Редактировать категорию" : "Новая категория"}</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Название" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <Field label="Порядок" type="number" value={draft.sortOrder} onChange={(v) => setDraft({ ...draft, sortOrder: Number(v) || 0 })} />
          </div>
          <div className="mt-6">
            <TextArea label="Описание" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} rows={3} />
          </div>
          <div className="mt-6">
            <Toggle checked={draft.isActive} onChange={(v) => setDraft({ ...draft, isActive: v })} label="Активна" />
          </div>
          {err && <p className="mt-5 text-sm text-red-500/90">{err}</p>}
          <div className="mt-7 flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="btn btn-solid">{saving ? "Сохранение…" : "Сохранить"}</button>
            <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost">Отмена</button>
          </div>
        </div>
      )}
    </>
  );
}

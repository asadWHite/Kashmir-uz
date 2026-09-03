"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader, Field, Toggle } from "@/app/admin/_components/ui";

type Stat = {
  id: number;
  label: string;
  value: string;
  suffix: string | null;
  sortOrder: number;
  isActive: boolean;
};

const blank = { id: 0, label: "", value: "0", suffix: "", sortOrder: 0, isActive: true };

export default function StatisticsAdmin() {
  const [items, setItems] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<typeof blank | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ statistics: Stat[] }>("/api/admin/statistics");
      setItems(res.statistics);
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
    if (!draft || !draft.label.trim()) {
      setErr("Укажите метку.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      if (draft.id) {
        await api(`/api/admin/statistics/${draft.id}`, { method: "PUT", body: JSON.stringify(draft) });
      } else {
        await api("/api/admin/statistics", { method: "POST", body: JSON.stringify(draft) });
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
    if (!confirm("Удалить эту статистику?")) return;
    try {
      await api(`/api/admin/statistics/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка удаления");
    }
  }

  return (
    <>
      <PageHeader
        title="Статистика"
        sub="Цифры, показываемые в блоке «В цифрах» на главной."
        action={<button type="button" onClick={() => setDraft({ ...blank })} className="btn btn-solid">+ Добавить статистику</button>}
      />

      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">Статистики пока нет.</p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-surface">
          {items.map((s) => (
            <li key={s.id} className="flex items-center gap-4 p-4">
              <p className="font-display text-2xl text-ink">{s.value}{s.suffix}</p>
              <div className="flex-1">
                <p className="font-medium text-ink">{s.label}</p>
                <p className="text-xs text-faint">порядок {s.sortOrder}{!s.isActive ? " · скрыта" : ""}</p>
              </div>
              <button type="button" onClick={() => setDraft({ id: s.id, label: s.label, value: s.value, suffix: s.suffix ?? "", sortOrder: s.sortOrder, isActive: s.isActive })} className="btn btn-ghost px-3 py-2 text-xs">Изменить</button>
              <button type="button" onClick={() => remove(s.id)} className="btn btn-ghost px-3 py-2 text-xs text-red-500/90">Удалить</button>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="mt-8 border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-xl text-ink">{draft.id ? "Редактировать статистику" : "Новая статистика"}</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Field label="Метка" value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} />
            <Field label="Значение" value={draft.value} onChange={(v) => setDraft({ ...draft, value: v })} />
            <Field label="Суффикс" value={draft.suffix} onChange={(v) => setDraft({ ...draft, suffix: v })} placeholder="+ или %" />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Порядок" type="number" value={draft.sortOrder} onChange={(v) => setDraft({ ...draft, sortOrder: Number(v) || 0 })} />
            <div className="flex items-end pb-3">
              <Toggle checked={draft.isActive} onChange={(v) => setDraft({ ...draft, isActive: v })} label="Активна" />
            </div>
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

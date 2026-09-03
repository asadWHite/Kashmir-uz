"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader, Field, TextArea } from "@/app/admin/_components/ui";

type Settings = {
  instagramUrl: string;
  telegramUrl: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  heroEyebrow: string;
  heroStatement: string;
  aboutTitle: string;
  aboutText: string;
  mapsQuery: string;
};

const EMPTY: Settings = {
  instagramUrl: "",
  telegramUrl: "",
  phone: "",
  email: "",
  address: "",
  workingHours: "",
  heroEyebrow: "",
  heroStatement: "",
  aboutTitle: "",
  aboutText: "",
  mapsQuery: "",
};

export default function SettingsAdmin() {
  const [form, setForm] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ settings: Partial<Settings> | null }>("/api/admin/settings");
        if (res.settings) {
          setForm({ ...EMPTY, ...res.settings } as Settings);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof Settings>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(form) });
      setMsg("Сохранено. Сайт обновлён.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Загрузка…</p>;

  return (
    <>
      <PageHeader title="Настройки" sub="Контакты, соцсети и тексты на сайте." />

      <div className="space-y-10">
        <section className="border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-lg text-ink">Контакты и соцсети</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Ссылка на Instagram" value={form.instagramUrl} onChange={(v) => set("instagramUrl", v)} />
            <Field label="Ссылка на Telegram" value={form.telegramUrl} onChange={(v) => set("telegramUrl", v)} />
            <Field label="Телефон" value={form.phone} onChange={(v) => set("phone", v)} />
            <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
            <Field label="Часы работы" value={form.workingHours} onChange={(v) => set("workingHours", v)} />
            <Field label="Запрос для карты" value={form.mapsQuery} onChange={(v) => set("mapsQuery", v)} />
          </div>
          <div className="mt-6">
            <TextArea label="Адрес" value={form.address} onChange={(v) => set("address", v)} rows={2} />
          </div>
        </section>

        <section className="border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-3 font-display text-lg text-ink">Тексты главной</h2>
          <p className="text-sm text-muted">
            Тексты автоматически переводятся на русский (по умолчанию),
            английский и узбекский.
          </p>
        </section>

        {msg && <p className="text-sm text-accent">{msg}</p>}

        <button type="button" onClick={save} disabled={saving} className="btn btn-solid">
          {saving ? "Сохранение…" : "Сохранить настройки"}
        </button>
      </div>
    </>
  );
}

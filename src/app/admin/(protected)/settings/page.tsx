"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader, Field } from "@/app/admin/_components/ui";
import TranslationEditor, {
  toPayload,
  translationsFromApi,
  type TranslationsDraft,
} from "@/app/admin/_components/TranslationEditor";

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

const FIELDS = [
  { extraKey: "heroEyebrow", label: { uz: "Kichik sarlavha", ru: "Надзаголовок hero", en: "Hero eyebrow" } },
  {
    key: "title" as const,
    label: { uz: "Hero matni", ru: "Текст hero", en: "Hero statement" },
    multiline: true,
    rows: 2,
  },
  { extraKey: "aboutTitle", label: { uz: "«Biz haqimizda» sarlavhasi", ru: "Заголовок «О салоне»", en: "About title" } },
  {
    key: "description" as const,
    label: { uz: "«Biz haqimizda» matni", ru: "Текст «О салоне»", en: "About text" },
    multiline: true,
    rows: 5,
  },
  { extraKey: "address", label: { uz: "Manzil", ru: "Адрес", en: "Address" } },
  { extraKey: "workingHours", label: { uz: "Ish vaqti", ru: "Часы работы", en: "Working hours" } },
];

export default function SettingsAdmin() {
  const [form, setForm] = useState<Settings>(EMPTY);
  const [tr, setTr] = useState<TranslationsDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ settings: Partial<Settings> | null; translations?: unknown }>(
          "/api/admin/settings",
        );
        if (res.settings) setForm({ ...EMPTY, ...res.settings } as Settings);
        setTr(translationsFromApi(res.translations));
      } catch {
        setTr(translationsFromApi(null));
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
      const res = await api<{ translations?: unknown }>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ ...form, translations: tr ? toPayload(tr) : {} }),
      });
      if (res.translations) setTr(translationsFromApi(res.translations));
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
      <PageHeader title="Настройки" sub="Контакты (общие) и тексты главной (на трёх языках)." />

      <div className="space-y-10">
        <section className="border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-2 font-display text-lg text-ink">Контакты и соцсети</h2>
          <p className="mb-6 text-sm text-muted">
            Эти поля одинаковы для всех языков: телефон, e-mail, ссылки и запрос для карты.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Ссылка на Instagram" value={form.instagramUrl} onChange={(v) => set("instagramUrl", v)} />
            <Field label="Ссылка на Telegram" value={form.telegramUrl} onChange={(v) => set("telegramUrl", v)} />
            <Field label="Телефон" value={form.phone} onChange={(v) => set("phone", v)} />
            <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
            <Field label="Запрос для карты" value={form.mapsQuery} onChange={(v) => set("mapsQuery", v)} />
          </div>
        </section>

        <section className="border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-2 font-display text-lg text-ink">Тексты главной</h2>
          <p className="mb-6 text-sm text-muted">
            Каждый язык сохраняется независимо. Пустое поле означает «перевод ещё не готов» — сайт
            покажет корректное сообщение вместо текста на другом языке.
          </p>
          {tr ? (
            <TranslationEditor
              value={tr}
              onChange={setTr}
              fields={FIELDS}
              disabled={saving}
            />
          ) : null}
        </section>

        {msg && <p className="text-sm text-accent">{msg}</p>}

        <button type="button" onClick={save} disabled={saving} className="btn btn-solid">
          {saving ? "Сохранение…" : "Сохранить настройки"}
        </button>
      </div>
    </>
  );
}

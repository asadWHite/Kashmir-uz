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
      setMsg("Saved. The public site is updated.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <>
      <PageHeader title="Settings" sub="Contact details, social links and on-site copy." />

      <div className="space-y-10">
        <section className="border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-lg text-ink">Contact & social</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Instagram URL" value={form.instagramUrl} onChange={(v) => set("instagramUrl", v)} />
            <Field label="Telegram URL" value={form.telegramUrl} onChange={(v) => set("telegramUrl", v)} />
            <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
            <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
            <Field label="Working hours" value={form.workingHours} onChange={(v) => set("workingHours", v)} />
            <Field label="Map search query" value={form.mapsQuery} onChange={(v) => set("mapsQuery", v)} />
          </div>
          <div className="mt-6">
            <TextArea label="Address" value={form.address} onChange={(v) => set("address", v)} rows={2} />
          </div>
        </section>

        <section className="border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-3 font-display text-lg text-ink">Homepage copy</h2>
          <p className="text-sm text-muted">
            Hero and studio text are translated automatically into Russian
            (default), English and Uzbek.
          </p>
        </section>

        {msg && <p className="text-sm text-accent">{msg}</p>}

        <button type="button" onClick={save} disabled={saving} className="btn btn-solid">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </>
  );
}

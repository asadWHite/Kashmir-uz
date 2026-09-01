"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import ImageField from "@/app/admin/_components/ImageField";
import { PageHeader, Field, TextArea, Toggle } from "@/app/admin/_components/ui";
import { useT } from "@/app/components/I18nProvider";

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
  const { ta } = useT();
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
      setErr(e instanceof Error ? e.message : ta("a.errLoad"));
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
      setErr(ta("a.reqTitle"));
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
      setErr(e instanceof Error ? e.message : ta("a.errSave"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm(ta("a.confirmDelInterior"))) return;
    try {
      await api(`/api/admin/interiors/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : ta("a.errDelete"));
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
      alert(e instanceof Error ? e.message : ta("a.errUpdate"));
    }
  }

  return (
    <>
      <PageHeader
        title={ta("a.interiors")}
        sub={ta("a.interiorsSub")}
        action={
          <button type="button" onClick={() => setDraft({ id: 0, ...blank })} className="btn btn-solid">
            + {ta("a.addInterior")}
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted">{ta("a.loading")}</p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">
          {ta("a.noInteriors")}
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
                  {it.isActive ? ta("a.visible") : ta("a.hidden")}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setDraft({ ...it })} className="btn btn-ghost px-3 py-2 text-xs">
                  {ta("a.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="btn btn-ghost px-3 py-2 text-xs text-red-500/90"
                >
                  {ta("a.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="mt-8 border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-xl text-ink">
            {draft.id ? ta("a.editInterior") : ta("a.newInterior")}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label={ta("a.title_field")} value={draft.title} onChange={(v) => update("title", v)} />
            <Field label={ta("a.location")} value={draft.location ?? ""} onChange={(v) => update("location", v)} />
            <Field label={ta("a.sort")} type="number" value={draft.sortOrder} onChange={(v) => update("sortOrder", Number(v) || 0)} />
          </div>
          <div className="mt-6">
            <TextArea label={ta("a.description")} value={draft.description ?? ""} onChange={(v) => update("description", v)} />
          </div>
          <div className="mt-6">
            <ImageField value={draft.imageUrl ?? ""} onChange={(v) => update("imageUrl", v)} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-8">
            <Toggle checked={draft.isActive} onChange={(v) => update("isActive", v)} label={ta("a.visibleOnSite")} />
            <Toggle checked={draft.isFeatured} onChange={(v) => update("isFeatured", v)} label={ta("a.featured")} />
          </div>

          {err && <p className="mt-5 text-sm text-red-500/90">{err}</p>}

          <div className="mt-7 flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="btn btn-solid">
              {saving ? ta("a.saving") : ta("a.saveInterior")}
            </button>
            <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost">
              {ta("a.cancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

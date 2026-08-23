"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import ImageField from "@/app/admin/_components/ImageField";
import { PageHeader, Field, Toggle } from "@/app/admin/_components/ui";

type Gallery = {
  id: number;
  title: string | null;
  imageUrl: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
};

const blank = { id: 0, title: "", imageUrl: "", category: "interior", isActive: true, sortOrder: 0 };
const CATS = ["interior", "curtain", "project"];

export default function GalleryAdmin() {
  const [items, setItems] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<typeof blank | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ gallery: Gallery[] }>("/api/admin/gallery");
      setItems(res.gallery);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!draft || !draft.imageUrl.trim()) {
      setErr("Image is required.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      if (draft.id) {
        await api(`/api/admin/gallery/${draft.id}`, { method: "PUT", body: JSON.stringify(draft) });
      } else {
        await api("/api/admin/gallery", { method: "POST", body: JSON.stringify(draft) });
      }
      setDraft(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this image?")) return;
    try {
      await api(`/api/admin/gallery/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <>
      <PageHeader
        title="Gallery"
        sub="Manage the dedicated gallery page images."
        action={<button type="button" onClick={() => setDraft({ ...blank })} className="btn btn-solid">+ Add image</button>}
      />
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">No gallery images yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((g) => (
            <div key={g.id} className="border border-line bg-surface p-3">
              <div className="aspect-square overflow-hidden bg-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <p className="mt-2 truncate text-xs text-ink">{g.title || "Untitled"}</p>
              <p className="text-[0.65rem] text-faint capitalize">{g.category}{!g.isActive ? " · hidden" : ""}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setDraft({ ...g, title: g.title ?? "" })} className="btn btn-ghost px-2 py-1 text-[0.65rem]">Edit</button>
                <button type="button" onClick={() => remove(g.id)} className="btn btn-ghost px-2 py-1 text-[0.65rem] text-red-500/90">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <div className="mt-8 border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-xl text-ink">{draft.id ? "Edit image" : "New image"}</h2>
          <div className="space-y-5">
            <Field label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
            <div>
              <label className="eyebrow">Category</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="field bg-transparent capitalize"
              >
                {CATS.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
            <ImageField value={draft.imageUrl} onChange={(v) => setDraft({ ...draft, imageUrl: v })} />
            <Field label="Sort order" type="number" value={draft.sortOrder} onChange={(v) => setDraft({ ...draft, sortOrder: Number(v) || 0 })} />
            <Toggle checked={draft.isActive} onChange={(v) => setDraft({ ...draft, isActive: v })} label="Visible" />
          </div>
          {err && <p className="mt-5 text-sm text-red-500/90">{err}</p>}
          <div className="mt-7 flex gap-3">
            <button type="button" onClick={save} disabled={saving} className="btn btn-solid">{saving ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

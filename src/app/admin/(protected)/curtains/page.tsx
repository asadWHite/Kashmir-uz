"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import ImageField from "@/app/admin/_components/ImageField";
import { PageHeader, Field, TextArea, Select, Toggle } from "@/app/admin/_components/ui";

type Curtain = {
  id: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  category: string | null;
  imageUrl: string | null;
  material: string | null;
  color: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
};

type Category = { id: number; name: string; slug: string };

const blank: Omit<Curtain, "id"> = {
  name: "",
  description: "",
  categoryId: null,
  category: "",
  imageUrl: "",
  material: "",
  color: "",
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
};

export default function CurtainsAdmin() {
  const [items, setItems] = useState<Curtain[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<(Curtain & { id: number }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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
      setErr(e instanceof Error ? e.message : "Load failed");
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

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      setErr("Name is required.");
      return;
    }
    setSaving(true);
    setErr("");
    const categoryName =
      cats.find((c) => c.id === draft.categoryId)?.name ?? draft.category ?? null;
    const body = { ...draft, category: categoryName };
    try {
      if (draft.id) {
        await api(`/api/admin/curtains/${draft.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/admin/curtains", { method: "POST", body: JSON.stringify(body) });
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
    if (!confirm("Delete this curtain permanently?")) return;
    try {
      await api(`/api/admin/curtains/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
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
      alert(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <>
      <PageHeader
        title="Curtains"
        sub="Add, edit, hide and curate your curtain collection."
        action={
          <button
            type="button"
            onClick={() => setDraft({ id: 0, ...blank })}
            className="btn btn-solid"
          >
            + Add curtain
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">
          No curtains yet. Add your first.
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
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => quickToggle(it, "isActive")}
                  className={`rounded-full border px-3 py-1 transition-colors ${
                    it.isActive
                      ? "border-ink text-ink"
                      : "border-line-strong text-faint"
                  }`}
                >
                  {it.isActive ? "Visible" : "Hidden"}
                </button>
                <button
                  type="button"
                  onClick={() => quickToggle(it, "isFeatured")}
                  className={it.isFeatured ? "text-ink" : "text-faint"}
                >
                  {it.isFeatured ? "★ Featured" : "☆ Feature"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ ...it })}
                  className="btn btn-ghost px-3 py-2 text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="btn btn-ghost px-3 py-2 text-xs text-red-500/90"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="mt-8 border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-xl text-ink">
            {draft.id ? "Edit curtain" : "New curtain"}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Name" value={draft.name} onChange={(v) => update("name", v)} placeholder="Atelier Taupe Drape" />
            <Select label="Category" value={draft.categoryId ?? ""} onChange={(v) => update("categoryId", v ? Number(v) : null)}>
              <option value="">— None —</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Field label="Material" value={draft.material ?? ""} onChange={(v) => update("material", v)} />
            <Field label="Color" value={draft.color ?? ""} onChange={(v) => update("color", v)} />
            <Field label="Sort order" type="number" value={draft.sortOrder} onChange={(v) => update("sortOrder", Number(v) || 0)} />
          </div>
          <div className="mt-6">
            <TextArea label="Description" value={draft.description ?? ""} onChange={(v) => update("description", v)} />
          </div>
          <div className="mt-6">
            <ImageField value={draft.imageUrl ?? ""} onChange={(v) => update("imageUrl", v)} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-8">
            <Toggle checked={draft.isActive} onChange={(v) => update("isActive", v)} label="Visible on site" />
            <Toggle checked={draft.isFeatured} onChange={(v) => update("isFeatured", v)} label="Featured" />
          </div>

          {err && <p className="mt-5 text-sm text-red-500/90">{err}</p>}

          <div className="mt-7 flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="btn btn-solid">
              {saving ? "Saving…" : "Save curtain"}
            </button>
            <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

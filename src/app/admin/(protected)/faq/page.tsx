"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader, Field, TextArea, Toggle } from "@/app/admin/_components/ui";

type Faq = {
  id: number;
  questionEn: string;
  questionRu: string | null;
  questionUz: string | null;
  answerEn: string;
  answerRu: string | null;
  answerUz: string | null;
  sortOrder: number;
  isActive: boolean;
};

const blank = {
  id: 0,
  questionEn: "", questionRu: "", questionUz: "",
  answerEn: "", answerRu: "", answerUz: "",
  sortOrder: 0, isActive: true,
};

export default function FaqAdmin() {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<typeof blank | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ faq: Faq[] }>("/api/admin/faq");
      setItems(res.faq);
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
    if (!draft || !draft.questionEn.trim()) {
      setErr("Question (EN) is required.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      if (draft.id) {
        await api(`/api/admin/faq/${draft.id}`, { method: "PUT", body: JSON.stringify(draft) });
      } else {
        await api("/api/admin/faq", { method: "POST", body: JSON.stringify(draft) });
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
    if (!confirm("Delete this FAQ?")) return;
    try {
      await api(`/api/admin/faq/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <>
      <PageHeader
        title="FAQ"
        sub="Manage frequently asked questions in 3 languages."
        action={<button type="button" onClick={() => setDraft({ ...blank })} className="btn btn-solid">+ Add question</button>}
      />
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">No questions yet.</p>
      ) : (
        <ul className="divide-y divide-line border border-line bg-surface">
          {items.map((f) => (
            <li key={f.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-medium text-ink">{f.questionEn}</p>
                <p className="mt-1 truncate text-xs text-faint">{f.answerEn}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      id: f.id,
                      questionEn: f.questionEn, questionRu: f.questionRu ?? "", questionUz: f.questionUz ?? "",
                      answerEn: f.answerEn, answerRu: f.answerRu ?? "", answerUz: f.answerUz ?? "",
                      sortOrder: f.sortOrder, isActive: f.isActive,
                    })
                  }
                  className="btn btn-ghost px-3 py-2 text-xs"
                >
                  Edit
                </button>
                <button type="button" onClick={() => remove(f.id)} className="btn btn-ghost px-3 py-2 text-xs text-red-500/90">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="mt-8 border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-6 font-display text-xl text-ink">{draft.id ? "Edit question" : "New question"}</h2>
          <p className="eyebrow mb-3">English</p>
          <div className="space-y-5">
            <Field label="Question (EN) *" value={draft.questionEn} onChange={(v) => setDraft({ ...draft, questionEn: v })} />
            <TextArea label="Answer (EN)" value={draft.answerEn} onChange={(v) => setDraft({ ...draft, answerEn: v })} rows={3} />
          </div>
          <p className="eyebrow mb-3 mt-6">Russian</p>
          <div className="space-y-5">
            <Field label="Question (RU)" value={draft.questionRu} onChange={(v) => setDraft({ ...draft, questionRu: v })} />
            <TextArea label="Answer (RU)" value={draft.answerRu} onChange={(v) => setDraft({ ...draft, answerRu: v })} rows={3} />
          </div>
          <p className="eyebrow mb-3 mt-6">Uzbek</p>
          <div className="space-y-5">
            <Field label="Question (UZ)" value={draft.questionUz} onChange={(v) => setDraft({ ...draft, questionUz: v })} />
            <TextArea label="Answer (UZ)" value={draft.answerUz} onChange={(v) => setDraft({ ...draft, answerUz: v })} rows={3} />
          </div>
          <div className="mt-6 flex items-center gap-8">
            <Field label="Sort order" type="number" value={draft.sortOrder} onChange={(v) => setDraft({ ...draft, sortOrder: Number(v) || 0 })} />
            <div className="pb-3"><Toggle checked={draft.isActive} onChange={(v) => setDraft({ ...draft, isActive: v })} label="Active" /></div>
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

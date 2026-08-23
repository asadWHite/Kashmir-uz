"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader } from "@/app/admin/_components/ui";

type Lead = {
  id: number;
  name: string;
  phone: string | null;
  telegram: string | null;
  interest: string | null;
  room: string | null;
  message: string | null;
  source: string | null;
  status: string;
  createdAt: string;
};

const STATUSES = ["new", "contacted", "in_progress", "converted", "closed"];

export default function LeadsAdmin() {
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ leads: Lead[] }>("/api/admin/leads");
      setItems(res.leads);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function changeStatus(id: number, status: string) {
    try {
      await api(`/api/admin/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this lead?")) return;
    try {
      await api(`/api/admin/leads/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const filtered = filter === "all" ? items : items.filter((l) => l.status === filter);

  return (
    <>
      <PageHeader title="Leads" sub="Sales enquiries from the lead flow." />
      <div className="mb-5 flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full border px-4 py-1.5 text-xs capitalize transition-colors ${
              filter === s ? "border-ink text-ink" : "border-line text-faint hover:text-muted"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">No leads yet.</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((l) => (
            <li key={l.id} className="border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{l.name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    {l.interest && <span>Style: {l.interest}</span>}
                    {l.room && <span>Room: {l.room}</span>}
                    {l.phone && <a href={`tel:${l.phone}`} className="hover:text-ink">{l.phone}</a>}
                    {l.telegram && <span>TG: {l.telegram}</span>}
                    <span>{new Date(l.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <select
                  value={l.status}
                  onChange={(e) => changeStatus(l.id, e.target.value)}
                  className="border border-line bg-transparent px-3 py-1 text-xs capitalize text-ink"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              {l.message && <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{l.message}</p>}
              <button
                type="button"
                onClick={() => remove(l.id)}
                className="btn btn-ghost mt-4 px-3 py-2 text-xs text-red-500/90"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

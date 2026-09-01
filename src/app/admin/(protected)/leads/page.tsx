"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader } from "@/app/admin/_components/ui";
import { useT } from "@/app/components/I18nProvider";

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
  const { ta } = useT();
  const statusLabel = (s: string) =>
    ({
      all: ta("a.all"),
      new: ta("a.new"),
      contacted: ta("a.contacted"),
      in_progress: ta("a.inProgress"),
      converted: ta("a.converted"),
      closed: ta("a.closed"),
    })[s] ?? s;
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
      alert(e instanceof Error ? e.message : ta("a.errUpdate"));
    }
  }

  async function remove(id: number) {
    if (!confirm(ta("a.confirmDelLead"))) return;
    try {
      await api(`/api/admin/leads/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : ta("a.errDelete"));
    }
  }

  const filtered = filter === "all" ? items : items.filter((l) => l.status === filter);

  return (
    <>
      <PageHeader title={ta("a.leads")} sub={ta("a.leadsSub")} />
      <div className="mb-5 flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
              filter === s ? "border-ink text-ink" : "border-line text-faint hover:text-muted"
            }`}
          >
            {statusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">{ta("a.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-faint">{ta("a.noLeads")}</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((l) => (
            <li key={l.id} className="border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{l.name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    {l.interest && <span>{ta("a.style")}: {l.interest}</span>}
                    {l.room && <span>{ta("a.room")}: {l.room}</span>}
                    {l.phone && <a href={`tel:${l.phone}`} className="hover:text-ink">{l.phone}</a>}
                    {l.telegram && <span>{ta("a.telegram")}: {l.telegram}</span>}
                    <span>{new Date(l.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <select
                  value={l.status}
                  onChange={(e) => changeStatus(l.id, e.target.value)}
                  className="border border-line bg-transparent px-3 py-1 text-xs text-ink"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
              </div>
              {l.message && <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{l.message}</p>}
              <button
                type="button"
                onClick={() => remove(l.id)}
                className="btn btn-ghost mt-4 px-3 py-2 text-xs text-red-500/90"
              >
                {ta("a.delete")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

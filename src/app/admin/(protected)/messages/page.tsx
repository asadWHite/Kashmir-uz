"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader } from "@/app/admin/_components/ui";
import { useT } from "@/app/components/I18nProvider";

type Message = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  status: string;
  createdAt: string;
};

const STATUSES = ["new", "contacted", "closed"];

export default function MessagesAdmin() {
  const { ta } = useT();
  const statusLabel = (s: string) =>
    ({ all: ta("a.all"), new: ta("a.new"), contacted: ta("a.contacted"), closed: ta("a.closed") })[s] ?? s;
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ messages: Message[] }>("/api/admin/messages");
      setItems(res.messages);
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
      await api(`/api/admin/messages/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : ta("a.errUpdate"));
    }
  }

  async function remove(id: number) {
    if (!confirm(ta("a.confirmDelMessage"))) return;
    try {
      await api(`/api/admin/messages/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : ta("a.errDelete"));
    }
  }

  const filtered = filter === "all" ? items : items.filter((m) => m.status === filter);

  return (
    <>
      <PageHeader title={ta("a.messages")} sub={ta("a.messagesSub")} />

      <div className="mb-5 flex gap-2">
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
        <p className="border border-line bg-surface p-6 text-sm text-faint">{ta("a.noMsgs")}</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((m) => (
            <li key={m.id} className="border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{m.name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    {m.phone && <a href={`tel:${m.phone}`} className="hover:text-ink">{m.phone}</a>}
                    {m.email && <a href={`mailto:${m.email}`} className="hover:text-ink">{m.email}</a>}
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <select
                  value={m.status}
                  onChange={(e) => changeStatus(m.id, e.target.value)}
                  className="border border-line bg-transparent px-3 py-1 text-xs text-ink"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{m.message}</p>
              <div className="mt-4">
                <button type="button" onClick={() => remove(m.id)} className="btn btn-ghost px-3 py-2 text-xs text-red-500/90">
                  {ta("a.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

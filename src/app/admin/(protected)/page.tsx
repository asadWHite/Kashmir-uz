"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/app/admin/_lib/fetch";
import { PageHeader } from "@/app/admin/_components/ui";
import { useT } from "@/app/components/I18nProvider";

type Curtain = { id: number; name: string; isActive: boolean; isFeatured: boolean };
type Interior = { id: number; title: string; isActive: boolean };
type Message = {
  id: number;
  name: string;
  message: string;
  status: string;
  createdAt: string;
};

export default function AdminDashboard() {
  const { ta } = useT();
  const [counts, setCounts] = useState({ curtains: 0, interiors: 0, messages: 0, featured: 0 });
  const [recent, setRecent] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, i, m] = await Promise.all([
          api<{ curtains: Curtain[] }>("/api/admin/curtains"),
          api<{ interiors: Interior[] }>("/api/admin/interiors"),
          api<{ messages: Message[] }>("/api/admin/messages"),
        ]);
        setCounts({
          curtains: c.curtains.length,
          interiors: i.interiors.length,
          messages: m.messages.filter((x) => x.status === "new").length,
          featured: c.curtains.filter((x) => x.isFeatured).length,
        });
        setRecent(m.messages.slice(0, 4));
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    { label: "Curtains", value: counts.curtains, href: "/admin/curtains" },
    { label: "Interiors", value: counts.interiors, href: "/admin/interiors" },
    { label: "New messages", value: counts.messages, href: "/admin/messages" },
    { label: "Featured", value: counts.featured, href: "/admin/curtains" },
  ];

  return (
    <>
      <PageHeader title={ta("a.dashboard")} sub={ta("a.dashSub")} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="block border border-line bg-surface p-5 transition-colors hover:border-line-strong"
          >
            <p className="font-display text-4xl text-ink">
              {loading ? "–" : card.value}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-faint">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{ta("a.recentMsgs")}</h2>
          <Link href="/admin/messages" className="text-sm text-muted hover:text-ink">
            {ta("a.viewAll")}
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="border border-line bg-surface p-6 text-sm text-faint">
            {ta("a.noMsgs")}
          </p>
        ) : (
          <ul className="divide-y divide-line border border-line bg-surface">
            {recent.map((m) => (
              <li key={m.id} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-ink">{m.name}</p>
                  <span className="text-xs text-faint">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

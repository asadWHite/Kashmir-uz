"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";
import { useT } from "@/app/components/I18nProvider";
import { PRODUCTION_SITE_URL } from "@/lib/site";

export default function AdminNav() {
  const { ta } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  const LINKS = [
    { href: "/admin", label: ta("a.dashboard") },
    { href: "/admin/curtains", label: ta("a.curtains") },
    { href: "/admin/interiors", label: ta("a.interiors") },
    { href: "/admin/gallery", label: ta("a.gallery") },
    { href: "/admin/categories", label: ta("a.categories") },
    { href: "/admin/statistics", label: ta("a.statistics") },
    { href: "/admin/leads", label: ta("a.leads") },
    { href: "/admin/messages", label: ta("a.messages") },
    { href: "/admin/faq", label: ta("a.faq") },
    { href: "/admin/settings", label: ta("a.settings") },
    { href: "/admin/translations", label: "Переводы" },
    { href: "/admin/activity", label: "История входов" },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const links = (
    <nav className="flex flex-col gap-0.5">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={() => setOpen(false)}
          className={`border-l-2 px-3 py-2.5 text-sm transition-colors ${
            isActive(l.href)
              ? "border-ink text-ink"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-3">
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="btn btn-ghost w-full justify-center"
      >
        {busy ? "…" : ta("a.signout")}
      </button>
      {/*
        "View website" opens the REAL public website (the verified production
        origin from a single config module), in a new tab.

        Why this was broken before: the link was `<Link href="/">`, which is a
        client-side navigation to the CURRENT origin — inside the admin panel
        that is the deployment/preview host or localhost, and it also dropped the
        administrator out of the panel in the same tab. Using an anchor with
        target="_blank" leaves the admin session untouched and works the same on
        desktop and mobile.
      */}
      <a
        href={PRODUCTION_SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setOpen(false)}
        className="block text-center text-xs text-faint hover:text-muted"
        data-testid="view-website"
      >
        {ta("a.viewSite")} ↗
      </a>
    </div>
  );

  return (
    <>
      {/* Mobile sticky top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-surface/95 px-5 py-3 backdrop-blur md:hidden">
        <Link href="/admin" className="font-display text-lg tracking-[0.28em] text-ink">
          {BRAND.name}
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Меню"
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center text-ink"
          >
            <div className="flex flex-col gap-[5px]">
              <span className={`h-px w-5 bg-current transition-transform duration-300 ${open ? "translate-y-[6px] rotate-45" : ""}`} />
              <span className={`h-px w-5 bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
              <span className={`h-px w-5 bg-current transition-transform duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
            </div>
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 top-[52px] z-30 flex flex-col bg-base px-5 py-6 md:hidden">
          {links}
          <div className="my-6 hairline" />
          {footer}
        </div>
      )}

      {/* Desktop fixed sidebar */}
      <aside className="hidden border-r border-line bg-surface md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col">
        <div className="px-5 py-6">
          <Link href="/admin" className="font-display text-xl tracking-[0.28em] text-ink">
            {BRAND.name}
          </Link>
          <p className="eyebrow mt-1">{ta("a.title")}</p>
        </div>
        <div className="px-2">{links}</div>
        <div className="mt-auto px-5 py-5">{footer}</div>
      </aside>
    </>
  );
}

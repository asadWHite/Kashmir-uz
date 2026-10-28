"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BRAND, NAV_LINKS } from "@/lib/constants";
import { LOCALE_LABELS, LOCALE_SHORT, LOCALES } from "@/lib/i18n";
import { useT } from "./I18nProvider";
import { useFavorites } from "./useLocalState";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current =
      (document.documentElement.dataset.theme as "light" | "dark") || "dark";
    setTheme(current);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("kashmir-theme", next);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`grid h-9 w-9 place-items-center text-ink/80 transition-colors hover:text-ink ${className}`}
    >
      {mounted ? (
        theme === "dark" ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        )
      ) : (
        <span className="block h-[17px] w-[17px]" />
      )}
    </button>
  );
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Select language"
        aria-expanded={open}
        className="flex h-9 items-center gap-1 px-1 text-[0.7rem] font-medium uppercase tracking-[0.15em] text-ink/80 transition-colors hover:text-ink"
      >
        {LOCALE_SHORT[locale]}
        <svg
          width="9"
          height="9"
          viewBox="0 0 10 10"
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M1 3.5 5 7l4-3.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[9.5rem] border border-line bg-surface py-1 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-panel ${
                l === locale ? "text-ink" : "text-muted"
              }`}
            >
              {LOCALE_LABELS[l]}
              <span className="text-[0.65rem] uppercase tracking-[0.15em] text-faint">
                {LOCALE_SHORT[l]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FavoritesIndicator({ className = "" }: { className?: string }) {
  const { ids } = useFavorites();
  if (ids.length === 0) return null;

  return (
    <Link
      href="/favorites"
      aria-label="My favorites"
      className={`relative grid h-9 w-9 place-items-center text-ink/80 transition-colors hover:text-ink ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 21s-7-4.5-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 5 23 8.5 21.5 12 19 16.5 12 21 12 21Z" fill="currentColor" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.6rem] font-medium text-base">
        {ids.length}
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "border-b border-line bg-base/80 backdrop-blur-md" : "border-b border-transparent"
        }`}
        style={{ animation: "ks-fade-in 1s ease 0.5s both" }}
      >
        <nav className="container-edge flex h-16 items-center justify-between md:h-20">
          <Link
            href="/"
            className="font-display text-xl tracking-[0.32em] text-ink md:text-2xl"
            aria-label={`${BRAND.full} — home`}
          >
            {BRAND.name}
          </Link>

          <div className="hidden items-center gap-9 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="link-underline text-[0.82rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
              >
                {t(l.tKey)}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <LanguageSwitcher className="mr-1" />
            <FavoritesIndicator />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
              aria-expanded={open}
              className="ml-1 grid h-9 w-9 place-items-center text-ink md:hidden"
            >
              <div className="flex flex-col gap-[5px]">
                <span className={`h-px w-5 bg-current transition-transform duration-300 ${open ? "translate-y-[6px] rotate-45" : ""}`} />
                <span className={`h-px w-5 bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
                <span className={`h-px w-5 bg-current transition-transform duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
              </div>
            </button>
          </div>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-40 flex flex-col bg-base transition-all duration-500 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="container-edge flex h-16 items-center justify-between" />
        <div className="container-edge flex flex-1 flex-col justify-center gap-2">
          {NAV_LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-display text-4xl tracking-tight text-ink"
              style={{
                transform: open ? "translateY(0)" : "translateY(16px)",
                opacity: open ? 1 : 0,
                transitionDelay: open ? `${0.1 + i * 0.06}s` : "0s",
              }}
            >
              {t(l.tKey)}
            </Link>
          ))}
        </div>
        <div className="container-edge pb-10 text-sm text-muted">
          <p className="eyebrow mb-3">{t("contact.with")}</p>
          <p>{BRAND.full}</p>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "./I18nProvider";
import { LOCALE_LABELS, LOCALE_SHORT, LOCALES } from "@/lib/i18n";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
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

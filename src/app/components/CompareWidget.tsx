"use client";

import { useState } from "react";
import Link from "next/link";
import { useCompare } from "./useLocalState";
import { useT } from "./I18nProvider";

/** Sticky compare bar + side-by-side modal. Shown when 1+ items are selected. */
export default function CompareWidget() {
  const { items, remove, clear } = useCompare();
  const { t } = useT();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const specs = [
    { key: "category", label: t("detail.category") },
    { key: "style", label: t("detail.style") },
    { key: "room", label: t("detail.room") },
  ] as const;

  return (
    <>
      {/* Sticky bar */}
      <div className="fixed bottom-14 inset-x-0 z-30 md:bottom-0">
        <div className="container-edge">
          <div className="flex items-center justify-between gap-4 border border-line bg-surface/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {items.map((it) => (
                  <div key={it.id} className="h-10 w-10 overflow-hidden border-2 border-surface bg-panel">
                    {it.imageUrl && <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                ))}
              </div>
              <span className="text-xs text-muted">
                {items.length}/3 · Compare
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clear} className="text-xs text-faint hover:text-muted">
                ✕
              </button>
              <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={items.length < 2}
                className="btn btn-solid px-4 py-2 text-xs disabled:opacity-40"
              >
                Compare →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="relative w-full max-w-3xl border border-line bg-base p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 grid h-8 w-8 place-items-center text-faint hover:text-ink">✕</button>
            <h2 className="mb-6 font-display text-2xl text-ink">Compare</h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
              {items.map((it) => (
                <div key={it.id}>
                  <div className="relative aspect-[3/4] overflow-hidden bg-panel">
                    {it.imageUrl && <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" />}
                    <button type="button" onClick={() => remove(it.id)} className="absolute right-2 top-2 grid h-6 w-6 place-items-center bg-base/80 text-xs text-faint hover:text-red-500">✕</button>
                  </div>
                  <Link href={`/curtains/${it.slug}`} className="mt-2 block truncate font-display text-sm text-ink hover:text-accent">{it.name}</Link>
                  <dl className="mt-2 space-y-1.5">
                    {specs.map((s) => (
                      <div key={s.key} className="flex justify-between text-xs">
                        <dt className="text-faint">{s.label}</dt>
                        <dd className="text-muted">{(it as Record<string, unknown>)[s.key] as string || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Link href="/collections" onClick={() => setOpen(false)} className="btn btn-ghost text-xs">← Back to collection</Link>
              <Link href="/#contact" onClick={() => setOpen(false)} className="btn btn-solid text-xs">{t("detail.contact")}</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

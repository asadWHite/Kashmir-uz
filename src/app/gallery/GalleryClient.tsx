"use client";

import { useMemo, useState } from "react";
import Reveal from "@/app/components/Reveal";
import { useT } from "@/app/components/I18nProvider";
import type { GalleryItem } from "./page";

export default function GalleryClient({ items }: { items: GalleryItem[] }) {
  const { t } = useT();
  const [filter, setFilter] = useState("all");

  const filters = [
    { key: "all", label: t("gallery.all") },
    { key: "interior", label: t("gallery.interiors") },
    { key: "curtain", label: t("gallery.curtains") },
    { key: "project", label: t("gallery.projects") },
  ];
  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  // Asymmetric spans for editorial feel.
  const span = (i: number) => {
    const pattern = ["sm:col-span-2", "", "sm:row-span-2", "", "sm:col-span-2"];
    return pattern[i % pattern.length];
  };

  return (
    <section className="container-edge py-12 md:py-20">
      <Reveal>
        <p className="eyebrow mb-4">{t("gallery.eyebrow")}</p>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="font-display text-[clamp(2.4rem,6vw,4rem)] leading-[1.02] text-ink">
          {t("gallery.title")}
        </h1>
      </Reveal>

      <div className="mt-8 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
              filter === f.key ? "border-ink text-ink" : "border-line text-faint hover:text-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-20 text-center font-display text-2xl text-faint">{t("gallery.empty")}</p>
      ) : (
        <div className="mt-10 grid auto-rows-[14rem] grid-cols-2 gap-3 md:auto-rows-[18rem] md:grid-cols-4 md:gap-4">
          {filtered.map((item, i) => (
            <Reveal key={item.id} delay={(i % 4) * 60} className={span(i)}>
              <div className="zoom-frame group relative h-full overflow-hidden bg-panel">
                <img
                  src={item.imageUrl}
                  alt={item.title || ""}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {item.title && (
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="text-sm text-white">{item.title}</span>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

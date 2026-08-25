"use client";

import { useMemo, useState } from "react";
import Reveal from "@/app/components/Reveal";
import Link from "next/link";
import { ASSETS } from "@/lib/constants";
import { useT } from "@/app/components/I18nProvider";
import FavButton from "@/app/components/FavButton";
import { useCompare, type CompareItem } from "@/app/components/useLocalState";
import type { CurtainView } from "@/lib/types";

export default function CollectionsClient({
  curtains,
}: {
  curtains: CurtainView[];
  categories: { id: number; name: string; slug: string }[];
}) {
  const { t, tc } = useT();
  const { isInCompare, toggle: toggleCompare } = useCompare();

  const tabs = useMemo(() => {
    const used = Array.from(new Set(curtains.map((c) => (c.category || "").trim()).filter(Boolean)));
    return ["__all__", ...used];
  }, [curtains]);

  const [active, setActive] = useState("__all__");

  const filtered = useMemo(() => {
    const list =
      active === "__all__" ? curtains : curtains.filter((c) => c.category === active);
    return [...list].sort((a, b) => b.likes - a.likes);
  }, [curtains, active]);

  // The single most-liked curtain (only if it has likes)
  const topId = useMemo(() => {
    if (filtered.length === 0) return null;
    const max = Math.max(...filtered.map((c) => c.likes));
    if (max <= 0) return null;
    return filtered.find((c) => c.likes === max)?.id ?? null;
  }, [filtered]);

  return (
    <section className="container-edge py-12 md:py-20">
      <Reveal>
        <p className="eyebrow mb-4">{t("collections.eyebrow")}</p>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="font-display text-[clamp(2.4rem,6vw,4rem)] leading-[1.02] text-ink">
          {t("collections.title")}
        </h1>
      </Reveal>

      {tabs.length > 1 && (
        <div className="no-scrollbar mt-10 flex gap-6 overflow-x-auto border-b border-line pb-px">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              className={`relative shrink-0 pb-3 text-[0.8rem] uppercase tracking-[0.18em] transition-colors ${
                active === tab ? "text-ink" : "text-faint hover:text-muted"
              }`}
            >
              {tab === "__all__" ? t("collection.all") : tab}
              {active === tab && <span className="absolute inset-x-0 -bottom-px h-px bg-ink" />}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-20 text-center font-display text-2xl text-faint">{t("collection.empty")}</p>
      ) : (
        <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => {
            const img = c.imageUrl || ASSETS.curtains[i % ASSETS.curtains.length];
            const isTop = c.id === topId;
            return (
              <Reveal key={c.id} delay={(i % 3) * 70}>
                <div className="group">
                  <Link href={`/curtains/${c.slug}`} className="block">
                    <div className="zoom-frame relative aspect-[4/5] bg-panel">
                      <img src={img} alt={tc(c.slug, "name", c.name)} loading="lazy" className="h-full w-full object-cover" />

                      {isTop && (
                        <span className="absolute left-3 top-3 z-10 bg-ink px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-base">
                          {t("trending.eyebrow")}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleCompare({
                            id: c.id,
                            name: tc(c.slug, "name", c.name),
                            slug: c.slug,
                            imageUrl: c.imageUrl,
                            category: c.category,
                            style: null,
                            room: null,
                          } as CompareItem);
                        }}
                        className={`absolute bottom-3 right-3 z-10 grid h-8 w-8 place-items-center border text-xs backdrop-blur transition-colors ${
                          isInCompare(c.id)
                            ? "border-ink bg-ink text-base"
                            : "border-line bg-base/70 text-muted hover:text-ink"
                        }`}
                        aria-label="Compare"
                      >
                        ⇄
                      </button>
                    </div>
                    <div className="mt-5 flex items-baseline justify-between gap-4">
                      <h2 className="font-display text-xl text-ink transition-colors group-hover:text-accent">
                        {tc(c.slug, "name", c.name)}
                      </h2>
                      {c.category && <span className="eyebrow">{c.category}</span>}
                    </div>
                  </Link>
                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-sm text-muted">
                      {[c.material, c.color].filter(Boolean).join(" · ")}
                    </p>
                    <FavButton curtainId={c.id} initialLikes={c.likes} size="sm" />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}

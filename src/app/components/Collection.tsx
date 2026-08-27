"use client";

import { useMemo, useState } from "react";
import Reveal from "./Reveal";
import { ASSETS } from "@/lib/constants";
import { useT } from "./I18nProvider";
import { useCompare, type CompareItem } from "./useLocalState";
import FavButton from "./FavButton";
import type { CategoryView, CurtainView } from "@/lib/types";

export default function Collection({
  curtains,
}: {
  curtains: CurtainView[];
  categories: CategoryView[];
}) {
  const { t, tc } = useT();
  const { isInCompare, toggle: toggleCompare } = useCompare();
  const tabs = useMemo(() => {
    const used = Array.from(
      new Set(curtains.map((c) => (c.category || "").trim()).filter(Boolean)),
    );
            return ["__all__", ...used];
          }, [curtains]);
          const [active, setActive] = useState("__all__");
  const filtered =
    active === "__all__"
      ? [...curtains].sort((a, b) => b.likes - a.likes)
      : curtains.filter((c) => (c.category || "") === active).sort((a, b) => b.likes - a.likes);

  // Single most-liked curtain gets the TOP badge (only if it has likes)
  const maxLikes = filtered.length ? Math.max(...filtered.map((c) => c.likes)) : 0;
  const topId = maxLikes > 0 ? filtered.find((c) => c.likes === maxLikes)?.id ?? null : null;

  return (
    <section id="collection" className="container-edge py-24 md:py-32">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Reveal>
            <p className="eyebrow mb-4">{t("collection.eyebrow")}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] text-ink">
              {t("collection.title")}
            </h2>
          </Reveal>
        </div>
        <Reveal delay={140}>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {t("collection.subtitle")}
          </p>
        </Reveal>
      </div>

      {curtains.length > 0 && tabs.length > 1 && (
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
        <p className="mt-20 text-center font-display text-2xl text-faint">
          {t("collection.empty")}
        </p>
      ) : (
        <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => {
            const img = c.imageUrl || ASSETS.curtains[i % ASSETS.curtains.length];
            const isTop = c.id === topId;
            return (
              <Reveal key={c.id} delay={(i % 3) * 70}>
                <div className="group">
                  <a href={`/curtains/${c.slug}`} className="block" data-cursor>
                    <div className="zoom-frame relative aspect-[4/5] bg-panel">
                      <img src={img} alt={`${c.name} — premium curtains in Tashkent`} loading="lazy" className="h-full w-full object-cover" />
                      {isTop && (
                        <span className="absolute left-4 top-4 z-10 bg-ink px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-base">
                          {t("trending.eyebrow")}
                        </span>
                      )}
                      {!isTop && c.isFeatured && (
                        <span className="absolute left-4 top-4 bg-base/85 px-3 py-1 text-[0.62rem] uppercase tracking-[0.22em] text-ink backdrop-blur">
                          {t("collection.featured")}
                        </span>
                      )}
                    </div>
                    <div className="mt-5 flex items-baseline justify-between gap-4">
                      <h3 className="font-display text-xl text-ink transition-colors group-hover:text-accent">
                        {tc(c.slug, "name", c.name)}
                      </h3>
                      {c.category && <span className="eyebrow">{c.category}</span>}
                    </div>
                  </a>
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

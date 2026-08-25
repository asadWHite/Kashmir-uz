"use client";

import Link from "next/link";
import Reveal from "./Reveal";
import { useT } from "./I18nProvider";
import { ASSETS } from "@/lib/constants";
import type { CurtainView } from "@/lib/types";

export default function Trending({ curtains }: { curtains: CurtainView[] }) {
  const { t, tc } = useT();
  if (curtains.length === 0) return null;

  // Sort by likes descending (already sorted from server, but ensure client-side too)
  const sorted = [...curtains].sort((a, b) => b.likes - a.likes);

  return (
    <section className="border-y border-line bg-panel py-16 md:py-20">
      <div className="container-edge">
        <div className="flex items-end justify-between">
          <div>
            <Reveal>
              <p className="eyebrow mb-3 text-accent">{t("trending.eyebrow")}</p>
            </Reveal>
            <Reveal delay={60}>
              <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-tight text-ink">
                {t("trending.title")}
              </h2>
            </Reveal>
          </div>
        </div>

        <div className="no-scrollbar mt-10 flex gap-5 overflow-x-auto pb-2">
          {sorted.map((c, i) => {
            const img = c.imageUrl || ASSETS.curtains[i % ASSETS.curtains.length];
            return (
              <Reveal key={c.id} delay={i * 50}>
                <Link
                  href={`/curtains/${c.slug}`}
                  className="group block w-[16rem] shrink-0 sm:w-[18rem]"
                >
                  <div className="zoom-frame relative aspect-[4/5] overflow-hidden bg-surface">
                    <img src={img} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                    <span className="absolute left-3 top-3 bg-ink/85 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-base">
                      #{i + 1}
                    </span>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-base/85 px-2.5 py-1 text-xs text-ink backdrop-blur">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 21s-7-4.5-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 5 23 8.5 21.5 12 19 16.5 12 21 12 21Z" />
                      </svg>
                      {c.likes}
                    </div>
                  </div>
                  <h3 className="mt-3 font-display text-lg text-ink transition-colors group-hover:text-accent">
                    {tc(c.slug, "name", c.name)}
                  </h3>
                  {c.category && <span className="eyebrow">{c.category}</span>}
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

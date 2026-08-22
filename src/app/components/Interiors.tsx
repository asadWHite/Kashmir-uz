"use client";

import { useEffect, useRef } from "react";
import Reveal from "./Reveal";
import { ASSETS } from "@/lib/constants";
import { useT } from "./I18nProvider";
import type { InteriorView } from "@/lib/types";

const LAYOUT = [
  { span: "lg:col-span-7", start: "", mt: "" },
  { span: "lg:col-span-4", start: "lg:col-start-9", mt: "lg:mt-32" },
  { span: "lg:col-span-6", start: "lg:col-start-2", mt: "lg:mt-16" },
  { span: "lg:col-span-5", start: "lg:col-start-8", mt: "" },
];

export default function Interiors({ interiors }: { interiors: InteriorView[] }) {
  const { t, ti } = useT();
  const layersRef = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduce || !fine || interiors.length === 0) return;
    let raf = 0;
    const update = () => {
      const vh = window.innerHeight;
      for (const img of layersRef.current) {
        if (!img) continue;
        const rect = img.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - vh / 2;
        img.style.transform = `translateY(calc(-6% + ${center * -0.03}px))`;
      }
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [interiors.length]);

  return (
    <section id="interiors" className="py-24 md:py-32">
      <div className="container-edge mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Reveal>
            <p className="eyebrow mb-4">{t("interiors.eyebrow")}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] text-ink">
              {t("interiors.title")}
            </h2>
          </Reveal>
        </div>
        <Reveal delay={140}>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {t("interiors.subtitle")}
          </p>
        </Reveal>
      </div>

      {interiors.length === 0 ? (
        <div className="container-edge">
          <p className="font-display text-2xl text-faint">{t("interiors.empty")}</p>
        </div>
      ) : (
        <div className="container-edge grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {interiors.map((it, i) => {
            const img = it.imageUrl || ASSETS.interiors[i % ASSETS.interiors.length];
            const layout = LAYOUT[i % LAYOUT.length];
            return (
              <Reveal
                key={it.id}
                delay={(i % 2) * 90}
                className={`${layout.span} ${layout.start} ${layout.mt}`}
              >
                <figure className="group relative">
                  <div className="zoom-frame relative aspect-[4/5] overflow-hidden bg-panel">
                    <img
                      ref={(el) => {
                        layersRef.current[i] = el;
                      }}
                      src={img}
                      alt={ti(it.slug, "title", it.title)}
                      loading="lazy"
                      className="absolute inset-0 h-[112%] w-full object-cover"
                      style={{ top: "-6%" }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-70" />
                    <figcaption className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                      <p className="text-[0.62rem] uppercase tracking-[0.3em] text-white/70">
                        {ti(it.slug, "location", it.location || t("interiors.location"))}
                      </p>
                      <h3 className="mt-1 font-display text-2xl text-white md:text-3xl">
                        {ti(it.slug, "title", it.title)}
                      </h3>
                      {it.description && (
                        <p className="mt-2 max-w-md text-sm text-white/75">
                          {ti(it.slug, "desc", it.description)}
                        </p>
                      )}
                    </figcaption>
                  </div>
                </figure>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}

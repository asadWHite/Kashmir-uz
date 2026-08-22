"use client";

import Reveal from "./Reveal";
import { BRAND } from "@/lib/constants";
import { useT } from "./I18nProvider";

const MARQUEE = ["Architecture", "Textile", "Light", "Craft", "Proportion", "Quiet luxury"];

export default function Manifesto() {
  const { t } = useT();
  return (
    <section className="container-edge py-20 md:py-28">
      <div className="relative mb-16 overflow-hidden border-y border-line py-4 md:py-5">
        <div
          className="flex w-max items-center gap-10"
          style={{ animation: "ks-marquee 32s linear infinite" }}
        >
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i} className="flex items-center gap-10">
              <span className="font-display text-lg tracking-wide text-muted md:text-xl">
                {w}
              </span>
              <span className="text-faint">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-4xl">
        <Reveal>
          <p className="eyebrow mb-6">{t("manifesto.label")}</p>
        </Reveal>
        <Reveal delay={80}>
          <p className="font-display text-[clamp(1.6rem,4vw,3.1rem)] leading-[1.22] text-ink">
            {t("about.title")}.
          </p>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            {t("about.text")}
          </p>
        </Reveal>
        <Reveal delay={220}>
          <p className="mt-10 font-display text-sm uppercase tracking-[0.3em] text-faint">
            — {BRAND.full}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

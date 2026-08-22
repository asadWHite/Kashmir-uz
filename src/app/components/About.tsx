"use client";

import Reveal from "./Reveal";
import { ASSETS } from "@/lib/constants";
import { useT } from "./I18nProvider";

export default function About() {
  const { t, tArr } = useT();
  const services = tArr("about.services");
  return (
    <section id="about" className="container-edge py-24 md:py-32">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
        <Reveal>
          <div className="zoom-frame relative aspect-[4/5] bg-panel">
            <img
              src={ASSETS.about}
              alt="KASHMIR DECOR curtain atelier and showroom"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="eyebrow mb-5">{t("about.eyebrow")}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.08] text-ink">
              {t("about.title")}
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
              {t("about.text")}
            </p>
          </Reveal>
          <Reveal delay={220}>
            <ul className="mt-9 divide-y divide-line border-y border-line">
              {services.map((s) => (
                <li
                  key={s}
                  className="flex items-center justify-between py-3 text-sm text-ink"
                >
                  <span>{s}</span>
                  <span className="text-faint">—</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

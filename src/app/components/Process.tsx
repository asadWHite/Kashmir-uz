"use client";

import Reveal from "./Reveal";
import { useT } from "./I18nProvider";

export default function Process() {
  const { t } = useT();
  const steps = [
    { n: "01", t: t("process.1t"), d: t("process.1d") },
    { n: "02", t: t("process.2t"), d: t("process.2d") },
    { n: "03", t: t("process.3t"), d: t("process.3d") },
    { n: "04", t: t("process.4t"), d: t("process.4d") },
    { n: "05", t: t("process.5t"), d: t("process.5d") },
  ];
  return (
    <section id="process" className="container-edge py-24 md:py-32">
      <Reveal>
        <p className="eyebrow mb-4">{t("process.eyebrow")}</p>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="mb-14 font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] text-ink">
          {t("process.title")}
        </h2>
      </Reveal>
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 70}>
            <div className="border-t border-line pt-5">
              <p className="font-display text-3xl text-faint">{s.n}</p>
              <h3 className="mt-3 font-display text-xl text-ink">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import Reveal from "@/app/components/Reveal";
import { useT } from "@/app/components/I18nProvider";
import { ASSETS } from "@/lib/constants";
import type { InteriorView } from "@/lib/types";

export default function InteriorsListClient({ interiors }: { interiors: InteriorView[] }) {
  const { t, ti } = useT();

  return (
    <section className="container-edge py-12 md:py-20">
      <Reveal>
        <p className="eyebrow mb-4">{t("interiors.eyebrow")}</p>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="font-display text-[clamp(2.4rem,6vw,4rem)] leading-[1.02] text-ink">
          {t("interiors.title")}
        </h1>
      </Reveal>

      {interiors.length === 0 ? (
        <p className="mt-20 text-center font-display text-2xl text-faint">{t("interiors.empty")}</p>
      ) : (
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {interiors.map((it, i) => {
            const img = it.imageUrl || ASSETS.interiors[i % ASSETS.interiors.length];
            return (
              <Reveal key={it.id} delay={(i % 2) * 90} className={i % 3 === 0 ? "lg:col-span-2" : ""}>
                <Link href={`/interiors/${it.slug}`} className="group block">
                  <div className={`zoom-frame relative overflow-hidden bg-panel ${i % 3 === 0 ? "aspect-[16/10]" : "aspect-[4/5]"}`}>
                    <img
                      src={img}
                      alt={ti(it.slug, "title", it.title)}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />
                    <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                      <p className="text-[0.62rem] uppercase tracking-[0.3em] text-white/70">
                        {ti(it.slug, "location", it.location || t("interiors.location"))}
                      </p>
                      <h2 className="mt-1 font-display text-2xl text-white md:text-3xl">
                        {ti(it.slug, "title", it.title)}
                      </h2>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}

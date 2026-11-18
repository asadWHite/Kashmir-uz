"use client";

import MediaImage from "@/app/components/MediaImage";
import { IMAGE_SIZES } from "@/lib/media";

import Link from "next/link";
import Reveal from "@/app/components/Reveal";
import { useT } from "@/app/components/I18nProvider";
import type { InteriorView } from "@/lib/types";

export default function InteriorsListClient({ interiors }: { interiors: InteriorView[] }) {
  const { t } = useT();

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
            const img = it.imageUrl;
            const ratio =
              it.imageWidth && it.imageHeight ? `${it.imageWidth} / ${it.imageHeight}` : undefined;
            // The feature-row span exists for wide/panoramic sources (16:9,
            // 16:4 …). A portrait in the full-width slot would become an
            // oversized tower, so the span only applies to landscape images.
            const wideSlot = i % 3 === 0 && (it.imageWidth ?? 0) > (it.imageHeight ?? 0);
            return (
              <Reveal key={it.id} delay={(i % 2) * 90} className={wideSlot ? "lg:col-span-2" : ""}>
                <Link href={`/interiors/${it.slug}`} className="group block">
                  {/* Image container: image only, framed at the image's own aspect ratio. */}
                  {/* `relative` sits on this line on purpose: the fill-image layout
                      guard reads the JSX textually (tests/product-layout.spec.ts). */}
                  <div className="zoom-frame relative aspect-[4/5] overflow-hidden bg-panel" style={ratio ? { aspectRatio: ratio } : undefined}>
                    <MediaImage
                      src={img}
                      alt={it.title}
                      recordType="interior"
                      recordId={it.id}
                      sizes={IMAGE_SIZES.editorial}
                      eager={i < 3}
                      className="object-cover object-center"
                    />
                  </div>
                  {/* Content container: all text lives below the image, never over it. */}
                  <div className="mt-5">
                    <p className="text-[0.62rem] uppercase tracking-[0.3em] text-faint">
                      {it.location || t("interiors.location")}
                    </p>
                    <h2 className="mt-1 font-display text-2xl text-ink transition-colors group-hover:text-accent md:text-3xl">
                      {it.title}
                    </h2>
                    {it.description && (
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                        {it.description}
                      </p>
                    )}
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

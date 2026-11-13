"use client";

import MediaImage from "@/app/components/MediaImage";
import { IMAGE_SIZES } from "@/lib/media";

import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { useSettings, useT } from "@/app/components/I18nProvider";

type Props = {
  title: string;
  description: string | null;
  location: string | null;
  /** Kept for callers that deep-link; the title is already localized. */
  slug?: string;
  imageUrl: string;
  gallery: string[] | null;
};

export default function InteriorDetailClient({ title, description, location, imageUrl, gallery }: Props) {
  const { t } = useT();
  const settings = useSettings();
  const images = gallery && gallery.length ? [imageUrl, ...gallery] : [imageUrl];
  // Localized on the server; this component only renders.
  const tTitle = title;
  const tLoc = location || t("interiors.location");
  const tDesc = description || "";

  return (
    <article>
      {/* Hero image */}
      <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-panel md:h-[80vh]">
        <MediaImage
          src={imageUrl}
          fallback={imageUrl}
          alt={tTitle}
          sizes={IMAGE_SIZES.hero}
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-5 py-10 md:px-10 md:py-14">
          <div className="container-edge">
            <p className="text-[0.62rem] uppercase tracking-[0.3em] text-white/70">{tLoc}</p>
            <h1 className="mt-2 font-display text-[clamp(2.2rem,6vw,4.5rem)] leading-[1.02] text-white">{tTitle}</h1>
          </div>
        </div>
      </div>

      {/* Body */}
      <section className="container-edge py-16 md:py-24">
        <Link href="/interiors" className="eyebrow mb-8 inline-block hover:text-ink">
          ← {t("interiors.eyebrow")}
        </Link>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-16">
          <div className="md:col-span-2">
            {tDesc && (
              <p className="text-lg leading-relaxed text-muted md:text-xl">{tDesc}</p>
            )}
          </div>
          <div>
            <dl className="divide-y divide-line border-y border-line">
              {location && (
                <div className="flex justify-between py-3 text-sm">
                  <dt className="text-faint">{t("location.eyebrow")}</dt>
                  <dd className="text-ink">{tLoc}</dd>
                </div>
              )}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/#contact" className="btn btn-solid">{t("detail.contact")}</Link>
              <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Telegram</a>
              <a href={settings.phoneHref} className="btn btn-ghost">{settings.phone}</a>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {images.length > 1 && (
        <section className="container-edge pb-16 md:pb-24">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* `relative` establishes the containing block for the absolutely
                positioned `fill` image (see CurtainDetailClient). */}
            {images.slice(1).map((g, i) => (
              <div key={i} className="relative aspect-[4/5] overflow-hidden bg-panel">
                <MediaImage
                  src={g}
                  fallback={imageUrl}
                  alt={`${tTitle} ${i + 2}`}
                  sizes={IMAGE_SIZES.editorial}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

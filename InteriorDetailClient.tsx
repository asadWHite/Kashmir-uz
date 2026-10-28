"use client";

import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { useT } from "@/app/components/I18nProvider";
import type { ResolvedSettings } from "@/lib/data";

type Props = {
  title: string;
  description: string | null;
  location: string | null;
  slug: string;
  imageUrl: string;
  gallery: string[] | null;
  settings: ResolvedSettings;
};

export default function InteriorDetailClient({ title, description, location, slug, imageUrl, gallery, settings }: Props) {
  const { t, ti } = useT();
  const images = gallery && gallery.length ? [imageUrl, ...gallery] : [imageUrl];
  const tTitle = ti(slug, "title", title);
  const tLoc = ti(slug, "location", location || t("interiors.location"));
  const tDesc = ti(slug, "desc", description || "");

  return (
    <article>
      {/* Hero image */}
      <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-panel md:h-[80vh]">
        <img src={imageUrl} alt={tTitle} className="h-full w-full object-cover" fetchPriority="high" />
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
              <a href="/#contact" className="btn btn-solid">{t("detail.contact")}</a>
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
            {images.slice(1).map((g, i) => (
              <div key={i} className="aspect-[4/5] overflow-hidden bg-panel">
                <img src={g} alt={`${tTitle} ${i + 2}`} loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

"use client";

import MediaImage from "@/app/components/MediaImage";
import { IMAGE_SIZES } from "@/lib/media";

import Link from "next/link";
import Reveal from "@/app/components/Reveal";
import { useT } from "@/app/components/I18nProvider";
import { ASSETS } from "@/lib/constants";

export type RelatedItem = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  category: string | null;
};

export default function RelatedGrid({ items }: { items: RelatedItem[] }) {
  const { t } = useT();
  if (items.length === 0) return null;
  return (
    <section className="container-edge py-20 md:py-28">
      <Reveal>
        <h2 className="mb-10 font-display text-[clamp(1.8rem,4vw,2.8rem)] text-ink">
          {t("detail.related")}
        </h2>
      </Reveal>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {items.map((c, i) => (
          <Reveal key={c.id} delay={i * 60}>
            <Link href={`/curtains/${c.slug}`} className="group block">
              <div className="zoom-frame relative aspect-[4/5] bg-panel">
                <MediaImage
                  src={c.imageUrl}
                  fallback={ASSETS.curtains[i % ASSETS.curtains.length]}
                  alt={c.name}
                  sizes={IMAGE_SIZES.thumb}
                  className="object-cover"
                />
              </div>
              <h3 className="mt-3 font-display text-lg text-ink group-hover:text-accent">{c.name}</h3>
              {c.category && <span className="eyebrow">{c.category}</span>}
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

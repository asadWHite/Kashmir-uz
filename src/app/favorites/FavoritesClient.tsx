"use client";

import MediaImage from "@/app/components/MediaImage";
import { IMAGE_SIZES } from "@/lib/media";

import Link from "next/link";
import Reveal from "@/app/components/Reveal";
import { useT } from "@/app/components/I18nProvider";
import { useFavoritesWithMountState } from "@/app/components/useLocalState";
import { ASSETS } from "@/lib/constants";
import FavButton from "@/app/components/FavButton";
import type { CurtainView } from "@/lib/types";

export default function FavoritesClient({ curtains }: { curtains: CurtainView[] }) {
  const { t } = useT();
  // One shared store for favorites (see useLocalState). Server snapshot is
  // empty, so the first paint matches the server and hydration is stable.
  const { ids: favIds, mounted } = useFavoritesWithMountState();
  const favCurtains = curtains.filter((c) => favIds.includes(c.id));

  if (!mounted) {
    return (
      <section className="container-edge py-20">
        <p className="text-muted">Loading…</p>
      </section>
    );
  }

  return (
    <section className="container-edge py-12 md:py-20">
      <Reveal>
        <p className="eyebrow mb-4">❤ {t("fav.title")}</p>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="font-display text-[clamp(2.4rem,6vw,4rem)] leading-[1.02] text-ink">
          {t("fav.title")}
        </h1>
      </Reveal>

      {favCurtains.length === 0 ? (
        <div className="mt-16 border border-line bg-surface p-10 text-center md:p-16">
          <p className="font-display text-2xl text-faint">{t("fav.empty")}</p>
          <Link href="/collections" className="btn btn-solid mt-8">
            {t("collections.title")} →
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-4 text-muted">{favCurtains.length} {t("collections.count")}</p>
          <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {favCurtains.map((c, i) => {
              const img = c.imageUrl || ASSETS.curtains[i % ASSETS.curtains.length];
              return (
                <Reveal key={c.id} delay={(i % 3) * 60}>
                  <div className="group">
                    <Link href={`/curtains/${c.slug}`} className="block">
                      <div className="zoom-frame relative aspect-[4/5] bg-panel">
                        <MediaImage
                          src={img}
                          fallback={ASSETS.curtains[i % ASSETS.curtains.length]}
                          alt={c.name}
                          sizes={IMAGE_SIZES.card}
                          className="object-cover"
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <h2 className="font-display text-xl text-ink">{c.name}</h2>
                        <FavButton curtainId={c.id} />
                      </div>
                      {c.category && <span className="eyebrow">{c.category}</span>}
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-12 border-t border-line pt-8">
            <Link href="/#contact" className="btn btn-solid">
              {t("detail.contact")} · KASHMIR →
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

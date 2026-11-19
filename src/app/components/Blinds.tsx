import MediaImage from "./MediaImage";
import type { BlindCard } from "@/lib/blind-data";
import { translate, type Locale } from "@/lib/i18n";
import type { CSSProperties } from "react";

// Mirrors container-edge padding, the column gaps, and the 88rem container cap.
const CARD_SIZES = "(min-width: 88rem) 24.7rem, (min-width: 64rem) calc(30vw - 1.33rem), (min-width: 40rem) calc(45vw - .75rem), calc(100vw - max(2.5rem, 10vw))";
const GALLERY_SIZES = "(min-width: 64rem) 12rem, (min-width: 40rem) 22vw, 45vw";

export default function Blinds({ products, locale }: { products: BlindCard[]; locale: Locale }) {
  const t = (key: string) => translate(locale, `blinds.${key}`);

  return (
    <section id="blinds" aria-labelledby="blinds-title" className="container-edge pb-24 md:pb-32">
      <div className="flex flex-col gap-6 border-t border-line pt-12 md:flex-row md:items-end md:justify-between md:pt-16">
        <div>
          <p className="eyebrow mb-4">{t("eyebrow")}</p>
          <h2 id="blinds-title" className="font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] text-ink">
            {t("title")}
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted">{t("subtitle")}</p>
      </div>
      {products.length === 0 ? (
        <p className="mt-10 font-display text-2xl text-muted">{t("empty")}</p>
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 md:mt-14 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
          {products.map(({ id, main, gallery, name, description, category, featured }) => (
            <article key={id} className="min-w-0" aria-labelledby={`blind-${id}-title`}>
              <div
                className="relative aspect-[var(--photo-ratio)] overflow-hidden bg-panel lg:aspect-[4/5]"
                style={{ "--photo-ratio": Math.max(0.8, Math.min(1.6, main.width / main.height)) } as CSSProperties}
              >
                <MediaImage src={main.url} alt={name} recordType="blind" recordId={id} sizes={CARD_SIZES} className="object-contain lg:object-cover" />
              </div>
              <h3 id={`blind-${id}-title`} className="mt-5 break-words font-display text-2xl leading-tight text-ink md:text-3xl">{name}</h3>
              <p className="mt-2 max-w-md break-words text-sm leading-relaxed text-muted">{description}</p>
              {(category || featured) && (
                <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted">
                  {category && <span className="min-w-0 break-words">{category}</span>}
                  {featured && <span className="text-accent">{t("featured")}</span>}
                </p>
              )}
              {gallery.length > 0 && (
                <details className="mt-5 border-t border-line pt-3">
                  <summary className="w-fit cursor-pointer text-xs text-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">
                    {t("gallery")} ({gallery.length})
                  </summary>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {gallery.map((image, index) => (
                      <a key={image.url} href={image.url} className="relative aspect-[4/3] overflow-hidden bg-panel focus-visible:outline-2 focus-visible:outline-offset-2">
                        <MediaImage src={image.url} alt={`${name} — ${index + 1}`} recordType="blind" recordId={id} galleryIndex={index + 1} sizes={GALLERY_SIZES} className="object-contain motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:scale-[1.025]" />
                      </a>
                    ))}
                  </div>
                </details>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

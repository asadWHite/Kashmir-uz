"use client";

import { useT } from "./I18nProvider";
import Reveal from "./Reveal";
import Link from "next/link";
import { ASSETS } from "@/lib/constants";

type Section = { heading: string; body: string };
type LinkItem = { href: string; label: string; desc?: string };

type Props = {
  eyebrow: string;
  h1: string;
  intro: string;
  imageSrc?: string;
  imageAlt: string;
  sections: Section[];
  related: LinkItem[];
  ctaLabel: string;
  ctaHref?: string;
  highlights?: string[];
};

/**
 * Reusable SEO landing page layout — used by the Uzbek-slug landing pages
 * (/toshkentda-pardalar, /rim-pardalar, ...). Renders meaningful, useful
 * content (no keyword stuffing), internal links and a CTA. Design is
 * deliberately minimal so it does not break the existing premium aesthetic.
 */
export default function SeoLanding({
  eyebrow,
  h1,
  intro,
  imageSrc = ASSETS.hero,
  imageAlt,
  sections,
  related,
  ctaLabel,
  ctaHref = "/#contact",
  highlights,
}: Props) {
  const { locale } = useT();
  const rtl = false; // UZ is LTR
  return (
    <article className="container-edge pt-28 md:pt-36 pb-20 md:pb-28">
      <Reveal>
        <p className="eyebrow mb-5">{eyebrow}</p>
      </Reveal>
      <Reveal delay={80}>
        <h1
          className="font-display text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.05] text-ink"
          style={{ fontWeight: 500 }}
        >
          {h1}
        </h1>
      </Reveal>
      <Reveal delay={140}>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          {intro}
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-12">
        <div className="md:col-span-7 space-y-10">
          {sections.map((s, i) => (
            <Reveal key={i} delay={i * 50}>
              <section>
                <h2 className="font-display text-2xl md:text-3xl text-ink" style={{ fontWeight: 500 }}>
                  {s.heading}
                </h2>
                <p className="mt-4 text-[15px] leading-[1.8] text-muted">{s.body}</p>
              </section>
            </Reveal>
          ))}

          {highlights && highlights.length > 0 && (
            <Reveal>
              <section>
                <h2 className="font-display text-2xl md:text-3xl text-ink" style={{ fontWeight: 500 }}>
                  {locale === "uz"
                    ? "Nega Kashmir Decor"
                    : locale === "ru"
                    ? "Почему Kashmir Decor"
                    : "Why Kashmir Decor"}
                </h2>
                <ul className="mt-4 grid grid-cols-1 gap-2 text-[15px] text-muted sm:grid-cols-2">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <span className="mt-[9px] inline-block h-px w-4 shrink-0 bg-ink/60" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}
        </div>

        <div className="md:col-span-5 space-y-10">
          <Reveal delay={100}>
            <div className="zoom-frame overflow-hidden bg-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={imageAlt}
                loading="eager"
                decoding="async"
                width={1200}
                height={1500}
                className="h-auto w-full object-cover"
              />
            </div>
          </Reveal>

          <Reveal delay={140}>
            <section className="border border-line bg-surface p-6">
              <h2 className="font-display text-xl text-ink" style={{ fontWeight: 500 }}>
                {locale === "uz"
                  ? "Bog'lanish"
                  : locale === "ru"
                  ? "Связаться"
                  : "Get in touch"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {locale === "uz"
                  ? "O'lchash, maslahat va buyurtma uchun salonga murojaat qiling."
                  : locale === "ru"
                  ? "Свяжитесь с салоном для замера, консультации и заказа."
                  : "Contact the salon for measurement, consultation and orders."}
              </p>
              <Link href={ctaHref} className="btn btn-solid mt-5 inline-block">
                {ctaLabel}
              </Link>
            </section>
          </Reveal>

          {related.length > 0 && (
            <Reveal delay={180}>
              <section>
                <h2 className="font-display text-xl text-ink" style={{ fontWeight: 500 }}>
                  {locale === "uz"
                    ? "Yana o'qing"
                    : locale === "ru"
                    ? "Читайте также"
                    : "Explore more"}
                </h2>
                <ul className="mt-4 divide-y divide-line border-t border-line">
                  {related.map((r) => (
                    <li key={r.href}>
                      <Link
                        href={r.href}
                        className="group flex items-baseline justify-between gap-4 py-3"
                      >
                        <span className="text-[15px] text-ink transition-colors group-hover:text-accent">
                          {r.label}
                        </span>
                        {r.desc && (
                          <span className="text-right text-xs text-faint">{r.desc}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}
        </div>
      </div>
    </article>
  );
}

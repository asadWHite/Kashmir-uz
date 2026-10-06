"use client";

import Link from "next/link";
import Reveal from "./Reveal";
import { useT } from "./I18nProvider";

/**
 * Internal-link block placed on the homepage. It exposes the primary SEO
 * style landing pages to crawlers and users — reinforcing the site's
 * internal link architecture (home → toshkentda-pardalar → style pages →
 * detail pages → contact).
 */
const LINKS = [
  { href: "/toshkentda-pardalar", key: "main", uz: "Toshkentda pardalar", ru: "Шторы в Ташкенте", en: "Curtains in Tashkent" },
  { href: "/zamonaviy-pardalar", key: "modern", uz: "Zamonaviy pardalar", ru: "Современные шторы", en: "Modern curtains" },
  { href: "/klassik-pardalar", key: "classic", uz: "Klassik pardalar", ru: "Классические шторы", en: "Classic curtains" },
  { href: "/rim-pardalar", key: "roman", uz: "Rim pardalari", ru: "Римские шторы", en: "Roman curtains" },
  { href: "/premium-pardalar", key: "prem", uz: "Premium pardalar", ru: "Премиум шторы", en: "Premium curtains" },
  { href: "/haqimizda", key: "about", uz: "Salon haqida", ru: "О салоне", en: "About salon" },
  { href: "/kontakt", key: "contact", uz: "Aloqa", ru: "Контакты", en: "Contact" },
] as const;

const LABELS = {
  uz: { heading: "Parda uslublari", sub: "Toshkent uchun tanlangan yo'nalishlar" },
  ru: { heading: "Стили штор", sub: "Направления для ташкентских интерьеров" },
  en: { heading: "Curtain styles", sub: "Selected directions for Tashkent interiors" },
} as const;

export default function StyleLinks() {
  const { locale } = useT();
  const l = LABELS[locale as keyof typeof LABELS] ?? LABELS.uz;
  return (
    <section className="border-t border-line py-20 md:py-24">
      <div className="container-edge">
        <Reveal>
          <p className="eyebrow mb-5">{l.sub}</p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.05] text-ink">
            {l.heading}
          </h2>
        </Reveal>
        <ul className="mt-10 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {LINKS.map((it, i) => (
            <li key={it.href} className="bg-base">
              <Reveal delay={i * 40}>
                <Link
                  href={it.href}
                  className="group flex items-baseline justify-between gap-4 px-0 py-5 transition-colors hover:text-accent"
                >
                  <span className="font-display text-xl text-ink transition-colors group-hover:text-accent">
                    {it[locale as "uz" | "ru" | "en"] ?? it.uz}
                  </span>
                  <span
                    className="text-faint transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

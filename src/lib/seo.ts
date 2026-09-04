import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://kashmirdecor.uz").replace(/\/$/, "");

export const OG_LOCALE: Record<Locale, string> = {
  ru: "ru_RU",
  uz: "uz_UZ",
  en: "en_US",
};

/** Cookie-based locale pages share canonical URLs; these alternates make the supported
 * language choices explicit without inventing routes that the app does not serve. */
export function localizedAlternates(path = "/") {
  const clean = path || "/";
  return {
    canonical: clean,
    languages: {
      ru: `${SITE_URL}${clean}`,
      uz: `${SITE_URL}${clean}`,
      en: `${SITE_URL}${clean}`,
      "x-default": `${SITE_URL}${clean}`,
    },
  } satisfies NonNullable<Metadata["alternates"]>;
}

export function resolveLocale(value?: string | null): Locale {
  return value && (LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export const HOME_SEO: Record<Locale, { title: string; description: string }> = {
  ru: {
    title: "Kashmir Decor — Индивидуальный пошив штор и текстиль в Ташкенте",
    description:
      "Пошив штор на заказ в Ташкенте. Портьеры, тюль, интерьерный текстиль премиум-класса от студии Kashmir Decor.",
  },
  uz: {
    title: "Kashmir Decor — Toshkentda individual pardalar va tekstil tikish",
    description:
      "Toshkentda pardalar buyurtma qilish. Premium darajadagi shtorlar, tyul va interyer tekstili — Kashmir Decor studiyasidan.",
  },
  en: {
    title: "Kashmir Decor — Custom Curtains & Textile Studio in Tashkent",
    description:
      "Custom curtains in Tashkent. Premium drapes, tulle, and interior textiles by Kashmir Decor studio.",
  },
};

export function getHomeSeo(locale: Locale = DEFAULT_LOCALE) {
  return HOME_SEO[locale] ?? HOME_SEO[DEFAULT_LOCALE];
}

export function socialMeta(title: string, description: string, path = "/") {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  return {
    openGraph: {
      type: "website" as const,
      url,
      title,
      description,
      siteName: "Kashmir Decor",
      images: [{ url: "/assets/hero.jpg", width: 1600, height: 900, alt: title }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: ["/assets/hero.jpg"],
    },
  };
}

export const SEO = {
  home: HOME_SEO.ru,
  collections: {
    title: "Шторы на заказ в Ташкенте | Kashmir Decor — салон штор и текстиля",
    description:
      "Коллекция штор Kashmir Decor в Ташкенте: портьеры, тюль и интерьерный текстиль. Подберём ткань, выполним пошив и установку.",
  },
  interiors: {
    title: "Интерьерные шторы в Ташкенте | Kashmir Decor — салон штор и текстиля",
    description:
      "Интерьерные проекты Kashmir Decor в Ташкенте: шторы на заказ, тюль и текстиль для спокойных, выразительных пространств.",
  },
  gallery: {
    title: "Портьеры и текстиль в Ташкенте | Kashmir Decor — салон штор",
    description:
      "Галерея Kashmir Decor: портьеры, тюль, интерьерный текстиль и реализованные проекты в Ташкенте.",
  },
} as const;

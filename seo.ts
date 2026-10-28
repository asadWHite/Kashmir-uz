import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n";

const DEFAULT_SITE_URL = "https://kashmirdecor.uz";
const PRODUCTION_HOSTS = new Set(["kashmirdecor.uz", "www.kashmirdecor.uz"]);

function getProductionSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return DEFAULT_SITE_URL;

  try {
    const parsed = new URL(configured);
    const host = parsed.hostname.toLowerCase();
    // Keep preview/local URLs out of canonical, OpenGraph, sitemap and robots
    // output, even if the public environment variable is misconfigured.
    if (!PRODUCTION_HOSTS.has(host)) return DEFAULT_SITE_URL;
    return `https://${host}`;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = getProductionSiteUrl();

export const OG_LOCALE: Record<Locale, string> = {
  ru: "ru_RU",
  uz: "uz_UZ",
  en: "en_US",
};

/**
 * The language switcher is cookie-based, so the app does not have separate
 * indexable URLs for each locale. Publish one canonical URL rather than
 * incorrect hreflang tags that point every language to the same page.
 */
export function localizedAlternates(path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return {
    canonical: new URL(cleanPath, `${SITE_URL}/`).toString(),
  } satisfies NonNullable<Metadata["alternates"]>;
}

export function resolveLocale(value?: string | null): Locale {
  return value && (LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export const HOME_SEO: Record<Locale, { title: string; description: string }> = {
  ru: {
    title: "Шторы в Ташкенте — Kashmir Decor | Пошив штор и текстиль",
    description:
      "Шторы в Ташкенте на заказ. Портьеры, тюль и интерьерный текстиль премиум-класса от студии Kashmir Decor.",
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
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(cleanPath, `${SITE_URL}/`).toString();
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
    title: "Шторы в Ташкенте — коллекция | Kashmir Decor",
    description:
      "Шторы в Ташкенте: портьеры, тюль и интерьерный текстиль. Подберём ткань, выполним пошив и установку.",
  },
  interiors: {
    title: "Шторы в Ташкенте — интерьеры | Kashmir Decor",
    description:
      "Шторы в Ташкенте в интерьерных проектах Kashmir Decor: пошив штор, тюль и текстиль для спокойных пространств.",
  },
  gallery: {
    title: "Шторы в Ташкенте — галерея | Kashmir Decor",
    description:
      "Галерея штор в Ташкенте: портьеры, тюль, интерьерный текстиль и реализованные проекты Kashmir Decor.",
  },
} as const;

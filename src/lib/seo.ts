import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n";
import { SITE_URL, absoluteUrl } from "@/lib/site";

export { SITE_URL, absoluteUrl, PRODUCTION_SITE_URL } from "@/lib/site";

export const OG_LOCALE: Record<Locale, string> = {
  ru: "ru_RU",
  uz: "uz_UZ",
  en: "en_US",
};

/**
 * Canonical + language metadata.
 *
 * The language switcher is cookie-based, so all three languages share one
 * indexable URL. The honest SEO model for that architecture is:
 *   · one canonical URL per page (never three URLs that serve the same HTML),
 *   · `og:locale` + `og:locale:alternate` describing the language set,
 *   · `Content-Language` on the response (set in next.config.ts).
 * Emitting `hreflang` alternates that all point at the same URL would be
 * incorrect, and emitting ?lang= variants would either duplicate content or
 * create hundreds of thin pages. Both are avoided on purpose — see
 * docs/audit/REPORT-2026-11-13.md §SEO.
 */
export function localizedAlternates(path = "/") {
  return {
    canonical: absoluteUrl(path),
  } satisfies NonNullable<Metadata["alternates"]>;
}

export function resolveLocale(value?: string | null): Locale {
  return value && (LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export type SeoCopy = { title: string; description: string };

export const HOME_SEO: Record<Locale, SeoCopy> = {
  ru: {
    title: "Шторы в Ташкенте — Kashmir Decor | Пошив штор и текстиль",
    description:
      "Шторы в Ташкенте на заказ. Портьеры, тюль и интерьерный текстиль премиум-класса от салона Kashmir Decor.",
  },
  uz: {
    title: "Kashmir Decor — Toshkentda individual pardalar va tekstil tikish",
    description:
      "Toshkentda pardalar buyurtma qilish. Premium darajadagi shtorlar, tyul va interyer tekstili — Kashmir Decor salonidan.",
  },
  en: {
    title: "Kashmir Decor — Custom Curtains & Textile Salon in Tashkent",
    description:
      "Custom curtains in Tashkent. Premium drapes, tulle and interior textiles by the Kashmir Decor salon.",
  },
};

export const COLLECTIONS_SEO: Record<Locale, SeoCopy> = {
  ru: {
    title: "Шторы в Ташкенте — коллекция | Kashmir Decor",
    description:
      "Шторы в Ташкенте: портьеры, тюль и интерьерный текстиль. Подберём ткань, выполним пошив и установку.",
  },
  uz: {
    title: "Pardalar kolleksiyasi — Toshkent | Kashmir Decor",
    description:
      "Toshkentdagi pardalar kolleksiyasi: portyeralar, tyul va interyer tekstili. Mato tanlash, tikish va o‘rnatish.",
  },
  en: {
    title: "Curtain collection — Tashkent | Kashmir Decor",
    description:
      "The curtain collection in Tashkent: drapes, tulle and interior textiles. Fabric selection, tailoring and installation.",
  },
};

export const INTERIORS_SEO: Record<Locale, SeoCopy> = {
  ru: {
    title: "Шторы в Ташкенте — интерьеры | Kashmir Decor",
    description:
      "Шторы в Ташкенте в интерьерных проектах Kashmir Decor: пошив штор, тюль и текстиль для спокойных пространств.",
  },
  uz: {
    title: "Interyer loyihalari — Toshkent | Kashmir Decor",
    description:
      "Kashmir Decor interyer loyihalari: Toshkentda pardalar tikish, tyul va xotirjam makonlar uchun tekstil.",
  },
  en: {
    title: "Interior projects — Tashkent | Kashmir Decor",
    description:
      "Interior projects by Kashmir Decor in Tashkent: curtain tailoring, tulle and textiles for calm spaces.",
  },
};

export const GALLERY_SEO: Record<Locale, SeoCopy> = {
  ru: {
    title: "Шторы в Ташкенте — галерея | Kashmir Decor",
    description:
      "Галерея штор в Ташкенте: портьеры, тюль, интерьерный текстиль и реализованные проекты Kashmir Decor.",
  },
  uz: {
    title: "Galereya — Toshkent pardalari | Kashmir Decor",
    description:
      "Toshkentdagi pardalar galereyasi: portyeralar, tyul, interyer tekstili va amalga oshirilgan loyihalar.",
  },
  en: {
    title: "Gallery — curtains in Tashkent | Kashmir Decor",
    description:
      "Curtain gallery in Tashkent: drapes, tulle, interior textiles and completed Kashmir Decor projects.",
  },
};

/**
 * Indexed copy stays Russian for the shared, language-agnostic URL so Google
 * keeps seeing the primary commercial query; per-language metadata is emitted
 * for pages whose copy is genuinely localized (product detail pages come from
 * the database in the visitor's language).
 */
export function getHomeSeo(locale: Locale = DEFAULT_LOCALE): SeoCopy {
  return HOME_SEO[locale] ?? HOME_SEO[DEFAULT_LOCALE];
}

export function socialMeta(title: string, description: string, path = "/") {
  const url = absoluteUrl(path);
  return {
    openGraph: {
      type: "website" as const,
      url,
      title,
      description,
      siteName: "Kashmir Decor",
      images: [{ url: "/assets/hero.jpg", alt: title }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: ["/assets/hero.jpg"],
    },
  };
}

/** Backwards-compatible shape used by the listing pages. */
export const SEO = {
  home: HOME_SEO.ru,
  collections: COLLECTIONS_SEO.ru,
  interiors: INTERIORS_SEO.ru,
  gallery: GALLERY_SEO.ru,
} as const;

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

/**
 * Homepage metadata per locale.
 *
 * Title strategy: primary keyword + brand name, under 60 characters.
 * Description strategy: expand on the title with service details and
 * location signals, under 160 characters.
 *
 * Russian targets: "шторы в Ташкенте", "пошив штор", "салон штор"
 * Uzbek targets:   "pardalar Toshkent", "parda tikish", "pardalar saloni"
 * English targets: "custom curtains Tashkent", "curtain salon"
 */
export const HOME_SEO: Record<Locale, SeoCopy> = {
  ru: {
    title: "Шторы в Ташкенте — Kashmir Decor | Пошив штор и текстиль",
    description:
      "Шторы в Ташкенте на заказ. Портьеры, тюль и интерьерный текстиль премиум-класса от салона Kashmir Decor. Пошив, дизайн и установка.",
  },
  uz: {
    title: "Toshkentda pardalar — Kashmir Decor | Parda tikish va dizayn",
    description:
      "Toshkentda pardalar buyurtma qilish. Premium darajadagi portyeralar, tyul va interyer tekstili — Kashmir Decor salonidan. Tikish, dizayn va o'rnatish.",
  },
  en: {
    title: "Curtains in Tashkent — Kashmir Decor | Custom Tailoring & Design",
    description:
      "Custom curtains in Tashkent. Premium drapes, tulle and interior textiles by Kashmir Decor salon. Tailoring, design and installation.",
  },
};

/**
 * Collections page metadata.
 * Targets: browsing and comparing curtain styles.
 */
export const COLLECTIONS_SEO: Record<Locale, SeoCopy> = {
  ru: {
    title: "Коллекция штор в Ташкенте — Kashmir Decor",
    description:
      "Каталог штор в Ташкенте: портьеры, тюль, римские шторы и интерьерный текстиль. Подберём ткань, выполним пошив и установку.",
  },
  uz: {
    title: "Pardalar kolleksiyasi — Toshkent | Kashmir Decor",
    description:
      "Toshkentdagi pardalar katalogi: portyeralar, tyul, rim pardalari va interyer tekstili. Mato tanlash, tikish va o'rnatish.",
  },
  en: {
    title: "Curtain collection in Tashkent — Kashmir Decor",
    description:
      "Curtain catalog in Tashkent: drapes, tulle, Roman blinds and interior textiles. Fabric selection, tailoring and installation.",
  },
};

/**
 * Interiors listing page.
 * Targets: interior design work, completed projects.
 */
export const INTERIORS_SEO: Record<Locale, SeoCopy> = {
  ru: {
    title: "Дизайн интерьера в Ташкенте — Kashmir Decor",
    description:
      "Интерьерные проекты Kashmir Decor в Ташкенте: шторы, текстиль и оформление окон как часть целостного дизайна пространства.",
  },
  uz: {
    title: "Interyer dizayni Toshkentda — Kashmir Decor",
    description:
      "Kashmir Decor interyer loyihalari Toshkentda: pardalar, tekstil va oyna bezaklari — butun makon dizaynining bir qismi sifatida.",
  },
  en: {
    title: "Interior design in Tashkent — Kashmir Decor",
    description:
      "Interior projects by Kashmir Decor in Tashkent: curtains, textiles and window dressings as part of holistic space design.",
  },
};

/**
 * Gallery page.
 * Targets: visual browsing, project examples, portfolio.
 */
export const GALLERY_SEO: Record<Locale, SeoCopy> = {
  ru: {
    title: "Галерея штор и интерьеров — Kashmir Decor | Ташкент",
    description:
      "Галерея Kashmir Decor: фотографии штор, портьер, тюля и реализованных интерьерных проектов в Ташкенте.",
  },
  uz: {
    title: "Pardalar va interyerlar galereyasi — Kashmir Decor | Toshkent",
    description:
      "Kashmir Decor galereyasi: Toshkentda pardalar, portyeralar, tyul va amalga oshirilgan interyer loyihalari suratlari.",
  },
  en: {
    title: "Curtain & interior gallery — Kashmir Decor | Tashkent",
    description:
      "Kashmir Decor gallery: photographs of curtains, drapes, tulle and completed interior projects in Tashkent.",
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
      images: [{ url: "/assets/hero.jpg", alt: title, width: 1536, height: 1024 }],
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

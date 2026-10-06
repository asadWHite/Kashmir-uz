import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n";
import { BRAND } from "@/lib/constants";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://kashmirdecor.uz").replace(/\/$/, "");

export const OG_LOCALE: Record<Locale, string> = {
  uz: "uz_UZ",
  ru: "ru_RU",
  en: "en_US",
};

/**
 * hreflang / canonical alternates.
 *
 * Language selection is cookie-driven (no per-locale URL segments), so each
 * public URL is shared by all three locales. We still advertise the
 * supported languages explicitly via hreflang and point `x-default` at UZ
 * since Uzbek is the primary audience.
 */
export function localizedAlternates(path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const full = `${SITE_URL}${clean}`;
  return {
    canonical: full,
    languages: {
      uz: full,
      ru: full,
      en: full,
      "x-default": full,
    },
  } satisfies NonNullable<Metadata["alternates"]>;
}

export function resolveLocale(value?: string | null): Locale {
  return value && (LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

/* ----------------------------- Home SEO ----------------------------- */
export const HOME_SEO: Record<Locale, { title: string; description: string }> = {
  uz: {
    title: "Kashmir Decor — Toshkentda Pardalar | Premium Parda Saloni",
    description:
      "Toshkentda premium pardalar: zamonaviy, klassik va Rim parda modellari, uy va ofis interyeri uchun sifatli matolar, o'lchash, tikish va o'rnatish — Kashmir Decor saloni.",
  },
  ru: {
    title: "Kashmir Decor — Шторы в Ташкенте | Премиум салон штор",
    description:
      "Премиальные шторы в Ташкенте: современные, классические и римские модели, качественные ткани для дома и офиса, замер, пошив и установка — салон Kashmir Decor.",
  },
  en: {
    title: "Kashmir Decor — Curtains in Tashkent | Premium Curtain Salon",
    description:
      "Premium curtains in Tashkent: modern, classic and Roman styles, quality fabrics for homes and offices, measurement, tailoring and installation — Kashmir Decor salon.",
  },
};

export function getHomeSeo(locale: Locale = DEFAULT_LOCALE) {
  return HOME_SEO[locale] ?? HOME_SEO[DEFAULT_LOCALE];
}

export function socialMeta(title: string, description: string, path = "/", image?: { url: string; width: number; height: number; alt: string }) {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  const img = image ?? { url: "/assets/hero.jpg", width: 1600, height: 900, alt: title };
  return {
    openGraph: {
      type: "website" as const,
      url,
      title,
      description,
      siteName: BRAND.full,
      images: [img],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [img.url],
    },
  };
}

/* -------------------------- Static page SEO ------------------------- */
export const SEO = {
  // Uzbek-first core landing page
  toshkentdaPardalar: {
    uz: {
      title: "Toshkentda Pardalar — Kashmir Decor | Premium Parda Saloni",
      description:
        "Toshkentda sifatli pardalar buyurtma qiling. Zamonaviy, klassik, Rim va blackout parda modellari, o'lchab berish, professional tikish va o'rnatish — Kashmir Decor.",
      h1: "Toshkentda pardalar",
    },
    ru: {
      title: "Шторы в Ташкенте — Kashmir Decor | Премиум салон штор",
      description:
        "Заказ штор в Ташкенте: современные, классические, римские и блэкаут модели, замер, профессиональный пошив и установка — Kashmir Decor.",
      h1: "Шторы в Ташкенте",
    },
    en: {
      title: "Curtains in Tashkent — Kashmir Decor | Premium Curtain Salon",
      description:
        "Order quality curtains in Tashkent. Modern, classic, Roman and blackout styles, measurement, professional tailoring and installation — Kashmir Decor.",
      h1: "Curtains in Tashkent",
    },
  },
  collections: {
    uz: {
      title: "Pardalar Kolleksiyasi — Kashmir Decor Toshkent",
      description:
        "Kashmir Decor parda kolleksiyasi: Toshkentdagi zamonaviy va klassik pardalar, premium matolar, har xil uslublar. Uyingiz uchun mos pardani tanlang.",
    },
    ru: {
      title: "Коллекция штор — Kashmir Decor Ташкент",
      description:
        "Коллекция штор Kashmir Decor: современные и классические модели в Ташкенте, премиальные ткани, разнообразие стилей. Подберите шторы для вашего дома.",
    },
    en: {
      title: "Curtain Collection — Kashmir Decor Tashkent",
      description:
        "Kashmir Decor curtain collection: modern and classic curtains in Tashkent, premium fabrics, a variety of styles. Find the right curtains for your home.",
    },
  },
  interiors: {
    uz: {
      title: "Interyer Loyihalari — Kashmir Decor Toshkent",
      description:
        "Kashmir Decor tomonidan Toshkentda amalga oshirilgan interyer loyihalari: mehmonxona, yotoqxona, ofis va boshqa joylar uchun pardalar.",
    },
    ru: {
      title: "Интерьерные проекты — Kashmir Decor Ташкент",
      description:
        "Интерьерные проекты Kashmir Decor в Ташкенте: шторы для гостиных, спален, офисов и других помещений.",
    },
    en: {
      title: "Interior Projects — Kashmir Decor Tashkent",
      description:
        "Interior projects by Kashmir Decor in Tashkent: curtains for living rooms, bedrooms, offices and other spaces.",
    },
  },
  gallery: {
    uz: {
      title: "Galereya — Kashmir Decor Toshkent",
      description:
        "Kashmir Decor parda va interyer galereyasi: Toshkentdagi salonimiz tomonidan amalga oshirilgan loyihalardan lavhalar.",
    },
    ru: {
      title: "Галерея — Kashmir Decor Ташкент",
      description:
        "Галерея штор и интерьеров Kashmir Decor: кадры выполненных проектов салона в Ташкенте.",
    },
    en: {
      title: "Gallery — Kashmir Decor Tashkent",
      description:
        "Kashmir Decor curtain and interior gallery: shots of projects completed by our salon in Tashkent.",
    },
  },
  contact: {
    uz: {
      title: "Aloqa — Kashmir Decor | Toshkentdagi Parda Saloni",
      description:
        "Kashmir Decor parda saloni bilan bog'laning. Toshkentda parda buyurtma berish, o'lchash va maslahat uchun telefon qiling.",
    },
    ru: {
      title: "Контакты — Kashmir Decor | Салон штор в Ташкенте",
      description:
        "Свяжитесь с салоном штор Kashmir Decor. Звоните для заказа штор, замера и консультации в Ташкенте.",
    },
    en: {
      title: "Contact — Kashmir Decor | Curtain Salon in Tashkent",
      description:
        "Get in touch with Kashmir Decor curtain salon. Call to order curtains, request measurement and consultation in Tashkent.",
    },
  },
  about: {
    uz: {
      title: "Salon Haqida — Kashmir Decor Toshkent",
      description:
        "Kashmir Decor — Toshkentdagi premium parda saloni. Sifatli pardalar, professional dizayn, tikish va o'rnatish xizmati.",
    },
    ru: {
      title: "О салоне — Kashmir Decor Ташкент",
      description:
        "Kashmir Decor — премиум-салон штор в Ташкенте. Качественные шторы, профессиональный дизайн, пошив и монтаж.",
    },
    en: {
      title: "About the Salon — Kashmir Decor Tashkent",
      description:
        "Kashmir Decor is a premium curtain salon in Tashkent, offering quality curtains, professional design, tailoring and installation.",
    },
  },
  // Style / category landing pages (Uzbek slugs)
  rim: {
    uz: {
      title: "Rim Pardalari Toshkent — Kashmir Decor",
      description:
        "Toshkentda Rim pardalari (Rim shtoralari) buyurtma qilish. Kashmir Decor salonida sifatli matolardan tikilgan zamonaviy Rim parda modellari, o'lchash va o'rnatish.",
      h1: "Rim pardalari",
    },
    ru: {
      title: "Римские шторы в Ташкенте — Kashmir Decor",
      description:
        "Римские шторы на заказ в Ташкенте от Kashmir Decor: качественные ткани, современные модели, замер и монтаж.",
      h1: "Римские шторы",
    },
    en: {
      title: "Roman Curtains in Tashkent — Kashmir Decor",
      description:
        "Roman curtains in Tashkent by Kashmir Decor: quality fabrics, modern styles, professional measurement and installation.",
      h1: "Roman curtains",
    },
  },
  klassik: {
    uz: {
      title: "Klassik Pardalar Toshkent — Kashmir Decor",
      description:
        "Toshkentda klassik uslubdagi pardalar: baxmal, jacquard va matolardan portyerlar, uy va mehmonxonalar uchun. Kashmir Decor salonida buyurtma qiling.",
      h1: "Klassik pardalar",
    },
    ru: {
      title: "Классические шторы в Ташкенте — Kashmir Decor",
      description:
        "Классические шторы в Ташкенте: бархатные и жаккардовые портьеры для дома и гостиной. Заказ в салоне Kashmir Decor.",
      h1: "Классические шторы",
    },
    en: {
      title: "Classic Curtains in Tashkent — Kashmir Decor",
      description:
        "Classic curtains in Tashkent: velvet and jacquard drapes for home and living rooms. Order from Kashmir Decor salon.",
      h1: "Classic curtains",
    },
  },
  zamonaviy: {
    uz: {
      title: "Zamonaviy Pardalar Toshkent — Kashmir Decor",
      description:
        "Toshkentda zamonaviy pardalar: minimalistik va lakonik uslub, yuqori sifatli matolar, uy va ofis uchun. Kashmir Decor — zamonaviy interyer uchun pardalar.",
      h1: "Zamonaviy pardalar",
    },
    ru: {
      title: "Современные шторы в Ташкенте — Kashmir Decor",
      description:
        "Современные шторы в Ташкенте: минималистичный и лаконичный стиль, качественные ткани для дома и офиса — Kashmir Decor.",
      h1: "Современные шторы",
    },
    en: {
      title: "Modern Curtains in Tashkent — Kashmir Decor",
      description:
        "Modern curtains in Tashkent: minimalist, laconic style, premium fabrics for home and office — Kashmir Decor.",
      h1: "Modern curtains",
    },
  },
  premium: {
    uz: {
      title: "Premium Pardalar Toshkent — Kashmir Decor",
      description:
        "Toshkentda premium va lyuks toifadagi pardalar: yuqori sifatli matolar, eksklyuziv dizayn, individual buyurtma. Kashmir Decor premium parda saloni.",
      h1: "Premium pardalar",
    },
    ru: {
      title: "Премиум шторы в Ташкенте — Kashmir Decor",
      description:
        "Премиум и люкс шторы в Ташкенте: высококачественные ткани, эксклюзивный дизайн, индивидуальный заказ — Kashmir Decor.",
      h1: "Премиум шторы",
    },
    en: {
      title: "Premium Curtains in Tashkent — Kashmir Decor",
      description:
        "Premium and luxury curtains in Tashkent: high-quality fabrics, exclusive design, custom orders — Kashmir Decor.",
      h1: "Premium curtains",
    },
  },
} as const;

/** Get SEO copy for a given locale; falls back to UZ then RU. */
export function getLocalePage<T extends { uz: any; ru?: any; en?: any }>(
  map: T,
  locale: Locale,
): T["uz"] {
  return (map as any)[locale] ?? map.uz ?? map.ru ?? map.en;
}

import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://kashmirdecor.uz").replace(/\/$/, "");

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

export const SEO = {
  home: {
    title: "Шторы в Ташкенте на заказ | KASHMIR — Премиальный салон штор",
    description: "Премиальные шторы на заказ в Ташкенте от KASHMIR: портьеры, интерьерные ткани, пошив и установка для дома и коммерческих интерьеров.",
  },
  collections: {
    title: "Шторы на заказ в Ташкенте | KASHMIR — Премиальный салон штор",
    description: "Выберите премиальные портьеры и интерьерные шторы в коллекции KASHMIR в Ташкенте. Подберём ткань, выполним пошив и установку под ваш интерьер.",
  },
  interiors: {
    title: "Интерьерные шторы в Ташкенте | KASHMIR — Премиальный салон штор",
    description: "Интерьерные проекты KASHMIR в Ташкенте: шторы на заказ, текстиль и продуманные решения для спокойных, выразительных пространств.",
  },
  gallery: {
    title: "Портьеры и интерьеры в Ташкенте | KASHMIR — Премиальный салон штор",
    description: "Галерея KASHMIR: портьеры, интерьерные шторы и реализованные проекты в Ташкенте. Вдохновитесь решениями для дома и бизнеса.",
  },
} as const;

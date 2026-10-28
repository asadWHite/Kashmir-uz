"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  curtainTr,
  interiorTr,
  statTr,
  statSuffixTr,
  adminTr,
  translate,
  translateArr,
  type Locale,
} from "@/lib/i18n";

type Ctx = {
  locale: Locale;
  locales: readonly Locale[];
  defaultLocale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  tArr: (key: string) => string[];
  tc: (slug: string, field: "name" | "desc", fallback: string) => string;
  ti: (
    slug: string,
    field: "title" | "desc" | "location",
    fallback: string,
  ) => string;
  ts: (label: string, fallback: string) => string;
  tsS: (label: string, fallback: string) => string;
  ta: (key: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    LOCALES.includes(initialLocale) ? initialLocale : DEFAULT_LOCALE,
  );

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      document.cookie = `kashmir-locale=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    } catch {
      /* ignore */
    }
    try {
      localStorage.setItem("kashmir-locale", l);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") document.documentElement.lang = l;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      locales: LOCALES,
      defaultLocale: DEFAULT_LOCALE,
      setLocale,
      t: (k: string) => translate(locale, k),
      tArr: (k: string) => translateArr(locale, k),
      tc: (slug, field, fb) => curtainTr(locale, slug, field, fb),
      ti: (slug, field, fb) => interiorTr(locale, slug, field, fb),
      ts: (label, fb) => statTr(locale, label, fb),
      tsS: (label, fb) => statSuffixTr(locale, label, fb),
      ta: (key: string) => adminTr(locale, key),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}

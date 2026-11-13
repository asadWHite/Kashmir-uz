"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocaleAction } from "@/app/actions/locale";
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
  translate,
  translateArr,
  adminTr,
  type Locale,
} from "@/lib/i18n";
import type { SettingsView } from "@/lib/types";

/**
 * Locale context for client components.
 *
 * Responsibility split — this is the single rule that keeps the site from
 * showing a mixture of languages:
 *
 *  · `t()` / `tArr()`   → static interface copy only (buttons, labels, empty
 *                          states). Comes from src/lib/i18n.ts.
 *  · `c.<field>`        → database content, **already localized on the server**
 *                          and passed down as props (see src/lib/data.ts +
 *                          src/lib/content.ts). Client components never look
 *                          content up by slug any more.
 *  · `settings`         → database-backed copy (hero/about/contact), localized
 *                          on the server for the same locale.
 *
 * The language switcher performs a client-side navigation after writing the
 * cookie, so the server re-renders the page tree in the new locale. There is no
 * full page reload, no hydration mismatch and no stale content.
 */
export type ContentProp = {
  /** The locale this content was resolved for on the server. */
  locale: Locale;
} | null;

type Ctx = {
  locale: Locale;
  locales: readonly Locale[];
  defaultLocale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  tArr: (key: string) => string[];
  ta: (key: string) => string;
  settings: SettingsView | null;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  initialLocale,
  settings,
  children,
}: {
  initialLocale: Locale;
  settings: SettingsView | null;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    LOCALES.includes(initialLocale) ? initialLocale : DEFAULT_LOCALE,
  );
  const router = useRouter();
  const [, startTransition] = useTransition();

  const setLocale = useCallback(
    (next: Locale) => {
    let previous: string | undefined;
    try {
      previous = document.cookie
        .split("; ")
        .find((c) => c.startsWith("kashmir-locale="))
        ?.split("=")[1];
    } catch {
      /* ignore */
    }
    if (previous === next) return;

    setLocaleState(next);
    try {
      // 1 year, site-wide, readable by the server on the next request.
      document.cookie = `kashmir-locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    } catch {
      /* ignore */
    }
    try {
      localStorage.setItem("kashmir-locale", next);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") document.documentElement.lang = next;

    // Persist server-side first (Server Action writes the cookie), then
    // re-render the server components so their output matches the new
    // language. No full page reload: scroll position, the client tree and the
    // URL — including an indexed product URL — are all preserved.
    startTransition(async () => {
      try {
        await setLocaleAction(next);
      } catch {
        /* the cookie was already written client-side as a fallback */
      }
      router.refresh();
    });
    },
    [router],
  );

  const value = useMemo<Ctx>(
    () => ({
      locale,
      locales: LOCALES,
      defaultLocale: DEFAULT_LOCALE,
      setLocale,
      t: (key: string) => translate(locale, key),
      tArr: (key: string) => translateArr(locale, key),
      ta: (key: string) => adminTr(locale, key),
      settings,
    }),
    [locale, setLocale, settings],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}

/**
 * Settings are database-backed copy localized on the server. Components that
 * need them take them from context so they are not threaded through every
 * prop chain, and they can never disagree with the page locale.
 */
export function useSettings(): SettingsView {
  const { settings } = useT();
  if (!settings) throw new Error("Settings were not provided by the layout");
  return settings;
}

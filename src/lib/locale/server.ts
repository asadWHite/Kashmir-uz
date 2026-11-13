import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, LOCALE_SHORT, type Locale } from "@/lib/i18n";
import { toLocale } from "@/lib/content";

export const LOCALE_COOKIE = "kashmir-locale";

/**
 * The one server-side way to learn the visitor's language.
 *
 * A request header is accepted as well, so a client-side navigation can pass
 * the newly chosen language immediately (`x-locale`) instead of racing the
 * cookie write. Neither value is trusted for authorization, only for content
 * selection, and both are strictly validated against the supported set.
 */
export async function getRequestLocale(): Promise<Locale> {
  try {
    const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
    const fromHeader = headerStore.get("x-locale");
    if (fromHeader && (LOCALES as readonly string[]).includes(fromHeader)) {
      return toLocale(fromHeader);
    }
    return toLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function localeLabel(locale: Locale): string {
  return LOCALE_SHORT[locale];
}

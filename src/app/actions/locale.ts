"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { toLocale } from "@/lib/content";
import { LOCALE_COOKIE } from "@/lib/locale/server";

/**
 * Persist the visitor's language server-side.
 *
 * Called as a Server Action from the language switcher. The cookie is written
 * before the response, so the very next server render (including a shared
 * product URL opened in a new tab) uses the new language — the language never
 * resets on refresh or navigation, and there is no hydration mismatch because
 * the cookie is also what the root layout reads on the initial request.
 */
export async function setLocaleAction(locale: string): Promise<void> {
  const next = toLocale(locale);
  const store = await cookies();
  store.set(LOCALE_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

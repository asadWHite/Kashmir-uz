/**
 * Single source of truth for the public website origin.
 *
 * Used by SEO canonicals, the sitemap and the admin panel's "View website"
 * action. Nothing in the app is allowed to hardcode a second website URL.
 */

/** The verified production origin. */
export const PRODUCTION_SITE_URL = "https://kashmirdecor.uz";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

export class InvalidSiteUrlError extends Error {
  constructor(value: string) {
    super(
      `NEXT_PUBLIC_SITE_URL must be the production origin (https, no path, no ` +
        `credentials, no preview host). Received: ${value}`,
    );
    this.name = "InvalidSiteUrlError";
  }
}

function parse(raw: string): URL | null {
  try {
    return new URL(raw.trim());
  } catch {
    return null;
  }
}

/** Is this a trusted production origin (not localhost, not a preview host)? */
export function isProductionOrigin(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (LOCAL_HOSTNAMES.has(url.hostname)) return false;
  // Platform preview hosts (Vercel deploy URLs, sandbox previews).
  if (url.hostname.endsWith(".vercel.app") || url.hostname.endsWith(".e2b.app")) return false;
  if (/\d+-\w+\.e2b\.app$/.test(url.hostname)) return false;
  return true;
}

/**
 * Resolve the public site URL.
 *
 * Order of preference:
 *   1. `NEXT_PUBLIC_SITE_URL` when it is a valid production origin.
 *   2. `NEXT_PUBLIC_PRODUCTION_URL` when it is a valid production origin.
 *   3. The verified production origin.
 *
 * A misconfigured (localhost / preview) value never leaks into canonicals or
 * the admin preview action; it is ignored, exactly as the previous SEO
 * implementation did, but now with one implementation instead of two.
 */
export function resolveSiteUrl(): string {
  for (const candidate of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_PRODUCTION_URL,
  ]) {
    if (!candidate) continue;
    const parsed = parse(candidate);
    if (!parsed) continue;
    if (!isProductionOrigin(parsed)) continue;
    // Reject origins with a path/query/hash so canonicals stay clean.
    if (parsed.pathname !== "/" || parsed.search || parsed.hash) continue;
    return parsed.origin;
  }
  return PRODUCTION_SITE_URL;
}

export const SITE_URL = resolveSiteUrl();

/** Absolute URL for a site path, always rooted at the production origin. */
export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return new URL(clean, `${SITE_URL}/`).toString();
}

/**
 * KASHMIR — product detail gallery source of truth.
 *
 * A curtain row stores a single `imageUrl` plus an optional `gallery` JSON
 * array. That array is free-form (the admin API accepts any `string[]`, and
 * the admin form itself only edits `imageUrl`), so in practice it arrives
 * empty, repeats the main image, or holds empty slots. Everything the gallery
 * renders is funnelled through `uniqueGalleryImages()` so the strip can never
 * show the same picture twice — and never shows up at all for a single image.
 */

/**
 * Editorial cap. Keeps the strip to a maximum of two desktop rows so a
 * mistyped gallery array cannot push the page into a wall of thumbnails.
 */
export const MAX_GALLERY_IMAGES = 8;

/**
 * Normalise one candidate image URL, or return `null` when it is unusable.
 * Trailing slashes are dropped (`/uploads/a.jpg/` is `/uploads/a.jpg`);
 * `data:` URLs are returned untouched because the image *is* the string.
 */
export function normalizeGalleryUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  return url.replace(/\/+$/, "");
}

/**
 * Main image first, then every usable gallery entry, in the stored order,
 * de-duplicated by URL and capped at `limit`.
 */
export function uniqueGalleryImages(
  mainImage: string | null | undefined,
  gallery: string[] | null | undefined,
  limit: number = MAX_GALLERY_IMAGES,
): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  const add = (candidate: unknown) => {
    const url = normalizeGalleryUrl(candidate);
    if (!url) return;
    // Data URLs are case-sensitive payloads — compare them verbatim.
    const key = url.startsWith("data:") ? url : url.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(url);
  };

  add(mainImage);
  if (Array.isArray(gallery)) {
    for (const entry of gallery) add(entry);
  }

  return limit > 0 ? unique.slice(0, limit) : unique;
}

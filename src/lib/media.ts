/**
 * Image delivery helpers.
 *
 * The upload pipeline in `src/lib/image-processing.ts` returns a base64 data
 * URL, and the legacy `*_image_url` columns may already contain multi-megabyte
 * data URLs. A data URL cannot be optimized, cannot be lazy-loaded usefully and
 * gets re-sent inside the HTML/RSC payload of every page that mentions the row —
 * which is the single largest measured source of page weight.
 *
 * `toImageSrc()` maps any stored value to a usable `src`:
 *   · `/assets/...` and other relative paths are served as-is,
 *   · `https://…` URLs are served as-is,
 *   · small data URLs are kept inline for legacy call sites,
 *   · oversized data URLs are rejected in favour of the curated fallback asset;
 *     interior records use `toPublicInteriorImageUrl()` below so their stored
 *     bytes are streamed instead of discarded.
 *
 * The data itself is never destroyed or rewritten here: this is a read-path
 * decision, reversible at any time.
 */

/** Beyond this, a data URL is not a usable `<img src>` at all. */
export const MAX_INLINE_DATA_URL_BYTES = 200 * 1024;

export function isDataUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && /^data:/i.test(url);
}

export function dataUrlBytes(url: string): number {
  const comma = url.indexOf(",");
  if (comma === -1) return 0;
  return Math.floor(((url.length - comma - 1) * 3) / 4);
}

export function toImageSrc(
  stored: string | null | undefined,
  fallback: string,
): string {
  if (!stored) return fallback;
  if (!isDataUrl(stored)) return stored;
  if (dataUrlBytes(stored) > MAX_INLINE_DATA_URL_BYTES) return fallback;
  return stored;
}

/**
 * Return a stable public URL for an interior image stored in the legacy image
 * column.
 *
 * Uploads are intentionally kept in the database as optimized data URLs so
 * the existing admin workflow and old records remain compatible. They must not
 * be placed directly in the public RSC payload, though: a data URL can be
 * several megabytes and the generic `MediaImage` read-path guard quite rightly
 * rejects oversized inline sources. The interior media route streams the same
 * stored bytes back to the browser, so the card receives the uploaded image
 * rather than a curated fallback and the detail view can open those bytes at
 * their original stored aspect ratio.
 *
 * External URLs and existing relative paths are left untouched. `version` is
 * part of the URL for data-backed images so replacing an image invalidates the
 * browser/CDN cache without changing the database value.
 */
export function toPublicInteriorImageUrl(
  interiorId: number,
  stored: string | null | undefined,
  galleryIndex?: number,
  version?: Date | number | string | null,
): string | null {
  if (!stored) return null;
  if (!isDataUrl(stored)) return stored;

  const params = new URLSearchParams();
  if (galleryIndex !== undefined) params.set("gallery", String(galleryIndex));
  if (version !== undefined && version !== null) {
    params.set("v", version instanceof Date ? String(version.getTime()) : String(version));
  }
  const query = params.toString();
  return `/api/media/interiors/${interiorId}${query ? `?${query}` : ""}`;
}

/**
 * Responsive `sizes` presets, kept in one place so every call site describes
 * the same layout. Getting this wrong is what makes mobile browsers download
 * desktop-sized assets.
 */
export const IMAGE_SIZES = {
  /** Full-viewport hero. */
  hero: "100vw",
  /** 4:5 product card in a 1/2/3-column grid. */
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  /** Product detail hero. */
  detail: "(max-width: 768px) 100vw, 60vw",
  /** Editorial interiors grid. */
  editorial: "(max-width: 1024px) 100vw, 50vw",
  /** Small thumbnails (related items, admin previews). */
  thumb: "25vw",
  /** Gallery masonry tiles. */
  gallery: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
} as const;

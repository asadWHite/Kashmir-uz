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
 *   · oversized data URLs are always kept exact; interior records use
 *     `toPublicInteriorImageUrl()` below so their stored bytes are streamed
 *     instead of inlined.
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
  fallback?: string,
): string | null {
  // A fallback is only valid when the record has no stored reference. Once a
  // record has a value, keep that exact value even when it is large or later
  // fails to load; the component will show a neutral placeholder rather than
  // another record's image.
  if (!stored) return fallback ?? null;
  if (!isDataUrl(stored)) return stored;
  if (dataUrlBytes(stored) > MAX_INLINE_DATA_URL_BYTES) return stored;
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
 * Record-scoped public URL for a curtain image (primary or one gallery slot),
 * mirroring `toPublicInteriorImageUrl` exactly: the stored bytes stay in the
 * database untouched, the URL is deterministic per record and slot, and
 * `version` busts caches when the image is replaced.
 */
export function toPublicCurtainImageUrl(
  curtainId: number,
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
  return `/api/media/curtains/${curtainId}${query ? `?${query}` : ""}`;
}

/**
 * Record-scoped public URL for a standalone gallery-row image. The gallery
 * table has no `updated_at`, so callers pass a content-derived version (see
 * `contentVersion` in `src/lib/data.ts`) — replacing the image changes the
 * bytes and therefore the URL, which keeps CDN/browser caches correct.
 */
export function toPublicGalleryImageUrl(
  galleryId: number,
  stored: string | null | undefined,
  version?: Date | number | string | null,
): string | null {
  if (!stored) return null;
  if (!isDataUrl(stored)) return stored;

  const params = new URLSearchParams();
  if (version !== undefined && version !== null) {
    params.set("v", version instanceof Date ? String(version.getTime()) : String(version));
  }
  const query = params.toString();
  return `/api/media/gallery/${galleryId}${query ? `?${query}` : ""}`;
}

/**
 * Widths the record-scoped media routes will resize for. Mirrors
 * `deviceSizes` + `imageSizes` in `next.config.ts` so the `srcset` that
 * `MediaImage` builds always finds a matching variant.
 */
export const MEDIA_ROUTE_WIDTHS = [64, 96, 128, 256, 360, 384, 420, 640, 768, 1024, 1280, 1536, 1920] as const;

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

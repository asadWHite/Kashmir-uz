/**
 * Read-path rules for curtain image references.
 *
 * Curtains currently keep their primary image and supplemental gallery in the
 * same row (`image_url` plus JSONB `gallery`). There is no separate asset table
 * or object ID in that schema, so this module deliberately does not rewrite the
 * stored values. It only builds a safe, ordered view for rendering.
 */

const DATA_IMAGE = /^data:image\/[a-z0-9.+-]+(?:;[^,]*)?,/i;
const ABSOLUTE_IMAGE_URL = /^https?:\/\/[^\s]+$/i;
const ROOT_RELATIVE_URL = /^\/[^\s]*$/;
const OPTIMIZER_KEYS = new Set([
  "auto",
  "dpr",
  "fit",
  "fm",
  "format",
  "h",
  "height",
  "ixlib",
  "q",
  "quality",
  "rect",
  "s",
  "w",
  "width",
]);

/**
 * Keep only values that can be used as an image source by the public renderer.
 * Invalid JSON members are ignored instead of reaching JSX or becoming a
 * placeholder for a different product.
 */
export function isCurtainImageReference(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const source = value.trim();
  if (!source || /^(?:javascript|vbscript|file|blob):/i.test(source)) return false;
  return DATA_IMAGE.test(source) || ABSOLUTE_IMAGE_URL.test(source) || ROOT_RELATIVE_URL.test(source);
}

function normalizeDataUrl(source: string): string {
  const comma = source.indexOf(",");
  if (comma < 0) return source.toLowerCase();
  const header = source.slice(0, comma).replace(/\s+/g, "").toLowerCase();
  const payload = source.slice(comma + 1).replace(/\s+/g, "");
  return `${header},${payload}`;
}

/** Compact deterministic fingerprint for a data URL without copying it into a React key. */
function fingerprint(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ (code + index), 0x85ebca6b);
  }
  return `${value.length}:${(first >>> 0).toString(16)}:${(second >>> 0).toString(16)}`;
}

function normalizedUrl(source: string, depth: number): string {
  try {
    const parsed = new URL(source, "https://curtain-image-identity.invalid");

    // Next's optimizer carries the original source in `url`; widths, quality
    // and other optimizer settings must not turn one asset into many gallery
    // entries. Follow at most two levels so a malformed nested URL cannot loop.
    if (parsed.pathname === "/_next/image" || parsed.pathname.endsWith("/_next/image")) {
      const original = parsed.searchParams.get("url");
      if (original && isCurtainImageReference(original)) return imageReferenceIdentity(original, depth + 1);
    }

    parsed.hash = "";
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (OPTIMIZER_KEYS.has(key.toLowerCase())) parsed.searchParams.delete(key);
    }
    parsed.searchParams.sort();

    // The synthetic origin is only an implementation detail for root-relative
    // paths; retaining a leading slash makes it compare with itself on future
    // calls without conflating it with an external host.
    if (parsed.origin === "https://curtain-image-identity.invalid") {
      return `${parsed.pathname}${parsed.search}`;
    }
    parsed.hostname = parsed.hostname.toLowerCase();
    if ((parsed.protocol === "https:" && parsed.port === "443") || (parsed.protocol === "http:" && parsed.port === "80")) {
      parsed.port = "";
    }
    return parsed.toString();
  } catch {
    // `isCurtainImageReference` rejects the unsafe cases. This branch is only
    // a stable identity for an unusual but still renderable relative source.
    return source.trim();
  }
}

/**
 * Stable identity derived from the stored source where the source exposes one.
 * It is intentionally not a content hash: hashing multi-megabyte data URLs on
 * every request would be expensive, and the existing schema has no original
 * upload/object ID to compare against.
 */
export function imageReferenceIdentity(source: string, depth = 0): string {
  const trimmed = source.trim();
  if (DATA_IMAGE.test(trimmed)) {
    const canonical = normalizeDataUrl(trimmed);
    const comma = canonical.indexOf(",");
    const header = comma < 0 ? canonical : canonical.slice(0, comma);
    const payload = comma < 0 ? "" : canonical.slice(comma + 1);
    return `data:${header}:${fingerprint(payload)}`;
  }
  if (depth > 2) return trimmed;
  return normalizedUrl(trimmed, depth);
}

/**
 * Return the current curtain's images in stable display order.
 *
 * The primary column is the first source, followed by the row's gallery array.
 * That is the only cross-field relationship we can prove from the production
 * schema. Entries are deduplicated by source identity, not by array position;
 * the first stored reference wins, so original ordering and the exact stored
 * URL/data URL remain intact. No curated asset is introduced and no database
 * value is changed.
 */
export function normalizeCurtainGallery(primary: unknown, gallery: unknown): string[] {
  const candidates: unknown[] = [primary];
  if (Array.isArray(gallery)) candidates.push(...gallery);

  const seen = new Set<string>();
  const result: string[] = [];
  for (const candidate of candidates) {
    if (!isCurtainImageReference(candidate)) continue;
    const source = candidate.trim();
    const identity = imageReferenceIdentity(source);
    if (seen.has(identity)) continue;
    seen.add(identity);
    result.push(source);
  }
  return result;
}

/** A small named helper for callers that already have a row-shaped object. */
export function curtainGalleryFromRow(row: { imageUrl?: unknown; gallery?: unknown }): string[] {
  return normalizeCurtainGallery(row.imageUrl, row.gallery);
}

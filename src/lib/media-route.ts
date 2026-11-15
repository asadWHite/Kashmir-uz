import "server-only";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { isDataUrl, MEDIA_ROUTE_WIDTHS } from "@/lib/media";

/**
 * Shared read-path for the record-scoped image endpoints
 * (`/api/media/interiors|curtains|gallery/[id]`).
 *
 * Two delivery modes per URL:
 *
 *  · bare URL (`?v=…`, no `w`) — the stored bytes streamed *byte-exact*, so the
 *    database record ↔ URL relationship stays verifiable end to end;
 *  · `?w=…&q=…` variants — Sharp-resized WebP renditions used by the
 *    responsive `srcset` that `MediaImage` emits, so a phone never downloads a
 *    2400px original when a 420px one suffices.
 *
 * Both carry long-lived cache headers keyed by the versioned URL: replacing an
 * image changes `v` (updatedAt or content hash), so no cache can serve
 * outdated bytes after an admin update.
 */

const IMAGE_DATA_URL = /^data:([^;,]+)(?:;[^,]*)?,([\s\S]*)$/i;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function notFound() {
  return new NextResponse("Image not found.", { status: 404 });
}

export function decodeImageDataUrl(value: string): { mimeType: string; bytes: Buffer } | null {
  const match = IMAGE_DATA_URL.exec(value);
  if (!match) return null;
  const mimeType = match[1].toLowerCase();
  if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) return null;

  const comma = value.indexOf(",");
  const header = value.slice(5, comma).toLowerCase();
  try {
    const bytes = header.split(";").includes("base64")
      ? Buffer.from(match[2], "base64")
      : Buffer.from(decodeURIComponent(match[2]));
    if (!bytes.length) return null;
    return { mimeType, bytes };
  } catch {
    return null;
  }
}

function parseVariantWidth(raw: string | null): number | null {
  if (raw === null) return null;
  if (!/^\d{1,5}$/.test(raw)) return -1;
  const width = Number(raw);
  return (MEDIA_ROUTE_WIDTHS as readonly number[]).includes(width) ? width : -1;
}

export interface ServeImageOptions {
  /** The stored reference (must be a data URL for the media routes). */
  stored: string | null | undefined;
  width: string | null;
  quality: string | null;
  /** True when the request carries an explicit cache-busting version. */
  versioned: boolean;
  label: string;
}

export async function serveStoredImage(
  { stored, width, quality, versioned, label }: ServeImageOptions,
  context: { id: number; galleryIndex: number | null },
): Promise<NextResponse> {
  if (!stored || !isDataUrl(stored)) {
    console.error(`${label} image is unavailable.`, { ...context, reason: "unsupported-storage-reference" });
    return notFound();
  }
  const image = decodeImageDataUrl(stored);
  if (!image) {
    console.error(`${label} image is unavailable.`, { ...context, reason: "invalid-image-data" });
    return notFound();
  }

  const requestedWidth = parseVariantWidth(width);
  if (requestedWidth === -1) {
    return new NextResponse("Unsupported image width.", { status: 400 });
  }

  // Versioned URLs change whenever the bytes change, so they are immutable.
  const cacheControl = versioned
    ? "public, max-age=31536000, stale-while-revalidate=86400, no-transform"
    : "public, max-age=300, stale-while-revalidate=60, no-transform";

  // Variant path: responsive WebP rendition.
  if (requestedWidth !== null) {
    const parsedQuality = Number(quality ?? "75");
    const q = Number.isFinite(parsedQuality) ? Math.min(90, Math.max(40, parsedQuality)) : 75;
    try {
      const variant = await sharp(image.bytes)
        .resize({ width: requestedWidth, withoutEnlargement: true })
        .webp({ quality: q })
        .toBuffer();
      return new NextResponse(new Uint8Array(variant), {
        status: 200,
        headers: {
          "Cache-Control": cacheControl,
          "Content-Disposition": "inline",
          "Content-Length": String(variant.byteLength),
          "Content-Type": "image/webp",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      console.error(`${label} image resize failed.`, { ...context, reason: "resize-failed" });
      return notFound();
    }
  }

  // Bare path: byte-exact stored image.
  return new NextResponse(new Uint8Array(image.bytes), {
    status: 200,
    headers: {
      "Cache-Control": cacheControl,
      "Content-Disposition": "inline",
      "Content-Length": String(image.bytes.byteLength),
      "Content-Type": image.mimeType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

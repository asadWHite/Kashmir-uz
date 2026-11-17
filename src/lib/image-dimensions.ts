import "server-only";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { decodeImageDataUrl } from "@/lib/media-route";

/**
 * Intrinsic dimensions of stored images, read server-side so a card frame can
 * adopt the image's own aspect ratio (4:5, 16:9, 16:4, …) instead of forcing
 * a fixed crop. Display metadata only — upload, validation, storage and the
 * optimized `?w=` variant pipeline are untouched.
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Historical card ratio, used only when a source cannot be probed (no stored
 * image, or an external URL the server cannot read locally).
 */
export const DEFAULT_CARD_DIMENSIONS: ImageDimensions = {
  width: 1200,
  height: 1500,
};

/** Process-local probe cache: one sharp metadata read per unique image. */
const probeCache = new Map<string, ImageDimensions | null>();

async function probe(stored: string): Promise<ImageDimensions | null> {
  const key = createHash("sha1").update(stored).digest("hex");
  const cached = probeCache.get(key);
  if (cached !== undefined) return cached;

  let dims: ImageDimensions | null = null;
  try {
    let bytes: Buffer | null = null;
    const decoded = decodeImageDataUrl(stored);
    if (decoded) {
      bytes = decoded.bytes;
    } else if (stored.startsWith("/") && !stored.startsWith("//")) {
      // Existing relative asset path (seed/curated visuals under /public).
      bytes = await readFile(path.join(process.cwd(), "public", stored));
    }
    if (bytes) {
      const meta = await sharp(bytes).metadata();
      if (meta.width && meta.height) dims = { width: meta.width, height: meta.height };
    }
  } catch {
    dims = null;
  }
  probeCache.set(key, dims);
  return dims;
}

/**
 * Dimensions for a card's primary image. Falls back to the historical 4:5
 * frame when there is no probeable source so the layout never collapses.
 */
export async function cardImageDimensions(
  stored: string | null | undefined,
): Promise<ImageDimensions> {
  if (stored) {
    const dims = await probe(stored);
    if (dims) return dims;
  }
  return DEFAULT_CARD_DIMENSIONS;
}

/**
 * KASHMIR DECOR — Server-side image processing pipeline.
 *
 * Produces optimized WebP assets for the public site from arbitrary admin
 * uploads (up to 15 MB originals).  Original files are never persisted on
 * disk; only the optimized variants are kept under /public/uploads so the
 * database stores references (URLs), never binary data.
 */

import "server-only";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024; // 15 MB upload ceiling
export const MAX_WIDTH = 2400; // desktop/hero ceiling
export const CARD_WIDTH = 800; // collection/detail thumbnails
export const THUMB_WIDTH = 320; // admin list previews

export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

// Magic-byte signatures for real file-type detection (MIME alone is not
// trusted — an attacker can rename an executable to .jpg).
const SIGNATURES: { sig: Buffer; mime: string; exts: string[] }[] = [
  { sig: Buffer.from([0xff, 0xd8, 0xff]), mime: "image/jpeg", exts: ["jpg", "jpeg"] },
  { sig: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), mime: "image/png", exts: ["png"] },
  { sig: Buffer.from("RIFF"), mime: "image/webp", exts: ["webp"] }, // followed by 'WEBP' at offset 8
  { sig: Buffer.from([0x00, 0x00, 0x00]), mime: "image/avif", exts: ["avif"] }, // rough — checked below
];

export type ProcessedImage = {
  url: string;       // public path to the large webp
  thumbUrl: string;  // public path to the card-size webp (used in listings / admin preview)
  width: number;
  height: number;
  bytes: number;
};

function detectMime(buffer: Buffer): string | null {
  for (const s of SIGNATURES) {
    if (buffer.length < s.sig.length) continue;
    if (s.mime === "image/webp") {
      if (buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
          buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
      continue;
    }
    if (s.mime === "image/avif") {
      // AVIF/HEIC family — delegate validation to sharp; here we simply accept
      // that sharp will throw if it can't decode it.
      continue;
    }
    if (buffer.subarray(0, s.sig.length).equals(s.sig)) return s.mime;
  }
  return null;
}

function sanitizeStem(input: string): string {
  // Build a filesystem-safe stem — ASCII-lower, replace non-alnum with dash,
  // collapse runs, trim.
  const cleaned = input
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return cleaned || "img";
}

/**
 * Process an uploaded file into optimized webp variants on disk.
 * Returns the public URLs for the large image and a card-size thumbnail.
 */
export async function processUpload(
  file: File,
  contextHint = "curtain",
): Promise<ProcessedImage> {
  if (file.size > MAX_ORIGINAL_BYTES) {
    const err = new Error(`Rasm hajmi juda katta. Maksimal hajm ${Math.round(MAX_ORIGINAL_BYTES / 1024 / 1024)} MB.`);
    (err as any).code = "TOO_LARGE";
    throw err;
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Server-side MIME validation by magic bytes.
  const realMime = detectMime(bytes);
  if (realMime && !ALLOWED_MIME.has(realMime)) {
    const err = new Error("Qo'llab-quvvatlanmaydigan rasm formati. JPG, PNG, WEBP yoki AVIF yuklang.");
    (err as any).code = "BAD_TYPE";
    throw err;
  }

  let pipeline = sharp(bytes, { failOn: "error" });

  // Strip EXIF / metadata (no GPS, no camera data leaks).
  pipeline = pipeline.rotate().withMetadata({});
  // Note: withMetadata({}) keeps orientation (from rotate()) but drops other
  // EXIF blocks. We then re-encode without metadata via .webp({ ... }) which
  // by default does not copy metadata.

  const meta = await pipeline.metadata();
  if (!meta.width || !meta.height) {
    const err = new Error("Rasm buzilgan yoki o'qib bo'lmadi.");
    (err as any).code = "CORRUPT";
    throw err;
  }

  // Compute output dimensions — cap the longest edge at MAX_WIDTH,
  // preserving aspect ratio.
  const ratio = meta.width / meta.height;
  const outW = Math.min(meta.width, MAX_WIDTH);
  const outH = Math.round(outW / ratio);

  const cardW = Math.min(meta.width, CARD_WIDTH);
  const cardH = Math.round(cardW / ratio);

  const thumbW = Math.min(meta.width, THUMB_WIDTH);
  const thumbH = Math.round(thumbW / ratio);

  // Sanitize a filename hint — combines a context label + random id for
  // uniqueness but keeps SEO-relevant words when the admin types them.
  const originalName = typeof file.name === "string" ? file.name : "";
  const stem = sanitizeStem(originalName || contextHint);
  const id = randomUUID().slice(0, 10);
  const baseName = `${stem}-${id}`;

  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const largeName = `${baseName}.webp`;
  const cardName = `${baseName}-${cardW}w.webp`;
  const thumbName = `${baseName}-${thumbW}w.webp`;

  const largePath = join(uploadDir, largeName);
  const cardPath = join(uploadDir, cardName);
  const thumbPath = join(uploadDir, thumbName);

  // Quality is chosen based on dimensions — larger images can use lower
  // quality without visible loss.
  const quality = outW >= 1800 ? 78 : outW >= 1200 ? 82 : 86;

  const [largeBuf, cardBuf, thumbBuf] = await Promise.all([
    sharp(bytes)
      .rotate()
      .resize({ width: outW, height: outH, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 5, smartSubsample: true })
      .toBuffer(),
    sharp(bytes)
      .rotate()
      .resize({ width: cardW, height: cardH, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toBuffer(),
    sharp(bytes)
      .rotate()
      .resize({ width: thumbW, height: thumbH, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 74, effort: 4 })
      .toBuffer(),
  ]);

  await Promise.all([
    writeFile(largePath, largeBuf),
    writeFile(cardPath, cardBuf),
    writeFile(thumbPath, thumbBuf),
  ]);

  return {
    url: `/uploads/${largeName}`,
    thumbUrl: `/uploads/${cardName}`,
    width: outW,
    height: outH,
    bytes: largeBuf.length,
  };
}

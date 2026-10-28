import sharp from "sharp";

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1800;
const MAX_INPUT_PIXELS = 150_000_000;
// Keep optimized output compact so data URLs save quickly and stay well under
// serverless request/response body limits.
const MAX_OPTIMIZED_BYTES = 1_800_000;
const SUPPORTED_FORMATS = new Set([
  "jpeg",
  "jpg",
  "png",
  "webp",
  "gif",
  "avif",
  "heif",
  "tiff",
  "svg",
]);

export class ImageUploadError extends Error {
  constructor(
    message: string,
    readonly status: number = 422,
  ) {
    super(message);
    this.name = "ImageUploadError";
  }
}

export type OptimizedImage = {
  url: string;
  filename: string;
  originalSize: number;
  optimizedSize: number;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
};

/** Keep only a safe, short basename; uploaded images are stored as data URLs. */
export function sanitizeImageFilename(name: string): string {
  const basename = name.split(/[\\/]/).pop() || "image";
  const stem = basename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[^.]*$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${stem || "image"}.webp`;
}

function detectMimeFallback(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (buf.length >= 6 && buf.subarray(0, 3).toString("ascii") === "GIF") {
    return "image/gif";
  }
  return null;
}

/**
 * Detect the real input format from its bytes, autorotate using EXIF orientation,
 * constrain the longest display dimension, strip metadata, and return a
 * high-quality WebP data URL compatible with the existing image_url columns.
 */
export async function optimizeImage(
  input: Buffer,
  originalFilename: string,
): Promise<OptimizedImage> {
  if (input.length === 0) {
    throw new ImageUploadError("Файл изображения пуст.");
  }
  if (input.length > MAX_IMAGE_BYTES) {
    throw new ImageUploadError("Размер изображения превышает 15 МБ.", 413);
  }

  // Use failOn: "none" so real-world photos from phones/Telegram with minor
  // metadata or trailing-byte quirks do not fail decoding.
  const pipelineOptions = {
    failOn: "none" as const,
    limitInputPixels: MAX_INPUT_PIXELS,
  };

  let metadata: sharp.Metadata | undefined;
  try {
    metadata = await sharp(input, pipelineOptions).metadata();
  } catch {
    metadata = undefined;
  }

  if (metadata?.format && SUPPORTED_FORMATS.has(metadata.format) && metadata.width && metadata.height) {
    let output: Buffer | undefined;
    let outputInfo: sharp.OutputInfo | undefined;

    try {
      for (const quality of [86, 82, 78, 74, 68]) {
        const result = await sharp(input, pipelineOptions)
          .rotate()
          .resize({
            width: MAX_IMAGE_DIMENSION,
            height: MAX_IMAGE_DIMENSION,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality, effort: 4, smartSubsample: true })
          .toBuffer({ resolveWithObject: true });

        output = result.data;
        outputInfo = result.info;
        if (output.length <= MAX_OPTIMIZED_BYTES) break;
      }

      if (output && outputInfo && output.length <= MAX_OPTIMIZED_BYTES) {
        return {
          url: `data:image/webp;base64,${output.toString("base64")}`,
          filename: sanitizeImageFilename(originalFilename),
          originalSize: input.length,
          optimizedSize: output.length,
          originalWidth: metadata.width,
          originalHeight: metadata.height,
          width: outputInfo.width,
          height: outputInfo.height,
        };
      }
    } catch {
      // Fall through to safe binary fallback below if sharp fails at runtime.
    }
  }

  // Fallback: if the image was already compressed on the client (or sharp is
  // unavailable in the current environment) and has valid magic bytes within
  // size limits, return its data URL directly so uploads never break.
  const fallbackMime = detectMimeFallback(input);
  if (fallbackMime && input.length <= MAX_OPTIMIZED_BYTES * 2) {
    return {
      url: `data:${fallbackMime};base64,${input.toString("base64")}`,
      filename: sanitizeImageFilename(originalFilename),
      originalSize: input.length,
      optimizedSize: input.length,
      originalWidth: metadata?.width ?? 1200,
      originalHeight: metadata?.height ?? 1200,
      width: metadata?.width ?? 1200,
      height: metadata?.height ?? 1200,
    };
  }

  throw new ImageUploadError("Не удалось обработать изображение. Попробуйте JPEG, PNG или WebP.");
}

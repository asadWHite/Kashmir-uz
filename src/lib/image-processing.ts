import sharp from "sharp";

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 2400;
const MAX_INPUT_PIXELS = 150_000_000;
// The legacy storage format is a data URL returned to the admin browser. Keep
// its base64 response below Vercel Functions' 4.5 MB response-body ceiling.
const MAX_OPTIMIZED_BYTES = 3_000_000;
const SUPPORTED_FORMATS = new Set(["jpeg", "png", "webp", "gif"]);

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
    throw new ImageUploadError("Unsupported image format.");
  }
  if (input.length > MAX_IMAGE_BYTES) {
    throw new ImageUploadError("Image is larger than 15 MB.", 413);
  }

  const pipelineOptions = {
    failOn: "error" as const,
    limitInputPixels: MAX_INPUT_PIXELS,
  };

  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(input, pipelineOptions).metadata();
  } catch {
    throw new ImageUploadError("Unsupported image format.");
  }

  if (!metadata.format || !SUPPORTED_FORMATS.has(metadata.format)) {
    throw new ImageUploadError("Unsupported image format.");
  }
  if (!metadata.width || !metadata.height) {
    throw new ImageUploadError("Image processing failed.");
  }

  let output: Buffer | undefined;
  let outputInfo: sharp.OutputInfo | undefined;

  try {
    // Reduce quality only as much as needed to keep the existing data-URL
    // response safely below serverless response limits. 90 is the normal path.
    for (const quality of [90, 88, 86, 84, 82, 80, 78]) {
      const result = await sharp(input, pipelineOptions)
        .rotate()
        .resize({
          width: MAX_IMAGE_DIMENSION,
          height: MAX_IMAGE_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 5, smartSubsample: true })
        .toBuffer({ resolveWithObject: true });

      output = result.data;
      outputInfo = result.info;
      if (output.length <= MAX_OPTIMIZED_BYTES) break;
    }
  } catch (error) {
    if (
      error instanceof Error &&
      /pixel limit|exceeds.*limit|too large/i.test(error.message)
    ) {
      throw new ImageUploadError("Image dimensions are too large to process.");
    }
    throw new ImageUploadError("Image processing failed.");
  }

  if (!output || !outputInfo || output.length > MAX_OPTIMIZED_BYTES) {
    throw new ImageUploadError("Image processing failed.");
  }

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

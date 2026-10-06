import { and, eq, lt, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { imageUploadSessions } from "@/db/schema";
import {
  ImageUploadError,
  MAX_IMAGE_BYTES,
  optimizeImage,
  sanitizeImageFilename,
} from "@/lib/image-processing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHUNK_BYTES = 1024 * 1024;
const MAX_CHUNKS = Math.ceil(MAX_IMAGE_BYTES / CHUNK_BYTES);
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function errorResponse(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

function asInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function validateUploadId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function getStatus(error: unknown): number {
  return error instanceof ImageUploadError ? error.status : 500;
}

function getMessage(error: unknown): string {
  return error instanceof ImageUploadError
    ? error.message
    : "Image processing failed.";
}

async function optimizeAndRespond(buffer: Buffer, filename: string) {
  const optimized = await optimizeImage(buffer, filename);
  return NextResponse.json({ ok: true, ...optimized });
}

/**
 * Small uploads keep the existing request path. Larger originals are sent in
 * 1 MB pieces and briefly staged in Postgres so the full 15 MB upload works on
 * Vercel as well as on a self-hosted Next.js server. The final database value
 * remains the same data-URL string used by existing image_url fields.
 */
async function receiveChunk(form: FormData) {
  const uploadId = form.get("uploadId");
  const filename = form.get("filename");
  const fileSize = asInteger(form.get("fileSize"));
  const partIndex = asInteger(form.get("partIndex"));
  const totalParts = asInteger(form.get("totalParts"));
  const part = form.get("file");

  if (
    !validateUploadId(uploadId) ||
    typeof filename !== "string" ||
    !filename ||
    fileSize === null ||
    partIndex === null ||
    totalParts === null ||
    !(part instanceof File)
  ) {
    return errorResponse("Image upload chunk is invalid.", 422);
  }
  if (fileSize < 1 || fileSize > MAX_IMAGE_BYTES) {
    return errorResponse("Image is larger than 15 MB.", 413);
  }

  const expectedParts = Math.ceil(fileSize / CHUNK_BYTES);
  if (
    expectedParts !== totalParts ||
    totalParts < 1 ||
    totalParts > MAX_CHUNKS ||
    partIndex < 0 ||
    partIndex >= totalParts
  ) {
    return errorResponse("Image upload chunk is invalid.", 422);
  }

  const expectedPartSize =
    partIndex === totalParts - 1
      ? fileSize - CHUNK_BYTES * (totalParts - 1)
      : CHUNK_BYTES;
  if (part.size !== expectedPartSize) {
    return errorResponse("Image upload chunk is invalid.", 422);
  }

  const chunkData = Buffer.from(await part.arrayBuffer()).toString("base64");
  const safeFilename = sanitizeImageFilename(filename);

  try {
    const expiredBefore = new Date(Date.now() - SESSION_TTL_MS);
    await db
      .delete(imageUploadSessions)
      .where(lt(imageUploadSessions.updatedAt, expiredBefore));

    const [session] = await db
      .select({
        filename: imageUploadSessions.filename,
        expectedSize: imageUploadSessions.expectedSize,
        totalParts: imageUploadSessions.totalParts,
        nextPart: imageUploadSessions.nextPart,
      })
      .from(imageUploadSessions)
      .where(eq(imageUploadSessions.id, uploadId))
      .limit(1);

    if (!session) {
      if (partIndex !== 0) {
        return errorResponse("Upload session expired. Please select the image again.", 409);
      }
      await db.insert(imageUploadSessions).values({
        id: uploadId,
        filename: safeFilename,
        expectedSize: fileSize,
        totalParts,
        nextPart: 1,
        chunks: chunkData,
        updatedAt: new Date(),
      });
      return NextResponse.json({ ok: true, nextPart: 1 });
    }

    if (
      session.filename !== safeFilename ||
      session.expectedSize !== fileSize ||
      session.totalParts !== totalParts
    ) {
      return errorResponse("Upload session does not match this image.", 409);
    }

    // A retried chunk is harmless; the client sends parts in order.
    if (partIndex < session.nextPart) {
      return NextResponse.json({ ok: true, nextPart: session.nextPart });
    }
    if (partIndex !== session.nextPart) {
      return errorResponse("Image upload chunks arrived out of order.", 409);
    }

    const [updated] = await db
      .update(imageUploadSessions)
      .set({
        chunks: sql`${imageUploadSessions.chunks} || ':' || ${chunkData}`,
        nextPart: partIndex + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(imageUploadSessions.id, uploadId),
          eq(imageUploadSessions.expectedSize, fileSize),
          eq(imageUploadSessions.totalParts, totalParts),
          eq(imageUploadSessions.nextPart, partIndex),
        ),
      )
      .returning({ id: imageUploadSessions.id });

    if (!updated) {
      return errorResponse("Image upload chunks arrived out of order.", 409);
    }
    return NextResponse.json({ ok: true, nextPart: partIndex + 1 });
  } catch (error) {
    console.error("Could not stage admin image upload:", error);
    return errorResponse("Image upload storage is temporarily unavailable.", 503);
  }
}

async function completeChunkedUpload(req: NextRequest) {
  let body: { action?: unknown; uploadId?: unknown };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Image upload request is invalid.", 422);
  }

  if (body.action !== "complete" || !validateUploadId(body.uploadId)) {
    return errorResponse("Image upload request is invalid.", 422);
  }

  let session;
  try {
    [session] = await db
      .select()
      .from(imageUploadSessions)
      .where(eq(imageUploadSessions.id, body.uploadId))
      .limit(1);
  } catch (error) {
    console.error("Could not read staged admin image:", error);
    return errorResponse("Image upload storage is temporarily unavailable.", 503);
  }

  if (!session) {
    return errorResponse("Upload session expired. Please select the image again.", 409);
  }
  if (session.nextPart !== session.totalParts) {
    return errorResponse("Image upload is incomplete. Please try again.", 409);
  }

  const parts = session.chunks.split(":");
  if (parts.length !== session.totalParts) {
    await db.delete(imageUploadSessions).where(eq(imageUploadSessions.id, session.id));
    return errorResponse("Image upload is incomplete. Please select the image again.", 422);
  }

  const original = Buffer.concat(parts.map((part) => Buffer.from(part, "base64")));
  if (original.length !== session.expectedSize) {
    await db.delete(imageUploadSessions).where(eq(imageUploadSessions.id, session.id));
    return errorResponse("Image upload is incomplete. Please select the image again.", 422);
  }

  try {
    return await optimizeAndRespond(original, session.filename);
  } catch (error) {
    return errorResponse(getMessage(error), getStatus(error));
  } finally {
    await db
      .delete(imageUploadSessions)
      .where(eq(imageUploadSessions.id, session.id))
      .catch((error) => console.error("Could not clear staged admin image:", error));
  }
}

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return errorResponse("Image is larger than 15 MB.", 413);
  }

  if (req.headers.get("content-type")?.includes("application/json")) {
    return completeChunkedUpload(req);
  }

  try {
    const form = await req.formData();
    if (form.get("action") === "chunk") {
      return await receiveChunk(form);
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return errorResponse("Choose an image to upload.", 422);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return errorResponse("Image is larger than 15 MB.", 413);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      return await optimizeAndRespond(buffer, file.name);
    } catch (error) {
      return errorResponse(getMessage(error), getStatus(error));
    }
  } catch (error) {
    console.error("Could not read admin image upload:", error);
    return errorResponse("Image processing failed.", 422);
  }
}

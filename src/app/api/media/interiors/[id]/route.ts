import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interiors } from "@/db/schema";
import { isDataUrl } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_DATA_URL = /^data:([^;,]+)(?:;[^,]*)?,([\s\S]*)$/i;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function notFound() {
  return new NextResponse("Interior image not found.", { status: 404 });
}

/**
 * Decode one of the optimized image data URLs stored by the existing admin
 * upload workflow. This route is deliberately read-only and only exposes
 * images belonging to active interior records.
 */
function decodeImageDataUrl(value: string): { mimeType: string; bytes: Buffer } | null {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const interiorId = Number(id);
  if (!Number.isSafeInteger(interiorId) || interiorId < 1) return notFound();

  const galleryParam = request.nextUrl.searchParams.get("gallery");
  let galleryIndex: number | null = null;
  if (galleryParam !== null) {
    if (!/^\d+$/.test(galleryParam)) return notFound();
    galleryIndex = Number(galleryParam);
    if (!Number.isSafeInteger(galleryIndex) || galleryIndex < 0) return notFound();
  }

  try {
    const [row] = await db
      .select({ imageUrl: interiors.imageUrl, gallery: interiors.gallery })
      .from(interiors)
      .where(and(eq(interiors.id, interiorId), eq(interiors.isActive, true)))
      .limit(1);

    if (!row) return notFound();

    const stored =
      galleryIndex === null
        ? row.imageUrl
        : Array.isArray(row.gallery)
          ? row.gallery[galleryIndex]
          : null;
    if (!stored || !isDataUrl(stored)) return notFound();

    const image = decodeImageDataUrl(stored);
    if (!image) return notFound();

    return new NextResponse(new Uint8Array(image.bytes), {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        "Content-Disposition": "inline",
        "Content-Length": String(image.bytes.byteLength),
        "Content-Type": image.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Could not read interior image:", error);
    return notFound();
  }
}

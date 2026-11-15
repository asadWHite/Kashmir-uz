import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interiors } from "@/db/schema";
import { notFound, serveStoredImage } from "@/lib/media-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Decode one of the optimized image data URLs stored by the existing admin
 * upload workflow. This route is deliberately read-only and only exposes
 * images belonging to active interior records. Bare URLs stream the stored
 * bytes byte-exact; `?w=…` variants are responsive WebP renditions used by
 * `MediaImage`'s srcset (see src/lib/media-route.ts).
 */
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

    return serveStoredImage(
      {
        stored,
        width: request.nextUrl.searchParams.get("w"),
        quality: request.nextUrl.searchParams.get("q"),
        versioned: request.nextUrl.searchParams.has("v"),
        label: "Interior",
      },
      { id: interiorId, galleryIndex },
    );
  } catch (error) {
    console.error("Could not read interior image.", {
      interiorId,
      galleryIndex,
      reason: error instanceof Error ? error.name : "unknown",
    });
    return notFound();
  }
}

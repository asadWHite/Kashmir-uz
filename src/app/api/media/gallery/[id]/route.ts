import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gallery } from "@/db/schema";
import { notFound, serveStoredImage } from "@/lib/media-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Record-scoped gallery-row image endpoint.
 *
 * The gallery table has no `updated_at`, so callers version the URL with a
 * content hash of the stored bytes (`contentVersion` in src/lib/data.ts):
 * replacing the image changes the hash and therefore the URL, keeping caches
 * correct without any schema change. Bare URLs are byte-exact; `?w=…`
 * variants power the responsive srcset.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const galleryId = Number(id);
  if (!Number.isSafeInteger(galleryId) || galleryId < 1) return notFound();

  if (request.nextUrl.searchParams.has("gallery")) return notFound();

  try {
    const [row] = await db
      .select({ imageUrl: gallery.imageUrl })
      .from(gallery)
      .where(and(eq(gallery.id, galleryId), eq(gallery.isActive, true)))
      .limit(1);

    if (!row) return notFound();

    return serveStoredImage(
      {
        stored: row.imageUrl,
        width: request.nextUrl.searchParams.get("w"),
        quality: request.nextUrl.searchParams.get("q"),
        versioned: request.nextUrl.searchParams.has("v"),
        label: "Gallery",
      },
      { id: galleryId, galleryIndex: null },
    );
  } catch (error) {
    console.error("Could not read gallery image.", {
      galleryId,
      reason: error instanceof Error ? error.name : "unknown",
    });
    return notFound();
  }
}

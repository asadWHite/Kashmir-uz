import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { curtains } from "@/db/schema";
import { notFound, serveStoredImage } from "@/lib/media-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Record-scoped curtain image endpoint (primary or one gallery slot).
 *
 * Mirrors the interior media route: the stored data URL never leaves the
 * database, the public URL is deterministic per record + slot, and the `v`
 * query (row `updated_at`) invalidates browser/CDN caches on admin replace.
 * Bare URLs are byte-exact; `?w=…` variants power the responsive srcset.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const curtainId = Number(id);
  if (!Number.isSafeInteger(curtainId) || curtainId < 1) return notFound();

  const galleryParam = request.nextUrl.searchParams.get("gallery");
  let galleryIndex: number | null = null;
  if (galleryParam !== null) {
    if (!/^\d+$/.test(galleryParam)) return notFound();
    galleryIndex = Number(galleryParam);
    if (!Number.isSafeInteger(galleryIndex) || galleryIndex < 0) return notFound();
  }

  try {
    const [row] = await db
      .select({ imageUrl: curtains.imageUrl, gallery: curtains.gallery })
      .from(curtains)
      .where(and(eq(curtains.id, curtainId), eq(curtains.isActive, true)))
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
        label: "Curtain",
      },
      { id: curtainId, galleryIndex },
    );
  } catch (error) {
    console.error("Could not read curtain image.", {
      curtainId,
      galleryIndex,
      reason: error instanceof Error ? error.name : "unknown",
    });
    return notFound();
  }
}

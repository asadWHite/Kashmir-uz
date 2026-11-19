import "server-only";
import { and, eq, gt, isNull, lt, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blindImages, blinds } from "@/db/schema";
import { adminBlindImageUrl, BLIND_IMAGE_ID } from "@/lib/blinds";
import type { OptimizedImage } from "@/lib/image-processing";
import { notFound, serveStoredImage } from "@/lib/media-route";

export function blindUploadCutoff() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export async function stageBlindImage({ url: dataUrl, ...image }: OptimizedImage) {
  await db.delete(blindImages).where(and(isNull(blindImages.blindId), lt(blindImages.createdAt, blindUploadCutoff())));
  const [stored] = await db.insert(blindImages)
    .values({ dataUrl, width: image.width, height: image.height })
    .returning({ id: blindImages.id });
  return { ...image, url: adminBlindImageUrl(stored.id) };
}

export async function serveBlindImage(request: NextRequest, id: string, admin = false) {
  if (!BLIND_IMAGE_ID.test(id)) return notFound();
  const { searchParams } = request.nextUrl;
  const width = searchParams.get("w");
  const quality = searchParams.get("q");
  const cacheControl = admin ? "private, no-store" : "public, no-cache, no-transform";
  // The UUID identifies immutable uploaded bytes. Revalidate publication before
  // replying 304, so an old image URL stops working once a product is hidden.
  const etag = `"${id}-${encodeURIComponent(width ?? "original")}-${encodeURIComponent(quality ?? "75")}"`;
  try {
    const [row] = await db.select({ dataUrl: blindImages.dataUrl, blindId: blindImages.blindId, position: blindImages.position })
      .from(blindImages)
      .leftJoin(blinds, eq(blindImages.blindId, blinds.id))
      .where(and(eq(blindImages.id, id), admin
        ? or(eq(blinds.id, blindImages.blindId), gt(blindImages.createdAt, blindUploadCutoff()))
        : eq(blinds.isPublished, true)));
    if (!row) return notFound();
    if (!admin && request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": cacheControl } });
    }
    const response = await serveStoredImage(
      { stored: row.dataUrl, width, quality, versioned: false, label: "Blind", cacheControl },
      { id: row.blindId ?? 0, galleryIndex: row.position },
    );
    if (response.ok && !admin) response.headers.set("ETag", etag);
    return response;
  } catch (error) {
    console.error("Could not serve blind image.", { id, reason: error instanceof Error ? error.name : "unknown" });
    return notFound();
  }
}

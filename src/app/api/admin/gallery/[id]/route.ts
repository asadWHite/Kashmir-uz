import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { gallery } from "@/db/schema";
import {
  deleteTranslations,
  getTranslations,
  parseTranslations,
  saveTranslations,
  touchContent,
} from "@/lib/admin-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const galleryId = Number(id);
  if (!Number.isInteger(galleryId)) {
    return NextResponse.json({ ok: false, error: "Некорректный идентификатор." }, { status: 422 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  await saveTranslations("gallery", galleryId, parsed.value);
  await touchContent("gallery", galleryId, "translate");
  return NextResponse.json({
    ok: true,
    translations: await getTranslations("gallery", galleryId),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const galleryId = Number(id);
  if (!Number.isInteger(galleryId)) {
    return NextResponse.json({ ok: false, error: "Некорректный идентификатор." }, { status: 422 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  // Shared (non-translatable) columns only. A missing field is left untouched
  // rather than written as undefined, so saving the crop cannot clear the image.
  const [updated] = await db
    .update(gallery)
    .set({
      ...(body.title !== undefined ? { title: body.title || null } : {}),
      ...(typeof body.imageUrl === "string" && body.imageUrl ? { imageUrl: body.imageUrl } : {}),
      ...(typeof body.category === "string" ? { category: body.category } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive !== false } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) || 0 } : {}),
    })
    .where(eq(gallery.id, galleryId))
    .returning();

  if (!updated) return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
  if (Object.keys(parsed.value).length > 0) {
    await saveTranslations("gallery", galleryId, parsed.value);
  }
  await touchContent("gallery", galleryId, "update");
  return NextResponse.json({
    ok: true,
    gallery: { ...updated, translations: await getTranslations("gallery", galleryId) },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const galleryId = Number(id);
  if (!Number.isInteger(galleryId)) {
    return NextResponse.json({ ok: false, error: "Некорректный идентификатор." }, { status: 422 });
  }
  await deleteTranslations("gallery", galleryId);
  await db.delete(gallery).where(eq(gallery.id, galleryId));
  await touchContent("gallery", galleryId, "delete");
  return NextResponse.json({ ok: true });
}

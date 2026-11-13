import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { interiors } from "@/db/schema";
import {
  getTranslations,
  parseTranslations,
  saveTranslations,
  touchContent,
  deleteTranslations,
} from "@/lib/admin-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const interiorId = Number(id);
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  try {
    await saveTranslations("interior", interiorId, parsed.value);
    await touchContent("interior", interiorId, "translate");
    return NextResponse.json({
      ok: true,
      translations: await getTranslations("interior", interiorId),
    });
  } catch (error) {
    console.error("Could not update interior translations:", error);
    return NextResponse.json({ ok: false, error: "Не удалось сохранить перевод." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  const [updated] = await db
    .update(interiors)
    .set({
      ...(typeof body.title === "string" && body.title.trim() ? { title: body.title.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description ?? null } : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl ?? null } : {}),
      ...(body.gallery !== undefined
        ? { gallery: Array.isArray(body.gallery) ? body.gallery : null }
        : {}),
      ...(body.location !== undefined ? { location: body.location ?? null } : {}),
      ...(body.isFeatured !== undefined ? { isFeatured: Boolean(body.isFeatured) } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive !== false } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) || 0 } : {}),
      updatedAt: new Date(),
    })
    .where(eq(interiors.id, Number(id)))
    .returning();

  if (!updated) return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });

  if (Object.keys(parsed.value).length > 0) {
    await saveTranslations("interior", updated.id, parsed.value);
  }
  await touchContent("interior", updated.id, "update");

  return NextResponse.json({
    ok: true,
    interior: { ...updated, translations: await getTranslations("interior", updated.id) },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await deleteTranslations("interior", Number(id));
  await db.delete(interiors).where(eq(interiors.id, Number(id)));
  await touchContent("interior", Number(id), "delete");
  return NextResponse.json({ ok: true });
}

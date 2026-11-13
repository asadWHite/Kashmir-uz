import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { curtains } from "@/db/schema";
import {
  getTranslations,
  parseTranslations,
  saveTranslations,
  touchContent,
  deleteTranslations,
} from "@/lib/admin-content";
import { databaseErrorMessage } from "@/lib/db-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH — partial update.
 *
 * Used by the translation editor's "save this language only" buttons. Only the
 * fields present in the body are written; translations for the locales that
 * were sent are upserted one row at a time (unique on entity/id/locale), so an
 * update for `ru` cannot touch `uz` or `en`.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const curtainId = Number(id);
  if (!Number.isInteger(curtainId)) {
    return NextResponse.json({ ok: false, error: "Некорректный идентификатор." }, { status: 422 });
  }
  const body = await req.json().catch(() => ({}));

  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });
  }

  try {
    await saveTranslations("curtain", curtainId, parsed.value);
    await touchContent("curtain", curtainId, "translate");
    return NextResponse.json({
      ok: true,
      translations: await getTranslations("curtain", curtainId),
    });
  } catch (error) {
    console.error("Could not update curtain translations:", error);
    return NextResponse.json({ ok: false, error: databaseErrorMessage(error, "Сохранение шторы") }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });
  }

  try {
    const [updated] = await db
      .update(curtains)
      .set({
        // `name` is only rewritten when the caller actually sends one; a
        // translation-only save must not blank the shared column.
        ...(typeof body.name === "string" && body.name.trim() ? { name: body.name.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body.categoryId !== undefined
          ? { categoryId: body.categoryId ? Number(body.categoryId) : null }
          : {}),
        ...(body.category !== undefined ? { category: body.category ?? null } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl ?? null } : {}),
        ...(body.gallery !== undefined
          ? { gallery: Array.isArray(body.gallery) ? body.gallery : null }
          : {}),
        ...(body.material !== undefined ? { material: body.material ?? null } : {}),
        ...(body.color !== undefined ? { color: body.color ?? null } : {}),
        ...(body.isFeatured !== undefined ? { isFeatured: Boolean(body.isFeatured) } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive !== false } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) || 0 } : {}),
        updatedAt: new Date(),
      })
      .where(eq(curtains.id, Number(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
    }

    if (Object.keys(parsed.value).length > 0) {
      await saveTranslations("curtain", updated.id, parsed.value);
    }
    await touchContent("curtain", updated.id, "update");

    return NextResponse.json({
      ok: true,
      curtain: { ...updated, translations: await getTranslations("curtain", updated.id) },
    });
  } catch (error) {
    console.error("Could not update curtain:", error);
    return NextResponse.json({ ok: false, error: databaseErrorMessage(error, "Сохранение шторы") }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const curtainId = Number(id);
  if (!Number.isInteger(curtainId)) {
    return NextResponse.json({ ok: false, error: "Некорректный идентификатор." }, { status: 422 });
  }
  await deleteTranslations("curtain", curtainId);
  await db.delete(curtains).where(eq(curtains.id, curtainId));
  await touchContent("curtain", curtainId, "delete");
  return NextResponse.json({ ok: true });
}

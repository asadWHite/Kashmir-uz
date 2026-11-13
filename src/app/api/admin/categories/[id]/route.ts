import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
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
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });
  await saveTranslations("category", Number(id), parsed.value);
  await touchContent("category", Number(id), "translate");
  return NextResponse.json({ ok: true, translations: await getTranslations("category", Number(id)) });
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
    .update(categories)
    .set({
      ...(typeof body.name === "string" && body.name.trim() ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description ?? null } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) || 0 } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive !== false } : {}),
    })
    .where(eq(categories.id, Number(id)))
    .returning();

  if (!updated) return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
  if (Object.keys(parsed.value).length > 0) {
    await saveTranslations("category", updated.id, parsed.value);
  }
  await touchContent("category", updated.id, "update");
  return NextResponse.json({
    ok: true,
    category: { ...updated, translations: await getTranslations("category", updated.id) },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await deleteTranslations("category", Number(id));
  await db.delete(categories).where(eq(categories.id, Number(id)));
  await touchContent("category", Number(id), "delete");
  return NextResponse.json({ ok: true });
}

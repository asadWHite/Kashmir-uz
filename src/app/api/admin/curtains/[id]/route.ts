import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { curtains } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const [updated] = await db
    .update(curtains)
    .set({
      name: body.name,
      description: body.description ?? null,
      categoryId: body.categoryId ? Number(body.categoryId) : null,
      category: body.category ?? null,
      imageUrl: body.imageUrl ?? null,
      gallery: Array.isArray(body.gallery) ? body.gallery : null,
      material: body.material ?? null,
      color: body.color ?? null,
      isFeatured: Boolean(body.isFeatured),
      isActive: body.isActive !== false,
      sortOrder: Number(body.sortOrder ?? 0),
      updatedAt: new Date(),
    })
    .where(eq(curtains.id, Number(id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, curtain: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(curtains).where(eq(curtains.id, Number(id)));
  return NextResponse.json({ ok: true });
}

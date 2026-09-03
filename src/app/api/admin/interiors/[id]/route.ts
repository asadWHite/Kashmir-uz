import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interiors } from "@/db/schema";
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
    .update(interiors)
    .set({
      title: body.title,
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
      gallery: Array.isArray(body.gallery) ? body.gallery : null,
      location: body.location ?? null,
      isFeatured: Boolean(body.isFeatured),
      isActive: body.isActive !== false,
      sortOrder: Number(body.sortOrder ?? 0),
      updatedAt: new Date(),
    })
    .where(eq(interiors.id, Number(id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, interior: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(interiors).where(eq(interiors.id, Number(id)));
  return NextResponse.json({ ok: true });
}

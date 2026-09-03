import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gallery } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const [updated] = await db
    .update(gallery)
    .set({
      title: b.title,
      imageUrl: b.imageUrl,
      category: b.category ?? "interior",
      isActive: b.isActive !== false,
      sortOrder: Number(b.sortOrder ?? 0),
    })
    .where(eq(gallery.id, Number(id)))
    .returning();
  if (!updated) return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
  return NextResponse.json({ ok: true, gallery: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(gallery).where(eq(gallery.id, Number(id)));
  return NextResponse.json({ ok: true });
}

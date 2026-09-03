import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
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
    .update(categories)
    .set({
      name: body.name,
      description: body.description ?? null,
      sortOrder: Number(body.sortOrder ?? 0),
      isActive: body.isActive !== false,
    })
    .where(eq(categories.id, Number(id)))
    .returning();
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, category: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(categories).where(eq(categories.id, Number(id)));
  return NextResponse.json({ ok: true });
}

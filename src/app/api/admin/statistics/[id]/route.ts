import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { statistics } from "@/db/schema";
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
    .update(statistics)
    .set({
      label: body.label,
      value: body.value != null ? String(body.value) : undefined,
      suffix: body.suffix,
      sortOrder: Number(body.sortOrder ?? 0),
      isActive: body.isActive !== false,
    })
    .where(eq(statistics.id, Number(id)))
    .returning();
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, statistic: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(statistics).where(eq(statistics.id, Number(id)));
  return NextResponse.json({ ok: true });
}

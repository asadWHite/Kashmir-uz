import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["new", "contacted", "in_progress", "converted", "closed"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "").trim();
  if (!STATUSES.has(status)) {
    return NextResponse.json({ ok: false, error: "Недопустимый статус." }, { status: 422 });
  }
  const [updated] = await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(eq(leads.id, Number(id)))
    .returning();
  if (!updated) return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
  return NextResponse.json({ ok: true, lead: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(leads).where(eq(leads.id, Number(id)));
  return NextResponse.json({ ok: true });
}

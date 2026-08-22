import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["new", "contacted", "closed"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "").trim();
  if (!STATUSES.has(status)) {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 422 });
  }
  const [updated] = await db
    .update(contactMessages)
    .set({ status })
    .where(eq(contactMessages.id, Number(id)))
    .returning();
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, message: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(contactMessages).where(eq(contactMessages.id, Number(id)));
  return NextResponse.json({ ok: true });
}

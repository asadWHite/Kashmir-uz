import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faq } from "@/db/schema";
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
    .update(faq)
    .set({
      questionEn: b.questionEn,
      questionRu: b.questionRu ?? null,
      questionUz: b.questionUz ?? null,
      answerEn: b.answerEn,
      answerRu: b.answerRu ?? null,
      answerUz: b.answerUz ?? null,
      sortOrder: Number(b.sortOrder ?? 0),
      isActive: b.isActive !== false,
    })
    .where(eq(faq.id, Number(id)))
    .returning();
  if (!updated) return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
  return NextResponse.json({ ok: true, faq: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(faq).where(eq(faq.id, Number(id)));
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faq } from "@/db/schema";
import { asc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(faq).orderBy(asc(faq.sortOrder), asc(faq.id));
  return NextResponse.json({ ok: true, faq: rows });
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (!b.questionEn) {
    return NextResponse.json({ ok: false, error: "Заполните вопрос на английском (обязательно)." }, { status: 422 });
  }
  const [created] = await db
    .insert(faq)
    .values({
      questionEn: String(b.questionEn),
      questionRu: b.questionRu || null,
      questionUz: b.questionUz || null,
      answerEn: String(b.answerEn ?? ""),
      answerRu: b.answerRu || null,
      answerUz: b.answerUz || null,
      sortOrder: Number(b.sortOrder ?? 0),
      isActive: b.isActive !== false,
    })
    .returning();
  return NextResponse.json({ ok: true, faq: created });
}

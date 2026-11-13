import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { faq } from "@/db/schema";
import {
  getTranslations,
  parseTranslations,
  saveTranslations,
  touchContent,
  translationStatus,
  translationSummaries,
} from "@/lib/admin-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(faq).orderBy(asc(faq.sortOrder), asc(faq.id));
  const summaries = await translationSummaries("faq", rows.map((r) => r.id)).catch(() => new Map());
  return NextResponse.json({
    ok: true,
    faq: rows.map((row) => {
      const translations = summaries.get(row.id) ?? {};
      return { ...row, translations, translation: translationStatus("faq", translations) };
    }),
  });
}

/**
 * The legacy NOT NULL English columns are still populated (from the English
 * translation when the new editor is used), so older code paths and the
 * existing rows keep working. Only the translations table is authoritative for
 * display.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  const qEn = parsed.value.en?.title ?? String(body.questionEn ?? "").trim();
  const aEn = parsed.value.en?.description ?? String(body.answerEn ?? "").trim();
  if (!qEn || !aEn) {
    return NextResponse.json(
      { ok: false, error: "Заполните вопрос и ответ на английском языке (EN)." },
      { status: 422 },
    );
  }

  const [created] = await db
    .insert(faq)
    .values({
      questionEn: qEn,
      questionRu: parsed.value.ru?.title ?? body.questionRu ?? null,
      questionUz: parsed.value.uz?.title ?? body.questionUz ?? null,
      answerEn: aEn,
      answerRu: parsed.value.ru?.description ?? body.answerRu ?? null,
      answerUz: parsed.value.uz?.description ?? body.answerUz ?? null,
      sortOrder: Number(body.sortOrder ?? 0),
      isActive: body.isActive !== false,
    })
    .returning();

  await saveTranslations("faq", created.id, parsed.value);
  await touchContent("faq", created.id, "create");

  return NextResponse.json({
    ok: true,
    faq: { ...created, translations: await getTranslations("faq", created.id) },
  });
}

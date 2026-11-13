import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { faq } from "@/db/schema";
import {
  getTranslations,
  parseTranslations,
  saveTranslations,
  touchContent,
  deleteTranslations,
} from "@/lib/admin-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });
  await saveTranslations("faq", Number(id), parsed.value);
  await touchContent("faq", Number(id), "translate");
  return NextResponse.json({ ok: true, translations: await getTranslations("faq", Number(id)) });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  const en = parsed.value.en;
  const [updated] = await db
    .update(faq)
    .set({
      // Keep the legacy English columns mirrored with the EN translation so the
      // NOT NULL constraint stays satisfied without inventing content.
      ...(en?.title ? { questionEn: en.title } : {}),
      ...(en?.description ? { answerEn: en.description } : {}),
      ...(parsed.value.ru?.title !== undefined ? { questionRu: parsed.value.ru.title } : {}),
      ...(parsed.value.uz?.title !== undefined ? { questionUz: parsed.value.uz.title } : {}),
      ...(parsed.value.ru?.description !== undefined ? { answerRu: parsed.value.ru.description } : {}),
      ...(parsed.value.uz?.description !== undefined ? { answerUz: parsed.value.uz.description } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) || 0 } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive !== false } : {}),
    })
    .where(eq(faq.id, Number(id)))
    .returning();

  if (!updated) return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
  if (Object.keys(parsed.value).length > 0) {
    await saveTranslations("faq", updated.id, parsed.value);
  }
  await touchContent("faq", updated.id, "update");
  return NextResponse.json({
    ok: true,
    faq: { ...updated, translations: await getTranslations("faq", updated.id) },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const faqId = Number(id);
  if (!Number.isInteger(faqId)) {
    return NextResponse.json({ ok: false, error: "Некорректный идентификатор." }, { status: 422 });
  }
  await deleteTranslations("faq", faqId);
  await db.delete(faq).where(eq(faq.id, faqId));
  await touchContent("faq", faqId, "delete");
  return NextResponse.json({ ok: true });
}

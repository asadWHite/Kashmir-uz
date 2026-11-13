import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { statistics } from "@/db/schema";
import {
  deleteTranslations,
  getTranslations,
  parseTranslations,
  saveTranslations,
  touchContent,
} from "@/lib/admin-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const statisticId = Number(id);
  if (!Number.isInteger(statisticId)) {
    return NextResponse.json({ ok: false, error: "Некорректный идентификатор." }, { status: 422 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  await saveTranslations("statistic", statisticId, parsed.value);
  await touchContent("statistic", statisticId, "translate");
  return NextResponse.json({
    ok: true,
    translations: await getTranslations("statistic", statisticId),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const statisticId = Number(id);
  if (!Number.isInteger(statisticId)) {
    return NextResponse.json({ ok: false, error: "Некорректный идентификатор." }, { status: 422 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  const [updated] = await db
    .update(statistics)
    .set({
      ...(typeof body.label === "string" && body.label.trim() ? { label: body.label.trim() } : {}),
      ...(body.value != null ? { value: String(body.value) } : {}),
      ...(body.suffix !== undefined ? { suffix: body.suffix } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) || 0 } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive !== false } : {}),
    })
    .where(eq(statistics.id, statisticId))
    .returning();

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
  }
  if (Object.keys(parsed.value).length > 0) {
    await saveTranslations("statistic", statisticId, parsed.value);
  }
  await touchContent("statistic", statisticId, "update");
  return NextResponse.json({
    ok: true,
    statistic: { ...updated, translations: await getTranslations("statistic", statisticId) },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const statisticId = Number(id);
  if (!Number.isInteger(statisticId)) {
    return NextResponse.json({ ok: false, error: "Некорректный идентификатор." }, { status: 422 });
  }
  await deleteTranslations("statistic", statisticId);
  await db.delete(statistics).where(eq(statistics.id, statisticId));
  await touchContent("statistic", statisticId, "delete");
  return NextResponse.json({ ok: true });
}

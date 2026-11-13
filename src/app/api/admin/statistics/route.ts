import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { statistics } from "@/db/schema";
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
  const rows = await db
    .select()
    .from(statistics)
    .orderBy(asc(statistics.sortOrder), asc(statistics.id));
  const summaries = await translationSummaries("statistic", rows.map((r) => r.id)).catch(
    () => new Map(),
  );
  return NextResponse.json({
    ok: true,
    statistics: rows.map((row) => {
      const translations = summaries.get(row.id) ?? {};
      return { ...row, translations, translation: translationStatus("statistic", translations) };
    }),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  // `label` mirrors the English copy (the language the legacy column was
  // authored in) and is only a fallback for old code paths — never the text
  // another language displays.
  const label =
    parsed.value.en?.title ||
    String(body.label ?? "").trim() ||
    "";
  if (!label) {
    return NextResponse.json({ ok: false, error: "Укажите метку." }, { status: 422 });
  }
  const [created] = await db
    .insert(statistics)
    .values({
      label,
      value: String(body.value ?? "0"),
      suffix: body.suffix ?? "",
      sortOrder: Number(body.sortOrder ?? 0),
      isActive: body.isActive !== false,
    })
    .returning();
  await saveTranslations("statistic", created.id, parsed.value);
  await touchContent("statistic", created.id, "create");
  return NextResponse.json({
    ok: true,
    statistic: { ...created, translations: await getTranslations("statistic", created.id) },
  });
}

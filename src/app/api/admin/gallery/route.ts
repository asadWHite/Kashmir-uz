import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { gallery } from "@/db/schema";
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
    .from(gallery)
    .orderBy(asc(gallery.sortOrder), asc(gallery.id));
  const summaries = await translationSummaries("gallery", rows.map((r) => r.id)).catch(
    () => new Map(),
  );
  return NextResponse.json({
    ok: true,
    gallery: rows.map((row) => {
      const translations = summaries.get(row.id) ?? {};
      return { ...row, translations, translation: translationStatus("gallery", translations) };
    }),
  });
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (!b.imageUrl) {
    return NextResponse.json({ ok: false, error: "Укажите изображение." }, { status: 422 });
  }
  const parsed = parseTranslations(b.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  const [created] = await db
    .insert(gallery)
    .values({
      // `title` is a legacy mirror of the English copy only. It is NOT used as
      // a fallback for other languages (that is what leaked English onto the
      // Russian and Uzbek site), and an explicit English translation wins over
      // whatever the client sent in the mirror field.
      title:
        parsed.value.en?.title ||
        (typeof b.title === "string" && b.title.trim()) ||
        null,
      imageUrl: String(b.imageUrl),
      category: String(b.category ?? "interior"),
      isActive: b.isActive !== false,
      sortOrder: Number(b.sortOrder ?? 0),
    })
    .returning();
  await saveTranslations("gallery", created.id, parsed.value);
  await touchContent("gallery", created.id, "create");
  return NextResponse.json({
    ok: true,
    gallery: { ...created, translations: await getTranslations("gallery", created.id) },
  });
}

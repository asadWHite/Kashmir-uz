import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { interiors } from "@/db/schema";
import {
  getTranslations,
  parseTranslations,
  saveTranslations,
  touchContent,
  translationStatus,
  translationSummaries,
} from "@/lib/admin-content";
import { isUniqueViolation, slugifyOrFallback } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET() {
  const rows = await db
    .select()
    .from(interiors)
    .orderBy(asc(interiors.sortOrder), asc(interiors.id));

  const summaries = await translationSummaries("interior", rows.map((r) => r.id)).catch(
    () => new Map(),
  );

  return NextResponse.json({
    ok: true,
    interiors: rows.map((row) => {
      const translations = summaries.get(row.id) ?? {};
      return { ...row, translations, translation: translationStatus("interior", translations) };
    }),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  const title =
    String(body.title ?? "").trim() ||
    parsed.value.en?.title ||
    parsed.value.ru?.title ||
    parsed.value.uz?.title ||
    "";
  if (!title) {
    return NextResponse.json(
      { ok: false, error: "Укажите заголовок хотя бы на одном языке." },
      { status: 422 },
    );
  }

  try {
    const [created] = await db
      .insert(interiors)
      .values({
        title,
        slug: String(body.slug ?? "").trim() || slugifyOrFallback(title, "interior"),
        description: body.description ?? null,
        imageUrl: body.imageUrl ?? null,
        gallery: Array.isArray(body.gallery) ? body.gallery : null,
        location: body.location ?? null,
        isFeatured: Boolean(body.isFeatured),
        isActive: body.isActive !== false,
        sortOrder: Number(body.sortOrder ?? 0),
      })
      .returning();

    await saveTranslations("interior", created.id, parsed.value);
    await touchContent("interior", created.id, "create");

    return NextResponse.json({
      ok: true,
      interior: { ...created, translations: await getTranslations("interior", created.id) },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { ok: false, error: "Такая ссылка (slug) уже занята. Укажите другую." },
        { status: 409 },
      );
    }
    console.error("Could not create interior:", error);
    return NextResponse.json(
      { ok: false, error: "Не удалось создать интерьер. Проверьте server logs." },
      { status: 500 },
    );
  }
}

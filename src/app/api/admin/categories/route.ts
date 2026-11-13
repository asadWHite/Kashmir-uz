import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
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
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  const summaries = await translationSummaries("category", rows.map((r) => r.id)).catch(
    () => new Map(),
  );
  return NextResponse.json({
    ok: true,
    categories: rows.map((row) => {
      const translations = summaries.get(row.id) ?? {};
      return { ...row, translations, translation: translationStatus("category", translations) };
    }),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });

  const name =
    String(body.name ?? "").trim() ||
    parsed.value.en?.title ||
    parsed.value.ru?.title ||
    parsed.value.uz?.title ||
    "";
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Укажите название хотя бы на одном языке." },
      { status: 422 },
    );
  }

  try {
    const [created] = await db
      .insert(categories)
      .values({
        name,
        slug: String(body.slug ?? "").trim() || slugifyOrFallback(name, "category"),
        description: body.description ?? null,
        sortOrder: Number(body.sortOrder ?? 0),
        isActive: body.isActive !== false,
      })
      .returning();
    await saveTranslations("category", created.id, parsed.value);
    await touchContent("category", created.id, "create");
    return NextResponse.json({
      ok: true,
      category: { ...created, translations: await getTranslations("category", created.id) },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { ok: false, error: "Такая ссылка (slug) уже занята. Укажите другую." },
        { status: 409 },
      );
    }
    console.error("Could not create category:", error);
    return NextResponse.json(
      { ok: false, error: "Не удалось создать категорию. Возможно, такой slug уже существует." },
      { status: 500 },
    );
  }
}

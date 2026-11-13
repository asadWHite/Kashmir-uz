import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { curtains } from "@/db/schema";
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
    .from(curtains)
    .orderBy(asc(curtains.sortOrder), asc(curtains.id));

  // One extra query for the whole page (not one per row).
  const summaries = await translationSummaries("curtain", rows.map((r) => r.id)).catch(
    () => new Map(),
  );

  return NextResponse.json({
    ok: true,
    curtains: rows.map((row) => {
      const translations = summaries.get(row.id) ?? {};
      return {
        ...row,
        translations,
        translation: translationStatus("curtain", translations),
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const parsed = parseTranslations(body.translations);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });
  }

  // The product's identity name comes from its original language when the
  // caller only supplied translations (new tabbed editor), so the legacy
  // non-null column stays meaningful for older code paths.
  // The shared column is the English legacy column; an explicit English
  // translation wins, and it is never used as another language's text.
  const name =
    parsed.value.en?.title ||
    String(body.name ?? "").trim() ||
    "";

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Укажите название хотя бы на одном языке." },
      { status: 422 },
    );
  }

  const slug = String(body.slug ?? "").trim() || slugifyOrFallback(name, "curtain");

  try {
    const [created] = await db
      .insert(curtains)
      .values({
        name,
        slug,
        description: body.description ?? null,
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        category: body.category ?? null,
        imageUrl: body.imageUrl ?? null,
        gallery: Array.isArray(body.gallery) ? body.gallery : null,
        material: body.material ?? null,
        color: body.color ?? null,
        isFeatured: Boolean(body.isFeatured),
        isActive: body.isActive !== false,
        sortOrder: Number(body.sortOrder ?? 0),
      })
      .returning();

    await saveTranslations("curtain", created.id, parsed.value);
    await touchContent("curtain", created.id, "create");

    return NextResponse.json({
      ok: true,
      curtain: { ...created, translations: await getTranslations("curtain", created.id) },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { ok: false, error: "Такая ссылка (slug) уже занята. Укажите другую." },
        { status: 409 },
      );
    }
    console.error("Could not create curtain:", error);
    return NextResponse.json(
      { ok: false, error: "Не удалось создать штору. Проверьте server logs." },
      { status: 500 },
    );
  }
}

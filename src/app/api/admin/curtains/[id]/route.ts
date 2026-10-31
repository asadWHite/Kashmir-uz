import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { curtains } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const [updated] = await db
      .update(curtains)
      .set({
        name: body.name,
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
        updatedAt: new Date(),
      })
      .where(eq(curtains.id, Number(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, curtain: updated });
  } catch (error) {
    console.error("Could not update curtain:", error);
    // Drizzle may wrap the PostgreSQL error in `cause`, so inspect both.
    const outer = error as { code?: string; message?: string; cause?: { code?: string; message?: string } };
    const pgCode = outer.code ?? outer.cause?.code;
    const schemaError = pgCode === "42P01" || pgCode === "42703";
    const message =
      schemaError
        ? "База данных не соответствует текущей схеме (таблица или столбец отсутствует). Примените схему к production DATABASE_URL: npx drizzle-kit push --url=\"$DATABASE_URL\"."
        : pgCode === "22001"
          ? "Поле изображения в базе слишком короткое для загруженного изображения. Измените curtains.image_url на тип TEXT и повторите сохранение."
          : pgCode === "23503"
            ? "Выбранная категория отсутствует в базе. Обновите список категорий и попробуйте снова."
            : `Сохранение не удалось (PostgreSQL ${pgCode ?? "unknown"}). Проверьте server logs.`;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.delete(curtains).where(eq(curtains.id, Number(id)));
  return NextResponse.json({ ok: true });
}

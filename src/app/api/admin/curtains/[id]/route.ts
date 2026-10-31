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
    const pgError = error as { code?: string; message?: string };
    const schemaError = pgError.code === "42P01" || pgError.code === "42703";
    return NextResponse.json(
      {
        ok: false,
        error: schemaError
          ? "Схема базы данных устарела: примените актуальную схему командой `npx drizzle-kit push` к той же базе, что указана в DATABASE_URL."
          : "Не удалось сохранить штору. Проверьте подключение DATABASE_URL и журнал сервера.",
      },
      { status: 500 },
    );
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

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, curtains } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = Number(id);
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "Укажите название." }, { status: 422 });
  }

  try {
    const [updated] = await db
      .update(categories)
      .set({
        name,
        description: body.description ?? null,
        sortOrder: Number(body.sortOrder ?? 0),
        isActive: body.isActive !== false,
      })
      .where(eq(categories.id, numId))
      .returning();
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Не найдено." }, { status: 404 });
    }
    // Keep denormalized curtain category names synchronized
    await db
      .update(curtains)
      .set({ category: name, updatedAt: new Date() })
      .where(eq(curtains.categoryId, numId));

    return NextResponse.json({ ok: true, category: updated });
  } catch (e) {
    console.error("PUT /api/admin/categories/[id] failed:", e);
    return NextResponse.json({ ok: false, error: "Не удалось обновить категорию." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await db.delete(categories).where(eq(categories.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/categories/[id] failed:", e);
    return NextResponse.json({ ok: false, error: "Не удалось удалить категорию." }, { status: 500 });
  }
}

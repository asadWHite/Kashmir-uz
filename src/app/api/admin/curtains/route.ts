import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { curtains } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export async function GET() {
  const rows = await db
    .select()
    .from(curtains)
    .orderBy(asc(curtains.sortOrder), asc(curtains.id));
  return NextResponse.json({ ok: true, curtains: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Укажите название." },
      { status: 422 },
    );
  }
  const slug = String(body.slug ?? "").trim() || slugify(name);

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
  return NextResponse.json({ ok: true, curtain: created });
}

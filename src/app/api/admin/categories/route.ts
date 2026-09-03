import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export async function GET() {
  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id));
  return NextResponse.json({ ok: true, categories: rows });
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
    .insert(categories)
    .values({
      name,
      slug,
      description: body.description ?? null,
      sortOrder: Number(body.sortOrder ?? 0),
      isActive: body.isActive !== false,
    })
    .returning();
  return NextResponse.json({ ok: true, category: created });
}

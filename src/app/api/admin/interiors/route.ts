import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interiors } from "@/db/schema";
import { asc } from "drizzle-orm";

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
    .from(interiors)
    .orderBy(asc(interiors.sortOrder), asc(interiors.id));
  return NextResponse.json({ ok: true, interiors: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json(
      { ok: false, error: "Title is required." },
      { status: 422 },
    );
  }
  const slug = String(body.slug ?? "").trim() || slugify(title);

  const [created] = await db
    .insert(interiors)
    .values({
      title,
      slug,
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
      gallery: Array.isArray(body.gallery) ? body.gallery : null,
      location: body.location ?? null,
      isFeatured: Boolean(body.isFeatured),
      isActive: body.isActive !== false,
      sortOrder: Number(body.sortOrder ?? 0),
    })
    .returning();
  return NextResponse.json({ ok: true, interior: created });
}

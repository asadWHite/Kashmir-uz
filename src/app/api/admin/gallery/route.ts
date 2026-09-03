import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gallery } from "@/db/schema";
import { asc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(gallery).orderBy(asc(gallery.sortOrder), asc(gallery.id));
  return NextResponse.json({ ok: true, gallery: rows });
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (!b.imageUrl) {
    return NextResponse.json({ ok: false, error: "Укажите изображение." }, { status: 422 });
  }
  const [created] = await db
    .insert(gallery)
    .values({
      title: b.title || null,
      imageUrl: String(b.imageUrl),
      category: String(b.category ?? "interior"),
      isActive: b.isActive !== false,
      sortOrder: Number(b.sortOrder ?? 0),
    })
    .returning();
  return NextResponse.json({ ok: true, gallery: created });
}

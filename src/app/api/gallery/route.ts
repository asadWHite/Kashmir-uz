import { NextResponse } from "next/server";
import { db } from "@/db";
import { gallery } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Public active gallery images. */
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(gallery)
      .where(eq(gallery.isActive, true))
      .orderBy(asc(gallery.sortOrder), asc(gallery.id));
    return NextResponse.json({ ok: true, gallery: rows });
  } catch (e) {
    console.error("Gallery fetch failed:", e);
    return NextResponse.json({ ok: true, gallery: [] });
  }
}

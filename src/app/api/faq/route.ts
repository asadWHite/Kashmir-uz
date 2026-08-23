import { NextResponse } from "next/server";
import { db } from "@/db";
import { faq } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Public active FAQ list. */
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(faq)
      .where(eq(faq.isActive, true))
      .orderBy(asc(faq.sortOrder), asc(faq.id));
    return NextResponse.json({ ok: true, faq: rows });
  } catch (e) {
    console.error("FAQ fetch failed:", e);
    return NextResponse.json({ ok: true, faq: [] });
  }
}

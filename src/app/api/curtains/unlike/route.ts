import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { curtains } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: decrement a curtain's like count (never below 0). */
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== "number") {
      return NextResponse.json({ ok: false, error: "Invalid id." }, { status: 422 });
    }
    const [updated] = await db
      .update(curtains)
      .set({ likes: sql`GREATEST(${curtains.likes} - 1, 0)` })
      .where(eq(curtains.id, id))
      .returning({ likes: curtains.likes });
    return NextResponse.json({ ok: true, likes: updated?.likes ?? 0 });
  } catch (e) {
    console.error("Unlike failed:", e);
    return NextResponse.json({ ok: false, error: "Failed." }, { status: 500 });
  }
}

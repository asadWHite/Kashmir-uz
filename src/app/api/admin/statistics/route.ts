import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { statistics } from "@/db/schema";
import { asc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(statistics)
    .orderBy(asc(statistics.sortOrder), asc(statistics.id));
  return NextResponse.json({ ok: true, statistics: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const label = String(body.label ?? "").trim();
  if (!label) {
    return NextResponse.json(
      { ok: false, error: "Label is required." },
      { status: 422 },
    );
  }
  const [created] = await db
    .insert(statistics)
    .values({
      label,
      value: String(body.value ?? "0"),
      suffix: body.suffix ?? "",
      sortOrder: Number(body.sortOrder ?? 0),
      isActive: body.isActive !== false,
    })
    .returning();
  return NextResponse.json({ ok: true, statistic: created });
}

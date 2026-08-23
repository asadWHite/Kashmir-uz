import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Public lead submission. Writes a real DB row. */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "Name is required." }, { status: 422 });
  }
  try {
    await db.insert(leads).values({
      name,
      phone: String(body.phone ?? "").trim() || null,
      telegram: String(body.telegram ?? "").trim() || null,
      interest: String(body.interest ?? "").trim() || null,
      room: String(body.room ?? "").trim() || null,
      message: String(body.message ?? "").trim() || null,
      source: String(body.source ?? "lead_flow").trim() || null,
      status: "new",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Lead insert failed:", e);
    return NextResponse.json({ ok: false, error: "Unable to submit." }, { status: 500 });
  }
}

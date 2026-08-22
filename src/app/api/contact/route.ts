import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Public contact form submission. Writes a real DB row. */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const name = String(body.name ?? "").trim();
  const message = String(body.message ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim();

  if (!name || !message) {
    return NextResponse.json(
      { ok: false, error: "Name and message are required." },
      { status: 422 },
    );
  }
  if (name.length > 160 || message.length > 4000) {
    return NextResponse.json(
      { ok: false, error: "Message is too long." },
      { status: 422 },
    );
  }

  try {
    await db.insert(contactMessages).values({
      name,
      phone: phone || null,
      email: email || null,
      message,
      status: "new",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Contact insert failed:", e);
    return NextResponse.json(
      { ok: false, error: "We could not send your message. Please try again." },
      { status: 500 },
    );
  }
}

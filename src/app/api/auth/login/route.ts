import { NextRequest, NextResponse } from "next/server";
import { loginWithCredentials } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Email and password are required." },
      { status: 422 },
    );
  }

  const ok = await loginWithCredentials(email, password);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Invalid email or password." },
      { status: 401 },
    );
  }
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { loginWithCredentials } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Некорректный запрос." },
      { status: 400 },
    );
  }

  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Укажите email и пароль." },
      { status: 422 },
    );
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 2000) || null;

  try {
    const ok = await loginWithCredentials(email, password, { ipAddress, userAgent });
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Неверный email или пароль." },
        { status: 401 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Administrator sign-in failed:", error);
    return NextResponse.json(
      { ok: false, error: "Сервис входа временно недоступен. Проверьте подключение к базе данных." },
      { status: 503 },
    );
  }
}

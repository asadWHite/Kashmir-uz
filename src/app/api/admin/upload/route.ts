import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB — base64 inflates ~33%

/**
 * Admin image upload. Converts to a base64 data URL so it works on Vercel
 * serverless (which has a read-only filesystem). No external storage needed.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Файл не выбран." },
        { status: 422 },
      );
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Допустимы только изображения JPG, PNG, WEBP или GIF." },
        { status: 422 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Изображение слишком большое (макс. 3 МБ)." },
        { status: 422 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    return NextResponse.json({ ok: true, url: dataUrl });
  } catch (e) {
    console.error("Не удалось загрузить файл.", e);
    return NextResponse.json(
      { ok: false, error: "Не удалось загрузить файл." },
      { status: 500 },
    );
  }
}

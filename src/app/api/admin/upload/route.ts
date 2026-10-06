import { NextRequest, NextResponse } from "next/server";
import { processUpload, MAX_ORIGINAL_BYTES, ALLOWED_MIME } from "@/lib/image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Admin image upload endpoint.
 *
 * Accepts JPG / JPEG / PNG / WEBP / AVIF up to 15 MB, then processes them
 * through the server-side pipeline (resize, EXIF strip, WebP encoding,
 * thumbnail generation) and saves the optimized assets to /public/uploads.
 *
 * The response returns public URLs — never base64 data URLs — so the
 * database stores references, and existing data: URLs uploaded before this
 * patch continue to work on the public site.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const hint = (form.get("hint") as string) || "curtain";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Fayl tanlanmagan." },
        { status: 422 },
      );
    }

    // Frontend is not trusted — revalidate on the server.
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Qo'llab-quvvatlanmaydigan rasm formati. Faqat JPG, PNG, WEBP, AVIF.",
        },
        { status: 422 },
      );
    }

    if (file.size > MAX_ORIGINAL_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: `Rasm hajmi juda katta. Maksimal ruxsat: ${Math.round(MAX_ORIGINAL_BYTES / 1024 / 1024)} MB.`,
        },
        { status: 422 },
      );
    }

    if (file.size < 32) {
      return NextResponse.json(
        { ok: false, error: "Rasm juda kichik yoki buzilgan." },
        { status: 422 },
      );
    }

    // Guard: refuse if the filename looks executable (defense in depth).
    const lowerName = (file.name || "").toLowerCase();
    if (/\.(php|js|ts|mjs|cjs|exe|sh|html|svg\+xml|svgz?)$/i.test(lowerName)) {
      return NextResponse.json(
        { ok: false, error: "Xavfsizlik sababli bu turdagi faylni yuklab bo'lmaydi." },
        { status: 422 },
      );
    }

    const processed = await processUpload(file, hint);

    return NextResponse.json({
      ok: true,
      url: processed.url,
      thumbUrl: processed.thumbUrl,
      width: processed.width,
      height: processed.height,
      bytes: processed.bytes,
      optimized: true,
      message: "Rasm muvaffaqiyatli optimallashtirildi.",
    });
  } catch (e: any) {
    console.error("Upload failed:", e);
    const code = e?.code;
    let msg = "Rasmni yuklab bo'lmadi.";
    if (code === "TOO_LARGE") {
      msg = `Rasm hajmi juda katta. Maksimal ruxsat: ${Math.round(MAX_ORIGINAL_BYTES / 1024 / 1024)} MB.`;
    } else if (code === "BAD_TYPE") {
      msg = "Qo'llab-quvvatlanmaydigan rasm formati. JPG, PNG, WEBP yoki AVIF yuklang.";
    } else if (code === "CORRUPT") {
      msg = "Rasm buzilgan. Boshqa fayl yuklab ko'ring.";
    } else if (e?.message?.includes("unsupported image")) {
      msg = "Rasm formati qo'llab-quvvatlanmaydi.";
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

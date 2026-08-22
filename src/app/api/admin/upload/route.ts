import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Admin image upload. Stores the file under /public/uploads and returns its
 * public URL. In production this can be swapped for Supabase Storage or
 * Vercel Blob without changing the admin UI (it only consumes a URL string).
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "No file provided." },
        { status: 422 },
      );
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Only JPG, PNG, WEBP or GIF images are allowed." },
        { status: 422 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Image is too large (max 8 MB)." },
        { status: 422 },
      );
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 4);
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadDir, name), buffer);

    return NextResponse.json({ ok: true, url: `/uploads/${name}` });
  } catch (e) {
    console.error("Upload failed:", e);
    return NextResponse.json(
      { ok: false, error: "Upload failed." },
      { status: 500 },
    );
  }
}

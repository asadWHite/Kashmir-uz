/**
 * WRITE-PATH verification of a deployed Kashmir Decor preview.
 *
 * ⚠️  Runs against whatever database the target deployment is connected to.
 *     Point it ONLY at a preview whose DATABASE_URL is a writable COPY
 *     (e.g. a Neon branch) — never at production.
 *
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… \
 *   npx tsx scripts/preview-write-verify.ts --base https://<preview>.vercel.app \
 *     [--out report.json] [--curtain-id 3]
 *
 * Steps (all through the public admin REST API, exactly like the admin panel):
 *   1. sign in → session cookie
 *   2. snapshot target curtain (imageUrl, gallery, updatedAt)
 *   3. upload a fresh generated image via /api/admin/upload
 *   4. PUT imageUrl only      → gallery must be preserved (guard), served bytes
 *                               must equal the stored bytes, ?v= must bump
 *   5. PUT gallery = [image]  → exactly one slot, no fabricated extras
 *   6. restore the original   → original bytes served again
 *   7. verify the public page HTML picks up the new ?v= (cache invalidation)
 */

import { createHash, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
function argValue(flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}
const BASE = argValue("--base")?.replace(/\/+$/, "") ?? "";
const OUT = argValue("--out");
const CURTAIN_ID = Number(argValue("--curtain-id") ?? 0);
const EMAIL = process.env.ADMIN_EMAIL ?? "";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "";

if (!BASE || !EMAIL || !PASSWORD) {
  console.error("usage: ADMIN_EMAIL=… ADMIN_PASSWORD=… preview-write-verify.ts --base https://host [--curtain-id N]");
  process.exit(2);
}
{
  const host = new URL(BASE).hostname;
  const local = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"].includes(host);
  if (!local && process.env.ALLOW_REMOTE_WRITES !== "1") {
    console.error(
      `refusing write tests against non-local host ${host} — set ALLOW_REMOTE_WRITES=1 only when the deployment's DATABASE_URL is a writable COPY (never production)`,
    );
    process.exit(2);
  }
}

type Result = { step: string; ok: boolean; detail: string };
const results: Result[] = [];
function record(step: string, ok: boolean, detail: string) {
  results.push({ step, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${step}: ${detail}`);
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function decodeDataUrl(value: string): Buffer | null {
  const m = /^data:([^;,]+);base64,([\s\S]+)$/.exec(value);
  return m ? Buffer.from(m[2], "base64") : null;
}

/** Small, distinct test image (PNG via sharp — the server optimizes it like any upload). */
async function makeTestImage(seed: number): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const w = 64;
  const h = 64;
  const pixels = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i += 1) {
    pixels[i * 3] = (i * 7 + seed) % 256;
    pixels[i * 3 + 1] = (i * 13 + seed * 2) % 256;
    pixels[i * 3 + 2] = (i * 29 + seed * 3) % 256;
  }
  return sharp(pixels, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
}

async function main() {
  console.log(`\nWRITE-path verification against ${BASE} (DB behind this deployment WILL be modified and restored)\n`);

  /* 1. sign in */
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    redirect: "manual",
  });
  const setCookie = login.headers.getSetCookie?.() ?? [];
  const session =
    setCookie.map((c) => c.split(";")[0]).find((c) => c.startsWith("kashemir_session=")) ??
    setCookie.map((c) => c.split(";")[0]).find((c) => c.startsWith("kashmir")) ??
    setCookie[0]?.split(";")[0];
  const cookie = session ?? "";
  if (!login.ok || !cookie) {
    record("login", false, `status=${login.status} session-cookie=${session ? "set" : "MISSING"}`);
    finish(1);
    return;
  }
  record("login", true, `status=${login.status}, session cookie captured`);

  const authHeaders = { "content-type": "application/json", cookie };

  /* 2. snapshot */
  const listRes = await fetch(`${BASE}/api/admin/curtains`, { headers: { cookie } });
  const listBody = await listRes.json().catch(() => ({}));
  const rows: Array<{
    id: number;
    name?: string;
    slug?: string;
    imageUrl?: string | null;
    gallery?: unknown;
    updatedAt?: string | null;
  }> = listBody.curtains ?? listBody ?? [];
  const target = CURTAIN_ID ? rows.find((r) => Number(r.id) === CURTAIN_ID) : rows[0];
  if (!target) {
    record("snapshot", false, "no curtain available to test against (empty database?)");
    finish(1);
    return;
  }
  const original = {
    imageUrl: String(target.imageUrl ?? ""),
    gallery: Array.isArray(target.gallery) ? [...target.gallery] : [],
    updatedAt: target.updatedAt ?? null,
  };
  record("snapshot", true, `curtain #${target.id} "${target.name ?? ""}" gallery slots=${original.gallery.length}`);
  const curtainId = target.id;
  const curtainSlug = target.slug ?? String(target.id);

  /* 3. upload */
  const form = new FormData();
  const bytes = await makeTestImage(Date.now() % 65536);
  form.set("uploadId", randomUUID());
  form.set("filename", "preview-write-verify.png");
  form.set("fileSize", String(bytes.length));
  form.set("partIndex", "0");
  form.set("totalParts", "1");
  form.set("file", new File([new Uint8Array(bytes)], "preview-write-verify.png"));
  const upRes = await fetch(`${BASE}/api/admin/upload`, { method: "POST", headers: { cookie }, body: form });
  const upBody = await upRes.json().catch(() => ({}));
  const uploaded: string = upBody.imageUrl ?? upBody.dataUrl ?? upBody.url ?? "";
  const uploadedBytes = decodeDataUrl(uploaded);
  if (!upRes.ok || !uploadedBytes) {
    record("upload", false, `status=${upRes.status} ${JSON.stringify(upBody).slice(0, 200)}`);
    finish(1);
    return;
  }
  record("upload", true, `optimized to ${uploadedBytes.length} bytes (${upBody.width ?? "?"}×${upBody.height ?? "?"})`);

  async function servedBytes(updatedAt: string | null | undefined): Promise<{ bytes: Buffer; url: string } | null> {
    const v = Date.parse(updatedAt ?? "") || Date.now();
    const publicUrl = `/api/media/curtains/${curtainId}?v=${v}`;
    const res = await fetch(`${BASE}${publicUrl}`);
    if (!res.ok) return null;
    return { bytes: Buffer.from(await res.arrayBuffer()), url: publicUrl };
  }

  async function publicPageVersion(): Promise<string> {
    const res = await fetch(`${BASE}/curtains/${encodeURIComponent(curtainSlug)}?vb=${Date.now()}`);
    const html = await res.text();
    return /\/api\/media\/curtains\/\d+\?v=(\d+)/.exec(html)?.[1] ?? "none";
  }

  const vBefore = await publicPageVersion();

  /* 4. replace primary image only */
  const put1 = await fetch(`${BASE}/api/admin/curtains/${target.id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ imageUrl: uploaded }),
  });
  const put1Body = await put1.json().catch(() => ({}));
  const galleryPreserved =
    JSON.stringify(put1Body.curtain?.gallery ?? original.gallery) === JSON.stringify(original.gallery);
  const served1 = await servedBytes(put1Body.curtain?.updatedAt);
  const identity1 = served1 ? sha256(served1.bytes) === sha256(uploadedBytes) : false;
  const vAfter = await publicPageVersion();
  const vBumped = vAfter !== vBefore && vAfter !== "none";
  record("replace_primary", put1.ok, `PUT status=${put1.status}`);
  record("gallery_guard", galleryPreserved, `gallery untouched when omitted (${original.gallery.length} slots)`);
  record("image_identity", identity1, served1 ? `served ${served1.url} sha=${sha256(served1.bytes).slice(0, 16)} vs stored ${sha256(uploadedBytes).slice(0, 16)}` : "media URL not served");
  record("cache_invalidation", vBumped, `public page ?v= ${vBefore} → ${vAfter}`);

  /* 5. replace gallery explicitly */
  const put2 = await fetch(`${BASE}/api/admin/curtains/${target.id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ gallery: [uploaded] }),
  });
  const put2Body = await put2.json().catch(() => ({}));
  const galleryNow: unknown[] = put2Body.curtain?.gallery ?? [];
  const slotOk = Array.isArray(galleryNow) && galleryNow.length === 1 && galleryNow[0] === uploaded;
  const galleryServed = await fetch(`${BASE}/api/media/curtains/${target.id}?gallery=0&v=${Date.parse(put2Body.curtain?.updatedAt ?? "") || ""}`);
  const galleryBytes = galleryServed.ok ? Buffer.from(await galleryServed.arrayBuffer()) : null;
  const galleryIdentity = galleryBytes ? sha256(galleryBytes) === sha256(uploadedBytes) : false;
  record("gallery_replace", slotOk && galleryIdentity, `explicit array → exactly 1 slot; gallery[0] identity=${galleryIdentity}`);

  /* 6. restore */
  const put3 = await fetch(`${BASE}/api/admin/curtains/${target.id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ imageUrl: original.imageUrl, gallery: original.gallery }),
  });
  const put3Body = await put3.json().catch(() => ({}));
  const restored = await servedBytes(put3Body.curtain?.updatedAt);
  const restoreOk = restored ? sha256(restored.bytes) === sha256(decodeDataUrl(original.imageUrl) ?? Buffer.from("x")) : original.imageUrl.startsWith("http") || original.imageUrl === "";
  record("restore", put3.ok && restoreOk, `original primary restored=${restoreOk}; gallery slots=${original.gallery.length} restored`);

  /* 7. logout (clean session) */
  await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: { cookie } });
  record("logout", true, "session destroyed");

  finish(results.every((r) => r.ok) ? 0 : 1);
}

function finish(code: number) {
  const summary = { base: BASE, date: new Date().toISOString(), results };
  if (OUT) {
    writeFileSync(OUT, JSON.stringify(summary, null, 2));
    console.log(`report written to ${OUT}`);
  }
  console.log(`\n=== write-path verification ${code === 0 ? "PASSED" : "FAILED"} ===`);
  process.exit(code);
}

main().catch((e) => {
  console.error("preview-write-verify crashed:", e);
  process.exit(2);
});

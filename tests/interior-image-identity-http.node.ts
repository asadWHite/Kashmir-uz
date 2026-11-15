import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import sharp from "sharp";
import { chromium } from "@playwright/test";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Pool } from "pg";
import { migrations } from "../src/db/recovery/manifest";
import { hashPassword } from "../src/lib/password";

/**
 * End-to-end identity test against an ephemeral PGlite database and the real
 * Next production server. It never uses DATABASE_URL from the environment and
 * never writes to a customer or deployment database.
 *
 * Run with: npm run test:image-identity:http
 */

const AUTH_SECRET = "test-only-random-secret-of-at-least-32-characters";
const ADMIN_EMAIL = "identity-test@example.test";
const ADMIN_PASSWORD = "Identity-test-password-947!";
let pgPort = 0;
let appPort = 0;
let base = "";
let databaseUrl = "";
let pglite: PGlite;
let socketServer: PGLiteSocketServer;
let pool: Pool;
let app: ChildProcess | undefined;

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close();
        reject(new Error("Could not determine a free port."));
        return;
      }
      probe.close(() => resolve(address.port));
    });
  });
}

async function waitForHealth(timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (app && app.exitCode !== null) {
      throw new Error(`Application server exited during startup (code ${app.exitCode}).`);
    }
    try {
      if ((await fetch(`${base}/api/health`)).status === 200) return;
    } catch {
      /* server not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Application server did not become healthy in time.");
}

async function imageDataUrl(red: number, green: number, blue: number): Promise<{ url: string; bytes: Buffer }> {
  const bytes = await sharp({
    create: { width: 8, height: 8, channels: 3, background: { r: red, g: green, b: blue } },
  })
    .webp({ quality: 90 })
    .toBuffer();
  return { url: `data:image/webp;base64,${bytes.toString("base64")}`, bytes };
}

function killAppTree(signal: NodeJS.Signals) {
  if (!app?.pid) return;
  try {
    process.kill(-app.pid, signal);
  } catch {
    try {
      app.kill(signal);
    } catch {
      /* already gone */
    }
  }
}

test.before(async () => {
  pgPort = await freePort();
  appPort = await freePort();
  base = `http://127.0.0.1:${appPort}`;
  databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${pgPort}/postgres`;

  pglite = new PGlite();
  await pglite.waitReady;
  socketServer = new PGLiteSocketServer({
    db: pglite,
    port: pgPort,
    host: "127.0.0.1",
    maxConnections: 20,
  });
  await socketServer.start();

  await pglite.exec(
    "CREATE TABLE IF NOT EXISTS public.kashmir_migrations (id text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  for (const migration of migrations) {
    const sql = readFileSync(`migrations/${migration.id}.sql`, "utf8");
    assert.equal(
      createHash("sha256").update(sql).digest("hex"),
      migration.checksum,
      `checksum for ${migration.id}`,
    );
    await pglite.exec(sql.replace(/--> statement-breakpoint/g, ""));
    await pglite.query(
      "INSERT INTO public.kashmir_migrations (id, checksum) VALUES ($1, $2)",
      [migration.id, migration.checksum],
    );
  }

  pool = new Pool({ connectionString: databaseUrl, max: 2 });
  await pool.query(
    "INSERT INTO public.admin_users (email, password_hash) VALUES ($1, $2)",
    [ADMIN_EMAIL, hashPassword(ADMIN_PASSWORD)],
  );
  const [a, b, c] = await Promise.all([
    imageDataUrl(220, 50, 50),
    imageDataUrl(50, 180, 70),
    imageDataUrl(40, 80, 220),
  ]);
  const rows = [
    { slug: "identity-a", primary: a, gallery: [b, c] },
    { slug: "identity-b", primary: b, gallery: [c, a] },
    { slug: "identity-c", primary: c, gallery: [a, b] },
  ];
  for (const [index, row] of rows.entries()) {
    await pool.query(
      `INSERT INTO public.interiors
        (title, slug, image_url, gallery, location, is_active, sort_order, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, true, $6, $7)`,
      [
        `Identity ${String.fromCharCode(65 + index)}`,
        row.slug,
        row.primary.url,
        JSON.stringify(row.gallery.map((image) => image.url)),
        "Isolated test fixture",
        index,
        new Date(`2026-11-15T00:0${index}:00.000Z`),
      ],
    );
  }

  if (!existsSync(".next/BUILD_ID")) {
    execFileSync("npx", ["next", "build"], {
      env: { ...process.env, DATABASE_URL: databaseUrl, AUTH_SECRET },
      stdio: "pipe",
    });
  }
  app = spawn("npx", ["next", "start", "-p", String(appPort), "-H", "127.0.0.1"], {
    env: { ...process.env, DATABASE_URL: databaseUrl, AUTH_SECRET },
    stdio: "pipe",
    detached: true,
  });
  app.stderr?.on("data", (chunk) => process.stderr.write(`[identity-app] ${chunk}`));
  await waitForHealth();
});

test.after(async () => {
  if (app?.pid && app.exitCode === null && app.signalCode === null) {
    const exited = new Promise<void>((resolve) => app?.once("exit", () => resolve()));
    killAppTree("SIGTERM");
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 5_000))]);
    if (app.exitCode === null && app.signalCode === null) killAppTree("SIGKILL");
  }
  await pool?.end();
  await socketServer?.stop();
  await pglite?.close();
});

async function fixtureIds(): Promise<number[]> {
  const result = await pool.query<{ id: number }>(
    "SELECT id FROM public.interiors WHERE slug LIKE 'identity-%' ORDER BY sort_order",
  );
  return result.rows.map((row) => Number(row.id));
}

async function getBytes(path: string): Promise<{ bytes: Buffer; response: Response }> {
  const response = await fetch(`${base}${path}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get("content-type"), "image/webp", path);
  assert.equal(response.headers.get("content-length"), String(bytes.length), path);
  return { bytes, response };
}

async function adminCookie(): Promise<string> {
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie);
  return cookie.split(";")[0];
}

test("A, B and C remain byte-identical through primary and ordered gallery media routes", async () => {
  const ids = await fixtureIds();
  assert.equal(ids.length, 3);
  const [a, b, c] = await Promise.all([
    imageDataUrl(220, 50, 50),
    imageDataUrl(50, 180, 70),
    imageDataUrl(40, 80, 220),
  ]);

  const expected = [
    { primary: a.bytes, gallery: [b.bytes, c.bytes] },
    { primary: b.bytes, gallery: [c.bytes, a.bytes] },
    { primary: c.bytes, gallery: [a.bytes, b.bytes] },
  ];
  for (const [index, id] of ids.entries()) {
    const primary = await getBytes(`/api/media/interiors/${id}?v=fixture-${index}`);
    assert.deepEqual(primary.bytes, expected[index].primary);
    for (const [galleryIndex, bytes] of expected[index].gallery.entries()) {
      const image = await getBytes(
        `/api/media/interiors/${id}?gallery=${galleryIndex}&v=fixture-${index}`,
      );
      assert.deepEqual(image.bytes, bytes);
    }
  }
});

test("an admin interior save preserves gallery references it does not edit", async () => {
  const [id] = await fixtureIds();
  const before = await pool.query<{ gallery: string[] }>(
    "SELECT gallery FROM public.interiors WHERE id = $1",
    [id],
  );
  const response = await fetch(`${base}/api/admin/interiors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: await adminCookie() },
    // Simulate the old client payload as well: null must not erase the
    // gallery because this editor does not own those references.
    body: JSON.stringify({ title: "Identity A after save", gallery: null }),
  });
  assert.equal(response.status, 200);
  const after = await pool.query<{ gallery: string[] }>(
    "SELECT gallery FROM public.interiors WHERE id = $1",
    [id],
  );
  assert.deepEqual(after.rows[0]?.gallery, before.rows[0]?.gallery);
});

test("cards and detail pages reference the same ID-scoped image family", async () => {
  const ids = await fixtureIds();
  const cards = await (await fetch(`${base}/interiors`)).text();
  const detail = await (await fetch(`${base}/interiors/identity-a`)).text();

  for (const id of ids) assert.match(cards, new RegExp(`/api/media/interiors/${id}(?:\\?|&)`));
  assert.match(detail, new RegExp(`/api/media/interiors/${ids[0]}(?:\\?|&)`));
  assert.match(detail, /gallery=0/);
  assert.match(detail, /gallery=1/);
});

test("the browser renders the ID-scoped primary and gallery URLs without media errors", async (t) => {
  const [id] = await fixtureIds();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    if (error instanceof Error && /Executable doesn't exist/.test(error.message)) {
      t.skip("Playwright Chromium is not installed in this sandbox.");
      return;
    }
    throw error;
  }
  const page = await browser.newPage();
  const failedMediaRequests: string[] = [];
  const mediaConsoleErrors: string[] = [];
  page.on("requestfailed", (request) => {
    if (request.url().includes("/api/media/interiors/")) failedMediaRequests.push(request.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("MediaImage")) {
      mediaConsoleErrors.push(message.text());
    }
  });
  try {
    const response = await page.goto(`${base}/interiors/identity-a`, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200);
    const urls = await page.locator("img").evaluateAll((images) =>
      images.map((image) => image.getAttribute("src") || ""),
    );
    assert.ok(urls.some((url) => url.includes(`/api/media/interiors/${id}?v=`)));
    assert.ok(urls.some((url) => url.includes(`/api/media/interiors/${id}?gallery=0&v=`)));
    assert.ok(urls.some((url) => url.includes(`/api/media/interiors/${id}?gallery=1&v=`)));
    assert.deepEqual(failedMediaRequests, []);
    assert.deepEqual(mediaConsoleErrors, []);
  } finally {
    await browser.close();
  }
});

test("replacing A changes A only; B and C bytes and gallery order survive refreshes", async () => {
  const ids = await fixtureIds();
  const [a2, b, c] = await Promise.all([
    imageDataUrl(210, 20, 180),
    imageDataUrl(50, 180, 70),
    imageDataUrl(40, 80, 220),
  ]);
  const beforeA = await getBytes(`/api/media/interiors/${ids[0]}?v=before`);
  await pool.query(
    "UPDATE public.interiors SET image_url = $1, updated_at = $2 WHERE id = $3",
    [a2.url, new Date("2026-11-15T01:00:00.000Z"), ids[0]],
  );

  const afterA = await getBytes(`/api/media/interiors/${ids[0]}?v=after`);
  assert.notDeepEqual(afterA.bytes, beforeA.bytes);
  assert.deepEqual(afterA.bytes, a2.bytes);

  for (const [id, expected] of [
    [ids[1], b.bytes],
    [ids[2], c.bytes],
  ] as const) {
    const first = await getBytes(`/api/media/interiors/${id}?v=refresh-1`);
    const second = await getBytes(`/api/media/interiors/${id}?v=refresh-2`);
    assert.deepEqual(first.bytes, expected);
    assert.deepEqual(second.bytes, expected);
  }

  const aGalleryB = await getBytes(`/api/media/interiors/${ids[0]}?gallery=0&v=after`);
  const aGalleryC = await getBytes(`/api/media/interiors/${ids[0]}?gallery=1&v=after`);
  assert.deepEqual(aGalleryB.bytes, b.bytes);
  assert.deepEqual(aGalleryC.bytes, c.bytes);
});

/**
 * Performance measurement harness (sandbox / CI friendly).
 *
 * Boots an ephemeral PGlite database with realistic seeded content (localized
 * ru/uz/en rows and multi-hundred-kilobyte data-URL product images, mirroring
 * the production storage shape), starts the production Next server and drives
 * real Chromium through the visitor journeys we care about:
 *
 *   · home page load (desktop + mobile): TTFB, FCP, LCP, CLS, load, transfer,
 *   · per-resource image transfer / decode timing,
 *   · language switch RU → UZ → EN (click to rendered-text swap),
 *   · navigation to /collections and a product detail page,
 *   · warm-cache repeat visit.
 *
 * Optionally runs Lighthouse against the same server when the `lighthouse`
 * package is available (npm i --no-save lighthouse).
 *
 * Usage: npx tsx scripts/perf-measure.ts --out docs/audit/perf-before.json
 * Never touches DATABASE_URL from the environment.
 */
import assert from "node:assert/strict";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { Pool } from "pg";
import sharp from "sharp";
import { chromium, type Browser } from "@playwright/test";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { migrations } from "../src/db/recovery/manifest";
import { hashPassword } from "../src/lib/password";

const outIdx = process.argv.indexOf("--out");
const OUT = outIdx > -1 && process.argv[outIdx + 1] ? process.argv[outIdx + 1] : "docs/audit/perf-latest.json";
const AUTH_SECRET = "perf-measure-random-secret-of-at-least-32-characters";

let pgPort = 0;
let appPort = 0;
let base = "";
let databaseUrl = "";
let pglite: PGlite;
let socketServer: PGLiteSocketServer;
let pool: Pool;
let app: ChildProcess | undefined;

function freePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
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
      probe.close(() => resolvePort(address.port));
    });
  });
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

async function waitForHealth(timeoutMs = 180_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (app && app.exitCode !== null) throw new Error(`App exited (code ${app.exitCode}).`);
    try {
      if ((await fetch(`${base}/api/health`)).status === 200) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Application did not become healthy in time.");
}

/** Photographic-weight webp data URL (high entropy ≈ realistic upload size). */
async function photoDataUrl(width: number, height: number, quality = 82): Promise<string> {
  const raw = randomBytes(width * height * 3);
  const bytes = await sharp(raw, { raw: { width, height, channels: 3 } })
    .webp({ quality })
    .toBuffer();
  return `data:image/webp;base64,${bytes.toString("base64")}`;
}

async function seed() {
  await pglite.exec(
    "CREATE TABLE IF NOT EXISTS public.kashmir_migrations (id text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  for (const migration of migrations) {
    const sql = readFileSync(`migrations/${migration.id}.sql`, "utf8");
    assert.equal(createHash("sha256").update(sql).digest("hex"), migration.checksum);
    await pglite.exec(sql.replace(/--> statement-breakpoint/g, ""));
    await pglite.query("INSERT INTO public.kashmir_migrations (id, checksum) VALUES ($1, $2)", [
      migration.id,
      migration.checksum,
    ]);
  }

  await pool.query(
    `INSERT INTO public.admin_users (email, password_hash) VALUES ($1, $2)`,
    ["perf@example.test", hashPassword("Perf-measure-password-947!")],
  );

  // Localized interface + content rows (ru default, uz + en translations).
  const loc = ["ru", "uz", "en"];
  const t = (entity: string, id: number, locale: string, title: string, description: string) =>
    pool.query(
      `INSERT INTO public.content_translations (entity, entity_id, locale, title, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [entity, id, locale, title, description],
    );

  await pool.query(
    `INSERT INTO public.site_settings (id, instagram_url, telegram_url, phone, email, address, working_hours, hero_eyebrow, hero_statement, about_title, about_text, maps_query, updated_at)
     VALUES (1, 'https://instagram.com/kashmirdecor', 'https://t.me/kashmirdecor', '+998 90 000 00 00', 'hello@kashmirdecor.uz', 'Tashkent', '9:00–20:00', 'Salon', 'Statement', 'About', 'About text', 'Kashmir Decor Tashkent', now())`,
  );
  for (const [i, locale] of loc.entries()) {
    await t("settings", 1, locale, `Settings title ${locale}`, `Settings about ${locale}`);
  }

  for (let c = 1; c <= 3; c++) {
    await pool.query(
      `INSERT INTO public.categories (name, slug, sort_order, is_active) VALUES ($1, $2, $3, true)`,
      [`Category ${c}`, `category-${c}`, c],
    );
    for (const locale of loc) await t("category", c, locale, `Category ${c} ${locale}`, `Category ${c} desc ${locale}`);
  }

  // 8 curtains, ~300 KB data-URL primary + 2 gallery images each (production shape).
  const curtainImages = await Promise.all(
    Array.from({ length: 8 * 3 }, () => photoDataUrl(1280, 960)),
  );
  for (let i = 1; i <= 8; i++) {
    const primary = curtainImages[(i - 1) * 3];
    const gallery = [curtainImages[(i - 1) * 3 + 1], curtainImages[(i - 1) * 3 + 2]];
    await pool.query(
      `INSERT INTO public.curtains (name, slug, description, category, category_id, image_url, gallery, material, color, style, room, is_featured, is_active, likes, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, true, $13, $14, now(), now())`,
      [
        `Curtain ${i}`,
        `curtain-${i}`,
        `Curtain ${i} description`,
        `category-${(i % 3) + 1}`,
        (i % 3) + 1,
        primary,
        JSON.stringify(gallery),
        "linen",
        "ivory",
        "classic",
        "living",
        i <= 3,
        i * 7,
        i,
      ],
    );
    for (const locale of loc) {
      await t("curtain", i, locale, `Curtain ${i} ${locale}`, `Curtain ${i} description ${locale}`);
    }
  }

  // 6 interiors, primary + 2 gallery data URLs.
  const interiorImages = await Promise.all(
    Array.from({ length: 6 * 3 }, () => photoDataUrl(1280, 960)),
  );
  for (let i = 1; i <= 6; i++) {
    const primary = interiorImages[(i - 1) * 3];
    const gallery = [interiorImages[(i - 1) * 3 + 1], interiorImages[(i - 1) * 3 + 2]];
    await pool.query(
      `INSERT INTO public.interiors (title, slug, description, image_url, gallery, location, style, room, is_featured, is_active, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, true, $10, now(), now())`,
      [
        `Interior ${i}`,
        `interior-${i}`,
        `Interior ${i} description`,
        primary,
        JSON.stringify(gallery),
        "Tashkent",
        "modern",
        "living",
        i <= 3,
        i,
      ],
    );
    for (const locale of loc) {
      await t("interior", i, locale, `Interior ${i} ${locale}`, `Interior ${i} description ${locale}`);
    }
  }

  // 8 standalone gallery items.
  const galleryImages = await Promise.all(Array.from({ length: 8 }, () => photoDataUrl(1280, 960)));
  for (let i = 1; i <= 8; i++) {
    await pool.query(
      `INSERT INTO public.gallery (title, image_url, category, is_active, sort_order, created_at)
       VALUES ($1, $2, $3, true, $4, now())`,
      [`Gallery ${i}`, galleryImages[i - 1], "interior", i],
    );
    for (const locale of loc) await t("gallery", i, locale, `Gallery ${i} ${locale}`, "");
  }

  for (let i = 1; i <= 6; i++) {
    await pool.query(
      `INSERT INTO public.statistics (label, value, suffix, sort_order, is_active) VALUES ($1, $2, $3, $4, true)`,
      [`Stat ${i}`, String(100 + i), "+", i],
    );
    for (const locale of loc) await t("statistic", i, locale, `Stat ${i} ${locale}`, "");
  }

  for (let i = 1; i <= 6; i++) {
    await pool.query(
      `INSERT INTO public.faq (question_en, question_ru, question_uz, answer_en, answer_ru, answer_uz, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [`Question ${i} en?`, `Question ${i} ru?`, `Question ${i} uz?`, `Answer ${i} en`, `Answer ${i} ru`, `Answer ${i} uz`, i],
    );
    for (const locale of loc) await t("faq", i, locale, `Question ${i} ${locale}?`, `Answer ${i} ${locale}`);
  }
}

/* ------------------------------ browser bootstrap ----------------------- */

/**
 * The sandbox has no system Chromium. Prefer the Playwright build when it
 * exists; otherwise extract the npm-shipped headless Chromium
 * (`@sparticuz/chromium`, installed ad hoc) together with its NSS libraries.
 */
async function resolveBrowserExecutable(): Promise<string | null> {
  try {
    const own = chromium.executablePath();
    if (own && existsSync(own)) return own;
  } catch {
    /* fall through */
  }
  try {
    const moduleName = "@sparticuz/" + "chromium";
    const mod: unknown = await import(moduleName);
    const sparticuz = ((mod as { default?: unknown }).default ?? mod) as {
      executablePath: () => Promise<string>;
    };
    const exe = await sparticuz.executablePath();
    // al2023.tar.br carries libnspr4/libnss3/… ; the dynamic loader needs them
    // on distros that do not ship NSS system-wide.
    const libDir = "/tmp/al2023-lib/lib";
    if (!existsSync(libDir)) {
      const zlib = await import("node:zlib");
      const tar = await import("node:child_process");
      const packed = readFileSync("node_modules/@sparticuz/chromium/bin/al2023.tar.br");
      mkdirSync("/tmp/al2023-lib", { recursive: true });
      writeFileSync("/tmp/al2023.tar", zlib.brotliDecompressSync(packed));
      tar.execFileSync("tar", ["-xf", "/tmp/al2023.tar", "-C", "/tmp/al2023-lib"]);
    }
    if (existsSync(libDir)) {
      process.env.LD_LIBRARY_PATH = `${libDir}:${process.env.LD_LIBRARY_PATH ?? ""}`;
    }
    return exe;
  } catch {
    return null;
  }
}

/* ------------------------------ measurement ------------------------------ */

const INIT_SCRIPT = `
  window.__name = (fn) => fn; // tsx keepNames shim for evaluate() callbacks
  window.__cls = 0;
  window.__lcp = 0;
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length) window.__lcp = entries[entries.length - 1].startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
`;

interface NavMetrics {
  ttfb: number | null;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  load: number | null;
  domContentLoaded: number | null;
  htmlTransferKB: number | null;
  jsKB: number;
  cssKB: number;
  fontKB: number;
  imageKB: number;
  imageRequests: number;
  imageSlowestMS: number | null;
  requests: number;
  totalTransferKB: number;
}

async function measureNav(page: import("@playwright/test").Page, path: string): Promise<NavMetrics> {
  await page.goto(`${base}${path}`, { waitUntil: "load" });
  await page.waitForTimeout(1200); // let buffered LCP/CLS observers finalize
  return page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const paints = performance.getEntriesByType("paint");
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const sum = (kind: string) =>
      resources
        .filter((r) => r.initiatorType === kind || (kind === "image" && /\.(jpe?g|png|webp|avif|gif)/i.test(r.name)) || (kind === "image" && r.name.includes("/api/media/")))
        .reduce((acc, r) => acc + (r.transferSize || r.encodedBodySize || 0), 0) / 1024;
    const images = resources.filter((r) => /\.(jpe?g|png|webp|avif|gif)/i.test(r.name) || r.name.includes("/api/media/") || r.name.startsWith("data:"));
    return {
      ttfb: nav ? nav.responseStart : null,
      fcp: (paints.find((p) => p.name === "first-contentful-paint")?.startTime ?? null) as number | null,
      lcp: ((window as unknown) as { __lcp: number }).__lcp || null,
      cls: Number(((window as unknown) as { __cls: number }).__cls.toFixed(4)),
      load: nav ? nav.loadEventEnd : null,
      domContentLoaded: nav ? nav.domContentLoadedEventEnd : null,
      htmlTransferKB: nav ? (nav.transferSize || nav.encodedBodySize || 0) / 1024 : null,
      jsKB: sum("script"),
      cssKB: sum("link") + sum("css"),
      fontKB: sum("font") + resources.filter((r) => /woff/.test(r.name)).reduce((a, r) => a + (r.transferSize || 0), 0) / 1024,
      imageKB: images.reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), 0) / 1024,
      imageRequests: images.length,
      imageSlowestMS: images.length
        ? Math.max(...images.map((r) => Math.max(0, r.responseEnd - r.startTime)))
        : null,
      requests: resources.length,
      totalTransferKB: resources.reduce((a, r) => a + (r.transferSize || 0), 0) / 1024,
    };
  });
}

async function measureLanguageSwitch(
  page: import("@playwright/test").Page,
  throttle = false,
): Promise<Record<string, number>> {
  await page.goto(`${base}/`, { waitUntil: "load" });
  // Measure the switch, not the intro overlay.
  await page.waitForSelector("[data-intro]", { state: "detached", timeout: 15_000 }).catch(() => {});

  if (throttle) {
    const cdp = await page.context().newCDPSession(page);
    // Typical slow mobile ("Slow 4G"): 1.5 Mbit/s down, 150 ms RTT.
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1.5 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
  }

  const results: Record<string, number> = {};
  const pairs: Array<[string, string, string]> = [
    // [current marker, next locale label, expected lang]
    ["RU", "O‘zbekcha", "uz"],
    ["UZ", "English", "en"],
    ["EN", "Русский", "ru"],
  ];
  // Only server-rendered DB content proves the RSC refresh landed; the client
  // flips `documentElement.lang` optimistically and must not stop the clock.
  const markerFor = (lang: string) => `Curtain 1 ${lang}`;
  let resourcesBefore = await page.evaluate(() => performance.getEntriesByType("resource").length);
  let rscKB = 0;
  for (const [from, label, lang] of pairs) {
    await page.getByRole("button", { name: /Tilni tanlash|Выбор языка|Select language/ }).click();
    const start = Date.now();
    await page.getByRole("button", { name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).first().click();
    // Wait until the html lang attribute reflects the new locale AND the
    // server-rendered product copy for that locale is on screen.
    await page.waitForFunction(
      ({ expected, marker }) =>
        document.documentElement.lang === expected && document.body.innerText.includes(marker),
      { expected: lang, marker: markerFor(lang) },
      { timeout: throttle ? 180_000 : 15_000 },
    );
    results[`switch_${from}_to_${lang}_ms`] = Date.now() - start;
    const delta = await page.evaluate((before) => {
      const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      return entries
        .slice(before)
        .reduce((acc, r) => acc + (r.transferSize || r.encodedBodySize || 0), 0) / 1024;
    }, resourcesBefore);
    rscKB += delta;
    resourcesBefore = await page.evaluate(() => performance.getEntriesByType("resource").length);
    await page.waitForTimeout(250);
  }
  results.switchRoundTripKB = Math.round(rscKB);
  return results;
}

interface Lhr {
  categories: { performance: { score: number | null } };
  audits: Record<string, { numericValue?: number } | undefined>;
}

async function runLighthouse(path: string, exe: string): Promise<Record<string, number | string> | null> {
  // Use the Lighthouse CLI (ESM-only package) and point it at the resolved
  // Chromium; parses the JSON report back for the summary.
  const outPath = `/tmp/lighthouse-${Date.now()}.json`;
  try {
    execFileSync(
      "npx",
      [
        "lighthouse",
        `${base}${path}`,
        "--quiet",
        "--output=json",
        `--output-path=${outPath}`,
        "--only-categories=performance",
        "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage",
      ],
      {
        env: { ...process.env, CHROME_PATH: exe },
        stdio: "pipe",
        timeout: 300_000,
      },
    );
  } catch (error) {
    process.stderr.write(`lighthouse failed: ${(error as Error).message.slice(0, 400)}\n`);
    return null;
  }
  if (!existsSync(outPath)) return null;
  const lhr = JSON.parse(readFileSync(outPath, "utf8")) as Lhr;
  const audits = lhr.audits;
  return {
    score: Math.round((lhr.categories.performance.score ?? 0) * 100),
    ttfbMs: Math.round(audits["server-response-time"]?.numericValue ?? 0),
    fcpMs: Math.round(audits["first-contentful-paint"]?.numericValue ?? 0),
    lcpMs: Math.round(audits["largest-contentful-paint"]?.numericValue ?? 0),
    tbtMs: Math.round(audits["total-blocking-time"]?.numericValue ?? 0),
    cls: Number((audits["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(4)),
    speedIndexMs: Math.round(audits["speed-index"]?.numericValue ?? 0),
  };
}

async function main() {
  pgPort = await freePort();
  appPort = await freePort();
  base = `http://127.0.0.1:${appPort}`;
  databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${pgPort}/postgres`;

  pglite = new PGlite();
  await pglite.waitReady;
  socketServer = new PGLiteSocketServer({ db: pglite, port: pgPort, host: "127.0.0.1", maxConnections: 20 });
  await socketServer.start();
  pool = new Pool({ connectionString: databaseUrl, max: 4 });
  process.stdout.write("seeding ephemeral database…\n");
  await seed();

  process.stdout.write("building production bundle…\n");
  execFileSync("npx", ["next", "build"], {
    env: { ...process.env, DATABASE_URL: databaseUrl, AUTH_SECRET },
    stdio: "inherit",
  });

  app = spawn("npx", ["next", "start", "-p", String(appPort), "-H", "127.0.0.1"], {
    env: { ...process.env, DATABASE_URL: databaseUrl, AUTH_SECRET },
    stdio: "pipe",
    detached: true,
  });
  app.stderr?.on("data", (c) => process.stderr.write(`[app] ${c}`));
  await waitForHealth();
  process.stdout.write(`server ready at ${base}\n`);

  const results: Record<string, unknown> = {
    date: new Date().toISOString(),
    commit: execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim(),
  };

  const exe = await resolveBrowserExecutable();
  if (!exe) process.stdout.write("no browser available — HTTP-only measurements\n");

  const profiles = [
    ["desktop", { viewport: { width: 1440, height: 900 } }],
    ["mobile", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ] as const;

  // A fresh browser per profile keeps the sandbox Chromium from leaking state
  // between emulated devices, and every section is persisted immediately.
  const flush = () => {
    mkdirSync(dirname(resolve(OUT)), { recursive: true });
    writeFileSync(resolve(OUT), JSON.stringify(results, null, 2));
  };

  if (exe) {
    for (const [name, options] of profiles) {
      const runProfile = async () => {
        const browser = await chromium.launch({
          headless: true,
          executablePath: exe,
          args: ["--no-sandbox", "--disable-dev-shm-usage", "--single-process"],
        });
        try {
          const context = await browser.newContext({ ...options, locale: "ru-RU" });
          await context.addInitScript(INIT_SCRIPT);
          const page = await context.newPage();
          results[`home_${name}`] = await measureNav(page, "/");
          flush();
          results[`collections_${name}`] = await measureNav(page, "/collections");
          flush();
          results[`detail_${name}`] = await measureNav(page, "/curtains/curtain-1");
          flush();
          results[`home_${name}_warm`] = await measureNav(page, "/");
          flush();
          if (name === "desktop") {
            results[`languageSwitch_desktop`] = await measureLanguageSwitch(page);
            flush();
            results[`languageSwitch_slow4g`] = await measureLanguageSwitch(page, true);
            flush();
          }
          await context.close();
        } finally {
          await browser.close().catch(() => {});
        }
      };
      try {
        await runProfile();
      } catch (error) {
        process.stderr.write(`profile ${name} failed, retrying once: ${(error as Error).message}\n`);
        await runProfile();
      }
    }
  }

  results.lighthouse = { home: exe ? await runLighthouse("/", exe) : null };

  mkdirSync(dirname(resolve(OUT)), { recursive: true });
  writeFileSync(resolve(OUT), JSON.stringify(results, null, 2));
  process.stdout.write(`\nwrote ${OUT}\n${JSON.stringify(results, null, 2)}\n`);

  killAppTree("SIGTERM");
  await pool.end();
  await socketServer.stop();
  await pglite.close();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  killAppTree("SIGKILL");
  process.exit(1);
});

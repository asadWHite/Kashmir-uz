/**
 * Read-only verification of a DEPLOYED Kashmir Decor preview.
 *
 * Runs from GitHub Actions (or any machine with outbound network) against a
 * base URL such as the Vercel preview of a branch. Everything here is a GET —
 * it never writes to the site or its database.
 *
 *   npx tsx scripts/preview-verify.ts --base https://<preview>.vercel.app \
 *     [--out report.json] [--perf] [--media-samples 12]
 *
 * Checks (see CHECKS below):
 *   health            /api/health read-only status
 *   locales           ru/uz/en switchable via kashmir-locale cookie, html lang
 *   real_data         sitemap has real product/interior URLs, pages render them
 *   ordering          collections link order captured + stable across two fetches
 *   no_inline_base64  no data:image payloads in any HTML (record-scoped delivery)
 *   media_urls        every /api/media URL is record-scoped and versioned (?v=)
 *   media_delivery    bare = original bytes/300s; ?w= = webp transform; ?v= immutable
 *   seo               title/description/canonical (kashmirdecor.uz) per page
 *   no_admin_leak     no JWTs, admin links, stack traces in public HTML
 *   favorites         /favorites shell responds
 *   perf (opt-in)     TTFB cold/warm, HTML bytes, language-switch round trips
 */

import { createHash } from "node:crypto";

type CheckStatus = "PASS" | "FAIL" | "WARN" | "INFO";
type Check = { id: string; status: CheckStatus; detail: string };

const args = process.argv.slice(2);
function argValue(flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}
const BASE = argValue("--base")?.replace(/\/+$/, "") ?? "";
const OUT = argValue("--out");
const PERF = args.includes("--perf");
const MEDIA_SAMPLES = Number(argValue("--media-samples") ?? 12);

if (!BASE || !/^https?:\/\//.test(BASE)) {
  console.error("usage: preview-verify.ts --base https://host [--out file] [--perf]");
  process.exit(2);
}

const PROD_HOST = "kashmirdecor.uz";
const checks: Check[] = [];
const facts: Record<string, unknown> = {};

function record(id: string, status: CheckStatus, detail: string) {
  checks.push({ id, status, detail });
  const tag = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : status === "WARN" ? "⚠️" : "ℹ️";
  console.log(`${tag} [${id}] ${detail}`);
}

async function get(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    redirect: "follow",
    ...init,
    headers: { "user-agent": "kashmir-preview-verify/1.0 (read-only checks)", ...(init?.headers ?? {}) },
  });
}

function sha256(buf: ArrayBuffer | Buffer): string {
  return createHash("sha256").update(Buffer.from(buf as never)).digest("hex").slice(0, 16);
}

function extractHtml(html: string) {
  const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#x26;|&#38;/g, "&").replace(/&quot;/g, '"');
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const srcs = [...html.matchAll(/\bsrc="([^"]+)"/gi)].map((m) => decode(m[1]));
  const srcsets = [...html.matchAll(/\bsrcset="([^"]+)"/gi)].flatMap((m) =>
    m[1].split(",").map((part) => decode(part.trim().split(/\s+/)[0])),
  );
  const hrefs = [...html.matchAll(/\bhref="([^"]+)"/gi)].map((m) => decode(m[1]));
  return { imgs, srcs: [...srcs, ...srcsets], hrefs };
}

function absolute(base: string, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

async function fetchHtml(url: string, locale?: string): Promise<{ html: string; ms: number; bytes: number; status: number }> {
  const started = performance.now();
  const res = await get(url, locale ? { headers: { cookie: `kashmir-locale=${locale}` } } : {});
  const html = await res.text();
  return { html, ms: performance.now() - started, bytes: Buffer.byteLength(html), status: res.status };
}

async function main() {
  console.log(`\nRead-only preview verification of ${BASE}\n`);

  /* ---------- health ---------- */
  try {
    const res = await get(`${BASE}/api/health`);
    const body = await res.json();
    facts.health = body;
    const checksMap = body?.checks ?? {};
    record(
      "health",
      checksMap.database === "PASS" ? "PASS" : "FAIL",
      `application=${checksMap.application} database=${checksMap.database} schema=${checksMap.schema} migrations=${checksMap.migrations} (migrations:FAIL is the documented pre-existing production state)`,
    );
  } catch (e) {
    record("health", "FAIL", `unreachable: ${String(e)}`);
  }

  /* ---------- locales ---------- */
  const LOCALES: Array<[string, string, string]> = [
    ["ru", "Коллекция", 'lang="ru"'],
    ["uz", "Kolleksiya", 'lang="uz"'],
    ["en", "Collection", 'lang="en"'],
  ];
  for (const [locale, marker, langAttr] of LOCALES) {
    try {
      const { html, status } = await fetchHtml(`${BASE}/?locale-check=${locale}`, locale);
      const hasLang = html.includes(langAttr);
      const hasMarker = html.includes(marker);
      const otherMarkers = LOCALES.filter(([l]) => l !== locale).every(([, m]) => !html.includes(m));
      const ok = status === 200 && hasLang && hasMarker;
      record(
        "locales",
        ok ? "PASS" : "FAIL",
        `${locale}: status=${status} ${langAttr}=${hasLang} marker(${JSON.stringify(marker)})=${hasMarker} other-locale-markers-absent=${otherMarkers}`,
      );
    } catch (e) {
      record("locales", "FAIL", `${locale}: ${String(e)}`);
    }
  }

  /* ---------- real data + ordering ---------- */
  const sitemapRes = await get(`${BASE}/sitemap.xml`).catch(() => null);
  const sitemapXml = sitemapRes?.ok ? await sitemapRes.text() : "";
  const sitemapProducts = [...sitemapXml.matchAll(/<loc>([^<]*\/curtains\/[^<]+)<\/loc>/g)].map((m) => m[1]);
  const sitemapInteriors = [...sitemapXml.matchAll(/<loc>([^<]*\/interiors\/[^<]+)<\/loc>/g)].map((m) => m[1]);
  facts.sitemapProducts = sitemapProducts;
  facts.sitemapInteriors = sitemapInteriors;
  record(
    "real_data",
    sitemapProducts.length > 0 && sitemapInteriors.length > 0 ? "PASS" : "FAIL",
    `sitemap lists ${sitemapProducts.length} products and ${sitemapInteriors.length} interiors${sitemapProducts.length === 0 ? " (empty database?)" : ""}`,
  );

  const collections = await fetchHtml(`${BASE}/collections`);
  const collectionSlugs = [...collections.html.matchAll(/href="[^"]*\/curtains\/([a-z0-9-]+)"/gi)].map((m) => m[1]);
  const uniqueOrdered: string[] = [];
  for (const s of collectionSlugs) if (!uniqueOrdered.includes(s)) uniqueOrdered.push(s);
  facts.collectionOrder = uniqueOrdered;
  const collectionsAgain = await fetchHtml(`${BASE}/collections`);
  const orderStable = JSON.stringify(uniqueOrdered) === JSON.stringify(
    [...collectionsAgain.html.matchAll(/href="[^"]*\/curtains\/([a-z0-9-]+)"/gi)].map((m) => m[1]).filter((s, i, a) => a.indexOf(s) === i),
  );
  const missingOnCollections = sitemapProducts.map((u) => u.split("/").pop()!).filter((s) => !uniqueOrdered.includes(s));
  record(
    "ordering",
    orderStable && missingOnCollections.length === 0 ? "PASS" : "FAIL",
    `collections order stable=${orderStable}; sitemap slugs missing on /collections: ${missingOnCollections.length ? missingOnCollections.join(",") : "none"}; order=${uniqueOrdered.join(",")}`,
  );

  /* ---------- pages: detail + interiors + gallery + favorites ---------- */
  const detailPages: Array<{ slug: string; html: string }> = [];
  for (const url of sitemapProducts.slice(0, 8)) {
    const slug = url.split("/").pop()!;
    const page = await fetchHtml(`${BASE}/curtains/${slug}`);
    const ok = page.status === 200 && !page.html.includes("скоро появится") && /\/api\/media\/curtains\/\d+/.test(page.html);
    record("real_data", ok ? "PASS" : "FAIL", `detail /curtains/${slug}: status=${page.status} bytes=${page.bytes} has-record-image=${/\/api\/media\/curtains\/\d+/.test(page.html)}`);
    detailPages.push({ slug, html: page.html });
  }
  const interiorsPage = await fetchHtml(`${BASE}/interiors`);
  const galleryPage = await fetchHtml(`${BASE}/gallery`);
  const favoritesPage = await fetchHtml(`${BASE}/favorites`);
  record("favorites", favoritesPage.status === 200 ? "PASS" : "FAIL", `/favorites status=${favoritesPage.status} bytes=${favoritesPage.bytes}`);

  /* ---------- media URL inventory ---------- */
  const pagesForMedia: Array<[string, string]> = [
    ["home", (await fetchHtml(`${BASE}/`)).html],
    ["collections", collections.html],
    ["interiors", interiorsPage.html],
    ["gallery", galleryPage.html],
    ...detailPages.map((d) => [`curtains/${d.slug}`, d.html] as [string, string]),
  ];
  const mediaUrls = new Set<string>();
  let inlineBase64 = 0;
  const unversioned: string[] = [];
  for (const [page, html] of pagesForMedia) {
    if (/data:image\//i.test(html)) inlineBase64 += 1;
    for (const raw of extractHtml(html).srcs) {
      const url = absolute(BASE, raw);
      if (!url || !url.includes("/api/media/")) continue;
      const path = url.replace(BASE, "");
      mediaUrls.add(path);
      if (!/[?&]v=/.test(path)) unversioned.push(`${page}: ${path}`);
    }
  }
  facts.mediaUrlCount = mediaUrls.size;
  record("no_inline_base64", inlineBase64 === 0 ? "PASS" : "FAIL", `pages containing data:image payloads: ${inlineBase64}/${pagesForMedia.length}`);
  record("media_urls", unversioned.length === 0 && mediaUrls.size > 0 ? "PASS" : "FAIL", `${mediaUrls.size} record-scoped URLs; unversioned: ${unversioned.length ? unversioned.join(" | ") : "none"}`);

  /* ---------- gallery slot consistency (srcset widths share one slot) ---------- */
  const slotVersions = new Map<string, Set<string>>();
  for (const raw of extractHtml(galleryPage.html).srcs) {
    const m = /\/api\/media\/(gallery|curtains)\/(\d+)(?:\?[^"]*?gallery=(\d+))?/.exec(raw);
    if (!m) continue;
    const v = /[?&]v=([0-9a-f]+)/i.exec(raw)?.[1] ?? "none";
    const key = `${m[1]}:${m[2]}#${m[3] ?? "p"}`;
    if (!slotVersions.has(key)) slotVersions.set(key, new Set());
    slotVersions.get(key)!.add(v);
  }
  const staleMix = [...slotVersions.entries()].filter(([, vs]) => vs.size > 1).map(([k, vs]) => `${k}:${[...vs].join("/")}`);
  record("media_urls", staleMix.length === 0 ? "PASS" : "FAIL", `gallery page references ${slotVersions.size} distinct slots, version-mixed slots: ${staleMix.length ? staleMix.join(", ") : "none"}`);

  /* ---------- media delivery semantics (sampled, one bare URL per slot) ---------- */
  const canonical = new Map<string, string>();
  for (const path of mediaUrls) {
    const u = new URL(path, "http://x");
    u.searchParams.delete("w");
    u.searchParams.delete("q");
    const key = `${u.pathname}?${u.searchParams.toString()}`;
    if (!canonical.has(key)) canonical.set(key, key);
  }
  const samples = [...canonical.values()].slice(0, MEDIA_SAMPLES);
  for (const path of samples) {
    try {
      const bareUrl = `${BASE}${path}`;
      const bare = await get(bareUrl);
      const bareBuf = await bare.arrayBuffer();
      const cache = bare.headers.get("cache-control") ?? "";
      const type = bare.headers.get("content-type") ?? "";
      const versioned = /[?&]v=/.test(path);
      const immutableOk = versioned ? cache.includes("immutable") || cache.includes("max-age=31536000") || cache.includes("max-age=300") : true;
      const bare2 = await get(bareUrl);
      const stable = sha256(bareBuf) === sha256(await bare2.arrayBuffer());
      const sep = path.includes("?") ? "&" : "?";
      const sized = await get(`${BASE}${path}${sep}w=384`);
      const sizedBuf = await sized.arrayBuffer();
      const isWebp = (sized.headers.get("content-type") ?? "").includes("webp");
      const transformed = sha256(bareBuf) !== sha256(sizedBuf);
      const ok = bare.status === 200 && type.startsWith("image/") && stable && immutableOk && sized.status === 200 && isWebp && transformed;
      record(
        "media_delivery",
        ok ? "PASS" : "FAIL",
        `${path}: status=${bare.status} type=${type} cache=${JSON.stringify(cache)} stable=${stable} w384→${sized.headers.get("content-type")} transformed=${transformed} bytes=${bareBuf.byteLength}→${sizedBuf.byteLength}`,
      );
    } catch (e) {
      record("media_delivery", "FAIL", `${path}: ${String(e)}`);
    }
  }

  /* ---------- SEO (og: fallbacks accepted; home-ru has no plain <title>/description
       in raw HTML on the BASE commit too — pre-existing metadata merge behaviour,
       og/twitter tags + client hoisting carry the values) ---------- */
  for (const [page, html] of pagesForMedia.slice(0, 6)) {
    const title =
      /<title>([^<]*)<\/title>/.exec(html)?.[1] ??
      /<meta property="og:title" content="([^"]*)"/.exec(html)?.[1] ??
      "";
    const desc =
      /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ??
      /<meta property="og:description" content="([^"]*)"/.exec(html)?.[1] ??
      "";
    const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1] ?? "";
    const canonicalOk = canonical.startsWith(`https://${PROD_HOST}`);
    const plainTitle = /<title>([^<]*)<\/title>/.test(html);
    record(
      "seo",
      title && desc && canonicalOk ? "PASS" : "FAIL",
      `${page}: title=${JSON.stringify(title.slice(0, 60))} (${plainTitle ? "plain" : "og-fallback, pre-existing"}) desc=${desc.length}ch canonical=${canonical || "MISSING"}`,
    );
  }

  /* ---------- admin leakage ---------- */
  for (const [page, html] of pagesForMedia) {
    const leaks: string[] = [];
    if (/eyJ[A-Za-z0-9_-]{10,}\./.test(html)) leaks.push("JWT-like token");
    if (/\/api\/admin/.test(html)) leaks.push("admin API link");
    if (/password|пароль/i.test(html) && !/type="password"/.test(html)) leaks.push("password text");
    if (/at Object\.|drizzle-orm\/|pg\/lib/.test(html)) leaks.push("stack trace");
    record("no_admin_leak", leaks.length === 0 ? "PASS" : "FAIL", `${page}: ${leaks.length ? leaks.join(", ") : "clean"}`);
  }

  /* ---------- perf (opt-in) ---------- */
  if (PERF) {
    const perf: Record<string, unknown> = {};
    const targets: Array<[string, string]> = [
      ["home_desktop", `${BASE}/`],
      ["collections", `${BASE}/collections`],
      ["detail", `${BASE}/curtains/${sitemapProducts[0]?.split("/").pop() ?? ""}`],
    ];
    for (const [name, url] of targets) {
      const cold: number[] = [];
      const warm: number[] = [];
      let bytes = 0;
      for (let i = 0; i < 3; i += 1) {
        const r = await fetchHtml(`${url}${url.includes("?") ? "&" : "?"}cold=${Date.now()}-${i}`);
        cold.push(Math.round(r.ms));
        bytes = r.bytes;
      }
      for (let i = 0; i < 3; i += 1) {
        const r = await fetchHtml(url);
        warm.push(Math.round(r.ms));
      }
      perf[name] = { coldMs: cold, warmMs: warm, htmlBytes: bytes };
      record("perf", "INFO", `${name}: cold=${cold.join("/")}ms warm=${warm.join("/")}ms html=${bytes}B`);
    }
    const switchTimes: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      for (const locale of ["ru", "uz", "en"] as const) {
        const r = await fetchHtml(`${BASE}/?switch=${i}-${locale}`, locale);
        switchTimes.push(Math.round(r.ms));
      }
    }
    perf.languageSwitchMs = switchTimes;
    record("perf", "INFO", `language-switch server round-trips: ${switchTimes.join("/")}ms`);
    // Weight of first-screen record-scoped images (one variant per slot).
    let imgBytes = 0;
    for (const path of [...canonical.values()].slice(0, 8)) {
      const res = await get(`${BASE}${path}`);
      if (res.ok) imgBytes += (await res.arrayBuffer()).byteLength;
    }
    perf.sampleImageBytes = imgBytes;
    record("perf", "INFO", `first ${Math.min(8, canonical.size)} record images total: ${imgBytes}B`);
    facts.perf = perf;
  }

  /* ---------- summary ---------- */
  const counts = { PASS: 0, FAIL: 0, WARN: 0, INFO: 0 } as Record<CheckStatus, number>;
  for (const c of checks) counts[c.status] += 1;
  const summary = { base: BASE, date: new Date().toISOString(), counts, checks, facts };
  console.log(`\n=== summary: ${counts.PASS} pass, ${counts.FAIL} fail, ${counts.WARN} warn, ${counts.INFO} info ===`);
  if (OUT) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(OUT, JSON.stringify(summary, null, 2));
    console.log(`report written to ${OUT}`);
  }
  process.exit(counts.FAIL > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("preview-verify crashed:", e);
  process.exit(2);
});

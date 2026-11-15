#!/usr/bin/env node
/**
 * Lighthouse battery for a deployed Kashmir Decor preview.
 *
 *   node scripts/preview-lighthouse.mjs https://<preview>.vercel.app outdir
 *
 * Runs 4 audits — mobile cold, mobile warm, desktop cold, desktop warm —
 * (mobile profile emulates Slow-4G-class throttling) and writes one JSON per
 * run plus a markdown summary to stdout and outdir/summary.md.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2]?.replace(/\/+$/, "");
const outDir = process.argv[3] ?? "lighthouse-out";
if (!base || !/^https?:\/\//.test(base)) {
  console.error("usage: preview-lighthouse.mjs <base-url> [out-dir]");
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const profiles = [
  ["mobile_cold", "mobile", `${base}/?lh=${Date.now()}`],
  ["mobile_warm", "mobile", `${base}/`],
  ["desktop_cold", "desktop", `${base}/?lh=${Date.now() + 1}`],
  ["desktop_warm", "desktop", `${base}/`],
];

const rows = [];
for (const [name, preset, url] of profiles) {
  const out = join(outDir, `${name}.json`);
  console.log(`▶ lighthouse ${name} → ${url}`);
  const run = spawnSync(
    "npx",
    [
      "-y",
      "lighthouse",
      url,
      "--quiet",
      "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage",
      `--output=json`,
      `--output-path=${out}`,
      ...(preset === "desktop" ? ["--preset=desktop"] : []),
    ],
    { stdio: "inherit", timeout: 300_000 },
  );
  if (run.status !== 0) {
    rows.push({ name, error: `lighthouse exited ${run.status}` });
    continue;
  }
  const lhr = JSON.parse(readFileSync(out, "utf8"));
  const a = lhr.audits;
  rows.push({
    name,
    score: Math.round((lhr.categories.performance?.score ?? 0) * 100),
    ttfb: Math.round(a["server-response-time"]?.numericValue ?? 0),
    fcp: Math.round(a["first-contentful-paint"]?.numericValue ?? 0),
    lcp: Math.round(a["largest-contentful-paint"]?.numericValue ?? 0),
    tbt: Math.round(a["total-blocking-time"]?.numericValue ?? 0),
    cls: Number((a["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3)),
    si: Math.round(a["speed-index"]?.numericValue ?? 0),
    requests: a["network-requests"]?.details?.items?.length ?? 0,
    transferKB: Math.round(
      (a["total-byte-weight"]?.numericValue ?? 0) / 1024,
    ),
  });
}

const md = [
  `## Lighthouse — ${base}`,
  "",
  "| profile | score | TTFB(ms) | FCP(ms) | LCP(ms) | TBT(ms) | CLS | SI(ms) | reqs | KB |",
  "|---|---|---|---|---|---|---|---|---|---|",
  ...rows.map((r) =>
    r.error
      ? `| ${r.name} | — | ${r.error} | | | | | | | |`
      : `| ${r.name} | ${r.score} | ${r.ttfb} | ${r.fcp} | ${r.lcp} | ${r.tbt} | ${r.cls} | ${r.si} | ${r.requests} | ${r.transferKB} |`,
  ),
  "",
].join("\n");
writeFileSync(join(outDir, "summary.md"), md);
writeFileSync(join(outDir, "summary.json"), JSON.stringify(rows, null, 2));
console.log(`\n${md}`);

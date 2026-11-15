import { Pool } from "pg";
import { toPublicInteriorImageUrl } from "../src/lib/media";

type InteriorRow = {
  id: number;
  imageUrl: string | null;
  gallery: unknown;
  updatedAt: Date | string | null;
};

type CheckResult = {
  id: number;
  slot: "primary" | `gallery[${number}]`;
  storedKind: "data-url" | "direct-url" | "missing" | "invalid";
  storedBytes: number | null;
  updatedAt: string | null;
  publicPath: string | null;
  status: number | null;
  contentType: string | null;
  responseBytes: number | null;
  byteMatch: boolean | null;
  error: string | null;
};

const DATA_URL = /^data:([^;,]+)(?:;[^,]*)?,([\s\S]*)$/i;

function decodeStored(value: string): { mimeType: string; bytes: Buffer } | null {
  const match = DATA_URL.exec(value);
  if (!match) return null;
  try {
    const header = value.slice(5, value.indexOf(",")).toLowerCase();
    const bytes = header.split(";").includes("base64")
      ? Buffer.from(match[2], "base64")
      : Buffer.from(decodeURIComponent(match[2]));
    return bytes.length > 0 ? { mimeType: match[1].toLowerCase(), bytes } : null;
  } catch {
    return null;
  }
}

function safePath(origin: URL, generated: string): string | null {
  try {
    const parsed = new URL(generated, origin);
    if (parsed.origin !== origin.origin) return null;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

function storedKind(value: unknown): CheckResult["storedKind"] {
  if (typeof value !== "string" || value.length === 0) return "missing";
  if (/^data:/i.test(value)) return decodeStored(value) ? "data-url" : "invalid";
  return "direct-url";
}

async function checkOne(
  origin: URL,
  id: number,
  slot: CheckResult["slot"],
  stored: unknown,
  updatedAt: Date | string | null,
  galleryIndex?: number,
): Promise<CheckResult> {
  const value = typeof stored === "string" && stored.length > 0 ? stored : null;
  const kind = storedKind(stored);
  const decoded = value && kind === "data-url" ? decodeStored(value) : null;
  const version = updatedAt instanceof Date ? updatedAt : updatedAt ? new Date(updatedAt) : null;
  const generated = value && Number.isFinite(version?.getTime())
    ? toPublicInteriorImageUrl(id, value, galleryIndex, version)
    : value
      ? toPublicInteriorImageUrl(id, value, galleryIndex)
      : null;
  const result: CheckResult = {
    id,
    slot,
    storedKind: kind,
    storedBytes: decoded?.bytes.byteLength ?? null,
    updatedAt: version && Number.isFinite(version.getTime()) ? version.toISOString() : null,
    publicPath: generated ? safePath(origin, generated) : null,
    status: null,
    contentType: null,
    responseBytes: null,
    byteMatch: null,
    error: null,
  };

  if (!value) {
    result.error = "missing-stored-reference";
    return result;
  }
  if (kind === "invalid") {
    result.error = "invalid-data-url";
    return result;
  }
  if (!generated) {
    result.error = "missing-public-reference";
    return result;
  }

  let requestUrl: URL;
  try {
    requestUrl = new URL(generated, origin);
    if (requestUrl.username || requestUrl.password) {
      result.error = "credential-bearing-reference-not-requested";
      return result;
    }
  } catch {
    result.error = "invalid-public-reference";
    return result;
  }

  try {
    const response = await fetch(requestUrl, { cache: "no-store" });
    const bytes = Buffer.from(await response.arrayBuffer());
    result.status = response.status;
    result.contentType = response.headers.get("content-type");
    result.responseBytes = bytes.byteLength;
    result.byteMatch = response.ok && decoded ? bytes.equals(decoded.bytes) : null;
    if (!response.ok) result.error = "public-response-not-ok";
    else if (decoded && !result.byteMatch) result.error = "stored-and-served-bytes-differ";
  } catch (error) {
    // Do not print the URL, DB error, response body, or any image data.
    result.error = error instanceof Error ? error.name : "public-request-failed";
  }
  return result;
}

function printResult(result: CheckResult) {
  console.log(
    JSON.stringify({
      id: result.id,
      slot: result.slot,
      storedKind: result.storedKind,
      storedBytes: result.storedBytes,
      updatedAt: result.updatedAt,
      publicPath: result.publicPath,
      status: result.status,
      contentType: result.contentType,
      responseBytes: result.responseBytes,
      byteMatch: result.byteMatch,
      error: result.error,
    }),
  );
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const originValue = process.env.IMAGE_VERIFY_ORIGIN;
  if (!connectionString || !originValue) {
    throw new Error("DATABASE_URL and IMAGE_VERIFY_ORIGIN are required.");
  }

  const origin = new URL(originValue);
  if (origin.protocol !== "https:" && process.env.ALLOW_NON_PRODUCTION_VERIFY !== "1") {
    throw new Error("IMAGE_VERIFY_ORIGIN must use HTTPS unless ALLOW_NON_PRODUCTION_VERIFY=1.");
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
    query_timeout: 8_000,
    statement_timeout: 8_000,
  });
  const client = await pool.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    const { rows } = await client.query<InteriorRow>(
      `SELECT id, image_url AS "imageUrl", gallery, updated_at AS "updatedAt"
       FROM public.interiors
       WHERE is_active = true
       ORDER BY sort_order ASC, id ASC`,
    );
    if (rows.length === 0) throw new Error("No active interior rows were found.");

    const results: CheckResult[] = [];
    for (const row of rows) {
      results.push(await checkOne(origin, row.id, "primary", row.imageUrl, row.updatedAt));
      const gallery = Array.isArray(row.gallery) ? row.gallery : [];
      for (const [index, value] of gallery.entries()) {
        results.push(await checkOne(origin, row.id, `gallery[${index}]`, value, row.updatedAt, index));
      }
    }

    console.log(JSON.stringify({ activeInteriorCount: rows.length, checkedImageReferenceCount: results.length }));
    for (const result of results) printResult(result);
    const failures = results.filter((result) => result.error || result.status === null || result.byteMatch === false);
    console.log(JSON.stringify({ result: failures.length === 0 ? "PASS" : "FAIL", failureCount: failures.length }));
    if (failures.length > 0) process.exitCode = 1;
  } finally {
    await client.query("ROLLBACK").catch(() => undefined);
    client.release();
    await pool.end();
  }
}

main().catch(() => {
  console.error("Interior image identity verification could not complete; no query details were logged.");
  process.exitCode = 1;
});

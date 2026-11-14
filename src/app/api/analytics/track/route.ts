import { NextRequest, NextResponse } from "next/server";
import {
  AnalyticsValidationError,
  checkRateLimit,
  recordPublicEvents,
  validateTrackPayload,
} from "@/lib/analytics";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reject bodies larger than 64 KB before parsing. */
const MAX_BODY_BYTES = 64 * 1024;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Public visitor event ingestion.
 *
 * - Accepts a batch of validated events ({ events: [...] }, max 20).
 * - Rate-limited per IP; oversized or malformed bodies are rejected.
 * - Requests carrying a valid admin session are silently dropped (204):
 *   an administrator's browser must never appear as an ordinary visitor,
 *   even if the client tracker misfires on a public page.
 * - Never blocks page rendering: the client fires this fire-and-forget,
 *   and database failures are swallowed (204) after server-side logging.
 * - Returns no visitor data and exposes no analytics reports.
 */
export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Request body too large." },
      { status: 413 },
    );
  }

  if (!checkRateLimit(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many requests." },
      { status: 429 },
    );
  }

  // Admin separation (defense in depth): the client tracker already skips
  // admin routes, but the server is authoritative. A valid admin session
  // means this browser belongs to an administrator — drop the event.
  const adminToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (adminToken && (await verifyToken(adminToken)) !== null) {
    return new NextResponse(null, { status: 204 });
  }

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Request body too large." },
        { status: 413 },
      );
    }
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  let events;
  try {
    events = validateTrackPayload(raw);
  } catch (error) {
    if (error instanceof AnalyticsValidationError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 },
      );
    }
    throw error;
  }

  try {
    await recordPublicEvents(events, req.headers.get("user-agent"));
  } catch (error) {
    // Analytics must never break the public site. If the tables do not
    // exist yet (pre-migration) or the database is unreachable, log and
    // still answer 204 so the client never sees an error.
    console.error("Visitor analytics recording failed:", error);
  }

  return new NextResponse(null, { status: 204 });
}

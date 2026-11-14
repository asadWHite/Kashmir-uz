import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { recordAdminEvent, sanitizePath } from "@/lib/analytics";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin page-view ingestion (authenticated admins only; the /api/admin/*
 * middleware already rejects unauthenticated requests, and getSession is
 * checked again here).
 *
 * Records admin_page_view events with actor_type='admin' so dashboard
 * navigation is auditable without ever touching public visitor tables.
 * Failures are swallowed (204): admin analytics must never interrupt
 * admin work.
 */
export async function POST(req: NextRequest) {
  const current = await getSession();
  if (!current) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let body: { path?: unknown; dedupeKey?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const path = sanitizePath(body.path) ?? "/admin";
  const dedupeKey =
    typeof body.dedupeKey === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      body.dedupeKey,
    )
      ? body.dedupeKey
      : randomUUID();

  try {
    await recordAdminEvent({
      eventType: "admin_page_view",
      adminSessionId: current.sessionId ?? null,
      adminUserId: Number(current.sub),
      path,
      dedupeKey,
    });
  } catch (error) {
    console.error("Admin analytics recording failed:", error);
  }

  return new NextResponse(null, { status: 204 });
}

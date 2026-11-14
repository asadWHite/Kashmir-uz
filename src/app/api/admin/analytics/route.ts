import { NextRequest, NextResponse } from "next/server";
import {
  AnalyticsValidationError,
  getActiveVisitors,
  getAnalyticsReport,
} from "@/lib/analytics";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Analytics reporting for the admin dashboard.
 *
 * Protected twice: the /api/admin/* middleware rejects unauthenticated
 * requests, and getSession is verified again here. Unauthenticated users
 * can never retrieve reports. Public metrics and admin metrics are
 * returned in separate sections and are never combined.
 *
 * Query params:
 *   range=today|yesterday|7d|30d|90d|custom (default 7d)
 *   from=<ISO date>&to=<ISO date> (required for custom, max 365 days)
 *   active=1 -> lightweight active-visitor count only
 */
export async function GET(req: NextRequest) {
  const current = await getSession();
  if (!current) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;

  try {
    if (params.get("active") === "1") {
      const activeNow = await getActiveVisitors();
      return NextResponse.json({ ok: true, activeNow });
    }
    const report = await getAnalyticsReport(
      params.get("range"),
      params.get("from"),
      params.get("to"),
    );
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    if (error instanceof AnalyticsValidationError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 },
      );
    }
    console.error("Analytics report failed:", error);
    return NextResponse.json(
      { ok: false, error: "Не удалось загрузить аналитику." },
      { status: 500 },
    );
  }
}

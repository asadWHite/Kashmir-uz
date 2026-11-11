import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { adminSessions } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Updates lastSeenAt while an authenticated admin tab is visible.
 * This lets the history page estimate activity; it does not claim to measure
 * continuous human activity or detect a browser being closed instantly.
 */
export async function POST() {
  const current = await getSession();
  if (!current) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  if (!current.sessionId) {
    return NextResponse.json(
      { ok: false, error: "Please sign in again to enable session tracking." },
      { status: 409 },
    );
  }

  try {
    const updated = await db
      .update(adminSessions)
      .set({ lastSeenAt: new Date() })
      .where(
        and(
          eq(adminSessions.id, current.sessionId),
          eq(adminSessions.adminUserId, Number(current.sub)),
          isNull(adminSessions.logoutAt),
        ),
      )
      .returning({ id: adminSessions.id });

    if (updated.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Session record was not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not update admin session activity:", error);
    return NextResponse.json(
      { ok: false, error: "Session activity could not be saved." },
      { status: 500 },
    );
  }
}

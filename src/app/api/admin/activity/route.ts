import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Recent administrator sign-in sessions. Only authenticated admins can read this. */
export async function GET() {
  const current = await getSession();
  if (!current) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const sessions = await db
      .select({
        id: adminSessions.id,
        adminEmail: adminSessions.adminEmail,
        ipAddress: adminSessions.ipAddress,
        userAgent: adminSessions.userAgent,
        loginAt: adminSessions.loginAt,
        lastSeenAt: adminSessions.lastSeenAt,
        logoutAt: adminSessions.logoutAt,
        expiresAt: adminSessions.expiresAt,
        logoutReason: adminSessions.logoutReason,
      })
      .from(adminSessions)
      .orderBy(desc(adminSessions.loginAt))
      .limit(100);

    return NextResponse.json({ ok: true, sessions });
  } catch (error) {
    console.error("Could not load admin session history:", error);
    return NextResponse.json(
      { ok: false, error: "Kirishlar tarixini yuklab bo'lmadi." },
      { status: 500 },
    );
  }
}

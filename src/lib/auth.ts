import { cookies } from "next/headers";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers, adminSessions } from "@/db/schema";
import {
  SESSION_COOKIE, SESSION_MAX_AGE, signToken, verifyToken,
  type SessionPayload,
} from "@/lib/session";

export { SESSION_COOKIE };
export type { SessionPayload };

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(test, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export async function createSession(
  payload: SessionPayload,
  metadata: { ipAddress: string | null; userAgent: string | null },
): Promise<void> {
  const sessionId = crypto.randomUUID();
  const now = new Date();
  await db.insert(adminSessions).values({
    id: sessionId,
    adminUserId: Number(payload.sub),
    adminEmail: payload.email,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    loginAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + SESSION_MAX_AGE * 1000),
  });
  const token = await signToken({ ...payload, sessionId });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const current = await getSession();
  const store = await cookies();

  try {
    if (current?.sessionId) {
      await db.update(adminSessions)
        .set({ logoutAt: new Date(), logoutReason: "manual" })
        .where(eq(adminSessions.id, current.sessionId));
    }
  } finally {
    // Sign-out must still clear the browser cookie if the database is unavailable.
    store.delete(SESSION_COOKIE);
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function loginWithCredentials(
  email: string,
  password: string,
  metadata: { ipAddress: string | null; userAgent: string | null },
): Promise<boolean> {
  const trimmed = email.trim().toLowerCase();
  const [user] = await db.select().from(adminUsers)
    .where(eq(adminUsers.email, trimmed)).limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) return false;
  await createSession({ sub: String(user.id), email: user.email, role: "admin" }, metadata);
  return true;
}

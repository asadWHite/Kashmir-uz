import { cookies } from "next/headers";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signToken,
  verifyToken,
  type SessionPayload,
} from "@/lib/session";

export { SESSION_COOKIE };
export type { SessionPayload };

/**
 * Secure server-side authentication (Node runtime only).
 * Admin credentials live ONLY on the server: an `admin_users` row whose
 * password is hashed with scrypt. The cleartext password is read from the
 * ADMIN_PASSWORD env var at seed time and never ships to the browser.
 * Sessions are httpOnly, signed JWTs.
 */

/* --------------------------- Password hashing -------------------------- */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(test, "hex"),
  );
}

/* ------------------------------ Sessions ------------------------------- */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signToken(payload);
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
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Server components / route handlers: returns the session or null. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}

/** Throws toward a redirect caller when unauthenticated. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  const trimmed = email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, trimmed))
    .limit(1);
  if (!user) return false;
  const ok = verifyPassword(password, user.passwordHash);
  if (!ok) return false;
  await createSession({ sub: String(user.id), email: user.email, role: "admin" });
  return true;
}

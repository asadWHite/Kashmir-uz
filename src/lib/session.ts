import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "kashemir_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export interface SessionPayload {
  sub: string;
  email: string;
  role: "admin";
  sessionId?: string;
}

export function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.NEXT_PUBLIC_SITE_URL || "kashemir-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (payload.sub && payload.email && payload.role === "admin") {
      return {
        sub: String(payload.sub),
        email: String(payload.email),
        role: "admin",
        sessionId: payload.sessionId ? String(payload.sessionId) : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

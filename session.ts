import { SignJWT, jwtVerify } from "jose";

/**
 * Edge-safe session primitives (no Node.js APIs). Shared by the edge
 * middleware and the Node-side auth module. Password hashing lives in
 * `auth.ts` (Node runtime) and is never imported by the middleware.
 */

export const SESSION_COOKIE = "kashemir_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  sub: string;
  email: string;
  role: "admin";
}

export function getSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "kashmir-internal-fallback-secret-9f8e7d6c5b4a3210";
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (payload.sub && payload.email && payload.role === "admin") {
      return {
        sub: String(payload.sub),
        email: String(payload.email),
        role: "admin",
      };
    }
    return null;
  } catch {
    return null;
  }
}

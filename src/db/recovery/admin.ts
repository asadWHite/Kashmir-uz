import { RecoveryError } from "./errors";
import type { PoolClient } from "pg";
import { hashPassword } from "../../lib/password";
export async function initializeAdmin(c: PoolClient, email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new RecoveryError("Invalid ADMIN_EMAIL");
  if (password.length < 16 || password.length > 256 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) throw new RecoveryError("Strong ADMIN_PASSWORD required");
  // ON CONFLICT also protects two operators initializing simultaneously.
  const result = await c.query("INSERT INTO public.admin_users(email,password_hash) VALUES($1,$2) ON CONFLICT(email) DO NOTHING RETURNING id", [normalized,hashPassword(password)]);
  return result.rowCount === 1 ? "created" : "skipped";
}

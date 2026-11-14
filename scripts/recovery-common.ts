import { RecoveryError } from "../src/db/recovery/errors";
import "dotenv/config";
import { Pool } from "pg";
export function recoveryPool() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new RecoveryError("DATABASE_URL required");
  let url: URL;
  try { url = new URL(raw); } catch { throw new RecoveryError("Invalid DATABASE_URL"); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2) throw new RecoveryError("Invalid PostgreSQL target");
  if (url.hostname.includes("-pooler.")) throw new RecoveryError("Use a direct Neon connection for recovery operations");
  return new Pool({ connectionString: raw, max: 1, connectionTimeoutMillis: 5000, statement_timeout: 30000, query_timeout: 35000 });
}
export function failure(error: unknown) {
  if (error instanceof RecoveryError) console.error(`FAIL ${error.message}`);
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "configuration-or-validation";
  console.error(`FAIL recovery (${/^[A-Z0-9_-]+$/i.test(code) ? code : "unknown"}). Check target, permissions and runbook privately; no secrets are logged.`);
  process.exitCode = 1;
}

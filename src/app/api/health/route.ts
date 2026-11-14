import { pool } from "@/db";
import { verifyCatalog, verifyHistory } from "@/db/recovery/verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const checks = { application: "PASS", database: "NOT VERIFIED", schema: "NOT VERIFIED", migrations: "NOT VERIFIED" };
  let c;
  try {
    if (!process.env.DATABASE_URL) throw new Error("Database not configured");
    c = await pool.connect();
    await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await c.query("SELECT 1");
    checks.database = "PASS";
    checks.schema = (await verifyCatalog(c)).valid ? "PASS" : "FAIL";
    checks.migrations = await verifyHistory(c) ? "PASS" : "FAIL";
    const ok = checks.schema === "PASS" && checks.migrations === "PASS";
    return Response.json({ ok, checks }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch {
    if (checks.database === "NOT VERIFIED") checks.database = "FAIL";
    return Response.json({ ok: false, checks }, { status: 503, headers: { "Cache-Control": "no-store" } });
  } finally {
    if (c) {
      try { await c.query("ROLLBACK"); c.release(); } catch { c.release(true); }
    }
  }
}

/**
 * Applies the SQL migrations and re-verifies the resulting schema.
 *
 * Usage:  npx tsx scripts/db-gate.ts            (apply + verify)
 *         npx tsx scripts/db-gate.ts --verify   (verify only)
 *
 * Uses the same DATABASE_URL as the application, so running it against
 * production applies exactly what production needs — nothing else.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { db, pool } from "@/db";

const MIGRATIONS = [
  "migrations/0001_admin_sessions.sql",
  "migrations/0002_content_translations.sql",
  "migrations/0003_content_translations_seed.sql",
];

const EXPECTED: Record<string, string[]> = {
  content_translations: ["entity", "entity_id", "locale", "title", "description", "extra", "review_status"],
  content_revisions: ["entity", "entity_id", "action"],
  admin_sessions: ["admin_user_id", "login_at"],
};

async function apply() {
  for (const file of MIGRATIONS) {
    const sqlText = readFileSync(join(process.cwd(), file), "utf8");
    process.stdout.write(`→ applying ${file} … `);
    await db.execute(sql.raw(sqlText));
    console.log("ok");
  }
}

async function verify() {
  let failed = 0;
  for (const [table, columns] of Object.entries(EXPECTED)) {
    const result = await db.execute(
      sql`select column_name from information_schema.columns
          where table_schema = 'public' and table_name = ${table}`,
    );
    const found = new Set(result.rows.map((r) => String((r as { column_name: string }).column_name)));
    const missing = columns.filter((c) => !found.has(c));
    if (missing.length) {
      failed += 1;
      console.log(`✗ ${table}: missing ${missing.join(", ")}`);
    } else {
      console.log(`✓ ${table} (${found.size} columns)`);
    }
  }
  const counts = await db.execute(
    sql`select entity, locale, count(*)::int as n from public.content_translations group by 1,2 order by 1,2`,
  );
  console.log("content_translations rows:", JSON.stringify(counts.rows));
  return failed === 0;
}

async function main() {
  if (!process.argv.includes("--verify")) await apply();
  const ok = await verify();
  await pool.end();
  if (!ok) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error("DB gate failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
  await pool.end().catch(() => {});
});

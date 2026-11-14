import { RecoveryError } from "../src/db/recovery/errors";
import { applyMigration } from "../src/db/recovery/apply";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { migrations, MIGRATION_LOCK } from "../src/db/recovery/manifest";
import { verifyCatalog } from "../src/db/recovery/verify";
import { recoveryPool, failure } from "./recovery-common";

export async function migrate() {
  // Validate all artifacts before connecting or writing anything.
  const files = migrations.map(m => {
    const sql = readFileSync(new URL(`../migrations/${m.id}.sql`, import.meta.url), "utf8");
    if (createHash("sha256").update(sql).digest("hex") !== m.checksum) throw new RecoveryError("Migration checksum changed");
    return { ...m, sql };
  });
  if (new Set(files.map(m => m.id)).size !== files.length || files.some((m,i) => i > 0 && m.id <= files[i-1].id)) throw new RecoveryError("Invalid ordering");
  const pool = recoveryPool();
  const c = await pool.connect();
  let locked = false;
  try {
    locked = (await c.query("SELECT pg_try_advisory_lock($1) AS ok", [MIGRATION_LOCK])).rows[0].ok;
    if (!locked) throw new RecoveryError("Another migration owns lock");
    const identity = (await c.query("SELECT current_database() AS database, current_schema() AS schema")).rows[0];
    if (identity.schema !== "public") throw new RecoveryError("Expected public schema");
    console.log("Target database/schema:", identity.database, identity.schema, "(confirm Neon project/branch out of band)");
    const tracked = (await c.query("SELECT to_regclass('public.kashmir_migrations') IS NOT NULL AS ok")).rows[0].ok;
    if (!tracked) {
      const tables = (await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public'")).rows;
      if (tables.length) throw new RecoveryError("Untracked nonempty database; explicit adoption review required");
    }
    await c.query("BEGIN");
    await c.query("CREATE TABLE IF NOT EXISTS public.kashmir_migrations (id text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
    await c.query("COMMIT");
    const applied = (await c.query("SELECT id, checksum FROM public.kashmir_migrations ORDER BY id")).rows;
    if (applied.length > files.length || applied.some((r,i) => r.id !== files[i]?.id || r.checksum !== files[i]?.checksum)) throw new RecoveryError("Migration history mismatch");
    for (const m of files.slice(applied.length)) {
      console.log(`Applying ${m.id}`);
      try {
        await applyMigration(c, m, async () => {
          if (m.id === files[files.length - 1].id && !(await verifyCatalog(c)).valid) throw new RecoveryError("Catalog mismatch");
        });
        console.log(`PASS ${m.id}`);
      } catch (e) {
        console.error(`FAIL ${m.id}: transaction rolled back; not recorded. Resolve cause and rerun; never reset. See PRODUCTION_RECOVERY.md.`);
        throw e;
      }
    }
    if (!(await verifyCatalog(c)).valid) throw new RecoveryError("Schema drift detected; run db:verify and review before deployment");
    console.log("PASS migration history current (no content/admin seeded)");
  } finally {
    if (locked) await c.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK]);
    c.release(); await pool.end();
  }
}
migrate().catch(failure);

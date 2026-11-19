import { RecoveryError } from "../src/db/recovery/errors";
/** Developer-only reference generation on a NEW loopback disposable database. */
import "dotenv/config";
import { Pool } from "pg";
import { writeFileSync } from "node:fs";
import { reviewedModelMigrations } from "./db-model-migrations";
import { readCatalog } from "../src/db/recovery/catalog";
import { modelContract } from "../src/db/recovery/model";
import { failure } from "./recovery-common";
async function main() {
  if (!process.env.TEST_DATABASE_URL) throw new RecoveryError("TEST_DATABASE_URL required");
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!["127.0.0.1","localhost"].includes(url.hostname) || !url.pathname.endsWith("_test")) throw new RecoveryError("Only disposable loopback test targets allowed");
  const files = await reviewedModelMigrations();
  const pool = new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
  const c = await pool.connect();
  try {
    if ((await c.query("SELECT 1 FROM pg_tables WHERE schemaname='public'")).rowCount) throw new RecoveryError("New empty test DB required");
    await c.query("BEGIN");
    for (const { sql } of files) await c.query(sql);
    const catalog = await readCatalog(c);
    await c.query("ROLLBACK"); // no persistent schema/data even on disposable target
    writeFileSync("src/db/recovery/catalog-reference.json",JSON.stringify(catalog,null,2)+"\n");
    writeFileSync("src/db/recovery/model-reference.json",JSON.stringify(modelContract(),null,2)+"\n");
    console.log("PASS reference generated from reviewed Drizzle migrations; review diff before committing");
  } finally { c.release(); await pool.end(); }
}
main().catch(failure);

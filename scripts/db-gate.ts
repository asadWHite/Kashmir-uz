/** Read-only catalog audit. Never executes migrations. See docs/database/PRODUCTION.md. */
import "dotenv/config";
import { Pool, type PoolClient } from "pg";
import { getTableConfig } from "drizzle-orm/pg-core";
import * as schema from "../src/db/schema";

async function main() {
  if (process.argv.slice(2).some((arg) => arg !== "--verify")) {
    throw new Error("This tool is read-only; migration execution is disabled. See docs/database/PRODUCTION.md.");
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required; refusing the implicit local PostgreSQL target.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 5000, query_timeout: 30000 });
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query("BEGIN READ ONLY");
    const identity = await client.query("SELECT current_database() AS database, current_schema() AS schema, current_setting('search_path') AS search_path, current_user AS db_user");
    console.log("Database identity (confirm Neon project/branch separately):", JSON.stringify(identity.rows[0]));
    const columns = await client.query(`SELECT c.relname AS table_name, a.attname AS column_name,
      pg_catalog.format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS not_null,
      pg_get_expr(d.adbin, d.adrelid) AS default_value, a.attidentity AS identity
      FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
      LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
      WHERE n.nspname='public' AND c.relkind IN ('r','p') ORDER BY c.relname,a.attnum`);
    const constraints = await client.query(`SELECT c.relname AS table_name, con.conname, con.contype, con.convalidated,
      pg_get_constraintdef(con.oid) AS definition FROM pg_catalog.pg_constraint con
      JOIN pg_catalog.pg_class c ON c.oid=con.conrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' ORDER BY c.relname,con.conname`);
    const indexes = await client.query(`SELECT t.relname AS table_name, i.relname AS index_name, x.indisvalid AS valid,
      x.indisready AS ready, pg_get_indexdef(i.oid) AS definition FROM pg_catalog.pg_index x
      JOIN pg_catalog.pg_class t ON t.oid=x.indrelid JOIN pg_catalog.pg_class i ON i.oid=x.indexrelid
      JOIN pg_catalog.pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' ORDER BY t.relname,i.relname`);
    let differences = 0;
    for (const table of Object.values(schema)) {
      const config = getTableConfig(table);
      const actual = columns.rows.filter((row) => row.table_name === config.name);
      if (!actual.length) { console.log(`MISSING TABLE public.${config.name}`); differences++; continue; }
      for (const col of config.columns) {
        const found = actual.find((row) => row.column_name === col.name);
        if (!found) { console.log(`MISSING COLUMN public.${config.name}.${col.name} (expected ${col.getSQLType()})`); differences++; continue; }
        const expected = col.getSQLType().replace(/^serial$/, "integer").replace(/^varchar\(/, "character varying(");
        if (found.type !== expected) { console.log(`TYPE public.${config.name}.${col.name}: expected ${expected}, actual ${found.type}`); differences++; }
        if (found.not_null !== col.notNull) { console.log(`NULLABILITY public.${config.name}.${col.name}: expected ${col.notNull ? "NOT NULL" : "nullable"}, actual ${found.not_null ? "NOT NULL" : "nullable"}`); differences++; }
        const hasDefault = found.default_value !== null || Boolean(found.identity);
        if (hasDefault !== col.hasDefault) { console.log(`DEFAULT PRESENCE public.${config.name}.${col.name}: expected ${col.hasDefault}, actual ${hasDefault}`); differences++; }
      }
      for (const row of actual.filter((row) => !config.columns.some((c) => c.name === row.column_name))) console.log(`EXTRA COLUMN public.${config.name}.${row.column_name} (${row.type}) — preserve and investigate`);
    }
    const expectedNames = new Set(Object.values(schema).map((table) => getTableConfig(table).name));
    for (const name of new Set(columns.rows.map((row) => String(row.table_name)))) if (!expectedNames.has(name)) console.log(`EXTRA TABLE public.${name} — preserve and investigate`);
    console.log("\nActual defaults (review values and sequences manually):");
    for (const row of columns.rows.filter((r) => r.default_value !== null || r.identity)) console.log(`${row.table_name}.${row.column_name}: ${row.default_value ?? `identity ${row.identity}`}`);
    console.log("\nActual constraints (review PK, uniqueness, foreign keys, checks and validation against schema and SQL):");
    for (const row of constraints.rows) console.log(`${row.table_name}.${row.conname}: ${row.definition} [validated=${row.convalidated}]`);
    console.log("\nActual indexes (review columns, uniqueness, predicate, validity and migration-only indexes):");
    for (const row of indexes.rows) console.log(`${row.table_name}.${row.index_name}: ${row.definition} [valid=${row.valid}, ready=${row.ready}]`);
    const tracking = await client.query("SELECT to_regclass('drizzle.__drizzle_migrations')::text AS drizzle_tracking, to_regclass('public.__drizzle_migrations')::text AS public_tracking");
    console.log("\nDrizzle tracking tables:", JSON.stringify(tracking.rows[0]));
    console.log(`Column-level differences: ${differences}. Constraint, index and default definitions require manual comparison; this is not a complete verification.`);
    await client.query("ROLLBACK");
    if (differences) process.exitCode = 1;
  } finally {
    client?.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  // Database errors can contain connection details or query contents; never print them here.
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "unknown";
  if (error instanceof Error && (error.message.startsWith("DATABASE_URL is required") || error.message.startsWith("This tool is read-only"))) console.error(error.message);
  else console.error(`Read-only database audit failed (code ${code}). Check connectivity, permissions and target privately.`);
  process.exitCode = 1;
});

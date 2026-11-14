import type { PoolClient } from "pg";
export async function applyMigration(c: PoolClient, m: { id: string; checksum: string; sql: string }, validate: () => Promise<void>) {
  try {
    await c.query("BEGIN");
    await c.query("SET LOCAL search_path TO public, pg_catalog");
    await c.query("SET LOCAL lock_timeout = '5s'");
    await c.query(m.sql);
    await validate();
    await c.query("INSERT INTO public.kashmir_migrations(id,checksum) VALUES($1,$2)", [m.id,m.checksum]);
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  }
}

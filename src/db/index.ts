import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Database client.
 *
 * NOTE: `DATABASE_URL` is read lazily. During `next build` the env may be
 * absent (`.env` is gitignored and not present on the build server), so we
 * never throw at module load — a Pool is only ever connected when a query
 * actually runs (never during build for force-dynamic routes). At runtime,
 * set DATABASE_URL to a reachable Postgres instance.
 */
const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function createPool(): Pool {
  const url = process.env.DATABASE_URL;
  return url ? new Pool({ connectionString: url }) : new Pool();
}

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

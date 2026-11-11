import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Reused Postgres pool.
 *
 * Public pages depend on server-side queries. Without explicit timeouts, an
 * unreachable or sleeping database can leave a request waiting far too long.
 * Bound connection and query waits so the existing data-layer fallbacks can
 * render the site instead of leaving the document stuck indefinitely.
 */
const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  return new Pool({
    ...(connectionString ? { connectionString } : {}),
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    query_timeout: 8_000,
    statement_timeout: 8_000,
  });
}

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);

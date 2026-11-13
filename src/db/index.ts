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
  // Pool size is an operational setting. The default stays at 5; managed
  // Postgres plans with a low connection limit (or a single-connection proxy
  // such as PgBouncer in session mode) can lower it without a code change.
  const configuredMax = Number(process.env.DATABASE_POOL_MAX);
  const max = Number.isInteger(configuredMax) && configuredMax > 0 ? configuredMax : 5;

  return new Pool({
    ...(connectionString ? { connectionString } : {}),
    max,
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

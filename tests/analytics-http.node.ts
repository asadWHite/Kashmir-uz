import test from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Pool } from "pg";
import { hashPassword } from "../src/lib/password";
import { migrations } from "../src/db/recovery/manifest";

/**
 * Visitor analytics HTTP integration tests.
 *
 * Self-contained: starts an isolated PostgreSQL (PGlite socket), applies
 * the real migration chain via scripts/db-migrate.ts, seeds an admin
 * account, builds (if needed) and starts the production Next.js server,
 * then exercises the real API routes over HTTP and verifies the actual
 * database records. No production database is ever touched.
 *
 * Run with: npm run test:analytics:http
 */

const AUTH_SECRET = "test-only-random-secret-of-at-least-32-characters";
const ADMIN_EMAIL = "admin@example.test";
const ADMIN_PASSWORD = "Integration-only-password-947!";

let PG_PORT = 0;
let APP_PORT = 0;
let BASE = "";
let DATABASE_URL = "";

let pglite: PGlite;
let socketServer: PGLiteSocketServer;
let app: ChildProcess | undefined;
let pool: Pool;

/**
 * Reserve a free TCP port on loopback. Ports are held only momentarily, so a
 * previously crashed run cannot make the suite fail with EADDRINUSE.
 */
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (typeof address === "string" || address === null) {
        probe.close();
        reject(new Error("Could not determine a free port."));
        return;
      }
      const { port } = address;
      probe.close(() => resolve(port));
    });
  });
}

async function waitForHealth(timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (app && app.exitCode !== null) {
      throw new Error(`Application server exited during startup (code ${app.exitCode}).`);
    }
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.status === 200) return;
    } catch {
      /* server not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Application server did not become healthy in time.");
}

test.before(async () => {
  PG_PORT = await freePort();
  APP_PORT = await freePort();
  BASE = `http://127.0.0.1:${APP_PORT}`;
  DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${PG_PORT}/postgres`;

  pglite = new PGlite();
  await pglite.waitReady;
  socketServer = new PGLiteSocketServer({
    db: pglite,
    port: PG_PORT,
    host: "127.0.0.1",
    // PGLiteSocketServer defaults to a single connection; the app's pg pool
    // (max 5) plus this test's own pool need several concurrent connections.
    maxConnections: 20,
  });
  await socketServer.start();

  // Apply the real migration chain (0000 baseline + 0004 analytics) with
  // checksum verification, mirroring scripts/db-migrate.ts. The runner
  // subprocess is not used here because PGlite's socket server resets
  // connections that carry the `statement_timeout` startup parameter
  // (valid on real PostgreSQL/Neon, unsupported by PGlite). The runner
  // itself is covered by tests/database.node.ts against real PostgreSQL.
  await pglite.exec(
    "CREATE TABLE IF NOT EXISTS public.kashmir_migrations (id text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  for (const migration of migrations) {
    const sql = readFileSync(`migrations/${migration.id}.sql`, "utf8");
    assert.equal(
      createHash("sha256").update(sql).digest("hex"),
      migration.checksum,
      `checksum for ${migration.id}`,
    );
    await pglite.exec(sql.replace(/--> statement-breakpoint/g, ""));
    await pglite.query(
      "INSERT INTO public.kashmir_migrations (id, checksum) VALUES ($1, $2)",
      [migration.id, migration.checksum],
    );
  }

  pool = new Pool({ connectionString: DATABASE_URL, max: 2 });
  await pool.query(
    "INSERT INTO public.admin_users (email, password_hash) VALUES ($1, $2)",
    [ADMIN_EMAIL, hashPassword(ADMIN_PASSWORD)],
  );

  // Build the production bundle if it does not exist yet.
  if (!existsSync(".next/BUILD_ID")) {
    execFileSync("npx", ["next", "build"], {
      env: { ...process.env, DATABASE_URL, AUTH_SECRET },
      stdio: "pipe",
    });
  }

  app = spawn(
    "npx",
    ["next", "start", "-p", String(APP_PORT), "-H", "127.0.0.1"],
    {
      env: { ...process.env, DATABASE_URL, AUTH_SECRET },
      stdio: "pipe",
      // Own process group: `npx` spawns the real server as a grandchild, so
      // signalling the group is the only reliable teardown (otherwise orphaned
      // next-server processes keep the port and break later runs).
      detached: true,
    },
  );
  app.stderr?.on("data", (chunk) => {
    process.stderr.write(`[app] ${chunk}`);
  });
  await waitForHealth();
});

/** Signal the whole process group, since `npx` runs the server as a child. */
function killAppTree(signal: NodeJS.Signals) {
  if (!app?.pid) return;
  try {
    process.kill(-app.pid, signal);
  } catch {
    try {
      app.kill(signal);
    } catch {
      /* already gone */
    }
  }
}

test.after(async () => {
  if (app?.pid && app.exitCode === null && app.signalCode === null) {
    const exited = new Promise<void>((resolve) => app?.once("exit", () => resolve()));
    killAppTree("SIGTERM");
    await Promise.race([exited, new Promise((r) => setTimeout(r, 5_000))]);
    if (app.exitCode === null && app.signalCode === null) killAppTree("SIGKILL");
  }
  await pool?.end();
  await socketServer?.stop();
  await pglite?.close();
});

const track = (events: unknown[], headers: Record<string, string> = {}) =>
  fetch(`${BASE}/api/analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ events }),
  });

const publicEvent = (
  visitorId: string,
  sessionId: string,
  type: string,
  path: string,
) => ({
  visitorId,
  sessionId,
  type,
  path,
  language: "ru",
  dedupeKey: randomUUID(),
});

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert.equal(res.status, 200);
  const cookie = res.headers.get("set-cookie");
  assert.ok(cookie);
  return cookie.split(";")[0];
}

test("reporting endpoints reject unauthenticated requests", async () => {
  assert.equal((await fetch(`${BASE}/api/admin/analytics`)).status, 401);
  assert.equal((await fetch(`${BASE}/api/admin/analytics?active=1`)).status, 401);
  const trackRes = await fetch(`${BASE}/api/admin/analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: "/admin" }),
  });
  assert.equal(trackRes.status, 401);
});

test("public tracking records a real visitor end-to-end", async () => {
  const visitorId = randomUUID();
  const sessionId = randomUUID();
  const res = await track([
    publicEvent(visitorId, sessionId, "public_session_start", "/"),
    publicEvent(visitorId, sessionId, "public_page_view", "/"),
    publicEvent(visitorId, sessionId, "public_page_view", "/collections"),
  ]);
  assert.equal(res.status, 204);

  const visitor = (
    await pool.query(
      "SELECT session_count, page_view_count FROM public.analytics_visitors WHERE visitor_id = $1",
      [visitorId],
    )
  ).rows[0];
  assert.ok(visitor, "visitor row must exist");
  assert.equal(visitor.session_count, 1);
  assert.equal(visitor.page_view_count, 2);

  const events = (
    await pool.query(
      "SELECT event_type FROM public.analytics_events WHERE visitor_id = $1 ORDER BY id",
      [visitorId],
    )
  ).rows;
  assert.deepEqual(
    events.map((e) => e.event_type),
    ["public_session_start", "public_page_view", "public_page_view"],
  );

  // The public homepage still renders (tracking never blocks rendering).
  assert.equal((await fetch(`${BASE}/`)).status, 200);
});

test("malformed and oversized track requests are rejected", async () => {
  assert.equal((await track([])).status, 400);
  assert.equal(
    (
      await track([
        { visitorId: "not-a-uuid", sessionId: randomUUID(), type: "public_page_view", path: "/" },
      ])
    ).status,
    400,
  );
  // Admin paths are never valid public events.
  assert.equal(
    (
      await track([
        publicEvent(randomUUID(), randomUUID(), "public_page_view", "/admin/analytics"),
      ])
    ).status,
    400,
  );
  // Unknown event types are rejected (no arbitrary client values).
  assert.equal(
    (
      await track([
        publicEvent(randomUUID(), randomUUID(), "admin_login", "/"),
      ])
    ).status,
    400,
  );
  // Oversized body.
  const big = await fetch(`${BASE}/api/analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: [{ blob: "x".repeat(70 * 1024) }] }),
  });
  assert.equal(big.status, 413);
  // Invalid JSON.
  const badJson = await fetch(`${BASE}/api/analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not json",
  });
  assert.equal(badJson.status, 400);
});

test("admin sessions are dropped by the public endpoint (separation)", async () => {
  const cookie = await login();
  const visitorId = randomUUID();
  const sessionId = randomUUID();
  const res = await track(
    [publicEvent(visitorId, sessionId, "public_page_view", "/")],
    { Cookie: cookie },
  );
  assert.equal(res.status, 204);
  const rows = (
    await pool.query(
      "SELECT COUNT(*)::int AS n FROM public.analytics_visitors WHERE visitor_id = $1",
      [visitorId],
    )
  ).rows[0];
  assert.equal(rows.n, 0, "admin browser must never become a public visitor");
});

test("admin login, page views and logout are tracked separately", async () => {
  const cookie = await login();

  // Admin login event was recorded by the login hook.
  const logins = (
    await pool.query(
      "SELECT COUNT(*)::int AS n FROM public.analytics_events WHERE actor_type = 'admin' AND event_type = 'admin_login'",
    )
  ).rows[0];
  assert.ok(logins.n >= 1);

  // Admin page view via the admin endpoint.
  const pageView = await fetch(`${BASE}/api/admin/analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ path: "/admin/analytics" }),
  });
  assert.equal(pageView.status, 204);

  // Public counts must not include admin activity.
  const publicViews = (
    await pool.query(
      "SELECT COUNT(*)::int AS n FROM public.analytics_events WHERE actor_type = 'public' AND event_type = 'public_page_view'",
    )
  ).rows[0];
  const adminViews = (
    await pool.query(
      "SELECT COUNT(*)::int AS n FROM public.analytics_events WHERE actor_type = 'admin' AND event_type = 'admin_page_view'",
    )
  ).rows[0];
  assert.ok(adminViews.n >= 1);
  // Exactly the 2 public views from the earlier test (admin added none).
  assert.equal(publicViews.n, 2);

  // Reporting returns separated sections.
  const reportRes = await fetch(`${BASE}/api/admin/analytics?range=7d`, {
    headers: { Cookie: cookie },
  });
  assert.equal(reportRes.status, 200);
  const { report } = await reportRes.json();
  assert.equal(report.overview.pageViews, 2);
  assert.ok(report.admin.logins >= 1);
  assert.ok(report.admin.pageViews >= 1);
  assert.ok(report.topPages.every((p: { path: string }) => !p.path.startsWith("/admin")));

  // Active-visitor endpoint.
  const activeRes = await fetch(`${BASE}/api/admin/analytics?active=1`, {
    headers: { Cookie: cookie },
  });
  assert.equal(activeRes.status, 200);
  const active = await activeRes.json();
  assert.equal(typeof active.activeNow, "number");

  // Invalid range is rejected.
  assert.equal(
    (
      await fetch(`${BASE}/api/admin/analytics?range=bogus`, {
        headers: { Cookie: cookie },
      })
    ).status,
    400,
  );

  // Logout records an admin_logout event.
  const logout = await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  assert.equal(logout.status, 200);
  const logouts = (
    await pool.query(
      "SELECT COUNT(*)::int AS n FROM public.analytics_events WHERE actor_type = 'admin' AND event_type = 'admin_logout'",
    )
  ).rows[0];
  assert.ok(logouts.n >= 1);
});

test("duplicate track submissions do not double-count", async () => {
  const visitorId = randomUUID();
  const sessionId = randomUUID();
  const batch = [publicEvent(visitorId, sessionId, "public_page_view", "/gallery")];
  assert.equal((await track(batch)).status, 204);
  assert.equal((await track(batch)).status, 204);
  const rows = (
    await pool.query(
      "SELECT COUNT(*)::int AS n FROM public.analytics_events WHERE visitor_id = $1",
      [visitorId],
    )
  ).rows[0];
  assert.equal(rows.n, 1);
});

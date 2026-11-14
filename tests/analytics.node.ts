import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import {
  AnalyticsValidationError,
  checkRateLimit,
  getActiveVisitors,
  getAnalyticsReport,
  parseUserAgent,
  recordAdminEvent,
  recordPublicEvents,
  resetRateLimits,
  sanitizeLanguage,
  sanitizePath,
  sanitizeReferrer,
  validateTrackEvent,
  validateTrackPayload,
  type QueryFn,
} from "../src/lib/analytics";

/**
 * Visitor analytics integration tests.
 *
 * Runs against an isolated in-memory PostgreSQL (PGlite, PG 18.6) with the
 * real 0000 baseline + 0004 analytics migrations applied. No production
 * database is ever touched. The analytics library is exercised through its
 * injected query function, exactly as the API routes use it.
 */

async function createTestDb(): Promise<{ db: PGlite; query: QueryFn }> {
  const db = new PGlite();
  await db.waitReady;
  const baseline = readFileSync(
    new URL("../migrations/0000_production_baseline.sql", import.meta.url),
    "utf8",
  );
  const analytics = readFileSync(
    new URL("../migrations/0004_visitor_analytics.sql", import.meta.url),
    "utf8",
  );
  // Strip Drizzle statement-breakpoint markers (comments to the driver).
  // exec() (not query()) because migrations contain multiple statements.
  await db.exec(baseline.replace(/--> statement-breakpoint/g, ""));
  await db.exec(analytics);
  const query: QueryFn = async (text, params) => {
    const result = await db.query(text, (params ?? []) as unknown[]);
    return { rows: result.rows as Record<string, unknown>[] };
  };
  return { db, query };
}

const UA_DESKTOP_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const UA_MOBILE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const UA_TABLET =
  "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

function event(
  visitorId: string,
  sessionId: string,
  type: string,
  path: string,
  extra: Record<string, unknown> = {},
) {
  return validateTrackEvent({
    visitorId,
    sessionId,
    type,
    path,
    language: "ru",
    dedupeKey: randomUUID(),
    ...extra,
  });
}

/* ------------------------- Pure validation ------------------------- */

test("sanitizePath keeps public paths and strips queries", () => {
  assert.equal(sanitizePath("/"), "/");
  assert.equal(sanitizePath("/collections"), "/collections");
  assert.equal(sanitizePath("/curtains/soft-white?x=1#frag"), "/curtains/soft-white");
  assert.equal(sanitizePath("/gallery?lang=ru"), "/gallery");
});

test("sanitizePath rejects admin/api/non-path input", () => {
  assert.equal(sanitizePath("/admin"), null);
  assert.equal(sanitizePath("/admin/analytics"), null);
  assert.equal(sanitizePath("/api/analytics/track"), null);
  assert.equal(sanitizePath("https://evil.test/"), null);
  assert.equal(sanitizePath("relative"), null);
  assert.equal(sanitizePath("/path with space"), null);
  assert.equal(sanitizePath("/path\\backslash"), null);
  assert.equal(sanitizePath(""), null);
  assert.equal(sanitizePath(null), null);
  assert.equal(sanitizePath("/" + "a".repeat(600)), null);
});

test("sanitizeReferrer strips query and fragment", () => {
  assert.equal(
    sanitizeReferrer("https://google.com/search?q=secret+token"),
    "https://google.com/search",
  );
  assert.equal(sanitizeReferrer("https://t.me/kashmir#x"), "https://t.me/kashmir");
  assert.equal(sanitizeReferrer(""), null);
  assert.equal(sanitizeReferrer("not a url"), null);
  assert.equal(sanitizeReferrer("javascript:alert(1)"), null);
});

test("sanitizeLanguage accepts BCP47-ish codes only", () => {
  assert.equal(sanitizeLanguage("ru"), "ru");
  assert.equal(sanitizeLanguage("UZ"), "uz");
  assert.equal(sanitizeLanguage("en-US"), "en-us");
  assert.equal(sanitizeLanguage("russian"), null);
  assert.equal(sanitizeLanguage("x; DROP TABLE"), null);
  assert.equal(sanitizeLanguage(""), null);
});

test("validateTrackEvent rejects malformed events", () => {
  const visitorId = randomUUID();
  const sessionId = randomUUID();
  assert.throws(() => validateTrackEvent(null), AnalyticsValidationError);
  assert.throws(
    () => validateTrackEvent({ visitorId: "nope", sessionId, type: "public_page_view", path: "/" }),
    AnalyticsValidationError,
  );
  assert.throws(
    () => validateTrackEvent({ visitorId, sessionId, type: "admin_login", path: "/" }),
    AnalyticsValidationError,
  );
  assert.throws(
    () => validateTrackEvent({ visitorId, sessionId, type: "public_page_view", path: "/admin" }),
    AnalyticsValidationError,
  );
  assert.throws(
    () => validateTrackEvent({ visitorId, sessionId, type: "public_page_view", path: "/", dedupeKey: "bad" }),
    AnalyticsValidationError,
  );
  const ok = validateTrackEvent({ visitorId, sessionId, type: "public_page_view", path: "/" });
  assert.equal(ok.path, "/");
});

test("validateTrackPayload enforces batch bounds", () => {
  assert.throws(() => validateTrackPayload({}), AnalyticsValidationError);
  assert.throws(() => validateTrackPayload({ events: [] }), AnalyticsValidationError);
  const many = Array.from({ length: 21 }, () => ({
    visitorId: randomUUID(),
    sessionId: randomUUID(),
    type: "public_page_view",
    path: "/",
  }));
  assert.throws(() => validateTrackPayload({ events: many }), AnalyticsValidationError);
  const one = validateTrackPayload({
    events: [{ visitorId: randomUUID(), sessionId: randomUUID(), type: "public_page_view", path: "/" }],
  });
  assert.equal(one.length, 1);
});

test("parseUserAgent classifies device, browser and OS server-side", () => {
  assert.deepEqual(parseUserAgent(UA_DESKTOP_CHROME), {
    deviceCategory: "desktop",
    browser: "Chrome",
    os: "Windows",
  });
  const mobile = parseUserAgent(UA_MOBILE_SAFARI);
  assert.equal(mobile.deviceCategory, "mobile");
  assert.equal(mobile.browser, "Safari");
  assert.equal(mobile.os, "iOS");
  assert.equal(parseUserAgent(UA_TABLET).deviceCategory, "tablet");
  assert.equal(parseUserAgent("").deviceCategory, "unknown");
  assert.equal(parseUserAgent(null).browser, "Unknown");
  // Edge contains "Chrome" in its UA; it must win over Chrome.
  assert.equal(
    parseUserAgent("Mozilla/5.0 Edg/126.0 Chrome/126.0 Safari/537.36").browser,
    "Edge",
  );
});

test("rate limiter allows bursts then blocks", () => {
  resetRateLimits();
  for (let i = 0; i < 120; i += 1) assert.equal(checkRateLimit("1.2.3.4"), true);
  assert.equal(checkRateLimit("1.2.3.4"), false);
  assert.equal(checkRateLimit("5.6.7.8"), true);
  resetRateLimits();
});

/* --------------------------- Recording ----------------------------- */

test("anonymous visitor lifecycle: view, navigate, refresh, return", async () => {
  const { db, query } = await createTestDb();
  try {
    const visitorId = randomUUID();
    const sessionId = randomUUID();

    // 1. Homepage visit (new visitor + new session).
    const first = await recordPublicEvents(
      [
        event(visitorId, sessionId, "public_session_start", "/"),
        event(visitorId, sessionId, "public_page_view", "/"),
      ],
      UA_DESKTOP_CHROME,
      query,
    );
    assert.equal(first.isNewVisitor, true);
    assert.equal(first.isNewSession, true);
    assert.equal(first.recorded, true);

    // 2. Navigate to another page (same visitor, same session).
    const nav = await recordPublicEvents(
      [event(visitorId, sessionId, "public_page_view", "/collections")],
      UA_DESKTOP_CHROME,
      query,
    );
    assert.equal(nav.isNewVisitor, false);
    assert.equal(nav.isNewSession, false);

    // 3. Refresh (same path again): still the same visitor, page views grow.
    await recordPublicEvents(
      [event(visitorId, sessionId, "public_page_view", "/collections")],
      UA_DESKTOP_CHROME,
      query,
    );

    const visitor = (
      await query(
        "SELECT session_count, page_view_count, device_category, browser, os FROM public.analytics_visitors WHERE visitor_id = $1",
        [visitorId],
      )
    ).rows[0];
    assert.equal(visitor.session_count, 1);
    assert.equal(visitor.page_view_count, 3);
    assert.equal(visitor.device_category, "desktop");
    assert.equal(visitor.browser, "Chrome");
    assert.equal(visitor.os, "Windows");

    const session = (
      await query(
        "SELECT page_views, landing_path FROM public.analytics_sessions WHERE session_id = $1",
        [sessionId],
      )
    ).rows[0];
    assert.equal(session.page_views, 3);
    assert.equal(session.landing_path, "/");

    // 4. Returning visit: new session, same visitor.
    const session2 = randomUUID();
    const returning = await recordPublicEvents(
      [
        event(visitorId, session2, "public_session_start", "/"),
        event(visitorId, session2, "public_page_view", "/"),
      ],
      UA_DESKTOP_CHROME,
      query,
    );
    assert.equal(returning.isNewVisitor, false);
    assert.equal(returning.isNewSession, true);

    const visitorAfter = (
      await query(
        "SELECT session_count, page_view_count FROM public.analytics_visitors WHERE visitor_id = $1",
        [visitorId],
      )
    ).rows[0];
    assert.equal(visitorAfter.session_count, 2);
    assert.equal(visitorAfter.page_view_count, 4);

    // 5. A second browser is a distinct visitor.
    const otherVisitor = randomUUID();
    const other = await recordPublicEvents(
      [event(otherVisitor, randomUUID(), "public_page_view", "/")],
      UA_MOBILE_SAFARI,
      query,
    );
    assert.equal(other.isNewVisitor, true);
    const otherRow = (
      await query(
        "SELECT device_category FROM public.analytics_visitors WHERE visitor_id = $1",
        [otherVisitor],
      )
    ).rows[0];
    assert.equal(otherRow.device_category, "mobile");
  } finally {
    await db.close();
  }
});

test("duplicate events are deduplicated by dedupe_key", async () => {
  const { db, query } = await createTestDb();
  try {
    const visitorId = randomUUID();
    const sessionId = randomUUID();
    const dedupeKey = randomUUID();
    const batch = [
      event(visitorId, sessionId, "public_page_view", "/", { dedupeKey }),
    ];
    const first = await recordPublicEvents(batch, UA_DESKTOP_CHROME, query);
    assert.equal(first.recorded, true);
    // Exact retry (same dedupe key): no new event row.
    const retry = await recordPublicEvents(batch, UA_DESKTOP_CHROME, query);
    assert.equal(retry.recorded, false);

    const count = (
      await query(
        "SELECT COUNT(*)::int AS n FROM public.analytics_events WHERE actor_type = 'public'",
      )
    ).rows[0];
    assert.equal(count.n, 1);
  } finally {
    await db.close();
  }
});

test("heartbeat updates activity without creating an event row", async () => {
  const { db, query } = await createTestDb();
  try {
    const visitorId = randomUUID();
    const sessionId = randomUUID();
    await recordPublicEvents(
      [event(visitorId, sessionId, "public_page_view", "/")],
      UA_DESKTOP_CHROME,
      query,
    );
    const before = (
      await query(
        "SELECT COUNT(*)::int AS n FROM public.analytics_events WHERE actor_type = 'public'",
      )
    ).rows[0];
    assert.equal(before.n, 1);

    await recordPublicEvents(
      [event(visitorId, sessionId, "public_session_heartbeat", "/")],
      UA_DESKTOP_CHROME,
      query,
    );
    const after = (
      await query(
        "SELECT COUNT(*)::int AS n FROM public.analytics_events WHERE actor_type = 'public'",
      )
    ).rows[0];
    assert.equal(after.n, 1);

    // Heartbeat still counts as activity for the active-visitor signal.
    assert.equal(await getActiveVisitors(query), 1);
  } finally {
    await db.close();
  }
});

test("session end stamps ended_at and computes duration server-side", async () => {
  const { db, query } = await createTestDb();
  try {
    const visitorId = randomUUID();
    const sessionId = randomUUID();
    await recordPublicEvents(
      [event(visitorId, sessionId, "public_page_view", "/")],
      UA_DESKTOP_CHROME,
      query,
    );
    await recordPublicEvents(
      [event(visitorId, sessionId, "public_session_end", "/")],
      UA_DESKTOP_CHROME,
      query,
    );
    const session = (
      await query(
        "SELECT ended_at IS NOT NULL AS ended, duration_seconds >= 0 AS sane FROM public.analytics_sessions WHERE session_id = $1",
        [sessionId],
      )
    ).rows[0];
    assert.equal(session.ended, true);
    assert.equal(session.sane, true);
    // Ended sessions are not "active now".
    assert.equal(await getActiveVisitors(query), 0);
  } finally {
    await db.close();
  }
});

test("database CHECK rejects cross-actor event types", async () => {
  const { db, query } = await createTestDb();
  try {
    await assert.rejects(
      query(
        "INSERT INTO public.analytics_events (actor_type, event_type) VALUES ('public', 'admin_login')",
      ),
    );
    await assert.rejects(
      query(
        "INSERT INTO public.analytics_events (actor_type, event_type) VALUES ('admin', 'public_page_view')",
      ),
    );
  } finally {
    await db.close();
  }
});

/* ------------------------- Admin separation ------------------------ */

test("admin events never inflate public statistics", async () => {
  const { db, query } = await createTestDb();
  try {
    const visitorId = randomUUID();
    const sessionId = randomUUID();
    await recordPublicEvents(
      [event(visitorId, sessionId, "public_page_view", "/")],
      UA_DESKTOP_CHROME,
      query,
    );

    // Seed an admin user + session (mirrors production FK targets).
    await query(
      "INSERT INTO public.admin_users (id, email, password_hash) VALUES (1, 'admin@example.test', 'x')",
    );
    await query(
      "INSERT INTO public.admin_sessions (id, admin_user_id, admin_email, expires_at) VALUES ('11111111-1111-4111-8111-111111111111', 1, 'admin@example.test', now() + interval '7 days')",
    );
    await recordAdminEvent(
      {
        eventType: "admin_login",
        adminSessionId: "11111111-1111-4111-8111-111111111111",
        adminUserId: 1,
        path: "/admin/login",
      },
      query,
    );
    await recordAdminEvent(
      {
        eventType: "admin_page_view",
        adminSessionId: "11111111-1111-4111-8111-111111111111",
        adminUserId: 1,
        path: "/admin/analytics",
      },
      query,
    );
    await recordAdminEvent(
      {
        eventType: "admin_page_view",
        adminSessionId: "11111111-1111-4111-8111-111111111111",
        adminUserId: 1,
        path: "/admin/curtains",
      },
      query,
    );

    const report = await getAnalyticsReport("7d", null, null, query);
    // Public metrics see only the single public page view.
    assert.equal(report.overview.pageViews, 1);
    assert.equal(report.overview.uniqueVisitors, 1);
    assert.equal(report.overview.sessions, 1);
    assert.equal(report.topPages.length, 1);
    assert.equal(report.topPages[0].path, "/");
    // Admin metrics are reported separately.
    assert.equal(report.admin.logins, 1);
    assert.equal(report.admin.pageViews, 2);
    assert.equal(report.admin.logouts, 0);
    // No admin path leaks into public top pages.
    assert.ok(report.topPages.every((p) => !p.path.startsWith("/admin")));
  } finally {
    await db.close();
  }
});

/* --------------------------- Reporting ----------------------------- */

test("report aggregates overview, distributions and timeseries", async () => {
  const { db, query } = await createTestDb();
  try {
    const v1 = randomUUID();
    const v2 = randomUUID();
    await recordPublicEvents(
      [
        event(v1, randomUUID(), "public_page_view", "/", {
          referrer: "https://google.com/search",
          language: "ru",
        }),
        event(v1, randomUUID(), "public_page_view", "/collections", {
          referrer: "https://google.com/search",
          language: "ru",
        }),
      ],
      UA_DESKTOP_CHROME,
      query,
    );
    await recordPublicEvents(
      [
        event(v2, randomUUID(), "public_page_view", "/", {
          referrer: "https://t.me/kashmir",
          language: "uz",
        }),
      ],
      UA_MOBILE_SAFARI,
      query,
    );

    const report = await getAnalyticsReport("30d", null, null, query);
    assert.equal(report.overview.uniqueVisitors, 2);
    assert.equal(report.overview.totalVisitors, 2);
    assert.equal(report.overview.pageViews, 3);
    assert.equal(report.overview.newVisitors, 2);
    assert.equal(report.overview.returningVisitors, 0);
    assert.ok(report.timeseries.length >= 1);
    assert.equal(report.topPages[0].path, "/");
    assert.equal(report.topPages[0].pageViews, 2);
    assert.ok(report.topReferrers.some((r) => r.referrer === "google.com"));
    assert.ok(report.topReferrers.some((r) => r.referrer === "t.me"));
    assert.ok(report.devices.some((d) => d.label === "desktop"));
    assert.ok(report.devices.some((d) => d.label === "mobile"));
    assert.ok(report.browsers.some((b) => b.label === "Chrome"));
    assert.ok(report.browsers.some((b) => b.label === "Safari"));
    assert.ok(report.languages.some((l) => l.label === "ru"));
    assert.ok(report.languages.some((l) => l.label === "uz"));
    assert.equal(report.recentActivity.length, 3);
    // Visitor IDs are never exposed in the report.
    assert.ok(!JSON.stringify(report).includes(v1));
    assert.ok(!JSON.stringify(report).includes(v2));
  } finally {
    await db.close();
  }
});

test("returning visitors are counted once they have history", async () => {
  const { db, query } = await createTestDb();
  try {
    const visitorId = randomUUID();
    // First visit 10 days ago (before the 7-day window), second visit today.
    await query(
      "INSERT INTO public.analytics_visitors (visitor_id, first_seen_at) VALUES ($1, now() - interval '10 days')",
      [visitorId],
    );
    await recordPublicEvents(
      [event(visitorId, randomUUID(), "public_page_view", "/")],
      UA_DESKTOP_CHROME,
      query,
    );
    const report = await getAnalyticsReport("7d", null, null, query);
    assert.equal(report.overview.uniqueVisitors, 1);
    assert.equal(report.overview.newVisitors, 0);
    assert.equal(report.overview.returningVisitors, 1);
  } finally {
    await db.close();
  }
});

test("custom range validation rejects bad input", async () => {
  const { db, query } = await createTestDb();
  try {
    await assert.rejects(
      getAnalyticsReport("custom", null, null, query),
      AnalyticsValidationError,
    );
    await assert.rejects(
      getAnalyticsReport(
        "custom",
        "2026-01-10T00:00:00Z",
        "2026-01-01T00:00:00Z",
        query,
      ),
      AnalyticsValidationError,
    );
    await assert.rejects(
      getAnalyticsReport("bogus", null, null, query),
      AnalyticsValidationError,
    );
    const ok = await getAnalyticsReport(
      "custom",
      "2026-01-01T00:00:00Z",
      "2026-01-10T00:00:00Z",
      query,
    );
    assert.equal(ok.range, "custom");
  } finally {
    await db.close();
  }
});

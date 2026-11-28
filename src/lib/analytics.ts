// NOTE: no `import "server-only"` here on purpose. This module is imported
// only by server route handlers and auth.ts, and it already depends on the
// server-only `pg` pool, which prevents client bundling. Omitting the
// marker keeps the validation/recording logic directly unit-testable with
// node:test (the `server-only` package throws outside Next.js).
import { pool } from "@/db";

/**
 * KASHMIR DECOR — first-party visitor analytics (server side).
 *
 * Why raw SQL (pool.query) instead of Drizzle here:
 *  - The recovery/migration system treats `src/db/schema.ts` as the model
 *    authority and pins `migrations/0000_production_baseline.sql` to it
 *    (see tests/database.node.ts + src/db/recovery/*). Adding analytics
 *    tables to schema.ts would rewrite that baseline and break production
 *    migration history. The analytics tables therefore live in
 *    `migrations/0004_visitor_analytics.sql` (registered in the manifest)
 *    and are accessed with parameterized SQL. The recovery verifier reports
 *    them as known extras (warnings), never as drift failures.
 *  - Aggregations are complex SQL; parameterized pool.query keeps them
 *    explicit and auditable. Every value is bound ($1, $2, ...), never
 *    interpolated, so client input cannot become SQL.
 *
 * Separation guarantee:
 *  - Public events are written with actor_type='public' and event_type in
 *    (public_page_view, public_session_start, public_session_end).
 *  - Admin events are written with actor_type='admin' and event_type in
 *    (admin_login, admin_page_view, admin_logout).
 *  - The database CHECK constraint enforces this pairing; every public
 *    aggregation filters actor_type='public' and every admin aggregation
 *    filters actor_type='admin'. Admin activity can never inflate public
 *    visitor statistics.
 *
 * Privacy:
 *  - Identifiers are random UUIDs (first-party cookies). No fingerprinting,
 *    no IP address, no raw User-Agent, no GPS, no free-text PII is stored.
 *  - Device/browser/OS are parsed server-side from the User-Agent header
 *    (never trusted from the client), referrers are stripped of query
 *    strings and fragments, and client timestamps are ignored (server time
 *    is authoritative).
 *
 * Failure mode:
 *  - Every write is best-effort. If the analytics tables do not exist yet
 *    (pre-migration) or the database is unreachable, recording silently
 *    no-ops so the public site and admin login are never affected.
 */

export type QueryFn = (
  text: string,
  params?: unknown[],
) => Promise<{ rows: Record<string, unknown>[] }>;

function defaultQuery(): QueryFn {
  return pool.query.bind(pool) as unknown as QueryFn;
}

/* ------------------------------------------------------------------ */
/*                         Validation                                  */
/* ------------------------------------------------------------------ */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const PUBLIC_EVENT_TYPES = [
  "public_page_view",
  "public_session_start",
  "public_session_end",
] as const;

export type PublicEventType = (typeof PUBLIC_EVENT_TYPES)[number];

/** Heartbeat is an activity signal only; it never creates an event row. */
export const HEARTBEAT_TYPE = "public_session_heartbeat";

const TRACKABLE_TYPES = new Set<string>([
  ...PUBLIC_EVENT_TYPES,
  HEARTBEAT_TYPE,
]);

export interface TrackEventInput {
  visitorId: string;
  sessionId: string;
  type: string;
  path: string;
  referrer?: string;
  language?: string;
  dedupeKey?: string;
}

export interface ValidatedTrackEvent {
  visitorId: string;
  sessionId: string;
  type: PublicEventType | typeof HEARTBEAT_TYPE;
  path: string;
  referrer: string | null;
  language: string | null;
  dedupeKey: string | null;
}

export class AnalyticsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyticsValidationError";
  }
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Reduce a client-supplied path to a safe pathname.
 * Returns null when the path is not a trackable public page.
 */
export function sanitizePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 512) return null;
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.includes("\\")) return null;
  // Control characters and whitespace are never valid in a stored path.
  if (/[\u0000-\u001f\u007f\s]/.test(trimmed)) return null;
  // Admin and API routes are never public page views.
  if (
    trimmed === "/admin" ||
    trimmed.startsWith("/admin/") ||
    trimmed.startsWith("/api/")
  ) {
    return null;
  }
  try {
    // Parse against a dummy origin so query strings and fragments are
    // dropped; only the pathname is ever stored (no PII in queries).
    const url = new URL(trimmed, "https://placeholder.invalid");
    const pathname = url.pathname;
    if (!pathname.startsWith("/")) return null;
    if (
      pathname === "/admin" ||
      pathname.startsWith("/admin/") ||
      pathname.startsWith("/api/")
    ) {
      return null;
    }
    return pathname.slice(0, 512);
  } catch {
    return null;
  }
}

/**
 * Reduce a referrer to origin + path (query and fragment stripped so
 * tracking parameters / tokens never reach the database).
 */
export function sanitizeReferrer(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 1024) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const clean = `${url.origin}${url.pathname}`.slice(0, 1024);
    return clean || null;
  } catch {
    return null;
  }
}

const LANGUAGE_RE = /^[a-z]{2,3}(-[a-zA-Z]{2,4})?$/;

export function sanitizeLanguage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > 16) return null;
  return LANGUAGE_RE.test(trimmed) ? trimmed : null;
}

export function validateTrackEvent(
  raw: unknown,
): ValidatedTrackEvent {
  if (typeof raw !== "object" || raw === null) {
    throw new AnalyticsValidationError("Event must be an object.");
  }
  const body = raw as Record<string, unknown>;
  if (!isUuid(body.visitorId)) {
    throw new AnalyticsValidationError("visitorId must be a UUID.");
  }
  if (!isUuid(body.sessionId)) {
    throw new AnalyticsValidationError("sessionId must be a UUID.");
  }
  if (typeof body.type !== "string" || !TRACKABLE_TYPES.has(body.type)) {
    throw new AnalyticsValidationError("Unknown event type.");
  }
  const path = sanitizePath(body.path);
  if (path === null) {
    throw new AnalyticsValidationError("Invalid or non-public path.");
  }
  const referrer = sanitizeReferrer(body.referrer);
  if (body.referrer !== undefined && body.referrer !== null && body.referrer !== "" && referrer === null) {
    throw new AnalyticsValidationError("Invalid referrer.");
  }
  const language = sanitizeLanguage(body.language);
  if (
    body.language !== undefined &&
    body.language !== null &&
    body.language !== "" &&
    language === null
  ) {
    throw new AnalyticsValidationError("Invalid language.");
  }
  let dedupeKey: string | null = null;
  if (body.dedupeKey !== undefined && body.dedupeKey !== null && body.dedupeKey !== "") {
    if (!isUuid(body.dedupeKey)) {
      throw new AnalyticsValidationError("dedupeKey must be a UUID.");
    }
    dedupeKey = body.dedupeKey;
  }
  return {
    visitorId: body.visitorId,
    sessionId: body.sessionId,
    type: body.type as PublicEventType | typeof HEARTBEAT_TYPE,
    path,
    referrer,
    language,
    dedupeKey,
  };
}

/**
 * Validate a whole request body: { events: [...] } with 1..20 events.
 * Throws AnalyticsValidationError on any malformed input.
 */
export function validateTrackPayload(raw: unknown): ValidatedTrackEvent[] {
  if (typeof raw !== "object" || raw === null) {
    throw new AnalyticsValidationError("Body must be a JSON object.");
  }
  const events = (raw as Record<string, unknown>).events;
  if (!Array.isArray(events) || events.length === 0) {
    throw new AnalyticsValidationError("events must be a non-empty array.");
  }
  if (events.length > 20) {
    throw new AnalyticsValidationError("Too many events in one request.");
  }
  return events.map(validateTrackEvent);
}

/* ------------------------------------------------------------------ */
/*                    User-Agent parsing (server)                      */
/* ------------------------------------------------------------------ */

export interface ParsedAgent {
  deviceCategory: "desktop" | "mobile" | "tablet" | "unknown";
  browser: string;
  os: string;
}

/**
 * Parse device/browser/OS from the User-Agent header on the server.
 * The client never supplies these values, so they cannot be forged to
 * manipulate distributions. Only the parsed categories are stored —
 * never the raw header.
 */
export function parseUserAgent(ua: string | null | undefined): ParsedAgent {
  const agent = (ua ?? "").slice(0, 2000);
  const lower = agent.toLowerCase();

  let deviceCategory: ParsedAgent["deviceCategory"] = "desktop";
  if (/ipad|tablet|playbook|silk/.test(lower)) {
    deviceCategory = "tablet";
  } else if (
    /mobi|iphone|ipod|android|windows phone|blackberry|opera mini|iemobile/.test(
      lower,
    )
  ) {
    deviceCategory = "mobile";
  } else if (!agent) {
    deviceCategory = "unknown";
  }

  let browser = "Unknown";
  if (/edg(a|e|ios)?\//.test(lower)) browser = "Edge";
  else if (/opr\/|opera/.test(lower)) browser = "Opera";
  else if (/samsungbrowser\//.test(lower)) browser = "Samsung Internet";
  else if (/firefox\/|fxios\//.test(lower)) browser = "Firefox";
  else if (/chrome\/|crios\//.test(lower)) browser = "Chrome";
  else if (/safari\//.test(lower)) browser = "Safari";

  let os = "Unknown";
  if (/windows nt|windows/.test(lower)) os = "Windows";
  else if (/iphone|ipad|ipod/.test(lower)) os = "iOS";
  else if (/mac os x|macintosh/.test(lower)) os = "macOS";
  else if (/android/.test(lower)) os = "Android";
  else if (/linux/.test(lower)) os = "Linux";

  return { deviceCategory, browser, os };
}

/* ------------------------------------------------------------------ */
/*                         Rate limiting                               */
/* ------------------------------------------------------------------ */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 120;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

/**
 * In-memory per-IP token bucket for the public ingest endpoint.
 * Serverless instances each keep their own bucket; combined with the
 * 20-events-per-request cap and the 64 KB body cap this bounds abuse
 * without any shared-state dependency. Returns true when allowed.
 */
export function checkRateLimit(ip: string, now = Date.now()): boolean {
  const key = ip || "unknown";
  const bucket = rateBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_MAX_REQUESTS) return false;
  bucket.count += 1;
  return true;
}

/** Test hook: clear all rate-limit buckets. */
export function resetRateLimits(): void {
  rateBuckets.clear();
}

/* ------------------------------------------------------------------ */
/*                          Recording                                  */
/* ------------------------------------------------------------------ */

export interface RecordResult {
  /** True when at least one event row was inserted (dedupe-safe). */
  recorded: boolean;
  /** True when the visitor was seen for the first time. */
  isNewVisitor: boolean;
  /** True when the session was started by this batch. */
  isNewSession: boolean;
}

/**
 * Record a batch of validated public events.
 *
 * Semantics:
 *  - Upserts the visitor (first_seen_at is never overwritten; last_seen_at,
 *    device/browser/OS/language/referrer track the latest signal).
 *  - Upserts the session (started_at is never overwritten; last_activity_at
 *    always advances; page_views counts page_view events only).
 *  - Inserts one analytics_events row per non-heartbeat event, deduplicated
 *    by dedupe_key (ON CONFLICT DO NOTHING) so retries and double-fires
 *    never double-count.
 *  - session_start marks the session as new; session_end stamps ended_at
 *    and computes duration server-side from started_at.
 *  - Returning vs new is derived server-side: a visitor is "new" only when
 *    this batch creates the visitor row.
 *
 * All events in a batch share one visitor/session in practice (the client
 * sends one visitor's events per request); the function groups by
 * (visitorId, sessionId) so mixed batches remain correct.
 */
export async function recordPublicEvents(
  events: ValidatedTrackEvent[],
  userAgent: string | null,
  query?: QueryFn,
): Promise<RecordResult> {
  if (!query) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await recordPublicEvents(events, userAgent, (sql, params) => client.query(sql, params));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  const agent = parseUserAgent(userAgent);
  const result: RecordResult = {
    recorded: false,
    isNewVisitor: false,
    isNewSession: false,
  };
  if (events.length === 0) return result;

  // Group by visitor+session so each pair is written in one transaction.
  const groups = new Map<string, ValidatedTrackEvent[]>();
  for (const event of events) {
    const key = `${event.visitorId}:${event.sessionId}`;
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }

  for (const group of groups.values()) {
    const first = group[0];
    let pageViews = 0;
    const hasEnd = group.some((e) => e.type === "public_session_end");
    const language = group.find((e) => e.language)?.language ?? null;
    const referrer = group.find((e) => e.referrer)?.referrer ?? null;
    const landingPath = first.path;

    // Visitor upsert. first_seen_at is set only on insert.
    const visitorRows = await query(
      `INSERT INTO public.analytics_visitors
         (visitor_id, device_category, browser, os, language, referrer)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (visitor_id) DO UPDATE SET
         last_seen_at = now(),
         device_category = COALESCE($2, public.analytics_visitors.device_category),
         browser = COALESCE($3, public.analytics_visitors.browser),
         os = COALESCE($4, public.analytics_visitors.os),
         language = COALESCE($5, public.analytics_visitors.language),
         referrer = COALESCE($6, public.analytics_visitors.referrer)
       RETURNING (xmax = 0) AS is_new`,
      [
        first.visitorId,
        agent.deviceCategory,
        agent.browser,
        agent.os,
        language,
        referrer,
      ],
    );
    const isNewVisitor = visitorRows.rows[0]?.is_new === true;
    if (isNewVisitor) result.isNewVisitor = true;

    // Session upsert. started_at is set only on insert. Any activity
    // clears a previous ended_at: a tab closed and reopened within the
    // 30-minute cookie window resumes the same session instead of
    // leaving it permanently "ended" with a stale duration.
    const sessionRows = await query(
      `INSERT INTO public.analytics_sessions
         (session_id, visitor_id, device_category, browser, os, language, referrer, landing_path, page_views)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
       ON CONFLICT (session_id) DO UPDATE SET
         last_activity_at = now(),
         ended_at = NULL,
         duration_seconds = 0,
         device_category = COALESCE($3, public.analytics_sessions.device_category),
         browser = COALESCE($4, public.analytics_sessions.browser),
         os = COALESCE($5, public.analytics_sessions.os),
         language = COALESCE($6, public.analytics_sessions.language)
       RETURNING (xmax = 0) AS is_new`,
      [
        first.sessionId,
        first.visitorId,
        agent.deviceCategory,
        agent.browser,
        agent.os,
        language,
        referrer,
        landingPath,
      ],
    );
    const isNewSession = sessionRows.rows[0]?.is_new === true;
    if (isNewSession) result.isNewSession = true;

    // Event rows (heartbeats excluded). Dedupe-safe via dedupe_key.
    for (const event of group) {
      if (event.type === HEARTBEAT_TYPE) continue;
      const inserted = await query(
        `INSERT INTO public.analytics_events
           (actor_type, event_type, visitor_id, session_id, path, referrer,
            device_category, browser, os, language, dedupe_key)
         VALUES ('public', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (dedupe_key) DO NOTHING
         RETURNING id`,
        [
          event.type,
          event.visitorId,
          event.sessionId,
          event.path,
          event.referrer,
          agent.deviceCategory,
          agent.browser,
          agent.os,
          event.language,
          event.dedupeKey,
        ],
      );
      if (inserted.rows.length > 0) {
        result.recorded = true;
        if (event.type === "public_page_view") pageViews++;
      }
    }

    if (pageViews > 0 || isNewSession) {
      await query(
        `UPDATE public.analytics_visitors
            SET page_view_count = page_view_count + $2, session_count = session_count + $3
          WHERE visitor_id = $1`,
        [first.visitorId, pageViews, Number(isNewSession)],
      );
    }
    if (pageViews > 0) {
      await query("UPDATE public.analytics_sessions SET page_views = page_views + $2 WHERE session_id = $1",
        [first.sessionId, pageViews]);
    }

    // Session end: stamp ended_at and compute duration server-side.
    // Runs after the upsert (which clears ended_at on activity), so an
    // end in this batch always wins over a resume in the same batch.
    if (hasEnd) {
      await query(
        `UPDATE public.analytics_sessions
           SET ended_at = now(),
               duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (now() - started_at))::integer),
               last_activity_at = now()
           WHERE session_id = $1`,
        [first.sessionId],
      );
    }
  }

  return result;
}

/**
 * Record one admin event (admin_page_view / admin_login / admin_logout).
 * Admin events carry the admin session reference and never touch the
 * public visitor/session tables.
 */
export async function recordAdminEvent(
  input: {
    eventType: "admin_login" | "admin_page_view" | "admin_logout";
    adminSessionId: string | null;
    adminUserId: number | null;
    path: string | null;
    dedupeKey?: string | null;
  },
  query: QueryFn = defaultQuery(),
): Promise<boolean> {
  const inserted = await query(
    `INSERT INTO public.analytics_events
       (actor_type, event_type, admin_session_id, admin_user_id, path, dedupe_key)
     VALUES ('admin', $1, $2, $3, $4, $5)
     ON CONFLICT (dedupe_key) DO NOTHING
     RETURNING id`,
    [
      input.eventType,
      input.adminSessionId,
      input.adminUserId,
      input.path,
      input.dedupeKey ?? null,
    ],
  );
  return inserted.rows.length > 0;
}

/* ------------------------------------------------------------------ */
/*                        Reporting                                    */
/* ------------------------------------------------------------------ */

export type AnalyticsRange = "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";

export interface AnalyticsReport {
  range: AnalyticsRange;
  from: string;
  to: string;
  overview: {
    uniqueVisitors: number;
    totalVisitors: number;
    pageViews: number;
    sessions: number;
    newVisitors: number;
    returningVisitors: number;
    activeNow: number;
    avgSessionDurationSeconds: number;
  };
  timeseries: Array<{ bucket: string; visitors: number; pageViews: number }>;
  topPages: Array<{ path: string; pageViews: number; visitors: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  devices: Array<{ label: string; count: number }>;
  browsers: Array<{ label: string; count: number }>;
  operatingSystems: Array<{ label: string; count: number }>;
  languages: Array<{ label: string; count: number }>;
  recentActivity: Array<{
    createdAt: string;
    path: string | null;
    deviceCategory: string | null;
    browser: string | null;
    language: string | null;
  }>;
  admin: {
    logins: number;
    pageViews: number;
    logouts: number;
    recentLogins: Array<{ createdAt: string; path: string | null }>;
  };
}

const RANGE_DAYS: Record<Exclude<AnalyticsRange, "custom">, number> = {
  today: 1,
  yesterday: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function parseRange(
  range: string | null,
  fromParam: string | null,
  toParam: string | null,
): { range: AnalyticsRange; from: Date; to: Date } {
  const now = new Date();
  if (range === "custom") {
    const from = fromParam ? new Date(fromParam) : null;
    const to = toParam ? new Date(toParam) : null;
    if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new AnalyticsValidationError("Custom range requires valid from/to dates.");
    }
    if (from > to) {
      throw new AnalyticsValidationError("Custom range from must not be after to.");
    }
    const spanDays = (to.getTime() - from.getTime()) / 86_400_000;
    if (spanDays > 365) {
      throw new AnalyticsValidationError("Custom range is limited to 365 days.");
    }
    return { range: "custom", from, to };
  }
  const key = (range ?? "7d") as AnalyticsRange;
  if (!Object.hasOwn(RANGE_DAYS, key)) {
    throw new AnalyticsValidationError("Unknown range.");
  }
  const days = RANGE_DAYS[key as Exclude<AnalyticsRange, "custom">];
  const dayMs = 86_400_000;
  // The salon reports calendar days in Tashkent (UTC+5).
  const offset = 5 * 3_600_000;
  const midnight = Math.floor((now.getTime() + offset) / dayMs) * dayMs - offset;
  const end = key === "yesterday" ? midnight : midnight + dayMs;
  return { range: key, from: new Date(end - days * dayMs), to: new Date(end) };
}

function num(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Build the full analytics report for the admin dashboard.
 * Every public metric filters actor_type='public'; every admin metric
 * filters actor_type='admin'. Visitor IDs are never returned.
 */
export async function getAnalyticsReport(
  rangeParam: string | null,
  fromParam: string | null,
  toParam: string | null,
  query: QueryFn = defaultQuery(),
): Promise<AnalyticsReport> {
  const { range, from, to } = parseRange(rangeParam, fromParam, toParam);
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  const overviewRows = await query(
    `SELECT
       (SELECT COUNT(DISTINCT visitor_id) FROM public.analytics_sessions
         WHERE started_at >= $1 AND started_at < $2) AS unique_visitors,
       (SELECT COUNT(*) FROM public.analytics_visitors) AS total_visitors,
       (SELECT COUNT(*) FROM public.analytics_events
         WHERE actor_type = 'public' AND event_type = 'public_page_view'
           AND created_at >= $1 AND created_at < $2) AS page_views,
       (SELECT COUNT(*) FROM public.analytics_sessions
         WHERE started_at >= $1 AND started_at < $2) AS sessions,
       (SELECT COUNT(*) FROM public.analytics_visitors
         WHERE first_seen_at >= $1 AND first_seen_at < $2) AS new_visitors,
       (SELECT COUNT(DISTINCT s.visitor_id) FROM public.analytics_sessions s
         JOIN public.analytics_visitors v ON v.visitor_id = s.visitor_id
         WHERE s.started_at >= $1 AND s.started_at < $2
           AND v.first_seen_at < $1) AS returning_visitors,
       (SELECT COUNT(*) FROM public.analytics_sessions
         WHERE last_activity_at >= now() - interval '3 minutes'
           AND ended_at IS NULL) AS active_now,
       (SELECT COALESCE(AVG(duration_seconds), 0)::integer FROM public.analytics_sessions
         WHERE started_at >= $1 AND started_at < $2 AND ended_at IS NOT NULL) AS avg_duration`,
    [fromIso, toIso],
  );
  const o = overviewRows.rows[0] ?? {};

  const bucketExpr =
    range === "today" || range === "yesterday"
      ? `date_trunc('hour', created_at)`
      : `date_trunc('day', created_at, 'Asia/Tashkent')`;
  const timeseriesRows = await query(
    `SELECT ${bucketExpr} AS bucket,
            COUNT(DISTINCT visitor_id) AS visitors,
            COUNT(*) FILTER (WHERE event_type = 'public_page_view') AS page_views
       FROM public.analytics_events
      WHERE actor_type = 'public' AND created_at >= $1 AND created_at < $2
      GROUP BY 1 ORDER BY 1`,
    [fromIso, toIso],
  );

  const topPagesRows = await query(
    `SELECT path,
            COUNT(*) AS page_views,
            COUNT(DISTINCT visitor_id) AS visitors
       FROM public.analytics_events
      WHERE actor_type = 'public' AND event_type = 'public_page_view'
        AND created_at >= $1 AND created_at < $2 AND path IS NOT NULL
      GROUP BY path ORDER BY page_views DESC, path ASC LIMIT 10`,
    [fromIso, toIso],
  );

  const referrerRows = await query(
    `SELECT COALESCE(NULLIF(split_part(referrer, '/', 3), ''), 'Direct / unknown') AS referrer,
            COUNT(*) AS count
       FROM public.analytics_events
      WHERE actor_type = 'public' AND event_type = 'public_page_view'
        AND created_at >= $1 AND created_at < $2
      GROUP BY 1 ORDER BY count DESC, referrer ASC LIMIT 10`,
    [fromIso, toIso],
  );

  const distributionRows = await query(
    `WITH grouped AS (
       SELECT dimension, coalesce(nullif(label, ''), 'Unknown') AS label,
              count(DISTINCT visitor_id) AS count
         FROM public.analytics_events
         CROSS JOIN LATERAL (VALUES ('device', device_category), ('browser', browser),
           ('os', os), ('language', language)) dimensions(dimension, label)
        WHERE actor_type = 'public' AND created_at >= $1 AND created_at < $2
        GROUP BY 1, 2
     ), ranked AS (
       SELECT *, row_number() OVER (PARTITION BY dimension ORDER BY count DESC, label) AS rank
         FROM grouped
     )
     SELECT dimension, label, count FROM ranked WHERE rank <= 10 ORDER BY dimension, rank`,
    [fromIso, toIso],
  );
  const distribution = (dimension: string) => distributionRows.rows
    .filter((row) => row.dimension === dimension)
    .map((row) => ({ label: str(row.label), count: num(row.count) }));

  const recentRows = await query(
    `SELECT created_at, path, device_category, browser, language
       FROM public.analytics_events
      WHERE actor_type = 'public'
      ORDER BY created_at DESC LIMIT 20`,
  );

  const adminRows = await query(
    `SELECT
       COUNT(*) FILTER (WHERE event_type = 'admin_login') AS logins,
       COUNT(*) FILTER (WHERE event_type = 'admin_page_view') AS page_views,
       COUNT(*) FILTER (WHERE event_type = 'admin_logout') AS logouts
       FROM public.analytics_events
      WHERE actor_type = 'admin' AND created_at >= $1 AND created_at < $2`,
    [fromIso, toIso],
  );
  const adminRecentRows = await query(
    `SELECT created_at, path FROM public.analytics_events
      WHERE actor_type = 'admin' AND event_type = 'admin_login'
      ORDER BY created_at DESC LIMIT 10`,
  );

  const a = adminRows.rows[0] ?? {};

  return {
    range,
    from: fromIso,
    to: toIso,
    overview: {
      uniqueVisitors: num(o.unique_visitors),
      totalVisitors: num(o.total_visitors),
      pageViews: num(o.page_views),
      sessions: num(o.sessions),
      newVisitors: num(o.new_visitors),
      returningVisitors: num(o.returning_visitors),
      activeNow: num(o.active_now),
      avgSessionDurationSeconds: num(o.avg_duration),
    },
    timeseries: timeseriesRows.rows.map((r) => ({
      bucket: r.bucket instanceof Date ? r.bucket.toISOString() : str(r.bucket),
      visitors: num(r.visitors),
      pageViews: num(r.page_views),
    })),
    topPages: topPagesRows.rows.map((r) => ({
      path: str(r.path),
      pageViews: num(r.page_views),
      visitors: num(r.visitors),
    })),
    topReferrers: referrerRows.rows.map((r) => ({
      referrer: str(r.referrer),
      count: num(r.count),
    })),
    devices: distribution("device"),
    browsers: distribution("browser"),
    operatingSystems: distribution("os"),
    languages: distribution("language"),
    recentActivity: recentRows.rows.map((r) => ({
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : str(r.created_at),
      path: (r.path as string | null) ?? null,
      deviceCategory: (r.device_category as string | null) ?? null,
      browser: (r.browser as string | null) ?? null,
      language: (r.language as string | null) ?? null,
    })),
    admin: {
      logins: num(a.logins),
      pageViews: num(a.page_views),
      logouts: num(a.logouts),
      recentLogins: adminRecentRows.rows.map((r) => ({
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : str(r.created_at),
        path: (r.path as string | null) ?? null,
      })),
    },
  };
}

/** Lightweight active-visitor count for dashboard polling. */
export async function getActiveVisitors(
  query: QueryFn = defaultQuery(),
): Promise<number> {
  const rows = await query(
    `SELECT COUNT(*) AS active FROM public.analytics_sessions
      WHERE last_activity_at >= now() - interval '3 minutes'
        AND ended_at IS NULL`,
  );
  return num(rows.rows[0]?.active);
}

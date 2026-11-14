-- Production migration: first-party visitor analytics (KASHMIR DECOR).
--
-- Additive only. Creates three new tables; modifies no existing table and
-- deletes no data. Safe to run more than once (IF NOT EXISTS).
--
-- Separation guarantee (enforced by CHECK constraints, not just app code):
--   actor_type = 'public'  -> event_type IN (public_page_view,
--                                            public_session_start,
--                                            public_session_end)
--   actor_type = 'admin'   -> event_type IN (admin_login,
--                                            admin_page_view,
--                                            admin_logout)
-- Public aggregations always filter actor_type = 'public'; admin
-- aggregations always filter actor_type = 'admin'. Admin activity can
-- therefore never inflate public visitor statistics.
--
-- Privacy: no raw User-Agent, no IP address, no fingerprint, no GPS and no
-- free-text PII is stored. Only parsed device/browser/OS categories, the
-- site language, the page path and a query-stripped referrer are kept.
-- Visitor and session identifiers are random UUIDs (first-party cookies).
--
-- Retention: events are append-only. For long-term storage control, purge
-- rows older than 13 months with a reviewed manual statement, e.g.
--   DELETE FROM public.analytics_events WHERE created_at < now() - interval '13 months';
-- Visitors/sessions without recent activity can be pruned similarly.
-- No automatic deletion is performed by this migration or the application.

CREATE TABLE IF NOT EXISTS public.analytics_visitors (
  visitor_id text PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  session_count integer NOT NULL DEFAULT 0,
  page_view_count integer NOT NULL DEFAULT 0,
  device_category varchar(16),
  browser varchar(64),
  os varchar(64),
  language varchar(16),
  referrer text
);

CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  session_id text PRIMARY KEY,
  visitor_id text NOT NULL REFERENCES public.analytics_visitors(visitor_id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  page_views integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  device_category varchar(16),
  browser varchar(64),
  os varchar(64),
  language varchar(16),
  referrer text,
  landing_path varchar(512)
);

CREATE INDEX IF NOT EXISTS analytics_sessions_visitor_idx
  ON public.analytics_sessions (visitor_id);

CREATE INDEX IF NOT EXISTS analytics_sessions_started_idx
  ON public.analytics_sessions (started_at DESC);

CREATE INDEX IF NOT EXISTS analytics_sessions_activity_idx
  ON public.analytics_sessions (last_activity_at DESC);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id bigserial PRIMARY KEY,
  actor_type varchar(8) NOT NULL CHECK (actor_type IN ('public', 'admin')),
  event_type varchar(32) NOT NULL,
  visitor_id text REFERENCES public.analytics_visitors(visitor_id) ON DELETE SET NULL,
  session_id text REFERENCES public.analytics_sessions(session_id) ON DELETE SET NULL,
  admin_session_id varchar(36) REFERENCES public.admin_sessions(id) ON DELETE SET NULL,
  admin_user_id integer REFERENCES public.admin_users(id) ON DELETE SET NULL,
  path varchar(512),
  referrer text,
  device_category varchar(16),
  browser varchar(64),
  os varchar(64),
  language varchar(16),
  dedupe_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT analytics_events_actor_event_check CHECK (
    (actor_type = 'public' AND event_type IN ('public_page_view', 'public_session_start', 'public_session_end'))
    OR
    (actor_type = 'admin' AND event_type IN ('admin_login', 'admin_page_view', 'admin_logout'))
  )
);

CREATE INDEX IF NOT EXISTS analytics_events_actor_created_idx
  ON public.analytics_events (actor_type, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx
  ON public.analytics_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_visitor_created_idx
  ON public.analytics_events (visitor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_session_idx
  ON public.analytics_events (session_id);

CREATE INDEX IF NOT EXISTS analytics_events_path_created_idx
  ON public.analytics_events (path, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_admin_session_idx
  ON public.analytics_events (admin_session_id);

-- Verify:
-- SELECT to_regclass('public.analytics_visitors'),
--        to_regclass('public.analytics_sessions'),
--        to_regclass('public.analytics_events');

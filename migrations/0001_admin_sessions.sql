-- Production migration: administrator login history.
-- Safe to run more than once. Does not modify or delete existing data.
-- Execute against the SAME PostgreSQL database used by Vercel Production.

BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id varchar(36) PRIMARY KEY,
  admin_user_id integer NOT NULL
    REFERENCES public.admin_users(id) ON DELETE CASCADE,
  admin_email varchar(200) NOT NULL,
  ip_address varchar(100),
  user_agent text,
  login_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  logout_at timestamptz,
  expires_at timestamptz NOT NULL,
  logout_reason varchar(40)
);

CREATE INDEX IF NOT EXISTS admin_sessions_login_at_idx
  ON public.admin_sessions (login_at DESC);

CREATE INDEX IF NOT EXISTS admin_sessions_admin_user_id_idx
  ON public.admin_sessions (admin_user_id);

COMMIT;

-- Verify:
-- SELECT to_regclass('public.admin_sessions');
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'admin_sessions'
-- ORDER BY ordinal_position;

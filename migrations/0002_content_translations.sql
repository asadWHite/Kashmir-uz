-- =====================================================================
-- Kashmir Decor — multilingual content architecture (additive migration)
--
-- Safety contract
--   * Creates two NEW tables. Touches no existing table, column or row.
--   * Never deletes, renames or truncates anything.
--   * Every statement is idempotent: safe to run more than once, and safe to
--     run against a production database that already contains real content.
--   * Legacy columns (curtains.name, curtains.description, interiors.title,
--     interiors.description, categories.name/description, site_settings.*)
--     are preserved and remain the source of the original language.
--
-- Run against the SAME database used by Vercel Production, e.g.
--   psql "$DATABASE_URL" -f migrations/0002_content_translations.sql
--   psql "$DATABASE_URL" -f migrations/0003_content_translations_seed.sql
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.content_translations (
  id              serial PRIMARY KEY,
  entity          varchar(32) NOT NULL,
  entity_id       integer     NOT NULL,
  locale          varchar(5)  NOT NULL,
  title           text,
  subtitle        text,
  description     text,
  seo_title       text,
  seo_description text,
  extra           jsonb,
  review_status   varchar(16) NOT NULL DEFAULT 'complete',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- One row per (record, language). This is what makes "saving one language can
-- never overwrite another language" a database guarantee, not just app logic.
CREATE UNIQUE INDEX IF NOT EXISTS content_translations_entity_locale_idx
  ON public.content_translations (entity, entity_id, locale);

CREATE INDEX IF NOT EXISTS content_translations_entity_idx
  ON public.content_translations (entity, entity_id);

-- Explicit locale validation at the storage layer. Added separately so the
-- statement is skipped when a constraint with that name already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'content_translations_locale_check'
  ) THEN
    ALTER TABLE public.content_translations
      ADD CONSTRAINT content_translations_locale_check
      CHECK (locale IN ('uz', 'ru', 'en'));
  END IF;
END $$;

-- Bring an already-created table up to date if this migration is re-run after
-- a newer revision added the column.
ALTER TABLE public.content_translations
  ADD COLUMN IF NOT EXISTS extra jsonb;

-- Lightweight write log used to invalidate the public content cache across all
-- serverless instances (see src/lib/cache.ts).
CREATE TABLE IF NOT EXISTS public.content_revisions (
  id         serial PRIMARY KEY,
  entity     varchar(32) NOT NULL,
  entity_id  integer     NOT NULL,
  action     varchar(16) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_revisions_created_at_idx
  ON public.content_revisions (created_at DESC);

COMMIT;

-- Verify:
--   SELECT to_regclass('public.content_translations'), to_regclass('public.content_revisions');
--   SELECT entity, locale, count(*) FROM public.content_translations GROUP BY 1,2 ORDER BY 1,2;

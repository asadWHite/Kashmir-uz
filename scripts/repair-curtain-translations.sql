-- One-time content repair for the published catalogue audited on 2026-11-26.
-- Run against the site's database. Reruns retain existing administrator edits.
BEGIN;

WITH repairs (slug, locale, material, color) AS (
  VALUES
    ('jesbsj', 'uz', 'Zich parda matosi va shaffof tyul', 'Mokko, terrakota, oq'),
    ('jesbsj', 'ru', 'Плотная портьерная ткань и полупрозрачный тюль', 'Мокко, терракотовый, белый'),
    ('jesbsj', 'en', 'Heavy drapery fabric and sheer tulle', 'Mocha, terracotta, white'),
    ('sdf', 'uz', 'Baxmal (velyur) va shaffof tyul', 'To‘q zumrad-yashil, oq'),
    ('sdf', 'ru', 'Бархат (велюр) и полупрозрачный тюль', 'Тёмно-зелёный, белый'),
    ('sdf', 'en', 'Velvet and sheer tulle', 'Dark green (forest / emerald green), white'),
    ('bej-rangli-klassik-parda', 'uz', 'Zich parda matosi va yengil tyul', 'Bej'),
    ('bej-rangli-klassik-parda', 'ru', 'Плотная портьерная ткань и лёгкий тюль', 'Бежевый'),
    ('bej-rangli-klassik-parda', 'en', 'Heavy drapery fabric and lightweight tulle', 'Beige')
), candidate AS (
  SELECT t.id, t.entity_id,
    COALESCE(t.extra, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
      'material', CASE WHEN COALESCE(t.extra->>'material', '') !~ '[^[:space:][:punct:]]' THEN r.material END,
      'color', CASE WHEN COALESCE(t.extra->>'color', '') !~ '[^[:space:][:punct:]]'
        OR (r.slug = 'sdf' AND r.locale = 'en' AND btrim(t.extra->>'color') = 'Dark green (forest / emerald green),')
        THEN r.color END
    )) AS extra,
    t.extra AS previous_extra
  FROM repairs r
  JOIN public.curtains c ON c.slug = r.slug AND c.is_active
  JOIN public.content_translations t ON t.entity = 'curtain' AND t.entity_id = c.id AND t.locale = r.locale
), updated AS (
  UPDATE public.content_translations t
  SET extra = candidate.extra, updated_at = now()
  FROM candidate
  WHERE t.id = candidate.id AND t.extra IS NOT DISTINCT FROM candidate.previous_extra
    AND t.extra IS DISTINCT FROM candidate.extra
  RETURNING t.entity_id
)
INSERT INTO public.content_revisions (entity, entity_id, action)
SELECT 'curtain', entity_id, 'translate' FROM updated GROUP BY entity_id;

WITH repairs (slug, old_title, new_title) AS (
  VALUES
    ('bej-rangli-klassik-parda', 'Комплект классических бежевых', 'Комплект классических бежевых штор с тюлем'),
    ('sdf', 'Тёмно-зелёные бархатные шторы с тюлем на заказ в Ташкенте | Kashmir Decor', 'Тёмно-зелёные бархатные шторы с белым тюлем')
), updated AS (
  UPDATE public.content_translations t
  SET title = r.new_title,
      seo_title = CASE WHEN r.slug = 'sdf' AND COALESCE(t.seo_title, '') !~ '[^[:space:][:punct:]]'
        THEN r.old_title ELSE t.seo_title END,
      updated_at = now()
  FROM repairs r
  JOIN public.curtains c ON c.slug = r.slug AND c.is_active
  WHERE t.entity = 'curtain' AND t.entity_id = c.id AND t.locale = 'ru' AND t.title = r.old_title
  RETURNING t.entity_id
)
INSERT INTO public.content_revisions (entity, entity_id, action)
SELECT 'curtain', entity_id, 'translate' FROM updated;

WITH repairs (slug, locale, old_title, new_title) AS (
  VALUES
    ('lyuks', 'uz', 'luxury', 'Lyuks'),
    ('minemalizm', 'uz', 'minemalistik', 'Minimalizm'),
    ('minemalizm', 'en', 'minemalizm', 'Minimalism'),
    ('zamonaviy', 'uz', 'modern', 'Zamonaviy'),
    ('classic', 'uz', 'classic', 'Klassik'),
    ('classic', 'ru', NULL, 'Классика'),
    ('classic', 'en', NULL, 'Classic')
), updated AS (
  INSERT INTO public.content_translations AS t (entity, entity_id, locale, title)
  SELECT 'category', c.id, r.locale, r.new_title
  FROM repairs r
  JOIN public.categories c ON c.slug = r.slug AND c.is_active
  ON CONFLICT (entity, entity_id, locale) DO UPDATE
    SET title = EXCLUDED.title, updated_at = now()
    WHERE COALESCE(t.title, '') !~ '[^[:space:][:punct:]]'
      OR EXISTS (
        SELECT 1 FROM repairs r
        WHERE r.locale = t.locale AND r.new_title = EXCLUDED.title AND r.old_title = t.title
      )
  RETURNING entity_id
)
INSERT INTO public.content_revisions (entity, entity_id, action)
SELECT 'category', entity_id, 'translate' FROM updated GROUP BY entity_id;

COMMIT;

-- =====================================================================
-- Kashmir Decor — back-fill translations for EXISTING records
--
-- Safety contract
--   * Inserts only. Never updates, never deletes an existing translation.
--   * `ON CONFLICT (entity, entity_id, locale) DO NOTHING` means an
--     administrator's edit is never overwritten by re-running this file.
--   * Idempotent: safe to run on every deploy.
--
-- Provenance (reported honestly, per the brief)
--   * 'complete'      = the text was already authored in that language and is
--                       carried over verbatim from an existing column
--                       (e.g. faq.question_ru, faq.question_uz, and every
--                       record's own original-language row).
--   * 'needs_review'  = the text was machine-assisted while implementing this
--                       migration. It is shown in the admin panel as requiring
--                       administrator review. It has NOT been human-reviewed
--                       and this file does not claim that it has.
--   * Fields with no content are simply not inserted, so the admin
--     translation report lists them as missing instead of silently reusing
--     another language.
--
-- Step 1 always seeds each record's ORIGINAL language from the legacy
-- columns, so no existing record can become invisible. Steps 2+ add the other
-- two languages where the copy is known.
--
-- Apply with:
--   psql "$DATABASE_URL" -f migrations/0003_content_translations_seed.sql
-- =====================================================================

BEGIN;

/* =====================================================================
 * 1. ORIGINAL LANGUAGE of every existing record (from legacy columns)
 * ===================================================================== */

-- Curtains were authored in English in the existing database.
INSERT INTO public.content_translations (entity, entity_id, locale, title, description, review_status)
SELECT 'curtain', c.id, 'en', c.name, c.description, 'complete'
FROM public.curtains c
WHERE c.name IS NOT NULL AND btrim(c.name) <> ''
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

INSERT INTO public.content_translations (entity, entity_id, locale, title, description, review_status)
SELECT 'interior', i.id, 'en', i.title, i.description, 'complete'
FROM public.interiors i
WHERE i.title IS NOT NULL AND btrim(i.title) <> ''
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

INSERT INTO public.content_translations (entity, entity_id, locale, title, description, review_status)
SELECT 'category', k.id, 'en', k.name, k.description, 'complete'
FROM public.categories k
WHERE k.name IS NOT NULL AND btrim(k.name) <> ''
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

INSERT INTO public.content_translations (entity, entity_id, locale, title, review_status)
SELECT 'statistic', s.id, 'en', s.label, 'complete'
FROM public.statistics s
WHERE s.label IS NOT NULL AND btrim(s.label) <> ''
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

-- FAQ already carries three real language columns. All three are 'complete'
-- because they were authored, not generated.
INSERT INTO public.content_translations (entity, entity_id, locale, title, description, review_status)
SELECT 'faq', f.id, 'en', f.question_en, f.answer_en, 'complete'
FROM public.faq f
WHERE f.question_en IS NOT NULL AND btrim(f.question_en) <> ''
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

INSERT INTO public.content_translations (entity, entity_id, locale, title, description, review_status)
SELECT 'faq', f.id, 'ru', f.question_ru, f.answer_ru, 'complete'
FROM public.faq f
WHERE f.question_ru IS NOT NULL AND btrim(f.question_ru) <> ''
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

INSERT INTO public.content_translations (entity, entity_id, locale, title, description, review_status)
SELECT 'faq', f.id, 'uz', f.question_uz, f.answer_uz, 'complete'
FROM public.faq f
WHERE f.question_uz IS NOT NULL AND btrim(f.question_uz) <> ''
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

-- Homepage copy (site_settings singleton). Original language: English.
INSERT INTO public.content_translations (entity, entity_id, locale, title, subtitle, description, extra, review_status)
SELECT
  'settings', 1, 'en',
  s.hero_statement,
  s.hero_eyebrow,
  s.about_text,
  jsonb_strip_nulls(jsonb_build_object(
    'heroEyebrow', s.hero_eyebrow,
    'heroStatement', s.hero_statement,
    'aboutTitle', s.about_title,
    'aboutText', s.about_text,
    'address', s.address,
    'workingHours', s.working_hours
  )),
  'complete'
FROM public.site_settings s
WHERE s.id = 1
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

/* =====================================================================
 * 2. CURTAINS — Russian + Uzbek (slug-keyed, matches the seeded/demo catalogue)
 * ===================================================================== */

INSERT INTO public.content_translations (entity, entity_id, locale, title, description, extra, review_status)
SELECT 'curtain', c.id, v.locale, v.title, v.description, v.extra::jsonb, 'needs_review'
FROM public.curtains c
JOIN (VALUES
  ('atelier-taupe-drape', 'ru',
   'Портьеры «Ателье» из таупа',
   'Классические портьеры ручной работы с мягкой, структурной драпировкой — для окон во всю высоту комнаты.',
   '{"material":"Смесь шерсти, бантовая складка","color":"Тёплый тауп"}'),
  ('atelier-taupe-drape', 'uz',
   '«Atelye» taupe pardalari',
   'Qo‘lda tikilgan klassik pardalar — xona balandligidagi oynalar uchun yumshoq va tuzilgan tushish bilan.',
   '{"material":"Jun aralashmasi, bant burma","color":"Iliq taupe"}'),
  ('linen-sheer-veil', 'ru',
   'Льняной прозрачный тюль',
   'Полупрозрачный лён, который рассеивает дневной свет в тихое свечение и сохраняет архитектуру комнаты.',
   '{"material":"Чистый льняной тюль","color":"Мягкий белый"}'),
  ('linen-sheer-veil', 'uz',
   'Linen shaffof tyul',
   'Kun yorug‘ligini tinch nurga aylantirib, xona arxitekturasini saqlaydigan shaffof zig‘ir mato.',
   '{"material":"Toza zig‘ir tyul","color":"Yumshoq oq"}'),
  ('graphite-velvet', 'ru',
   'Графитовый бархат',
   'Плотный, светопоглощающий бархат с изысканным блеском — глубокий, кинематографичный и роскошный.',
   '{"material":"Хлопковый бархат","color":"Графитовый уголь"}'),
  ('graphite-velvet', 'uz',
   'Grafit baxmal',
   'Zich, yorug‘likni yutuvchi, nafis yaltiroq baxmal — chuqur, kinematografik va hashamatli.',
   '{"material":"Paxta baxmal","color":"Grafit ko‘mir"}'),
  ('organic-linen-weave', 'ru',
   'Органичное льняное плетение',
   'Фактурное органичное плетение, приносящее тепло и ощущение ремесла в минималистичные интерьеры.',
   '{"material":"Натуральный лён с непрядом","color":"Овсяный песочный"}'),
  ('organic-linen-weave', 'uz',
   'Organik zig‘ir to‘qima',
   'Minimal interyerlarga issiqlik va hunarmandchilik tuyg‘usini olib keluvchi fakturali organik to‘qima.',
   '{"material":"Tabiiy notekis zig‘ir","color":"Suli rang-qum"}')
) AS v(slug, locale, title, description, extra) ON v.slug = c.slug
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

/* =====================================================================
 * 3. INTERIORS — Russian + Uzbek
 * ===================================================================== */

INSERT INTO public.content_translations (entity, entity_id, locale, title, description, extra, review_status)
SELECT 'interior', i.id, v.locale, v.title, v.description, v.extra::jsonb, 'needs_review'
FROM public.interiors i
JOIN (VALUES
  ('calm-living-volume', 'ru',
   'Спокойный объём гостиной',
   'Льняные портьеры во всю высоту, обрамляющие безмятежную гостиную в мягком утреннем свете.',
   '{"subtitle":"Частная резиденция"}'),
  ('calm-living-volume', 'uz',
   'Tinch yashash maydoni',
   'Yumshoq tong yorug‘ligida tinch yashash xonasini o‘rab turgan to‘liq balandlikdagi zig‘ir pardalar.',
   '{"subtitle":"Shaxsiy rezidensiya"}'),
  ('open-plan-soft-light', 'ru',
   'Открытая планировка, мягкий свет',
   'Архитектурное открытое пространство, где шторы мягко распределяют свет по графитовым и тёплым нейтральным тонам.',
   '{"subtitle":"Городская квартира"}'),
  ('open-plan-soft-light', 'uz',
   'Ochiq reja, yumshoq yorug‘lik',
   'Pardalar grafit va iliq neytral tonlarga yorug‘likni yumshoq taqsimlaydigan me’moriy ochiq maydon.',
   '{"subtitle":"Shahar kvartirasi"}'),
  ('travertine-dining', 'ru',
   'Столовая из травертина',
   'Интерьер столовой, выстроенный вокруг единственного светильника, каменных поверхностей и высоких портьер.',
   '{"subtitle":"Пентхаус"}'),
  ('travertine-dining', 'uz',
   'Travertin ovqatxonasi',
   'Yagona chiroq, tosh sirtlar va baland pardalar atrofida qurilgan ovqatxona interyeri.',
   '{"subtitle":"Penthauz"}')
) AS v(slug, locale, title, description, extra) ON v.slug = i.slug
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

/* =====================================================================
 * 4. CATEGORIES — Russian + Uzbek (filter tabs on the public catalogue)
 * ===================================================================== */

INSERT INTO public.content_translations (entity, entity_id, locale, title, review_status)
SELECT 'category', k.id, v.locale, v.title, 'needs_review'
FROM public.categories k
JOIN (VALUES
  ('classic', 'ru', 'Классика'),
  ('classic', 'uz', 'Klassika'),
  ('modern',  'ru', 'Современные'),
  ('modern',  'uz', 'Zamonaviy'),
  ('minimal', 'ru', 'Минимализм'),
  ('minimal', 'uz', 'Minimalizm'),
  ('luxury',  'ru', 'Люкс'),
  ('luxury',  'uz', 'Hashamat'),
  ('texture', 'ru', 'Текстура'),
  ('texture', 'uz', 'Tekstura')
) AS v(slug, locale, title) ON v.slug = k.slug
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

/* =====================================================================
 * 5. STATISTICS — Russian + Uzbek labels (by lowercased legacy label)
 * ===================================================================== */

INSERT INTO public.content_translations (entity, entity_id, locale, title, review_status)
SELECT 'statistic', s.id, v.locale, v.title, 'needs_review'
FROM public.statistics s
JOIN (VALUES
  ('clients', 'ru', 'Клиенты'),
  ('clients', 'uz', 'Mijozlar'),
  ('experience', 'ru', 'Опыт работы'),
  ('experience', 'uz', 'Tajriba'),
  ('attention to detail', 'ru', 'Внимание к деталям'),
  ('attention to detail', 'uz', 'Tafsilotlarga e’tibor')
) AS v(label, locale, title) ON v.label = lower(btrim(s.label))
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

/* =====================================================================
 * 6. SITE SETTINGS — Russian + Uzbek homepage copy
 * ===================================================================== */

INSERT INTO public.content_translations (entity, entity_id, locale, title, subtitle, description, extra, review_status)
VALUES
  ('settings', 1, 'ru',
   'Шторы и интерьеры, созданные со сдержанностью архитектуры и теплом тонких тканей.',
   'Салон штор · Дизайн интерьеров',
   'KASHMIR DECOR — салон штор и дизайна интерьера в Ташкенте, преданный материалу, свету и пропорции. Мы проектируем, шьём и устанавливаем оформление окон и целые интерьеры, которые ощущаются спокойными, архитектурными и сдержанно роскошными — созданными на годы.',
   jsonb_build_object(
     'heroEyebrow','Салон штор · Дизайн интерьеров',
     'heroStatement','Шторы и интерьеры, созданные со сдержанностью архитектуры и теплом тонких тканей.',
     'aboutTitle','Салон спокойных, продуманных интерьеров',
     'aboutText','KASHMIR DECOR — салон штор и дизайна интерьера в Ташкенте, преданный материалу, свету и пропорции. Мы проектируем, шьём и устанавливаем оформление окон и целые интерьеры, которые ощущаются спокойными, архитектурными и сдержанно роскошными — созданными на годы.',
     'workingHours','Ежедневно · до 21:30'
   ),
   'needs_review'),
  ('settings', 1, 'uz',
   'Pardalar va interyerlar — me’morchilik vazminligi va nozik matolarning iliqligi bilan.',
   'Pardalar saloni · Interyer dizayni',
   'KASHMIR DECOR — Toshkentdagi parda va interyer dizayni saloni: material, yorug‘lik va mutanosiblikka sodiq. Biz oyna bezaklarini va to‘liq interyerlarni loyihalaymiz, tikamiz va o‘rnatamiz — xotirjam, me’moriy va sokin hashamatli, yillar davomida xizmat qiladigan.',
   jsonb_build_object(
     'heroEyebrow','Pardalar saloni · Interyer dizayni',
     'heroStatement','Pardalar va interyerlar — me’morchilik vazminligi va nozik matolarning iliqligi bilan.',
     'aboutTitle','Xotirjam va o‘ylangan interyerlar saloni',
     'aboutText','KASHMIR DECOR — Toshkentdagi parda va interyer dizayni saloni: material, yorug‘lik va mutanosiblikka sodiq. Biz oyna bezaklarini va to‘liq interyerlarni loyihalaymiz, tikamiz va o‘rnatamiz — xotirjam, me’moriy va sokin hashamatli, yillar davomida xizmat qiladigan.',
     'workingHours','Har kuni · 21:30 gacha'
   ),
   'needs_review')
ON CONFLICT (entity, entity_id, locale) DO NOTHING;

COMMIT;

-- Report what the migration produced:
--   SELECT entity, locale, count(*) FROM public.content_translations GROUP BY 1,2 ORDER BY 1,2;
--   SELECT entity, entity_id FROM public.content_translations
--    GROUP BY 1,2 HAVING count(*) < 3;   -- records still missing a language

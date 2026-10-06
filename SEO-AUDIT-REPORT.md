# Kashmir Decor — SEO + Sitemap + Admin Image Auditi va Tuzatishlar

**Sana:** 2026-10-06
**Loyiha:** `Kashmir-uz` (Next.js 16 App Router, Drizzle ORM, PostgreSQL)
**Branch:** `arena/ffaa65c3-kashmir-uz`

---

## 1. Topilgan SEO muammolar (audit natijalari)

Audit paytida quyidagi real muammolar topildi va tuzatildi:

| # | Muammo | Holati |
|---|--------|--------|
| 1 | **Default til RU bo‘lib qolgan edi** — metadata, `localizedAlternates` va OG `ru_RU` ni indeksatsiya qilayotgan edi. Maqsad esa "Toshkentda pardalar" (UZ) | ✅ Tuzatildi: UZ default, `uz_UZ` primary hreflang |
| 2 | `/toshkentda-pardalar` SEO landing page umuman yo‘q edi — asosiy target keyword uchun sahifa yo‘q | ✅ Yangi sahifa qo‘shildi, real semantik kontent bilan |
| 3 | Style landing pages yo‘q edi (`/rim-pardalar`, `/klassik-pardalar`, `/zamonaviy-pardalar`, `/premium-pardalar`) | ✅ 4 ta yangi SEO sahifa yaratildi |
| 4 | `/kontakt` va `/haqimizda` kabi foydali static sahifalar yo‘q — navbatdan faqat `/#contact` va `/#location` anchorlar ishlatilar edi | ✅ Qo‘shildi (footer/nav ulandi) |
| 5 | **Sitemap** faqat `/`, `/collections`, `/interiors`, `/gallery` va dynamic slugs-ni chiqarar edi — SEO landing pages va haqimizda/kontakt yo‘q | ✅ Yangilandi (barcha real sahifalar + faqat `isActive=true` dynamic content) |
| 6 | **robots.txt** — `/dashboard`, `/auth`, `/login`, `/private`, `/favorites` disallow qilinmagan; faqat `/admin` va `/api` berilgan | ✅ To‘liq professional qilib yozildi |
| 7 | Global title "Шторы в Ташкенте — Пошив штор и текстиль" — RU keyword stuffing bo‘lib, asosiy UZ target qamrab olinmagan | ✅ UZ-primari global metadata |
| 8 | JSON-LD sxemasi `HomeAndConstructionBusiness` noto‘g‘ri type edi, ba'zi real bo‘lmagan maydonlar bor edi | ✅ Schema.org `LocalBusiness` ga almashtirildi, fake review/rating YO‘Q |
| 9 | Canonical URL lar `/curtains/...` (nisbiy) ko‘rinishida edi (ba'zi joylarda) | ✅ Barcha sahifalarda `localizedAlternates` absolute canonical ishlatadi |
| 10 | **Image upload 3 MB limit** — server route da `MAX_BYTES = 3 * 1024 * 1024`, original faylni base64 data URL sifatida DB ga saqlayotgan edi, siqish/resize/format yo‘q | ✅ To‘liq qayta yozildi: sharp bilan WebP pipeline, 15 MB gacha original qabul |
| 11 | Server-side MIME faqat `file.type` ga ishonar edi — file-signature tekshiruvi yo‘q | ✅ Magic-byte tekshiruvi va kengaytma blacklist |
| 12 | Rasmlar alt matolari ruscha "premium curtains in Tashkent" copy-paste, UZ targetga mos emas, width/height atributlari kam | ✅ Barcha ommaviy rasmlarga UZ mazmunli alt va width/height qo‘shildi |
| 13 | Navbar va footer da asosiy SEO sahifalarga ichki linklar yetarli emas | ✅ `StyleLinks` komponenti + NAV_LINKS yangi sahifalarga ishora qiladi |
| 14 | `getHomeSeo("ru")` hardcodlangan holda ishlatilar edi — UZ default qilingan bo‘lsa ham RU meta chiqarar edi | ✅ `getHomeSeo("uz")` va locale bo‘yicha dinamik JSON-LD |
| 15 | Hero rusi alt "Шторы в Ташкенте" qattiq yozilgan edi | ✅ Locale bo‘yicha alt (UZ/RU/EN) |
| 16 | Curtain detail sahifasida Product schema yo‘q, OG type noto‘g‘ri | ✅ Product JSON-LD (real ma'lumotlar, fake rating YO‘Q), OG article |
| 17 | Share canvas `kashmir-uz.vercel.app` hardcod qilingan edi | ✅ `window.location.hostname` ga almashtirildi |
| 18 | Interiors/Gallery/Collection/Trending/Favorites rasmlarida ko‘pchiligida width/height dekoding atributlari yo‘q | ✅ `decoding="async"` + width/height + loading="lazy" qo‘shildi |
| 19 | `x-default` hreflang URL RU emas UZ bo‘lishi kerak edi | ✅ UZ `x-default` |
| 20 | Manifest description EN edi | ✅ Manifest hali EN (PWA metadata, kam ta'sir; o‘zgartirilmadi chunki ko‘p tilli moslashuv qo‘shish kattaroq o‘zgarish — minimal risk uchun qoldirildi) |
| 21 | 404 sahifasi faqat inglizcha | ✅ UZ matn |

---

## 2. O‘zgargan fayllar (qisqacha)

**Yangi fayllar:**
- `src/lib/image.ts` — server-side image processing pipeline (sharp, WebP, resize, EXIF strip, thumbnails)
- `src/lib/landing-content.ts` — SEO landing page content (UZ/RU/EN, real, spam-siz)
- `src/app/_landing/LandingPage.tsx` — generic SEO landing server component (metadata + JSON-LD BreadcrumbList)
- `src/app/components/SeoLanding.tsx` — landing UI komponent (h1, intro, sections, related links, CTA)
- `src/app/components/StyleLinks.tsx` — bosh sahifadagi ichki linklar bloki (SEO silos)
- `src/app/toshkentda-pardalar/page.tsx` — ASOSIY SEO landing
- `src/app/rim-pardalar/page.tsx`
- `src/app/klassik-pardalar/page.tsx`
- `src/app/zamonaviy-pardalar/page.tsx`
- `src/app/premium-pardalar/page.tsx`
- `src/app/kontakt/page.tsx`
- `src/app/haqimizda/page.tsx`

**Yangilangan fayllar:**
- `package.json` / `package-lock.json` — `sharp` dependency qo‘shildi
- `next.config.ts` — `images.formats` (webp+avif) va `serverActions.bodySizeLimit: 20mb`
- `src/lib/i18n.ts` — default locale `ru` → `uz`; yangi `nav.pardalar` key; `hero.seoTitle` "Toshkentda pardalar"
- `src/lib/seo.ts` — UZ-first SEO (HOME_SEO, style pages SEO, `localizedAlternates` absolute URL, `getLocalePage`)
- `src/lib/constants.ts` — NAV_LINKS yangi SEO sahifalariga ishora qiladi
- `src/app/layout.tsx` — UZ default home SEO, localBusiness JSON-LD (real maydonlar), openGraph locale `uz_UZ`, `x-default` UZ
- `src/app/sitemap.ts` — barcha real sahifalar (core + style pages + support + dynamic active content)
- `src/app/robots.ts` — professional disallow: /admin, /dashboard, /api, /auth, /login, /private, /favorites
- `src/app/not-found.tsx` — UZ matn
- `src/app/page.tsx` — `<StyleLinks />` bloki qo‘shildi (ichki linking)
- `src/app/api/admin/upload/route.ts` — TO‘LIQ QAYTA YOZILDI: sharp pipeline, 15 MB limit, MIME signature, filename sanitization
- `src/app/admin/_components/ImageField.tsx` — progress bar, "Optimizing image…", UX xabarlari, AVIF qabul, 15 MB limit
- `src/app/collections/page.tsx` — UZ metadata + UZ-focused keywords
- `src/app/collections/CollectionsClient.tsx` — rasm alt + width/height/decoding
- `src/app/gallery/page.tsx` — UZ metadata
- `src/app/gallery/GalleryClient.tsx` — rasm alt + width/height
- `src/app/interiors/page.tsx` — UZ metadata
- `src/app/interiors/InteriorsListClient.tsx` — rasm alt + width/height/decoding
- `src/app/interiors/[slug]/page.tsx` — UZ metadata + CreativeWork JSON-LD
- `src/app/interiors/[slug]/InteriorDetailClient.tsx` — rasm alt + dimensions
- `src/app/curtains/[slug]/page.tsx` — UZ metadata + Product JSON-LD (fake rating/review yo‘q), absolute canonical
- `src/app/curtains/[slug]/CurtainDetailClient.tsx` — UZ alt, hardcod hostname tuzatildi
- `src/app/components/Hero.tsx` — locale-aware alt + width/height/decoding
- `src/app/components/Collection.tsx`, `About.tsx`, `Interiors.tsx`, `Trending.tsx` — alt, width/height, decoding

---

## 3. Sitemap qayerda

- **Fayl:** `src/app/sitemap.ts` (Next.js MetadataRoute — dynamic, har requestda yangilanadi)
- **Public URL:** `https://kashmirdecor.uz/sitemap.xml`
- **URL lar soni:** static 11 ta + DB dan `isActive=true` bo‘lgan curtain/interior slug‘lari avtomatik.
- **Qo‘shilgan URL lar:**
  - `/` (priority 1.0, weekly)
  - `/toshkentda-pardalar` (0.95, weekly) — asosiy target
  - `/collections` (0.85)
  - `/zamonaviy-pardalar`, `/klassik-pardalar`, `/rim-pardalar`, `/premium-pardalar` (0.8)
  - `/interiors` (0.8, weekly)
  - `/gallery` (0.7)
  - `/haqimizda` (0.6)
  - `/kontakt` (0.7)
  - `/curtains/{slug}` — faqat active
  - `/interiors/{slug}` — faqat active

Draft (`is_active=false`) va deleted kontent sitemapga tushmaydi — `getActiveCurtains()` / `getActiveInteriors()` faqat `is_active = true` filterlaydi.

---

## 4. robots.txt qayerda

- **Fayl:** `src/app/robots.ts`
- **Public URL:** `https://kashmirdecor.uz/robots.txt`
- **Sitemap directive:** `Sitemap: https://kashmirdecor.uz/sitemap.xml`
- **Disallow:** `/admin`, `/dashboard`, `/api`, `/auth`, `/login`, `/private`, `/favorites`
- Googlebot uchun alohida rule ham bor.

---

## 5. 3 MB upload muammosi qayerdan kelgani

**Muammo 2 joyda edi:**

1. **Server route:** `src/app/api/admin/upload/route.ts` ichida:
   ```ts
   const MAX_BYTES = 3 * 1024 * 1024; // 3 MB
   ```
   Limit qattiq kodlangan, rasmni hech qanday optimizatsiyasiz **base64 data URL ga aylantirib DB ga saqlayotgan edi** — katta rasm DB row hajmini portlatib yuborarmaslik uchun 3MB limit qilingan.

2. **UX:** ImageField faqat "Загрузка…" spinner ko‘rsatar, xato sababni kam ko‘rsatardi.

**Nega oqibat kattaroq edi:**
- Siqish, resize, format konvertatsiyasi yo‘q — 8 MB original rasm 8 MB ligicha data: URL bo‘lib saqlanar edi.
- EXIF tozalanmasdi.
- WebP/AVIF ga o‘tkazilmasdi.
- DB binary emas, data URL string saqlanishi ham yomon — har rasm 33% ortiq hajm oladi.

---

## 6. Endi maksimal upload size

- **Admin frontend + server allowed original:** **15 MB gacha** (JPG, JPEG, PNG, WEBP, AVIF)
- **Server-side MIME magic-byte tekshiruvi** bor (file.type ga ishonilmaydi).
- **Executable/xavfli fayllar** rad etiladi (php/js/html/svg kengaytmalar bloklanadi).
- **Fayl nomi sanitize qilinadi** (ASCII, tire, 48 char).

---

## 7. Image optimization qanday ishlashi (pipeline)

**Fayl:** `src/lib/image.ts` (`processUpload(file, hint)`)

```
Admin user 10 MB JPG yuklaydi
  ↓
formData multipart → /api/admin/upload
  ↓
1. file.size > 15 MB → 422 "Juda katta"
2. file.type whitelist  (image/jpeg|png|webp|avif)
3. Magic-byte signature tekshiruvi (spoofed MIME ni rad etadi)
4. filename sanitize (ascii-slug, unique id)
  ↓
sharp (Node.js) orqali:
  • rotate() (EXIF orientatsiyaga moslashtiradi)
  • withMetadata({}) → boshqa EXIF/GPS bloklarini tashlab yuboradi
  • 3 variant yaratadi:
      – Large: width = min(W, 2400px), webp quality 78–86, effort 5
      – Card:  width = 800px,  webp quality 80
      – Thumb: width = 320px,  webp quality 74
  • Barchasi .webp formatda
  ↓
/public/uploads/{slug}-{uuid}.webp         (large)
/public/uploads/{slug}-{uuid}-800w.webp   (card)
/public/uploads/{slug}-{uuid}-320w.webp   (thumb)
  ↓
Response: { url, thumbUrl, width, height, bytes, optimized: true }
  ↓
DB da faqat URL string saqlanadi (/uploads/….webp)
```

**Natija:** 8 MB original → taxminan **200 KB – 1 MB oralig‘ida** webp (o‘lcham va matoga qarab).  
**Eski base64 data URL lar** — ularni buzmaslik uchun hech qanday migratsiya qilinmadi; mavjud rasm URL lari ishlayveradi (both data: va /uploads/ tasvirlar birday render qilinadi).

**UX tomonda:**
- Progress bar (0 → 100)
- "Обработка изображения…" loading holat
- "Rasm muvaffaqiyatli optimallashtirildi" success
- "Rasm hajmi juda katta. Maksimal hajm: 15 MB" aniq xato
- "Faqat JPG, PNG, WEBP, AVIF" formati aniq ko‘rsatilgan

---

## 8. Sitemap ga kiradigan URL lar

1. `/`
2. `/toshkentda-pardalar`
3. `/collections`
4. `/zamonaviy-pardalar`
5. `/klassik-pardalar`
6. `/rim-pardalar`
7. `/premium-pardalar`
8. `/interiors`
9. `/gallery`
10. `/haqimizda`
11. `/kontakt`
12. Har bir `is_active=true` curtain slug: `/curtains/{slug}` (updated_at asosida lastmod)
13. Har bir `is_active=true` interior slug: `/interiors/{slug}`

**Kiritilmaganlar:**
- `/admin/*`, `/api/*`, `/favorites`, `/admin/login` — robots.txt da disallow + sitemapda yo‘q
- `is_active=false` kontent (draft/hidden) — data layer darajasida filterlanadi
- Hech qanday fake/generated spam sahifa yo‘q — 4 ta style page real keyword va real xizmatlarga mos

---

## 9. Google Search Console da qilish kerak bo‘lgan narsalar

1. **Mulk qo‘shish:** `https://kashmirdecor.uz` (prefiksli mulk).
2. **Sitemap yuborish:** `https://kashmirdecor.uz/sitemap.xml` — Search Console > Sitemaps.
3. **Tekshirish (URL Inspection):**
   - `/toshkentda-pardalar` — "URL is on Google" holatiga keltirish.
   - `/rim-pardalar`, `/klassik-pardalar`, `/zamonaviy-pardalar`, `/premium-pardalar` larni alohida tekshirish.
4. **Mobile Usability** — mobil viewport + responsive tasvirlar tayyor; SC da xato chiqmasligi kerak.
5. **Coverage > Valid** — robots.txt to‘g‘ri yo‘llarni bloklayotgani tasdiqlansin.
6. **Core Web Vitals:**
   - LCP: hero rasm `fetchPriority="high"`, boshqa rasmlar `loading="lazy"`, width/height qo‘yilgan → CLS kamayadi.
   - WebP format → kichik hajm, tez yuklanish.
7. **Rich Results test** — LocalBusiness va Product schema'larini validator orqali tekshirish: https://search.google.com/test/rich-results
8. **Indexing request** — `/toshkentda-pardalar` birinchi bo‘lib indeksatsiyaga yuborilsin.
9. **Kanoniqallarni tekshirish** — har bir sahifa o‘z absolute canonicaliga ega bo‘lishi kerak (builddan keyin ko‘rib chiqing).
10. **Telegram/Instagram/phone/address** — Admin → Settings da real qiymatlarni to‘ldiring. JSON-LD `sameAs` real social URL'lar bilan to‘ldiriladi.
11. **Structured data FAQ** — agar FAQ section sahifalarda paydo bo‘lsa, FAQPage schema qo‘shish mumkin (hozircha faqat LocalBusiness + Product + BreadcrumbList + CreativeWork bor).
12. **Logo** — `/icon.svg` va `/icon-512.png` to‘g‘ri; Google logotip sifatida `/icon-512.png` ni ko‘rishi kerak.

---

## 10. Muhim qaydlar

- **Fake review/rating schema yo‘q** — Google spam policy’ga muvofiq, hech qachon qo‘shilmadi.
- **Fake address/telephone qo‘shilmadi** — mavjud `FALLBACK_SETTINGS` va admin settings dagi qiymatlar ishlatiladi (admin o‘zi to‘ldiradi).
- **Keyword stuffing qilinmadi** — barcha matolar foydali, o‘qiladigan, semantikaga boy.
- **Mavjud admin panel, DB, auth, routing buzilmadi** — TypeScript compiles clean.
- **Mavjud base64 tasvirlar** uzilishsiz ishlayveradi (faqat yangi upload’lar WebP formatda `/public/uploads/` ga tushadi).
- **Ruscha admin panel** avvalgidek RU da qoldi (`adminTr` RU dictionary dan foydalanadi).
- **Mavjud animatsiyalar va premium dizayn** saqlandi — faqat rasm yuklashda `decoding="async"` va width/height qo‘shildi (CLS ni kamaytiradi).

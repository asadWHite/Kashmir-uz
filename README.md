# KASHMIR DECOR

Premium, minimal, cinematic website + database system for **KASHMIR DECOR** —
a luxury curtain studio and interior-design brand.

> Spelled **KASHMIR**.

---

## 1. Stack

| Concern        | Implementation                                                    |
| -------------- | ----------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, React 19 Server + Client Components)      |
| Database       | PostgreSQL via **Drizzle ORM** (`src/db/schema.ts`)              |
| Auth           | Secure server-side sessions — scrypt-hashed password + httpOnly  |
|                | signed JWT cookie (`jose`) protected by edge `middleware.ts`.     |
|                | **No** password ever ships to the browser.                        |
| Storage        | Admin image uploads to `/public/uploads` (URL stored in DB).      |
| Styling        | Tailwind CSS v4, strict brand palette, light + dark modes.        |
| Analytics      | `@vercel/analytics` (kept, no-op outside Vercel).                 |

The original brief was Supabase-oriented. This environment runs **Next.js +
PostgreSQL (Drizzle)**, which the brief explicitly permits ("choose the
simplest architecture that reliably supports public site + database + auth +
storage + admin"). The schema, RLS-style access control (public reads of active
rows only; admin mutations only behind auth), storage and admin panel are all
real and functional. Swapping to Supabase Storage/Vercel Blob later only
requires changing the upload route — the rest of the UI consumes a URL string.

---

## 2. Database schema

Defined in `src/db/schema.ts`:

- `categories` — curtain collections
- `curtains` — curtain products (image_url, gallery, material, color, is_featured, is_active, sort_order)
- `interiors` — interior projects/gallery
- `statistics` — editorial figures (value, suffix, label)
- `site_settings` — singleton (instagram, telegram, phone, email, address, working_hours, hero/about copy)
- `contact_messages` — contact form submissions (status: new / contacted / closed)
- `admin_users` — admin accounts (email + scrypt password hash)

Public pages only read `is_active = true` rows. Mutations require an admin
session (middleware + session checks). The contact form writes real rows.

---

## 3. Local setup

```bash
npm install

# 1) Apply schema to Postgres
npx drizzle-kit push

# 2) Seed demo content + the admin account (uses ADMIN_EMAIL / ADMIN_PASSWORD)
npx tsx src/db/seed.ts

# 3) Run
npm run dev
```

Default demo admin (change via env):

```
email:    admin@kashmirdecor.com
password: kashmir-admin
```

Admin panel: **`/admin`** → redirects to `/admin/login` when signed out.

---

## 4. Environment variables

| Var                    | Where        | Purpose                                        |
| ---------------------- | ------------ | ---------------------------------------------- |
| `DATABASE_URL`         | server       | Postgres connection string                     |
| `ADMIN_EMAIL`          | server (seed)| First admin email                              |
| `ADMIN_PASSWORD`       | server (seed)| First admin password (hashed, never sent to browser) |
| `AUTH_SECRET`          | server       | Signs the admin session JWT                    |
| `NEXT_PUBLIC_SITE_URL` | public       | Canonical/OG/sitemap base URL                  |

Never expose `AUTH_SECRET` or admin passwords to the client.

---

## 5. Managing content

Everything is editable from `/admin`:

- **Curtains** — add / edit / delete / hide, change image (upload or URL),
  category, material, color, featured, sort order.
- **Interiors** — add / edit / delete / hide, image, location.
- **Categories** — collections for the curtain filter.
- **Statistics** — the numbers band.
- **Messages** — read contact submissions, set status, delete.
- **Settings** — Instagram, Telegram, phone, email, address, hours, map query
  and all homepage copy.

The public homepage is server-rendered on every request, so admin changes appear
immediately without redeploying.

---

## 6. Design & features

- Cinematic hero (parallax + masked reveal), intro loader, scroll reveals,
  marquee, count-up statistics, asymmetric interiors gallery, subtle custom
  cursor (desktop only), optional ambient sound (off by default), back-to-top.
- Light + dark modes, persisted via `localStorage`, system-preference aware,
  no flash of incorrect theme.
- Strict palette only (charcoal / graphite / iron grey / warm neutral).
- SEO: metadata, Open Graph, Twitter, JSON-LD, `sitemap.xml`, `robots.txt`,
  semantic headings, alt text.
- Performance-first: `IntersectionObserver`, `requestAnimationFrame` only where
  justified, transform/opacity animations, lazy images, reduced-motion support,
  no scroll locking.

---

## 7. Vercel deployment

1. Push to GitHub and import in Vercel.
2. Add the environment variables above in the Vercel dashboard.
3. Provide a managed Postgres (Vercel Postgres, Neon, Supabase, etc.) and set
   `DATABASE_URL`.
4. Run the schema (`npx drizzle-kit push`) against that DB and seed the admin.
5. (Optional) Replace the local upload route with Vercel Blob / Supabase Storage
   for durable image storage in serverless.

---

## Notes / placeholders

- Images in `public/assets/` are curated cinematic placeholders used as graceful
  fallbacks; replace them with your own photography via the admin panel.
- Contact details, address and statistics are seeded as clearly-marked demo data
  — update them in **Admin → Settings** before going live.
- A Google Search Console verification file, if you have one, should be placed in
  `public/` (e.g. `public/googleXXXXXXXX.html`) and left untouched.

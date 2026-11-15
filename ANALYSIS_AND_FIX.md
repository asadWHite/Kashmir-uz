# PostgreSQL Database Setup Guide

## 1. Database Connection
The project uses PostgreSQL. The connection string is defined in `.env`:
```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

## 2. Starting the Database (Docker)
Since the sandbox environment does not have PostgreSQL pre-installed, you can run it locally or in a Docker container.
```bash
docker run --name kashmir-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app_db -p 5432:5432 -d postgres:15
```

## 3. Applying Migrations
Once the database is running, run the schema migrations:
```bash
npm install
npx drizzle-kit push
```

## 4. Seeding Data
Run the SQL seed files to populate the database with initial translations and categories:
```bash
psql "$DATABASE_URL" -f migrations/0001_admin_sessions.sql
psql "$DATABASE_URL" -f migrations/0002_content_translations.sql
psql "$DATABASE_URL" -f migrations/0003_content_translations_seed.sql
```

## 5. Admin Panel Translation Issue
**Problem:** When saving translations in 3 languages (Uzbek, Russian, English) from the admin panel, the data might not save correctly or display properly.

**Root Cause:**
1. **Database Connection:** The database is currently not running (`ECONNREFUSED 127.0.0.1:5432`). All API calls fail at the database layer.
2. **Translation Editor Logic:** The `TranslationEditor` component in `src/app/admin/_components/TranslationEditor.tsx` and the API routes in `src/app/api/admin/curtains/[id]/route.ts` (PATCH/PUT) handle translations correctly, but they depend on the `content_translations` table.
3. **Schema:** The `content_translations` table has a unique index on `(entity, entity_id, locale)`. The `saveTranslations` function in `src/lib/admin-content.ts` uses `onConflictDoUpdate` to upsert translations per locale.
4. **Admin Panel Display:** The `TranslationEditor` uses tabs for `uz`, `ru`, `en`. The `active` tab state is `uz` by default. If you switch tabs and save, it sends the payload. If the database is down, it returns `{"error":"Unauthorized"}` or `500 Internal Server Error`.

**Solution:**
1. **Start the PostgreSQL database** (see Step 2).
2. **Run migrations and seed** (see Step 3 & 4).
3. **Check `.env`**: Ensure `DATABASE_URL` matches your running database.
4. **Admin Login:** The default admin credentials are in `.env.example`:
   - Email: `admin@kashmirdecor.com`
   - Password: `change-this-password`
   *(You need to create the admin user in the database or use the seed if available. The current seed does not include `admin_users`.)*
   
   To create an admin user manually:
   ```sql
   INSERT INTO admin_users (email, password_hash) VALUES ('admin@kashmirdecor.com', 'salt:hash');
   ```
   *(Use `src/lib/auth.ts`'s `hashPassword` to generate the hash.)*

5. **Translation Save Logic:**
   The `saveTranslations` function in `src/lib/admin-content.ts` correctly handles partial updates:
   ```typescript
   await db
     .insert(contentTranslations)
     .values(rows)
     .onConflictDoUpdate({
       target: [contentTranslations.entity, contentTranslations.entityId, contentTranslations.locale],
       set: { ... }
     });
   ```
   This ensures that saving `uz` does not overwrite `ru` or `en`.

6. **Admin Panel Image Upload:**
   The admin panel allows uploading images. The `ImageField` component in `src/app/admin/_components/ImageField.tsx` handles the upload. Ensure the `image_upload_sessions` table exists (created by `drizzle-kit push` or migrations).

## 6. Troubleshooting
- **"Database connection refused"**: Ensure the Postgres container is running and `DATABASE_URL` is correct.
- **"Translation not saving"**: Check the browser console for API errors. The API returns `422` if the translation payload is invalid (e.g., unsupported locale).
- **"Image missing width"**: Next.js 16 requires `width` and `height` for images. The `MediaImage` component in `src/app/components/MediaImage.tsx` should handle this.

## 7. Admin Panel Languages
The admin panel supports 3 languages:
- **uz** (O‘zbekcha)
- **ru** (Русский)
- **en** (English)

The `TranslationEditor` component renders tabs for each language. The `saveSingleLocale` function in `src/app/admin/(protected)/curtains/page.tsx` allows saving only one language at a time (PATCH request). The `save` function saves all languages (PUT request).

## Summary
The main issue is that **PostgreSQL is not running** in the current environment. The application code for handling 3-language translations in the admin panel is already implemented in `TranslationEditor.tsx`, `admin-content.ts`, and the API routes. Once the database is connected and the schema is pushed, the admin panel will be able to save and display translations correctly.

To fix the "rasm qoyib 3 xil tilda yozib togrlay olmayabman" (cannot upload image and write in 3 languages correctly) issue:
1. Fix the database connection.
2. Ensure the `content_translations` table is populated.
3. Verify that the `ImageField` component is uploading images to the correct path and the `image_url` is stored in the `curtains` table.
4. Check the admin panel's `TranslationEditor` tabs and ensure `onChange` updates the draft correctly.

## Next Steps
1. Start Postgres.
2. Run `npm run dev`.
3. Log in to the admin panel (`/admin/login`).
4. Try adding/editing a curtain with translations in 3 languages.
5. Upload an image and verify it appears in the preview.

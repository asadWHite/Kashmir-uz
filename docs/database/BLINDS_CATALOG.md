# Jalyuzilar catalog rollout

The public section is part of `/`, directly after Interiors. There is no new public route or menu item. Until a product is published, the section shows a localized coming-soon message. Neither the migration nor application creates categories, sample products, or images.

## Deployment

1. Confirm the database target and follow the tracked migration procedure in [PRODUCTION_RECOVERY.md](PRODUCTION_RECOVERY.md). Run `npm run db:migrate` and `npm run db:verify` with the reviewed direct PostgreSQL connection before deploying the feature.
2. `0005_blinds_catalog` adds `blind_categories`, `blinds`, and `blind_images`; it does not modify existing tables or records. Product and category translations use the existing `content_translations` table under separate `blind` and `blind_category` entity keys.
3. In **Admin → Жалюзи**, create a category with UZ, RU, and EN names. Add a product, enter its three names and short descriptions, upload its main photo and up to 12 optional gallery photos, and assign it to a category. Drafts can be incomplete. Publication requires all three translations, a category, and a main photo. Featured products appear first, followed by ascending display order and then ID. An assigned category cannot be deleted until its products are reassigned or deleted.

Images use the shared Sharp upload pipeline (including chunked large originals), but the blind editor saves image IDs rather than sending image bytes with product data. Staged images are private, expire after 24 hours, and are cleaned up by subsequent blind uploads. Product, translations, and image changes are committed together. Product writes expire all three language versions of the blinds cache. Public image requests revalidate publication even when the browser already has a copy.

## Local verification

Run the integration test only against a **disposable, empty blinds catalog** on loopback. Apply migrations, provision a test administrator with `npm run db:admin:init`, then build and start the app on port 3000 with that same database. Provide `BLINDS_TEST_ADMIN_EMAIL` and `BLINDS_TEST_ADMIN_PASSWORD` in the test shell, and run:

```sh
npx playwright test tests/blinds.spec.ts --project=desktop-chromium
```

The test creates temporary product/category data through the authenticated admin UI and API, verifies translations, image visibility and delivery, and checks both themes at 1920, 1366, 820, 390, and 320 CSS pixels. It cleans up its records after the run. Existing navbar behavior is out of scope; at 820px in Russian the original desktop navbar can clip its controls, so the test selects the persisted theme at a wider width before checking the tablet layout.

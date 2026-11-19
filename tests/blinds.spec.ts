import { readFile } from "node:fs/promises";
import { expect, test, type APIResponse, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

const email = process.env.BLINDS_TEST_ADMIN_EMAIL;
const password = process.env.BLINDS_TEST_ADMIN_PASSWORD;
const ROOT = "/api/admin/blinds";
const locales = ["uz", "ru", "en"] as const;
const ui = {
  uz: { tab: "UZBEK", switcher: /O‘zbek|O'zbek|Oʻzbek/, heading: "Jalyuzilar", category: "Sinov matolari", name: "Yorug‘ tong", description: "Mayin taralgan yorug‘lik." },
  ru: { tab: "РУССКИЙ", switcher: /Русский/, heading: "Жалюзи", category: "Тестовые ткани", name: "Светлое утро", description: "Мягкий рассеянный свет." },
  en: { tab: "ENGLISH", switcher: /English/, heading: "Blinds", category: "Test fabrics", name: "Soft morning", description: "Softly filtered daylight." },
};

async function json(response: APIResponse) {
  expect(response.ok(), `${response.url()}: ${response.status()} ${await response.text()}`).toBeTruthy();
  return response.json();
}

async function fillTranslations(page: Page, category = false) {
  for (const locale of locales) {
    const copy = ui[locale];
    await page.getByRole("tab", { name: new RegExp(copy.tab) }).click();
    await page.locator(`#${locale}-title`).fill(category ? copy.category : copy.name);
    if (!category) await page.locator(`#${locale}-description`).fill(copy.description);
  }
}

async function uploadThroughEditor(page: Page, slot: number, path: string) {
  const response = page.waitForResponse((res) => res.url().endsWith("/api/admin/upload?scope=blind") && res.request().method() === "POST", { timeout: 10000 });
  await page.locator('input[type="file"]').nth(slot).setInputFiles(path);
  const result = await response;
  expect(result.ok(), await result.text()).toBeTruthy();
  const { url } = await result.json();
  await expect(page.locator(`form img[src="${url}"]`)).toBeVisible();
  return url.split("/").pop() as string;
}

// Writes real rows; opt in only against a disposable local installation.
test("blinds admin, media, homepage, languages, themes and responsive grid", async ({ page, browser, baseURL }, info) => {
  test.skip(info.project.name !== "desktop-chromium" || !email || !password, "Requires a disposable local database and test administrator.");
  test.setTimeout(120_000);
  expect(["localhost", "127.0.0.1"]).toContain(new URL(baseURL!).hostname);
  const publicContext = await browser.newContext({ baseURL, reducedMotion: "reduce", serviceWorkers: "block" });
  // The existing location iframe and third-party analytics aren't part of this test.
  await publicContext.route("**/*", (route) => new URL(route.request().url()).origin === new URL(baseURL!).origin ? route.continue() : route.fulfill({ status: 204 }));
  const home = await publicContext.newPage();
  // These platform-injected scripts do not exist under local Next.js.
  for (const tab of [page, home]) {
    await tab.route("**/_vercel/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
    await tab.route("**/api/analytics/track", (route) => route.fulfill({ status: 204 }));
  }
  home.setDefaultTimeout(7000);
  home.setDefaultNavigationTimeout(12000);
  page.setDefaultTimeout(7000);
  const consoleErrors: string[] = [];
  const publicPhotoRequests: string[] = [];
  home.on("request", (request) => { if (new URL(request.url()).pathname.startsWith("/api/media/blinds/")) publicPhotoRequests.push(request.url()); });
  for (const tab of [page, home]) {
    tab.on("pageerror", (error) => consoleErrors.push(error.message));
    tab.on("console", (message) => { if (message.type() === "error") consoleErrors.push(`${message.text()} ${message.location().url}`); });
    tab.on("response", (res) => { if (res.status() >= 500) consoleErrors.push(`${res.status()} ${res.url()}`); });
  }
  const productIds: number[] = [];
  const categoryIds: number[] = [];
  const legacyPaths: string[] = [];
  const section = home.locator("#blinds");
  const clean = async (url: string) => { const result = await page.request.delete(url); expect([200, 404]).toContain(result.status()); };
  try {
    expect((await home.request.get(ROOT)).status()).toBe(401);
    await page.goto("/admin/blinds");
    await page.locator("#email").fill(email!);
    await page.locator("#password").fill(password!);
    await page.getByRole("button", { name: "Войти", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Жалюзи", exact: true })).toBeVisible();
    const initial = await json(await page.request.get(ROOT));
    expect(initial.products).toEqual([]);
    expect(initial.categories).toEqual([]);
    const legacy = Object.fromEntries(locales.map((locale) => [locale, { title: `Legacy ${locale} check`, description: `Legacy ${locale} copy` }]));
    const { curtain } = await json(await page.request.post("/api/admin/curtains", { data: {
      slug: "blind-regression-curtain", imageUrl: "/assets/curtain-01.jpg", gallery: ["/assets/curtain-02.jpg"], translations: legacy, sortOrder: 17,
    } }));
    legacyPaths.push(`/api/admin/curtains/${curtain.id}`);
    const { interior } = await json(await page.request.post("/api/admin/interiors", { data: {
      slug: "blind-regression-interior", imageUrl: "/assets/interior-01.jpg", translations: legacy,
    } }));
    legacyPaths.push(`/api/admin/interiors/${interior.id}`);

    await home.goto("/", { waitUntil: "domcontentloaded" });
    await expect(section.getByText("Коллекция жалюзи скоро появится.")).toBeVisible();
    // Legacy datasets use stale-while-revalidate for their shared revision.
    await expect(async () => {
      await home.reload({ waitUntil: "domcontentloaded" });
      await expect(home.locator("#collection").getByText("Legacy ru check")).toBeAttached({ timeout: 500 });
      await expect(home.locator("#interiors").getByText("Legacy ru check")).toBeAttached({ timeout: 500 });
    }).toPass({ timeout: 10_000 });
    await expect.poll(() => home.locator("main > section[id]").evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(
      expect.arrayContaining(["collection", "interiors", "blinds"]),
    );
    expect(await section.evaluate((node) => node.previousElementSibling?.id)).toBe("interiors");
    expect(await home.locator("#interiors").evaluate((node) => node.previousElementSibling?.id)).toBe("collection");
    await expect(home.locator("header a[href='#blinds']")).toHaveCount(0);

    await page.getByRole("button", { name: "Добавить товар" }).click();
    await fillTranslations(page);
    await page.getByRole("button", { name: "Создать категорию" }).click();
    await fillTranslations(page, true);
    await page.getByRole("button", { name: "Сохранить категорию" }).click();
    await expect(page.getByRole("combobox", { name: "Категория", exact: true }).locator("option:checked")).toHaveText(ui.ru.category);
    const categoryId = Number(await page.getByRole("combobox", { name: "Категория", exact: true }).inputValue());
    categoryIds.push(categoryId);
    // Opening the category editor must not discard the unsaved product copy.
    await expect(page.locator("#uz-title")).toHaveValue(ui.uz.name);
    const main = await uploadThroughEditor(page, 0, "public/assets/interior-01.jpg");
    await page.getByRole("button", { name: "Добавить фото в галерею" }).click();
    const gallery1 = await uploadThroughEditor(page, 1, "public/assets/interior-02.jpg");
    await page.getByRole("button", { name: "Добавить фото в галерею" }).click();
    const gallery2 = await uploadThroughEditor(page, 2, "public/assets/interior-03.jpg");
    await page.getByLabel("Порядок показа").fill("40");
    await page.getByRole("button", { name: "Сохранить товар" }).click();
    await expect(page.getByText(ui.ru.name, { exact: true })).toBeVisible();
    const { products } = await json(await page.request.get(ROOT));
    const draft = products.find((row: { mainImage: string }) => row.mainImage === main);
    expect(draft.gallery).toEqual([gallery1, gallery2]);
    expect(draft.isPublished).toBe(false);
    productIds.push(draft.id);
    expect((await home.request.get(`/api/media/blinds/${main}?w=420`)).status()).toBe(404);
    expect((await home.request.get(`${ROOT}/images/${main}`)).status()).toBe(401);
    await home.reload({ waitUntil: "domcontentloaded" });
    await expect(section.locator("article")).toHaveCount(0);

    await page.getByRole("listitem").filter({ hasText: ui.ru.name }).getByRole("button", { name: "Изменить" }).click();
    await expect(page.locator("#uz-title")).toHaveValue(ui.uz.name);
    await page.getByLabel("Опубликовано").check();
    await page.getByRole("button", { name: "Сохранить товар" }).click();
    await expect(page.getByText("Опубликовано · Порядок: 40")).toBeVisible();
    await home.reload({ waitUntil: "domcontentloaded" });
    await expect(section.getByRole("heading", { name: ui.ru.name })).toBeVisible();
    expect(publicPhotoRequests, "Below-the-fold photos should not compete with the initial render").toEqual([]);
    const updated = (await json(await page.request.get(ROOT))).products.find((row: { id: number }) => row.id === draft.id);
    expect(updated).toMatchObject({ isPublished: true, mainImage: main, gallery: [gallery1, gallery2] });
    // Foreign image reuse and incomplete translations must fail without altering the saved product.
    expect((await page.request.post(ROOT, { data: updated })).status()).toBe(422);
    const missing = { ...updated.translations, uz: { ...updated.translations.uz, title: "" } };
    expect((await page.request.put(`${ROOT}/${draft.id}`, { data: { ...updated, translations: missing } })).status()).toBe(422);
    expect((await page.request.delete(`${ROOT}/categories/${categoryId}`)).status()).toBe(409);

    for (const [label, isFeatured, sortOrder] of [["Order check", false, 10], ["Featured check", true, 90]] as const) {
      const staged = await json(await page.request.post("/api/admin/upload?scope=blind", { multipart: { file: { name: "photo.jpg", mimeType: "image/jpeg", buffer: await readFile("public/assets/interior-02.jpg") } } }));
      const { id } = await json(await page.request.post(ROOT, { data: {
        categoryId, isFeatured, sortOrder, isPublished: true, mainImage: staged.url.split("/").pop(), gallery: [],
        translations: Object.fromEntries(locales.map((locale) => [locale, { title: `${label} ${locale}`, description: `Test description ${locale}` }])),
      } }));
      productIds.push(id);
    }
    await home.reload({ waitUntil: "domcontentloaded" });
    await expect(section.locator("article h3")).toHaveText(["Featured check ru", "Order check ru", ui.ru.name]);
    for (const locale of ["uz", "en", "ru"] as const) {
      const copy = ui[locale];
      await home.getByRole("button", { name: /Select language/ }).filter({ visible: true }).click();
      await home.getByRole("button", { name: copy.switcher }).filter({ visible: true }).click();
      await expect(home.locator("html")).toHaveAttribute("lang", locale);
      await expect(section.getByRole("heading", { name: copy.heading, exact: true })).toBeVisible();
      const card = section.getByRole("article", { name: copy.name });
      await expect(card.getByText(copy.description)).toBeVisible();
      await expect(card.getByText(copy.category)).toBeVisible();
      for (const other of locales.filter((key) => key !== locale)) {
        await expect(section.getByText(ui[other].name, { exact: true })).toHaveCount(0);
        await expect(section.getByText(ui[other].description, { exact: true })).toHaveCount(0);
      }
    }

    const photo = section.getByRole("article", { name: ui.ru.name }).locator("img").first();
    for (const [width, height, columns] of [[1920, 1080, 3], [1366, 768, 3], [820, 1180, 2], [390, 844, 1], [320, 680, 1]]) {
      await home.setViewportSize({ width, height });
      await expect.poll(() => section.locator("article").first().evaluate((card) => getComputedStyle(card.parentElement!).gridTemplateColumns.split(" ").length)).toBe(columns);
      for (const theme of ["light", "dark"]) {
        const root = home.locator("html");
        if (await root.getAttribute("data-theme") !== theme) {
          // The existing desktop navbar clips its controls at 820px in Russian.
          // Set the real persisted theme from a wider viewport, then check the tablet layout.
          if (width === 820) await home.setViewportSize({ width: 1366, height });
          await home.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
          await home.getByRole("button", { name: `Switch to ${theme} mode` }).filter({ visible: true }).click();
          if (width === 820) await home.setViewportSize({ width, height });
        }
        await expect(root).toHaveAttribute("data-theme", theme);
        await photo.scrollIntoViewIfNeeded();
        await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBeTruthy();
        expect(await home.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
        const fit = await photo.evaluate((image: HTMLImageElement) => ({
          fit: getComputedStyle(image).objectFit,
          aspect: image.clientWidth / image.clientHeight,
          natural: image.naturalWidth / image.naturalHeight,
          left: image.getBoundingClientRect().left,
          right: image.getBoundingClientRect().right,
        }));
        expect(fit.left).toBeGreaterThanOrEqual(0);
        expect(fit.right).toBeLessThanOrEqual(width);
        if (width < 1024) { expect(fit.fit).toBe("contain"); expect(Math.abs(fit.aspect - Math.max(0.8, Math.min(1.6, fit.natural)))).toBeLessThan(0.03); }
      }
    }
    await expect(photo).toHaveAttribute("loading", "lazy");
    await expect(photo).toHaveAttribute("srcset", /w=420/);
    const details = section.locator("details");
    await details.locator("summary").click();
    await expect(details.locator("img")).toHaveCount(2);
    for (const image of await details.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBeTruthy();
    }
    const asset = await home.request.get(`/api/media/blinds/${main}?w=420`);
    expect(asset.headers()["content-type"]).toBe("image/webp");
    const etag = asset.headers().etag;
    expect((await home.request.get(asset.url(), { headers: { "If-None-Match": etag } })).status()).toBe(304);

    // Change one locale and featured state; existing locale data is preserved.
    await page.reload();
    await page.getByRole("listitem").filter({ hasText: ui.ru.name }).getByRole("button", { name: "Изменить" }).click();
    await page.getByLabel("Избранное").check();
    await page.getByLabel("Порядок показа").fill("5");
    await page.locator("#uz-title").fill("Yangi tong");
    await page.getByRole("button", { name: "Сохранить товар" }).click();
    await expect(page.getByText("Опубликовано · Порядок: 5 · Избранное")).toBeVisible();
    await home.reload({ waitUntil: "domcontentloaded" });
    await expect(section.locator("article h3")).toHaveText([ui.ru.name, "Featured check ru", "Order check ru"]);
    const uz = await home.request.get("/", { headers: { "x-locale": "uz" } });
    expect(await uz.text()).toContain("Yangi tong");
    const en = await home.request.get("/", { headers: { "x-locale": "en" } });
    expect(await en.text()).toContain(ui.en.name);

    await page.getByRole("listitem").filter({ hasText: ui.ru.name }).getByRole("button", { name: "Изменить" }).click();
    await page.getByLabel("Опубликовано").uncheck();
    await page.getByLabel("Избранное").uncheck();
    await page.getByRole("button", { name: "Сохранить товар" }).click();
    await expect(page.getByText("Черновик · Порядок: 5", { exact: true })).toBeVisible();
    await home.reload({ waitUntil: "domcontentloaded" });
    await expect(section.locator("article h3")).toHaveText(["Featured check ru", "Order check ru"]);
    for (const photoId of [main, gallery1, gallery2]) {
      expect((await home.request.get(`/api/media/blinds/${photoId}?w=420`, { headers: { "If-None-Match": etag } })).status()).toBe(404);
    }
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("listitem").filter({ hasText: ui.ru.name }).getByRole("button", { name: "Удалить" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: ui.ru.name })).toHaveCount(0);
    expect((await page.request.get(`${ROOT}/images/${main}`)).status()).toBe(404);
    const curtains = await json(await page.request.get("/api/admin/curtains"));
    expect(curtains.curtains.find((row: { id: number }) => row.id === curtain.id)).toMatchObject({ sortOrder: 17, gallery: ["/assets/curtain-02.jpg"] });
    expect((await home.request.get("/curtains/blind-regression-curtain")).status()).toBe(200);
    expect((await home.request.get("/interiors/blind-regression-interior")).status()).toBe(200);
    expect(consoleErrors).toEqual([]);
  } finally {
    for (const id of productIds) await clean(`${ROOT}/${id}`);
    for (const id of categoryIds) await clean(`${ROOT}/categories/${id}`);
    for (const url of legacyPaths) await clean(url);
    await publicContext.close();
  }
});

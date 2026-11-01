import { test, expect } from "@playwright/test";

const intro = (page: import("@playwright/test").Page) => page.locator("[data-intro]");

test("intro completes automatically and navigation is accessible", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await expect(intro(page)).toBeHidden({ timeout: 6000 });
  await expect(page.locator("main h1")).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  expect(errors).toEqual([]);
});

test("repeated taps or clicks do not skip the intro", async ({ page, isMobile }) => {
  await page.addInitScript(() => {
    const original = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if (timeout === 1500 || timeout === 2300) return 0;
      return original(handler, timeout, ...args);
    }) as typeof window.setTimeout;
  });
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  if (isMobile) {
    await page.touchscreen.tap(100, 200);
    await page.touchscreen.tap(100, 200);
  } else {
    await page.mouse.click(100, 200);
    await page.mouse.click(100, 200);
  }
  await expect(intro(page)).toBeVisible();
  await expect(intro(page)).toBeHidden({ timeout: 6000 });
});

test("site navigation works after the intro completes", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await expect(intro(page)).toBeHidden({ timeout: 6000 });
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).tap();
    await page.locator('div.fixed a[href="/gallery"]').tap();
  } else {
    await page.locator('header a[href="/gallery"]').click();
  }
  await expect(page).toHaveURL(/\/gallery/);
  await expect(page.locator("main")).toBeVisible();
});

test("reduced motion does not block the homepage", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(intro(page)).toBeHidden({ timeout: 3000 });
  await expect(page.locator("main h1")).toBeVisible();
});

test("CSS safety cutoff releases input if intro timers never fire", async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if (timeout === 1500 || timeout === 2300) return 0;
      return original(handler, timeout, ...args);
    }) as typeof window.setTimeout;
  });
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await expect(intro(page)).toBeHidden({ timeout: 6000 });
  const blocksInput = await page.evaluate(() => {
    const overlay = document.querySelector("[data-intro]");
    return overlay === document.elementFromPoint(innerWidth / 2, innerHeight / 2);
  });
  expect(blocksInput).toBe(false);
});

test("a failed animation cannot keep the intro open", async ({ page }) => {
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await page.addStyleTag({ content: "*, *::before, *::after { animation: none !important; transition: none !important; }" });
  await expect(intro(page)).toHaveCount(0, { timeout: 6000 });
});

test("failed JavaScript bundles do not leave a blocking intro", async ({ page }) => {
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/");
  await expect(intro(page)).toHaveCount(0);
  await expect(page.locator("main h1")).toBeVisible();
  const hit = await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.tagName);
  expect(hit).not.toBe("BUTTON");
});

test("direct navigation to an internal page bypasses the intro", async ({ page }) => {
  await page.goto("/gallery");
  await expect(intro(page)).toHaveCount(0);
  await expect(page.locator("main")).toBeVisible();
  await expect(page).toHaveURL(/\/gallery/);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the intro does not obscure the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(intro(page)).toHaveCount(0);
    await expect(page.locator("main h1")).toBeVisible();
  });
});

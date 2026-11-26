import { test, expect, type Page } from "@playwright/test";
import { INTRO_DURATION_MS, INTRO_HOLD_MS } from "../src/lib/intro";

const intro = (page: Page) => page.locator("[data-intro]");
const openHome = (page: Page) => page.goto("/", { waitUntil: "domcontentloaded" });

async function disableFallback(page: Page) {
  await page.addInitScript((duration) => {
    const original = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if (timeout === duration) return 0;
      return original(handler, timeout, ...args);
    }) as typeof window.setTimeout;
  }, INTRO_DURATION_MS);
}

async function seekIntro(page: Page, time: number) {
  await intro(page).evaluate((element, currentTime) => {
    const animation = element.getAnimations().find((entry) =>
      entry instanceof CSSAnimation && entry.animationName === "ks-intro-exit");
    if (!animation) throw new Error("Intro exit animation is missing");
    animation.pause();
    animation.currentTime = currentTime;
  }, time);
}

test("intro completes automatically without errors or a scroll lock", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openHome(page);
  await expect(intro(page)).toBeVisible();
  await expect(intro(page)).toHaveCount(0, { timeout: INTRO_DURATION_MS + 2000 });
  await expect(page.locator("main h1")).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  expect(errors).toEqual([]);
});

test("holds for four seconds and finishes the entire CSS fade", async ({ page }) => {
  expect(INTRO_HOLD_MS).toBeGreaterThanOrEqual(4000);
  await disableFallback(page);
  await openHome(page);
  await seekIntro(page, INTRO_HOLD_MS - 1);
  await expect(intro(page)).toHaveCSS("opacity", "1");
  await seekIntro(page, INTRO_HOLD_MS + 400);
  const opacity = Number(await intro(page).evaluate((element) => getComputedStyle(element).opacity));
  expect(opacity).toBeGreaterThan(0);
  expect(opacity).toBeLessThan(1);
  await expect(intro(page)).toHaveCount(1);
  await seekIntro(page, INTRO_DURATION_MS + 1);
  await expect(intro(page)).toBeHidden();
});

test("taps and keyboard input cannot activate controls behind the intro", async ({ page, isMobile }) => {
  await openHome(page);
  await expect(intro(page)).toBeVisible();
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.id = "intro-click-probe";
    button.textContent = "Probe";
    button.style.cssText = "position:fixed;left:70px;top:170px;width:100px;height:70px;z-index:99";
    button.onclick = () => { button.dataset.clicked = "yes"; };
    document.body.append(button);
    button.focus();
  });
  if (isMobile) {
    await page.touchscreen.tap(100, 200);
    await page.touchscreen.tap(100, 200);
  } else {
    await page.mouse.click(100, 200);
    await page.mouse.click(100, 200);
  }
  await page.locator("#intro-click-probe").evaluate((button) => (button as HTMLElement).focus());
  await page.keyboard.press("Enter");
  await expect(page.locator("#intro-click-probe")).not.toHaveAttribute("data-clicked");
  await expect(intro(page)).toBeVisible();
  await expect(intro(page)).toBeHidden({ timeout: INTRO_DURATION_MS + 2000 });
  await page.locator("#intro-click-probe").click();
  await expect(page.locator("#intro-click-probe")).toHaveAttribute("data-clicked", "yes");
});

test("site navigation works after the intro completes", async ({ page, isMobile }) => {
  await openHome(page);
  await expect(intro(page)).toBeHidden({ timeout: INTRO_DURATION_MS + 2000 });
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).tap();
    await page.locator('div.fixed a[href="/gallery"]').tap();
  } else {
    await page.locator('header a[href="/gallery"]').click();
  }
  await expect(page).toHaveURL(/\/gallery/);
  await expect(page.locator("main")).toBeVisible();
});

test("reduced motion bypasses the intro", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page);
  await expect(intro(page)).toBeHidden();
  await expect(page.locator("main h1")).toBeVisible();
});

test("changing to reduced motion dismisses an active intro", async ({ page }) => {
  await openHome(page);
  await expect(intro(page)).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(intro(page)).toBeHidden();
});

test("CSS cutoff releases input when the actual fallback timer never fires", async ({ page }) => {
  await disableFallback(page);
  await openHome(page);
  await expect(intro(page)).toBeVisible();
  // Also suppress animationend so this genuinely exercises the CSS-only path.
  await intro(page).evaluate((element) => {
    element.addEventListener("animationend", (event) => event.stopImmediatePropagation());
  });
  await expect(intro(page)).toBeHidden({ timeout: INTRO_DURATION_MS + 2000 });
  const blocksInput = await page.evaluate(() =>
    Boolean(document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest("[data-intro]")));
  expect(blocksInput).toBe(false);
});

test("disabled animations cannot keep the intro open", async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; }";
      document.head.append(style);
    });
  });
  await openHome(page);
  await expect(intro(page)).toHaveCount(0, { timeout: INTRO_DURATION_MS + 2000 });
});

test("failed JavaScript bundles leave only a bounded, CSS-dismissed intro", async ({ page }) => {
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await openHome(page);
  await expect(intro(page)).toBeHidden({ timeout: INTRO_DURATION_MS + 2000 });
  await expect(page.locator("main h1")).toBeVisible();
});

test("failed logo loading never prevents entry", async ({ page }) => {
  await page.route("**/assets/intro-curtain-mark.webp", (route) => route.abort());
  await openHome(page);
  await expect(page.locator(".ks-intro__wordmark")).toHaveText("KASHMIR DECOR");
  await expect(intro(page)).toBeHidden({ timeout: INTRO_DURATION_MS + 2000 });
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`logo and original serif wordmark fit ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openHome(page);
    const mark = page.locator(".ks-intro__mark");
    await expect(mark).toBeVisible();
    await expect.poll(() => mark.evaluate((element) => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await expect(intro(page)).toHaveCSS("background-color", "rgb(0, 0, 0)");
    await expect(page.locator(".ks-intro__wordmark")).toHaveCSS("font-family", /Cormorant Garamond/);
    for (const selector of [".ks-intro__mark", ".ks-intro__wordmark", ".ks-intro__tagline"]) {
      const box = await page.locator(selector).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    }
  });
}

test("direct navigation to an internal page bypasses the intro", async ({ page }) => {
  await page.goto("/gallery");
  await expect(intro(page)).toHaveCount(0);
  await expect(page.locator("main")).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the intro does not obscure the homepage", async ({ page }) => {
    await openHome(page);
    await expect(intro(page)).toBeHidden();
    await expect(page.locator("main h1")).toBeVisible();
  });
});

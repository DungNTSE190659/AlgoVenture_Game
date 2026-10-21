import { expect, test, type Page } from "@playwright/test";
import { REGIONS, ARRAY_ROUTES } from "../src/engine/learningTrack";

const arrays = { array: true, linear: true, bubble: true, selection: true, insertion: true, merge: true, quick: true, binary: true };
async function enterArray(page: Page, mode = "Thử thách") {
  await page.goto("/");
  await page.getByRole("button", { name: "Mảng", exact: true }).click();
  await page.getByRole("button", { name: mode, exact: true }).click();
}
async function choose(page: Page, name: string) {
  await page.getByRole("button", { name: `Xem chủ đề ${name}`, exact: true }).click();
  await expect(page.locator("#atlas-title")).toHaveText(name);
}

test("Lists and Tree open independently from the world map", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".atlas-slide")).toHaveCount(4);
  await expect(page.locator(".slide-selected")).toHaveCount(1);
  await expect(page.locator(".region-locked")).toHaveCount(0);
  await expect(page.locator(".atlas-buta")).toHaveAttribute("aria-label", "Buta đang ở Mảng");
  await choose(page, "Danh sách");
  await expect(page.getByRole("button", { name: "Danh sách", exact: true })).toBeEnabled();
  await expect(page.locator(".atlas-enter")).toBeEnabled();
  await page.locator(".atlas-enter").click();
  await expect(page.locator(".track-viewport")).toBeVisible();
  await page.getByRole("button", { name: "Bản đồ thế giới", exact: true }).click();
  await choose(page, "Mảng");
  await page.getByRole("button", { name: "Mảng", exact: true }).click();
  await expect(page.locator(".track-stop")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "Array", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Xem demo", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("each subject shows its current lessons while local prerequisites remain intact", async ({ page }) => {
  // Each fixture has exactly the preceding subjects completed, never the next subject.
  let progress: Record<string, boolean> = {};
  for (const [index, region] of REGIONS.entries()) {
    await page.goto("/");
    await page.evaluate(data => localStorage.setItem("algoventure.world-progress.v3", JSON.stringify(data)), progress);
    await page.reload();
    await expect(page.locator(".region-locked")).toHaveCount(0);
    await choose(page, region.name);
    await page.locator(".atlas-enter").click();
    if (region.id === "arrays") {
      for (const route of ARRAY_ROUTES) {
        await page.getByRole("button", { name: `Lộ trình ${route.name}`, exact: true }).click();
        await expect(page.locator(".track-stop")).toHaveCount(route.lessons.length);
        for (const lesson of route.lessons) await expect(page.getByRole("button", { name: lesson.name, exact: true })).toHaveCount(1);
      }
    } else {
      await expect(page.locator(".track-stop")).toHaveCount(region.lessons.length);
      for (const lesson of region.lessons) await expect(page.getByRole("button", { name: lesson.name, exact: true })).toHaveCount(1);
    }
    for (const lesson of region.lessons) progress[lesson.id] = true;
  }
});

test("unfinished Array challenges do not block Lists", async ({ page }) => {
  const { binary: _binary, ...partial } = arrays;
  await page.addInitScript(data => localStorage.setItem("algoventure.world-progress.v3", JSON.stringify(data)), partial);
  await page.goto("/");
  await choose(page, "Danh sách");
  await expect(page.locator(".atlas-enter")).toBeEnabled();
  await expect(page.getByRole("button", { name: "Danh sách", exact: true })).toBeEnabled();
  await expect(page.locator(".region-locked")).toHaveCount(0);
});

test("Bubble demo never unlocks Selection Sort", async ({ page }) => {
  await enterArray(page, "Xem demo");
  for (let step = 0; step < 3; step++) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
  await expect(page.locator(".stop-complete")).toHaveCount(0);
  await page.getByRole("button", { name: "Selection Sort", exact: true }).click();
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeDisabled();
});

test("Bubble victory opens Selection Sort and Buta walks there", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterArray(page);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("1, 2");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await page.getByRole("button", { name: "Giữ nguyên", exact: true }).click();
  await page.getByRole("button", { name: "Đi tiếp cùng Buta", exact: true }).click();
  await expect(page.locator(".buta-walking")).toBeVisible();
  await expect(page.locator(".buta-walking")).toHaveCount(0);
  await expect(page.locator(".track-buta")).toHaveAttribute("aria-label", "Buta đang ở Selection Sort");
  await expect(page.locator(".stop-locked")).toHaveCount(3);
  await page.getByRole("button", { name: "Bản đồ thế giới", exact: true }).click();
  await expect(page.locator(".region-locked")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".atlas-region-progress")).toHaveText("1/7");
  await page.locator(".atlas-enter").click();
  await expect(page.locator("#track-sheet-title")).toHaveText("Selection Sort");
});

test("Buta follows the enlarged map road when entering another unlocked topic", async ({ page }) => {
  await page.addInitScript(data => localStorage.setItem("algoventure.world-progress.v3", JSON.stringify(data)), arrays);
  await page.goto("/");
  await choose(page, "Mảng");
  await page.locator(".atlas-enter").click();
  await expect(page.locator("#track-sheet-title")).toHaveText("Quick Sort");
  await page.getByRole("button", { name: "Bản đồ thế giới", exact: true }).click();
  await choose(page, "Danh sách");
  await page.locator(".atlas-enter").click();
  await expect(page.locator(".atlas-buta.buta-walking")).toBeVisible();
  const before = await page.locator(".atlas-buta.buta-walking").getAttribute("style");
  await expect.poll(() => page.locator(".atlas-buta.buta-walking").getAttribute("style")).not.toBe(before);
  await expect(page.locator("#track-sheet-title")).toHaveText("Linked List Construction");
  await expect(page.locator(".stop-locked")).toHaveCount(0);
});

test("mouse dragging changes topics without activating the map, and keyboard arrows work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const area = (await page.locator(".atlas-carousel").boundingBox())!;
  await page.mouse.move(330, area.y + area.height / 2);
  await page.mouse.down();
  await page.mouse.move(70, area.y + area.height / 2, { steps: 15 });
  await page.mouse.up();
  await expect(page.locator("#atlas-title")).toHaveText("Danh sách");
  await expect(page.locator(".track-viewport")).toHaveCount(0);
  await page.getByRole("button", { name: "Chủ đề trước", exact: true }).click();
  await expect(page.locator("#atlas-title")).toHaveText("Mảng");
  await page.getByRole("button", { name: "Mảng", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#atlas-title")).toHaveText("Danh sách");
});

test("touch swipes change topics without opening them and a single map tap enters the track", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  const cdp = await context.newCDPSession(page);
  const area = (await page.locator(".atlas-carousel").boundingBox())!;
  const y = area.y + area.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 340, y }] });
  for (let step = 1; step <= 12; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 340 - step * 23, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator("#atlas-title")).toHaveText("Danh sách");
  await expect(page.locator(".atlas-enter")).toBeEnabled();
  await expect(page.locator(".track-viewport")).toHaveCount(0);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 55, y }] });
  for (let step = 1; step <= 12; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 55 + step * 23, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator("#atlas-title")).toHaveText("Mảng");
  await page.getByRole("button", { name: "Mảng", exact: true }).tap();
  await expect(page.locator(".track-viewport")).toBeVisible();
  await page.getByRole("button", { name: "Thử thách", exact: true }).tap();
  await expect(page.locator(".bubble-play")).toBeVisible();
  await context.close();
});

test("the selected map, navigation and action panel fit portrait, landscape and resizing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const [width,height] of [[320,568],[375,667],[390,844],[1440,900],[844,390],[667,375]]) {
    await page.setViewportSize({ width,height });
    await choose(page, "Cây");
    await expect.poll(() => page.locator(".atlas-carousel").evaluate(node => Math.round(node.scrollLeft / node.clientWidth))).toBe(2);
    for (const selector of [".slide-selected .atlas-canvas", ".atlas-topic-nav", ".atlas-actions button", ".atlas-sheet"]) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(-1);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

test("old saves preserve completed lessons without bypassing subject prerequisites", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("algoventure.learning-track.v1", '{"bubble":true}'));
  await page.goto("/");
  await expect(page.locator("#atlas-title")).toHaveText("Mảng");
  await expect(page.locator(".region-locked")).toHaveCount(0);
  await page.getByRole("button", { name: "Mảng", exact: true }).click();
  await expect(page.locator(".stop-complete")).toHaveCount(1);
  await page.getByRole("button", { name: "Bubble Sort", exact: true }).click();
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeEnabled();
});

test("arrays to lists animates smoothly even when the locked-topic sheet changes height", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const target of [1, 2, 0]) {
    const positions = await page.evaluate(async destination => {
      const carousel = document.querySelector<HTMLElement>(".atlas-carousel")!;
      const values: number[] = [carousel.scrollLeft];
      (document.querySelectorAll(".topic-dots button")[destination] as HTMLButtonElement).click();
      for (let sample = 0; sample < 24; sample++) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        values.push(carousel.scrollLeft);
      }
      return { values, width: carousel.clientWidth };
    }, target);
    const from = positions.values[0], to = positions.width * target;
    expect(positions.values.some(position => position > Math.min(from, to) + 1 && position < Math.max(from, to) - 1)).toBe(true);
    await expect.poll(() => page.locator(".atlas-carousel").evaluate(node => Math.round(node.scrollLeft))).toBe(to);
  }
});

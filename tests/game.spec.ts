import { expect, test, type Page } from "@playwright/test";

async function openMap(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem("algoventure.world-progress.v3")) localStorage.setItem("algoventure.world-progress.v3", JSON.stringify({ array: true, linear: true }));
  });
  await page.goto("/");
  for (const name of ["Xem chủ đề Mảng", "Tiếp tục"]) await page.getByRole("button", { name, exact: true }).click();
}
test("five Sort lessons offer optional demo and direct challenge; locked islands explain the gate", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await openMap(page);
  await expect(page.locator(".track-stop")).toHaveCount(5);
  await expect(page.locator(".stop-locked")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Xem demo", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Selection Sort", exact: true }).click();
  await expect(page.locator(".sheet-description")).toHaveText("Xong Bubble Sort để mở.");
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeDisabled();
  await expect(page.locator(".track-buta")).toHaveAttribute("aria-label", "Buta đang ở Bubble Sort");
  await page.getByRole("button", { name: "Insertion Sort", exact: true }).click();
  await expect(page.locator(".sheet-description")).toHaveText("Xong Selection Sort để mở.");
  await page.getByRole("button", { name: "Quick Sort", exact: true }).click();
  await expect(page.locator(".sheet-description")).toHaveText("Xong Merge Sort để mở.");
  await page.getByRole("button", { name: "Bubble Sort", exact: true }).click();
  await page.getByRole("button", { name: "Thử thách", exact: true }).click();
  await expect(page.locator(".bubble-play")).toBeVisible();
  await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
  await expect(page.locator("#track-sheet-title")).toHaveText("Bubble Sort");
  expect(errors).toEqual([]);
});

test("watching the whole demo never unlocks the next island", async ({ page }) => {
  await openMap(page);
  await page.getByRole("button", { name: "Xem demo", exact: true }).click();
  const next = page.getByRole("button", { name: "Bước tiếp", exact: true });
  while (await next.count()) {
    if (await next.isDisabled()) break;
    await next.click();
  }
  await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
  await expect(page.locator(".stop-complete")).toHaveCount(0);
  await expect(page.locator(".stop-locked")).toHaveCount(4);
});

test("winning Bubble persists progress and Buta walks along the newly opened road", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openMap(page);
  await page.getByRole("button", { name: "Thử thách", exact: true }).click();
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("1, 2");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await page.getByRole("button", { name: "Giữ nguyên", exact: true }).click();
  await expect(page.locator(".victory-celebration")).toBeVisible();
  await page.getByRole("button", { name: "Đi tiếp cùng Buta", exact: true }).click();
  await expect(page.locator(".buta-walking")).toBeVisible();
  const before = await page.locator(".track-buta").getAttribute("style");
  await expect.poll(() => page.locator(".track-buta").getAttribute("style")).not.toBe(before);
  await expect(page.locator(".buta-walking")).toHaveCount(0);
  await expect(page.locator(".track-buta")).toHaveAttribute("aria-label", "Buta đang ở Selection Sort");
  await expect(page.locator(".stop-locked")).toHaveCount(3);
  await expect(page.locator(".stop-complete")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeEnabled();
  await page.screenshot({ path: ".qa/learning-track-unlocked-390.png" });
  await page.reload();
  await page.getByRole("button", { name: "Xem chủ đề Mảng", exact: true }).click();
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(page.locator(".stop-complete")).toHaveCount(1);
  await expect(page.locator(".stop-locked")).toHaveCount(3);
  await expect(page.locator("#track-sheet-title")).toHaveText("Selection Sort");
  await expect(page.locator(".track-buta")).toHaveAttribute("aria-label", "Buta đang ở Selection Sort");
});

test("revisiting and replaying completed lessons keeps Buta at the newest unlocked stop", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("algoventure.world-progress.v3", '{"bubble":true,"selection":true}'));
  await openMap(page);
  await expect(page.locator(".track-buta")).toHaveAttribute("aria-label", "Buta đang ở Insertion Sort");
  const position = await page.locator(".track-buta").getAttribute("style");
  for (const lesson of ["Bubble Sort", "Selection Sort", "Insertion Sort", "Quick Sort", "Bubble Sort"]) {
    await page.getByRole("button", { name: lesson, exact: true }).click();
    await expect(page.locator("#track-sheet-title")).toHaveText(lesson);
    await expect(page.locator(".buta-walking")).toHaveCount(0);
    await expect(page.locator(".track-buta")).toHaveAttribute("style", position!);
  }
  await page.getByRole("button", { name: "Thử thách", exact: true }).click();
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("1, 2");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await page.getByRole("button", { name: "Giữ nguyên", exact: true }).click();
  await page.getByRole("button", { name: "Đi tiếp cùng Buta", exact: true }).click();
  await expect(page.locator("#track-sheet-title")).toHaveText("Bubble Sort");
  await expect(page.locator(".track-buta")).toHaveAttribute("aria-label", "Buta đang ở Insertion Sort");
  await page.waitForTimeout(600);
  await expect(page.locator(".buta-walking")).toHaveCount(0);
});

test("portrait and landscape layouts keep both actions and Buta inside the viewport", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [width, height] of [[390,844],[375,667],[320,568],[1440,900],[1280,720],[844,390],[667,375]]) {
    await page.setViewportSize({ width, height });
    await openMap(page);
    for (const selector of [".track-sheet", ".sheet-demo", ".sheet-challenge", ".track-buta"]) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

test("scrolling explores the route; keyboard focus finds islands and locate returns to Buta", async ({ page }) => {
  await openMap(page);
  const area = page.locator(".track-viewport");
  const initial = await area.evaluate(node => node.scrollTop);
  await area.hover();
  await page.mouse.wheel(0, -900);
  await expect.poll(() => area.evaluate(node => node.scrollTop)).toBeLessThan(initial - 100);
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "Quick Sort", exact: true }).focus();
  await expect(page.getByRole("button", { name: "Quick Sort", exact: true })).toBeInViewport();
  await page.getByRole("button", { name: "Về vị trí Buta", exact: true }).click();
  await expect(page.locator(".track-buta")).toBeInViewport();
});

test("touch users can choose an island and enter challenge with a single tap", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem("algoventure.world-progress.v3", JSON.stringify({ array: true, linear: true })));
  await page.goto("/");
  for (const name of ["Xem chủ đề Mảng", "Tiếp tục"]) await page.getByRole("button", { name, exact: true }).tap();
  await page.getByRole("button", { name: "Selection Sort", exact: true }).tap();
  await expect(page.locator("#track-sheet-title")).toHaveText("Selection Sort");
  await page.getByRole("button", { name: "Bubble Sort", exact: true }).tap();
  await page.getByRole("button", { name: "Thử thách", exact: true }).tap();
  await expect(page.locator(".bubble-play")).toBeVisible();
  await context.close();
});

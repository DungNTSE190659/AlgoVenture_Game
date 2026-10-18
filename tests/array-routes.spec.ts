import { expect, test, type Page } from "@playwright/test";

async function enter(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Xem chủ đề Mảng", exact: true }).click();
  await page.locator(".atlas-enter").click();
}
async function route(page: Page, name: "Search" | "Sort") {
  await page.getByRole("button", { name: `Lộ trình ${name}`, exact: true }).click();
  await expect(page.getByRole("button", { name: `Lộ trình ${name}`, exact: true })).toHaveAttribute("aria-pressed", "true");
}

test("Search and Sort render independent roads, numbering, progress and prerequisites", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await enter(page);
  await expect(page.locator(".track-stop")).toHaveCount(5);
  await expect(page.locator(".track-roads > g")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Lộ trình Sort", exact: true })).toContainText("0/5");
  await expect(page.getByRole("button", { name: "Linear Search", exact: true })).toHaveCount(0);
  await route(page, "Search");
  await expect(page.locator(".track-stop")).toHaveCount(2);
  await expect(page.locator(".track-roads > g")).toHaveCount(1);
  await expect(page.locator(".stop-number")).toHaveText(["01", "02"]);
  await expect(page.locator("#track-sheet-title")).toHaveText("Linear Search");
  await expect(page.getByRole("button", { name: "Bubble Sort", exact: true })).toHaveCount(0);
  await expect(page.locator(".track-progress")).toContainText("0/2");
  await page.getByRole("button", { name: "Binary Search", exact: true }).click();
  await expect(page.locator(".sheet-description")).toHaveText("Xong Linear Search để mở.");
  await expect(page.locator(".track-buta")).toHaveAttribute("aria-label", "Buta đang ở Linear Search");
  await route(page, "Sort");
  await expect(page.locator("#track-sheet-title")).toHaveText("Bubble Sort");
  await expect(page.locator(".buta-walking")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("Linear unlocks Binary without Sort; winning Bubble stays on Sort and preserves Search progress", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("algoventure.world-progress.v3")) localStorage.setItem("algoventure.world-progress.v3", '{"linear":true}');
  });
  await enter(page);
  await route(page, "Search");
  await expect(page.locator("#track-sheet-title")).toHaveText("Binary Search");
  await expect(page.locator(".stop-locked")).toHaveCount(0);
  await expect(page.locator(".sheet-description")).toHaveText("Đang phát triển.");
  await expect(page.locator(".track-progress")).toContainText("1/2");
  await route(page, "Sort");
  await page.getByRole("button", { name: "Thử thách", exact: true }).click();
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("1, 2");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await page.getByRole("button", { name: "Giữ nguyên", exact: true }).click();
  await page.getByRole("button", { name: "Đi tiếp cùng Buta", exact: true }).click();
  await expect(page.locator("#track-sheet-title")).toHaveText("Insertion Sort");
  await expect(page.locator(".buta-walking")).toHaveCount(0);
  await expect(page.locator(".track-progress")).toContainText("1/5");
  await route(page, "Search");
  await expect(page.locator(".track-progress")).toContainText("1/2");
  await page.getByRole("button", { name: "Bản đồ thế giới", exact: true }).click();
  await page.locator(".atlas-enter").click();
  await expect(page.getByRole("button", { name: "Lộ trình Search", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await page.locator(".atlas-enter").click();
  await expect(page.getByRole("button", { name: "Lộ trình Sort", exact: true })).toContainText("1/5");
  await expect(page.getByRole("button", { name: "Lộ trình Search", exact: true })).toContainText("1/2");
});

test("old combined saves keep both routes and the world total", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("algoventure.world-progress.v3", '{"linear":true,"binary":true,"bubble":true,"insertion":true,"quick":true}'));
  await enter(page);
  await expect(page.getByRole("button", { name: "Lộ trình Sort", exact: true })).toContainText("3/5");
  await expect(page.getByRole("button", { name: "Lộ trình Search", exact: true })).toContainText("2/2");
  await expect(page.locator(".stop-complete")).toHaveCount(3);
  await route(page, "Search");
  await expect(page.locator(".stop-complete")).toHaveCount(2);
  await page.getByRole("button", { name: "Bản đồ thế giới", exact: true }).click();
  await expect(page.locator(".atlas-region-progress")).toHaveText("5/7");
  await page.getByRole("button", { name: "Xem chủ đề Danh sách", exact: true }).click();
  await expect(page.locator(".atlas-enter")).toBeDisabled();
});

test("both route maps fit desktop, phone portrait and landscape without overlapping controls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enter(page);
  for (const [width, height] of [[1440, 900], [1280, 720], [390, 844], [375, 667], [320, 568], [844, 390], [667, 375]]) {
    await page.setViewportSize({ width, height });
    for (const name of ["Search", "Sort"] as const) {
      await route(page, name);
      for (const selector of [".track-routes", ".track-sheet", ".track-viewport", ".track-locate", ".track-buta"]) {
        const box = (await page.locator(selector).boundingBox())!;
        expect(box.x, `${width} ${name} ${selector}`).toBeGreaterThanOrEqual(-1);
        expect(box.y, `${width} ${name} ${selector}`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${width} ${name} ${selector}`).toBeLessThanOrEqual(width + 1);
        expect(box.y + box.height, `${width} ${name} ${selector}`).toBeLessThanOrEqual(height + 1);
      }
      const tabs = (await page.locator(".track-routes").boundingBox())!;
      const viewport = (await page.locator(".track-viewport").boundingBox())!;
      expect(tabs.y + tabs.height).toBeLessThanOrEqual(viewport.y);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      if ([1440, 390, 844].includes(width)) await page.screenshot({ path: `.qa/array-${name.toLowerCase()}-${width}.png` });
    }
  }
});

test("touch and keyboard switch routes without walking across the other road", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await enter(page);
  await page.getByRole("button", { name: "Lộ trình Search", exact: true }).tap();
  await expect(page.locator(".track-stop")).toHaveCount(2);
  await page.getByRole("button", { name: "Lộ trình Sort", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".track-stop")).toHaveCount(5);
  await expect(page.locator(".buta-walking")).toHaveCount(0);
  await page.getByRole("button", { name: "Thử thách", exact: true }).tap();
  await expect(page.locator(".bubble-play")).toBeVisible();
  await page.getByRole("button", { name: "Về bản đồ", exact: true }).tap();
  await expect(page.getByRole("button", { name: "Lộ trình Sort", exact: true })).toHaveAttribute("aria-pressed", "true");
  await context.close();
});

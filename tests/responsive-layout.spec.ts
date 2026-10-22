import { expect, test, type Page } from "@playwright/test";

async function enterGraph(page: Page) {
  await page.addInitScript(() => localStorage.setItem("algoventure.world-progress.v3", JSON.stringify({})));
  await page.goto("/");
  await page.getByRole("button", { name: "Xem chủ đề Đồ thị" }).click();
  await page.getByRole("button", { name: "Vào vùng đất" }).click();
  await page.getByRole("button", { name: "BFS", exact: true }).click();
  await page.getByRole("button", { name: "Thử thách", exact: true }).click();
}

test("Graph game uses compact landscape layout and keeps portrait sizing above 620px", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await enterGraph(page);

  const landscape = await page.locator(".graph-world").evaluate((element) => ({
    display: getComputedStyle(element).display,
    headerHeight: getComputedStyle(element.querySelector(".play-header")!).minHeight,
    footerHeight: getComputedStyle(element.querySelector(".graph-play-footer")!).minHeight,
    hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }));
  expect(landscape).toEqual({
    display: "grid",
    headerHeight: "56px",
    footerHeight: "70px",
    hasHorizontalOverflow: false,
  });

  await page.setViewportSize({ width: 390, height: 667 });
  const portrait = await page.locator(".graph-world").evaluate((element) => ({
    display: getComputedStyle(element).display,
    compactPortrait: matchMedia("(max-height: 620px) and (orientation: portrait)").matches,
  }));
  expect(portrait).toEqual({ display: "flex", compactPortrait: false });
});

test("Atlas and learning track fit a narrow landscape phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("/");

  const atlas = await page.locator(".atlas-map").evaluate((element) => ({
    top: getComputedStyle(element).getPropertyValue("--atlas-top").trim(),
    sheet: getComputedStyle(element).getPropertyValue("--atlas-sheet").trim(),
    headerHeight: getComputedStyle(element.querySelector(".atlas-header")!).height,
  }));
  expect(atlas).toEqual({ top: "72px", sheet: "120px", headerHeight: "58px" });

  await page.locator(".atlas-enter").click();
  const track = await page.locator(".learning-map").evaluate((element) => ({
    sheet: getComputedStyle(element).getPropertyValue("--sheet-height").trim(),
    headerHeight: getComputedStyle(element.querySelector(".track-header")!).height,
    sheetBottom: getComputedStyle(element.querySelector(".track-sheet")!).bottom,
    hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }));
  expect(track).toEqual({
    sheet: "130px",
    headerHeight: "62px",
    sheetBottom: "8px",
    hasHorizontalOverflow: false,
  });
});

test("Atlas, learning track, and Graph game fit iPad portrait and landscape viewports", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);

  await page.locator(".atlas-enter").click();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);
  await enterGraph(page);
  await expect(page.locator(".graph-board")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);
});

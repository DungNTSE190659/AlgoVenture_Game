import { expect, test, type Page } from "@playwright/test";

async function enterGraph(page: Page) {
  await page.addInitScript(() => localStorage.setItem("algoventure.world-progress.v3", JSON.stringify({})));
  await page.goto("/");
  await page.getByRole("button", { name: "Mở nhánh Graph" }).click();
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

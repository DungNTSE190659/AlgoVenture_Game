import { expect, test } from "@playwright/test";
import { enterTrack } from "./track-navigation";

test("mouse hover unfolds a topic and keeps its lessons reachable", async ({ page }) => {
  await page.goto("/");
  const array = page.locator('[data-topic="array"] .roadmap-topic-node');
  await array.hover();
  await expect(array).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Bubble Sort", exact: true }).hover();
  await expect(array).toHaveAttribute("aria-expanded", "true");
  const tree = page.locator('[data-topic="tree"] .roadmap-topic-node');
  await tree.hover();
  await expect(tree).toHaveAttribute("aria-expanded", "true");
  await expect(array).toHaveAttribute("aria-expanded", "false");
  await tree.click();
  await expect(tree).toHaveAttribute("aria-expanded", "true");
  await tree.click();
  await expect(tree).toHaveAttribute("aria-expanded", "false");
});

test("Bubble demo uses map lavender and hover leaves asset corners transparent", async ({ page }) => {
  await enterTrack(page, "Bubble Sort", "Demo");
  await expect(page.locator(".bubble-studio")).toHaveCSS("background-color", "rgb(145, 145, 255)");
  for (const name of ["Về bản đồ", "Tùy chọn", "Bước tiếp"]) {
    const button = page.getByRole("button", { name, exact: true });
    await button.hover();
    await expect(button).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(button).toHaveCSS("background-image", "none");
    expect(await button.evaluate(node => getComputedStyle(node).borderImageSource)).toContain("button");
  }
  await page.screenshot({ path: ".qa/bubble-demo-hover-fixed.png" });
});

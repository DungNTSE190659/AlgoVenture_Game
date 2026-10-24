import { expect, test } from "@playwright/test";
import { enterTrack } from "./track-navigation";

test("topics open on click without reacting to mouse hover", async ({ page }) => {
  await page.goto("/");
  const array = page.locator('[data-topic="array"] .roadmap-topic-node');
  await array.hover();
  await expect(array).toHaveAttribute("aria-expanded", "false");
  await array.click();
  await expect(array).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Bubble Sort", exact: true }).hover();
  await expect(array).toHaveAttribute("aria-expanded", "true");
  const tree = page.locator('[data-topic="tree"] .roadmap-topic-node');
  await tree.hover();
  await expect(tree).toHaveAttribute("aria-expanded", "false");
  await tree.click();
  await expect(tree).toHaveAttribute("aria-expanded", "true");
  await expect(array).toHaveAttribute("aria-expanded", "false");
  await tree.click();
  await expect(tree).toHaveAttribute("aria-expanded", "false");
});

test("Bubble demo buttons keep the same artwork on hover", async ({ page }) => {
  await enterTrack(page, "Bubble Sort", "Demo");
  await expect(page.locator(".bubble-studio")).toHaveCSS("background-color", "rgb(145, 145, 255)");
  for (const name of ["Về bản đồ", "Tùy chọn", "Bước tiếp"]) {
    const button = page.getByRole("button", { name, exact: true });
    const before = await button.evaluate(node => {
      const style = getComputedStyle(node);
      return [style.backgroundColor, style.backgroundImage, style.borderImageSource, style.filter];
    });
    await button.hover();
    const after = await button.evaluate(node => {
      const style = getComputedStyle(node);
      return [style.backgroundColor, style.backgroundImage, style.borderImageSource, style.filter];
    });
    expect(after).toEqual(before);
  }
  await page.screenshot({ path: ".qa/bubble-demo-hover-fixed.png" });
});

import { expect, test } from "@playwright/test";
import { enterTrack } from "./track-navigation";

for (const [width, height] of [[1440, 900], [1280, 580], [390, 844], [320, 568], [844, 390]]) {
  test(`algorithm screens share the same header and score styling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    let reference: unknown;
    for (const algorithm of ["Bubble Sort", "Selection Sort", "Insertion Sort", "Merge Sort", "Quick Sort", "Stack", "Queue"]) {
      await enterTrack(page, algorithm, "Play");
      await expect(page.locator(".play-header h1")).toHaveText(algorithm);
      await expect(page.locator(".play-score")).toBeInViewport();
      await expect(page.locator(".play-score")).toHaveAttribute("aria-label", /điểm$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const hint = page.locator(".game-play-footer .game-hint-button");
      await hint.scrollIntoViewIfNeeded();
      await expect(hint).toBeInViewport();
      const geometry = await page.evaluate(() => {
        const main = document.querySelector(".game-play-layout")!;
        const footer = document.querySelector(".game-play-footer")!;
        const button = footer.querySelector(".game-hint-button")!;
        const box = button.getBoundingClientRect(), area = footer.getBoundingClientRect();
        const undo = footer.querySelector(".expedition-undo")?.getBoundingClientRect();
        return {
          centered: Math.abs(box.x + box.width / 2 - innerWidth / 2),
          bottomGap: area.bottom - box.bottom,
          expectedGap: parseFloat(getComputedStyle(footer).paddingBottom),
          footerAtEnd: Math.abs(area.bottom - main.getBoundingClientRect().top + main.scrollTop - main.scrollHeight),
          undoSeparated: !undo || undo.right <= box.left - 2,
        };
      });
      expect(geometry.centered).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.bottomGap - geometry.expectedGap)).toBeLessThanOrEqual(1);
      expect(geometry.footerAtEnd).toBeLessThanOrEqual(1);
      expect(geometry.undoSeparated).toBe(true);
      const appearance = await page.evaluate(() => {
        const read = (selector: string, properties: string[]) => {
          const style = getComputedStyle(document.querySelector(selector)!);
          return properties.map(property => style.getPropertyValue(property));
        };
        return {
          score: read(".play-score", ["background-color", "color", "border", "border-radius", "box-shadow", "padding", "gap"]),
          number: read(".play-score strong", ["font-size", "font-weight"]),
          star: read(".play-score svg", ["width", "height", "fill", "stroke"]),
          title: read(".play-header h1", ["font-size", "font-weight", "color"]),
          button: read(".play-header .round-button", ["width", "height", "border-radius"]),
          hint: read(".game-hint-button", ["background-color", "color", "border-radius", "padding", "font-size", "min-height"]),
        };
      });
      if (reference) expect(appearance).toEqual(reference);
      else reference = appearance;
      await page.screenshot({ path: `.qa/hud-${algorithm.split(" ")[0].toLowerCase()}-${width}.png` });
      await hint.click();
      const close = page.getByRole("button", { name: "Đóng gợi ý", exact: true });
      await expect(close).toBeInViewport();
      await close.click();
      await expect(close).toHaveCount(0);
    }
  });
}

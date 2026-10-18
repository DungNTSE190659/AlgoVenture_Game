import { expect, test } from "@playwright/test";
import { createBubbleLesson } from "../src/engine/bubbleSort";
import { enterTrack } from "./track-navigation";

test("desktop demo keeps every section visible without scrolling at browser zoom 100%", async ({ page }) => {
  await enterTrack(page, "Bubble Sort", "Demo");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const input = [3, 3, -1, 99, 0, 1, -99, 8];
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill(input.join(", "));
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  const frames = createBubbleLesson(input);
  const checkpoints = new Set([0, 1, 2, 3, frames.findIndex(frame => frame.kind === "pass"), frames.length - 1]);
  for (let cursor = 0; cursor < frames.length; cursor++) {
    if (checkpoints.has(cursor)) {
      for (const [width, height] of [[1920, 885], [1536, 707], [1440, 760], [1366, 625], [1280, 580], [1024, 560]]) {
        await page.setViewportSize({ width, height });
        const layout = await page.evaluate(() => {
          const world = document.querySelector<HTMLElement>(".bubble-world")!;
          const selectors = [".bubble-header", ".bubble-topline", ".bubble-content h2", ".bubble-task", ".bubble-board-area", ".bubble-rule", ".bubble-equation", ".bubble-dialogue", ".bubble-dialogue p", ".bubble-controls", ".bubble-playback", ".bubble-step-status"];
          const boxes = Object.fromEntries(selectors.flatMap(selector => {
            const node = document.querySelector(selector);
            if (!node) return [];
            const rect = node.getBoundingClientRect();
            return [[selector, { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }]];
          }));
          return { boxes, height: world.clientHeight, scrollHeight: world.scrollHeight, scrollTop: world.scrollTop };
        });
        const context = `${width}x${height} ${frames[cursor].kind}`;
        expect(layout.scrollHeight, context).toBeLessThanOrEqual(layout.height + 1);
        expect(layout.scrollTop, context).toBe(0);
        for (const [selector, box] of Object.entries(layout.boxes)) {
          expect(box.top, `${context} ${selector} top`).toBeGreaterThanOrEqual(0);
          expect(box.bottom, `${context} ${selector} bottom`).toBeLessThanOrEqual(height + 1);
          expect(box.left, `${context} ${selector} left`).toBeGreaterThanOrEqual(0);
          expect(box.right, `${context} ${selector} right`).toBeLessThanOrEqual(width + 1);
        }
        const box = layout.boxes;
        expect(box[".bubble-header"].bottom, context).toBeLessThanOrEqual(box[".bubble-topline"].top + 1);
        expect(box[".bubble-task"].bottom, context).toBeLessThanOrEqual(box[".bubble-board-area"].top + 1);
        const explanation = box[".bubble-rule"] ?? box[".bubble-equation"];
        if (explanation) {
          expect(box[".bubble-board-area"].bottom, context).toBeLessThanOrEqual(explanation.top + 1);
          expect(explanation.bottom, context).toBeLessThanOrEqual(box[".bubble-dialogue"].top + 1);
        }
        expect(box[".bubble-dialogue p"].bottom, context).toBeLessThanOrEqual(box[".bubble-controls"].top + 1);
      }
    }
    if (cursor < frames.length - 1) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  }
  await page.setViewportSize({ width: 1536, height: 707 });
  await page.screenshot({ path: ".qa/bubble-desktop-fit.png" });
});

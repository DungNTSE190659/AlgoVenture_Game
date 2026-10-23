import { expect, test } from "@playwright/test";
import { createBubbleLesson } from "../src/engine/bubbleSort";
import { enterTrack } from "./track-navigation";
import { expectLessonFits, expectLessonVisible } from "./lesson-viewport";

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
          const selectors = [".bubble-header", ".bubble-topline", ".bubble-board-area", ".array-guide", ".bubble-dialogue", ".bubble-dialogue p", ".bubble-controls", ".bubble-playback", ".bubble-step-status"];
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
        expect(box[".bubble-board-area"].right, context).toBeLessThanOrEqual(box[".array-guide"].left + 1);
        expect(box[".bubble-dialogue p"].bottom, context).toBeLessThanOrEqual(box[".bubble-controls"].top + 1);
      }
    }
    if (cursor < frames.length - 1) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  }
  await page.setViewportSize({ width: 1536, height: 707 });
  await page.screenshot({ path: ".qa/bubble-desktop-fit.png" });
});

test("bridge play fits eight friends and their camp on phones, landscape and desktop", async ({ page }) => {
  await enterTrack(page, "Bubble Sort", "Play");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("3,3,-1,99,0,1,-99,8");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  const sizes = [[320,568], [390,844], [844,390], [1280,580], [1440,900]];
  async function check(stage: string) {
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await expectLessonFits(page, ".bubble-world", 2);
      await expect(page.locator('.bubble-tile[data-active="true"]')).toHaveCount(stage === "pair" ? 2 : 0);
      await expect(page.locator(".bubble-overview-item")).toHaveCount(8);
      for (const node of await page.locator(".bubble-tile,.bubble-overview-item").all()) await expectLessonVisible(page, node);
      await expectLessonVisible(page, page.getByRole("button", { name: "Buta gợi ý", exact: true }));
      await expectLessonVisible(page, page.getByRole("button", { name: stage === "pair" ? "Giữ nguyên" : "Lượt tiếp theo", exact: true }));
      await page.screenshot({ path: `.qa/bubble-bridge-${stage}-${width}.png` });
    }
  }
  await check("pair");
  for (let step = 0; step < 7; step++) {
    const values = await page.locator('.bubble-tile[data-active="true"]').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-value"))));
    if (values[0] > values[1]) await page.locator('.bubble-tile[data-active="true"]').first().press("Enter");
    else await page.getByRole("button", { name: "Giữ nguyên", exact: true }).click();
    await expect(page.locator(".bubble-world")).toHaveAttribute("data-busy", "false");
  }
  await expect(page.locator(".bubble-overview-item.is-settled")).toHaveCount(1);
  await check("bank");
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("3,2,6,5,8");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await page.locator('.bubble-tile[data-active="true"]').first().press("Enter");
  await expect(page.locator(".bubble-world")).toHaveAttribute("data-busy", "false");
  await page.getByRole("button", { name: "Giữ nguyên", exact: true }).click();
  await expect(page.locator(".bubble-world")).toHaveAttribute("data-busy", "false");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".qa/bubble-bridge-preview.png" });
});

test("demo bridge, adjacent pair and narration fit every frame on phones and landscape", async ({ page }) => {
  await enterTrack(page, "Bubble Sort", "Demo"); await page.emulateMedia({ reducedMotion: "reduce" });
  const input = [3, 3, -1, 99, 0, 1, -99, 8], frames = createBubbleLesson(input);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill(input.join(","));
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  const checkpoints = new Set([0, 1, 2, 3, frames.findIndex(frame => frame.kind === "pass"), frames.length - 1]);
  for (let cursor = 0; cursor < frames.length; cursor++) {
    if (checkpoints.has(cursor)) for (const [width, height] of [[320,568], [390,844], [844,390]]) {
      await page.setViewportSize({ width, height });
      await expectLessonFits(page, ".bubble-world", 2);
      for (const node of await page.locator(".bubble-tile,.bubble-overview-item,.bubble-dialogue,.bubble-controls").all()) await expectLessonVisible(page, node);
      const stage = (await page.locator(".bubble-board-area").boundingBox())!, speech = (await page.locator(".bubble-dialogue").boundingBox())!;
      if (height > 500) expect(stage.y + stage.height).toBeLessThanOrEqual(speech.y + 1);
    }
    if (cursor < frames.length - 1) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".qa/bubble-bridge-demo.png" });
});

import { expect, test } from "@playwright/test";
import { enterTrack } from "./track-navigation";

const games = [
  { name: "Bubble Sort", root: ".bubble-world", task: ".bubble-task", board: ".bubble-board-area", cards: '.bubble-tile[data-active="true"]', values: '.bubble-tile[data-active="true"] strong' },
  { name: "Selection Sort", root: ".selection-world", task: ".selection-task", board: ".pack-table", cards: ".selection-tile:not(:disabled)", values: ".selection-tile strong" },
  { name: "Insertion Sort", root: ".insertion-world", task: ".insertion-task", board: ".insertion-board", cards: ".insertion-tile:not(:disabled)", values: '.insertion-tile[data-zone="hand"] strong' },
  { name: "Merge Sort", root: ".merge-world", task: ".merge-task", board: ".merge-stream-board", cards: ".stream-split-handle", values: ".stream-group-leaves strong" },
  { name: "Quick Sort", root: ".quick-forest-world", task: ".qf-task", board: ".qf-junction", cards: ".qf-friend:not(:disabled)", values: ".qf-friend strong" },
];

for (const game of games) test(`${game.name} portrait keeps readable values and reachable controls with larger arrays`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterTrack(page, game.name, "Play");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const custom of [false, true]) {
    if (custom) {
      await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
      const input = game.name === "Insertion Sort" ? "-99,99,4,3,2,1" : "-99,99,6,5,4,3,2,1";
      const label = game.name === "Quick Sort" ? "Các phần tử của mảng" : "Mảng của bạn";
      await page.getByLabel(label, { exact: true }).fill(input);
      await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
    }
    for (const [width, height] of [[320, 568], [360, 640], [390, 844], [430, 932]]) {
      await page.setViewportSize({ width, height });
      await page.locator(game.root).evaluate(node => node.scrollTop = 0);
      await expect.poll(() => page.locator(game.task).evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(15);
      const metrics = await page.locator(game.values).evaluateAll(nodes => nodes.map(node => ({
        digits: node.textContent!.length, font: parseFloat(getComputedStyle(node).fontSize),
        left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right,
        overflowX: node.scrollWidth - node.clientWidth, height: node.getBoundingClientRect().height,
      })));
      expect(metrics.length).toBeGreaterThan(0);
      for (const value of metrics) {
        expect(value.font).toBeGreaterThanOrEqual(value.digits > 1 ? 18 : 24);
        expect(value.overflowX).toBeLessThanOrEqual(1);
        expect(value.height).toBeGreaterThanOrEqual(value.font - 1);
        expect(value.left).toBeGreaterThanOrEqual(0);
        expect(value.right).toBeLessThanOrEqual(width);
      }
      for (const card of await page.locator(game.cards).all()) {
        const box = (await card.boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
      const overflow = await page.locator(game.root).evaluate(node => node.scrollWidth - node.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const board = (await page.locator(game.board).boundingBox())!;
      const footer = (await page.locator(".game-play-footer").boundingBox())!;
      expect(board.y + board.height).toBeLessThanOrEqual(footer.y + 1);
      const hint = page.getByRole("button", { name: "Buta gợi ý", exact: true });
      await hint.scrollIntoViewIfNeeded();
      await hint.click();
      await page.getByRole("button", { name: "Đóng gợi ý", exact: true }).click();
      await page.locator(game.root).evaluate(node => node.scrollTop = 0);
      await page.screenshot({ path: `.qa/portrait-${game.name.split(" ")[0].toLowerCase()}-${custom ? "large" : "default"}-${width}.png` });
    }
  }
  if (game.name === "Selection Sort") {
    await expect.poll(() => page.locator(".pack-mat").evaluate(node => getComputedStyle(node).getPropertyValue("--columns").trim())).toBe("3");
    await page.setViewportSize({ width: 844, height: 390 });
    await expect.poll(() => page.locator(".pack-mat").evaluate(node => getComputedStyle(node).getPropertyValue("--columns").trim())).toBe("4");
  }
  if (game.name === "Merge Sort") {
    await page.getByRole("button", { name: "Tách nhánh", exact: true }).click();
    await expect(page.locator(".merge-world")).toHaveAttribute("data-busy", "false");
    const branches = page.locator(".stream-branch-picker button");
    await expect(branches).toHaveCount(2);
    for (const branch of await branches.all()) expect((await branch.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await branches.last().click();
    await expect(branches.last()).toHaveAttribute("aria-pressed", "true");
    expect(await page.locator(".stream-group-leaves .stream-leaf").evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-value"))))).toEqual([4, 3, 2, 1]);
  }
});

test("all five portrait demos use readable narration and keep playback below the board", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  for (const game of games) {
    await enterTrack(page, game.name, "Demo");
    const prefix = game.name === "Quick Sort" ? "qf" : game.name.split(" ")[0].toLowerCase();
    const speech = page.locator(`.${prefix}-dialogue p`);
    await speech.scrollIntoViewIfNeeded();
    expect(await speech.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    const board = (await page.locator(game.board).boundingBox())!;
    const speechBox = (await speech.boundingBox())!;
    expect(board.y + board.height).toBeLessThanOrEqual(speechBox.y + 1);
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
    expect(await page.locator(game.root).evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `.qa/portrait-demo-${prefix}.png` });
  }
});

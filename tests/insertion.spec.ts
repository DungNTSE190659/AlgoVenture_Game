import { expect, test, type Page, type Locator } from "@playwright/test";
import { enterTrack } from "./track-navigation";
import { expectLessonVisible } from "./lesson-viewport";

async function enter(page: Page, mode = "Play") { await enterTrack(page, "Insertion Sort", mode); }
async function custom(page: Page, values: string) {
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill(values);
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
}
async function dragTo(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  const from = (await source.boundingBox())!, to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await expect(page.locator(".insertion-ghost")).toBeVisible();
  await page.mouse.up();
  await expect(page.locator(".insertion-world")).toHaveAttribute("data-busy", "false");
}
async function solve(page: Page) {
  for (let move = 0; move < 80; move++) {
    await expect(page.locator(".insertion-world")).toHaveAttribute("data-busy", "false");
    if (await page.locator(".insertion-victory").count()) return;
    const lift = page.locator("[data-insertion-lift]");
    if (await lift.count()) {
      const cursor = Number((await page.locator(".insertion-stats").innerText()).match(/(\d+)\//)![1]);
      await dragTo(page, page.locator(`.insertion-tile[data-index="${cursor}"]`), lift);
      continue;
    }
    const held = Number(await page.locator(".tile-held").getAttribute("data-value"));
    const hole = Number(await page.locator("[data-insertion-hole]").getAttribute("data-insertion-hole"));
    const left = page.locator(`.insertion-tile[data-index="${hole - 1}"]`);
    const shift = hole > 0 && Number(await left.getAttribute("data-value")) > held;
    await dragTo(page, shift ? left : page.locator(".tile-held"), page.locator("[data-insertion-hole]"));
  }
  throw new Error("Insertion Sort did not finish");
}

test("play explains mistakes, sorts negative and duplicate values stably, saves, and replays the same array", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await enter(page);
  await custom(page, "3, -1, 3, 0");
  await page.getByRole("button", { name: "Số -1, ô 1", exact: true }).click();
  await expect(page.locator(".insertion-world")).toHaveAttribute("data-busy", "false");
  await dragTo(page, page.locator(".tile-held"), page.locator("[data-insertion-hole]"));
  await expect(page.getByRole("status")).toContainText("Chưa đúng");
  await expect(page.locator(".slot-empty")).toHaveAttribute("data-insertion-hole", "1");
  await solve(page);
  const sorted = await page.locator(".insertion-tile").evaluateAll(nodes => nodes.map(node => ({ id: Number(node.getAttribute("data-item-id")), value: Number(node.getAttribute("data-value")), index: Number(node.getAttribute("data-index")) })).sort((a, b) => a.index - b.index));
  expect(sorted.map(item => item.value)).toEqual([-1, 0, 3, 3]);
  expect(sorted.filter(item => item.value === 3).map(item => item.id)).toEqual([0, 2]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!).insertion)).toBe(true);
  await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
  expect(await page.locator('.insertion-tile').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-value"))))).toEqual([3, -1, 3, 0]);
  await solve(page);
  await page.getByRole("button", { name: "Đi tiếp cùng Buta", exact: true }).click();
  await expect(page.locator("#track-sheet-title")).toHaveText("Merge Sort");
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("keyboard can lift, shift and insert; mouse can drag the held number into the hole", async ({ page }) => {
  await enter(page);
  await custom(page, "2, 1");
  await page.getByRole("button", { name: "Số 1, ô 1", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".insertion-world")).toHaveAttribute("data-busy", "false");
  await page.getByRole("button", { name: "Số 2, ô 0", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".insertion-world")).toHaveAttribute("data-busy", "false");
  const key = (await page.locator(".tile-held").boundingBox())!;
  const hole = (await page.locator("[data-insertion-hole]").boundingBox())!;
  await page.mouse.move(key.x + key.width / 2, key.y + key.height / 2);
  await page.mouse.down();
  await page.mouse.move(hole.x + hole.width / 2, hole.y + hole.height / 2, { steps: 12 });
  await expect(page.locator(".insertion-ghost")).toBeVisible();
  await page.mouse.up();
  await expect(page.locator(".insertion-victory")).toBeVisible();
});

test("touch completes lift, shift and insertion entirely by dragging", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await enter(page);
  await custom(page, "2, 1");
  const cdp = await context.newCDPSession(page);
  async function touchDrag(source: Locator, target: Locator) {
    const from = (await source.boundingBox())!, to = (await target.boundingBox())!;
    const x = from.x + from.width / 2, y = from.y + from.height / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let step = 1; step <= 12; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (to.x + to.width / 2 - x) * step / 12, y: y + (to.y + to.height / 2 - y) * step / 12 }] });
    await expect(page.locator(".insertion-ghost")).toBeVisible();
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.locator(".insertion-world")).toHaveAttribute("data-busy", "false");
  }
  await touchDrag(page.getByRole("button", { name: "Số 1, ô 1", exact: true }), page.locator("[data-insertion-lift]"));
  await touchDrag(page.getByRole("button", { name: "Số 2, ô 0", exact: true }), page.locator("[data-insertion-hole]"));
  await touchDrag(page.locator(".tile-held"), page.locator("[data-insertion-hole]"));
  await expect(page.locator(".insertion-victory")).toBeVisible();
  await context.close();
});

test("a missed or canceled drop leaves the array and score unchanged", async ({ page }) => {
  await enter(page);
  await custom(page, "2, 1");
  const tile = page.getByRole("button", { name: "Số 1, ô 1", exact: true });
  const box = (await tile.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator(".insertion-score")).toHaveText("0");
  await expect(page.locator(".tile-held")).toHaveCount(0);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y - 30, { steps: 10 });
  await page.locator(".insertion-board").dispatchEvent("pointercancel");
  await page.mouse.up();
  await expect(page.locator(".insertion-ghost")).toHaveCount(0);
  await expect(page.locator(".insertion-score")).toHaveText("0");
  await solve(page);
  await expect(page.locator(".insertion-victory")).toBeVisible();
});

test("demo has backward steps, pause, speed, validation, and never awards completion", async ({ page }) => {
  await enter(page, "Demo");
  await custom(page, "2, 1, 1");
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".tile-held")).toHaveAttribute("data-value", "1");
  await page.getByRole("button", { name: "Bước trước", exact: true }).click();
  await expect(page.locator(".tile-held")).toHaveCount(0);
  await page.getByRole("button", { name: /^Tốc độ demo:/ }).click();
  await expect(page.getByRole("button", { name: /^Tốc độ demo:/ })).toHaveText("1.5x");
  await page.getByRole("button", { name: "Bắt đầu", exact: true }).click();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const progress = await page.locator("progress").getAttribute("value");
  await page.waitForTimeout(1600);
  await expect(page.locator("progress")).toHaveAttribute("value", progress!);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("1, nope");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("2 đến 6 số nguyên");
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  while (await page.getByRole("button", { name: "Bước tiếp", exact: true }).count()) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tự mình thử", exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!).insertion)).toBeUndefined();
  await page.getByRole("button", { name: "Tự mình thử", exact: true }).click();
  await expect(page.locator(".insertion-play")).toBeVisible();
});

test("haptics have a separate persistent toggle and work with sound muted", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("piggy-sound", "off");
    (window as unknown as { vibrations: unknown[] }).vibrations = [];
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: (pattern: unknown) => { (window as unknown as { vibrations: unknown[] }).vibrations.push(pattern); return true; } });
  });
  await enter(page);
  await dragTo(page, page.locator('.insertion-tile[data-index="1"]'), page.locator("[data-insertion-lift]"));
  expect(await page.evaluate(() => (window as unknown as { vibrations: unknown[] }).vibrations)).toContain(14);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByRole("button", { name: /Rung khi thao tác/ }).click();
  await expect(page.getByRole("button", { name: /Rung khi thao tác/ })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await dragTo(page, page.getByRole("button", { name: "Số 8, ô 0", exact: true }), page.locator("[data-insertion-hole]"));
  expect(await page.evaluate(() => (window as unknown as { vibrations: unknown[] }).vibrations)).not.toContainEqual([12, 25, 18]);
  expect(await page.evaluate(() => localStorage.getItem("algoventure-haptics"))).toBe("off");
});

test("six numbers fit without horizontal scrolling in portrait, landscape and desktop", async ({ page }) => {
  await enter(page);
  await custom(page, "6, 5, 4, 3, 2, 1");
  for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await expect(page.locator(".insertion-board-scroll")).toBeVisible();
    await expect(page.locator(".insertion-tile")).toHaveCount(6);
    expect(await page.locator(".insertion-board-scroll").evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
    for (const tile of await page.locator(".insertion-tile").all()) await expectLessonVisible(page, tile);
    const button = page.locator('.insertion-tile[data-index="1"]');
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeInViewport();
  }
  await page.screenshot({ path: ".qa/insertion-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".qa/insertion-mobile.png" });
  for (const [width, height] of [[1024, 560], [1280, 580], [1536, 707]]) {
    await page.setViewportSize({ width, height });
    expect(await page.locator(".insertion-world").evaluate(node => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(1);
    await expect(page.getByRole("button", { name: "Buta gợi ý", exact: true })).toBeInViewport();
  }
});

test("medium and hard use six numbers and custom input rejects longer arrays", async ({ page }) => {
  await enter(page);
  for (const level of ["medium", "hard"]) {
    await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
    await page.getByLabel("Mảng mẫu", { exact: true }).selectOption(level);
    await expect(page.locator(".insertion-tile")).toHaveCount(6);
    await expect(page.locator(".insertion-stats")).toContainText("1/6 thẻ");
    if (level === "hard") {
      const values = await page.locator(".insertion-tile").evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-value"))));
      expect(values.some(value => value < 0)).toBe(true);
      expect(new Set(values).size).toBeLessThan(6);
      await expect(page.locator(".tile-guided")).toHaveCount(0);
    }
  }
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await expect(page.getByLabel("Mảng mẫu")).toContainText("Vừa · 6 số");
  await expect(page.getByLabel("Mảng mẫu")).toContainText("Khó · 6 số");
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("7, 6, 5, 4, 3, 2, 1");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("2 đến 6 số nguyên");
});

test("deck hides future values and medium only shows a move when Buta is asked", async ({ page }) => {
  await enter(page);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng mẫu", { exact: true }).selectOption("medium");
  await custom(page, "8, 3, 6, 2, 5");
  await expect(page.locator(".insertion-tile:enabled")).toHaveCount(1);
  await expect(page.locator(".tile-deck strong")).toHaveCount(0);
  await expect(page.locator(".tile-deck")).toHaveCount(4);
  await expect(page.locator(".tile-guided, .slot-hinted, .is-guided")).toHaveCount(0);
  await page.getByRole("button", { name: "Buta gợi ý", exact: true }).click();
  await expect(page.locator(".tile-guided")).toHaveCount(1);
  await expect(page.locator(".insertion-lift-zone")).toHaveClass(/is-guided/);
  await page.getByRole("button", { name: "Đóng gợi ý", exact: true }).click();
  await dragTo(page, page.locator('.insertion-tile[data-index="1"]'), page.locator("[data-insertion-lift]"));
  await dragTo(page, page.locator('.insertion-tile[data-index="0"]'), page.locator("[data-insertion-hole]"));
  await dragTo(page, page.locator(".tile-held"), page.locator("[data-insertion-hole]"));
  await dragTo(page, page.locator('.insertion-tile[data-next="true"]'), page.locator("[data-insertion-lift]"));
  // Dragging a non-adjacent card must not move the correct neighbour instead.
  await dragTo(page, page.locator('.insertion-tile[data-index="0"]'), page.locator("[data-insertion-hole]"));
  await expect(page.locator('[data-insertion-hole="2"]')).toBeVisible();
  await expect(page.locator('.insertion-tile[data-index="1"]')).toHaveAttribute("data-value", "8");
  await page.getByRole("button", { name: "Buta gợi ý", exact: true }).click();
  await expect(page.locator(".insertion-hint")).toContainText("8 lớn hơn 6");
});

test("equal cards keep their symbols and cannot be shifted past one another", async ({ page }) => {
  await enter(page);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng mẫu", { exact: true }).selectOption("hard");
  await custom(page, "3, 3, -2, 0, -2, 1");
  await dragTo(page, page.locator('.insertion-tile[data-next="true"]'), page.locator("[data-insertion-lift]"));
  expect(await page.locator(".tile-held .insertion-card-suit").textContent()).not.toBe(await page.locator('[data-zone="hand"] .insertion-card-suit').textContent());
  await dragTo(page, page.locator('[data-zone="hand"]'), page.locator("[data-insertion-hole]"));
  await expect(page.getByRole("status")).toContainText("Hai thẻ cùng số");
  await expect(page.locator('[data-insertion-hole="1"]')).toBeVisible();
  await solve(page);
  const sorted = await page.locator(".insertion-tile").evaluateAll(nodes => nodes.map(node => ({ id: Number(node.getAttribute("data-item-id")), value: Number(node.getAttribute("data-value")), index: Number(node.getAttribute("data-index")) })).sort((a, b) => a.index - b.index));
  expect(sorted.map(item => item.value)).toEqual([-2, -2, 0, 1, 3, 3]);
  expect(sorted.filter(item => item.value === 3).map(item => item.id)).toEqual([0, 1]);
  expect(sorted.filter(item => item.value === -2).map(item => item.id)).toEqual([2, 4]);
});

test("six-number demo keeps tiles, narration and controls visible", async ({ page }) => {
  await enter(page, "Demo");
  await custom(page, "6, 2, 5, 3, 4, 1");
  for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (let step = 0; step < 4; step++) {
      await expect(page.locator(".insertion-tile")).toHaveCount(6);
      expect(await page.locator(".insertion-board-scroll").evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
      for (const tile of await page.locator(".insertion-tile").all()) await expectLessonVisible(page, tile);
      await expectLessonVisible(page, page.locator(".array-demo-dialogue .insertion-dialogue"));
      await expectLessonVisible(page, page.locator(".insertion-playback"));
      await expectLessonVisible(page, page.locator(".insertion-demo-progress"));
      const board = (await page.locator(".insertion-board").boundingBox())!;
      const narration = (await page.locator(".array-demo-dialogue .insertion-dialogue").boundingBox())!;
      if (width <= 700 && height > 500) expect(board.y + board.height).toBeLessThanOrEqual(narration.y + 1);
      else expect(board.x + board.width).toBeLessThanOrEqual(narration.x + 1);
      await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
    }
    await page.screenshot({ path: `.qa/insertion-demo-six-${width}.png` });
  }
  while (await page.getByRole("button", { name: "Bước tiếp", exact: true }).count()) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('[data-zone="hand"]')).toHaveCount(6);
  for (const tile of await page.locator(".insertion-tile").all()) await expect(tile).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: ".qa/insertion-cards-complete.png" });
});

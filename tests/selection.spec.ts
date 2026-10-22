import { expect, test, type Page } from "@playwright/test";
import { enterTrack } from "./track-navigation";
import { createSelectionLesson } from "../src/engine/selectionSort";

async function enter(page: Page, mode = "Play") { await enterTrack(page, "Selection Sort", mode); }
async function custom(page: Page, input: string) {
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill(input);
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
}
async function solve(page: Page) {
  for (let turn = 0; turn < 20; turn++) {
    await expect(page.locator(".selection-world")).toHaveAttribute("data-busy", "false");
    if (await page.locator(".selection-victory").count()) return;
    if (await page.locator(".selection-world").getAttribute("data-phase") === "choose") {
      const items = await page.locator(".selection-tile:not(.tile-fixed)").evaluateAll(nodes => nodes.map(node => ({ value: Number(node.getAttribute("data-value")), id: node.getAttribute("data-selection-id")! })));
      const minimum = items.reduce((smallest, item) => item.value <= smallest.value ? item : smallest);
      await page.locator(`[data-selection-id="${minimum.id}"]`).click();
    }
    await page.locator(".selection-action button").last().click();
  }
  throw new Error("Selection Sort did not finish");
}

test("play explains a wrong choice, accepts duplicate minima, sorts and saves, then opens Insertion", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await enter(page);
  await custom(page, "4, -1, 4, 0, -1");
  await page.getByRole("button", { name: "Số 4, ô 1", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Thẻ 4 chưa phải nhỏ nhất");
  expect(await page.locator(".selection-tile").evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-value"))))).toEqual([4, -1, 4, 0, -1]);
  await page.getByRole("button", { name: "Số -1, ô 5", exact: true }).click();
  await expect(page.locator(".tile-candidate")).toHaveAttribute("data-selection-id", "4");
  await page.getByRole("button", { name: "Số 4, ô 1", exact: true }).click();
  await solve(page);
  expect(await page.locator(".selection-tile").evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-value"))))).toEqual([-1, -1, 0, 4, 4]);
  expect(await page.locator(".selection-tile").evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-selection-id"))).sort())).toEqual([0, 1, 2, 3, 4]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!).selection)).toBe(true);
  await page.getByRole("button", { name: "Đi tiếp cùng Buta", exact: true }).click();
  await expect(page.locator("#track-sheet-title")).toHaveText("Insertion Sort");
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("mouse drags the minimum straight to the goal in one gesture", async ({ page }) => {
  await enter(page);
  await custom(page, "5, 1");
  const item = (await page.locator('[data-selection-id="1"]').boundingBox())!;
  const goal = (await page.locator("[data-selection-target]").boundingBox())!;
  await page.mouse.move(item.x + item.width / 2, item.y + item.height / 2);
  await page.mouse.down();
  await page.mouse.move(goal.x + goal.width / 2, goal.y + goal.height / 2, { steps: 15 });
  await expect(page.locator(".goal-over")).toBeVisible();
  await page.mouse.up();
  await expect(page.locator(".selection-victory")).toBeVisible();
  await expect(page.locator(".selection-victory")).toContainText("250 điểm");
  await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
  expect(await page.locator(".selection-tile").evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-value"))))).toEqual([5, 1]);
});

test("keyboard can fix an already-correct minimum without swapping or duplicate scoring", async ({ page }) => {
  await enter(page);
  await custom(page, "1, 2");
  await page.getByRole("button", { name: "Số 1, ô 1", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".selection-action button")).toHaveText("Giữ nguyên vị trí");
  await page.locator(".selection-action button").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".selection-victory")).toBeVisible();
  await expect(page.locator(".selection-victory")).toContainText("0 lần đổi chỗ");
  await expect(page.locator(".selection-victory")).toContainText("250 điểm");
});

test("touch dragging works; a missed drop keeps the choice ready to place", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await enter(page);
  await custom(page, "8, 2");
  const cdp = await context.newCDPSession(page);
  const tile = (await page.locator('[data-selection-id="1"]').boundingBox())!;
  const goal = (await page.locator("[data-selection-target]").boundingBox())!;
  const x = tile.x + tile.width / 2, y = tile.y + tile.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 12; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (goal.x + goal.width / 2 - x) * step / 12, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator(".selection-victory")).toBeVisible();
  await page.getByRole("button", { name: "Chơi lại", exact: true }).tap();
  await page.getByRole("button", { name: "Số 2, ô 2", exact: true }).tap();
  const picked = (await page.locator('[data-selection-id="1"]').boundingBox())!;
  const startX = picked.x + picked.width / 2, startY = picked.y + picked.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y: startY }] });
  for (let step = 1; step <= 10; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: startX, y: startY - step * 10 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator(".selection-world")).toHaveAttribute("data-phase", "place");
  await expect(page.getByRole("status")).toContainText("Thả món đồ vào ô cờ");
  await expect(page.locator(".selection-score")).toHaveText("100");
  await page.getByRole("button", { name: "Đưa về ô 1", exact: true }).tap();
  await expect(page.locator(".selection-victory")).toBeVisible();
  await context.close();
});

test("demo scans the suffix, explains equal values, supports controls and never awards completion", async ({ page }) => {
  await enter(page, "Demo");
  const input = [2, 2, 1];
  await custom(page, input.join(", "));
  const frames = createSelectionLesson(input);
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".tile-scan")).toHaveAttribute("data-selection-index", "1");
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".selection-dialogue")).toContainText("Hai số bằng nhau");
  await page.getByRole("button", { name: "Bước trước", exact: true }).click();
  await expect(page.locator(".tile-scan")).toHaveAttribute("data-selection-index", "1");
  await page.getByRole("button", { name: /^Tốc độ demo:/ }).click();
  await expect(page.getByRole("button", { name: /^Tốc độ demo:/ })).toHaveText("1.5x");
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const value = await page.locator("progress").getAttribute("value");
  await page.waitForTimeout(500);
  await expect(page.locator("progress")).toHaveAttribute("value", value!);
  for (let index = 2; index < frames.length; index++) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tự mình thử", exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!).selection)).toBeUndefined();
  await page.getByRole("button", { name: "Tự mình thử", exact: true }).click();
  await expect(page.locator(".selection-play")).toBeVisible();
});

test("settings validate arrays and victory upgrades through the three levels", async ({ page }) => {
  await enter(page);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("1, 2.5");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("số nguyên");
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("1, 2");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await solve(page);
  for (const [level, count] of [["medium", 7], ["hard", 8]] as const) {
    await page.getByRole("button", { name: "Tăng độ khó", exact: true }).click();
    await expect(page.locator(".selection-tile")).toHaveCount(count);
    await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
    await expect(page.getByRole("combobox")).toHaveValue(level);
    await page.getByLabel("Mảng của bạn", { exact: true }).fill("1, 2");
    await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
    await solve(page);
  }
  await expect(page.getByRole("button", { name: "Tăng độ khó", exact: true })).toHaveCount(0);
});

test("eight items fit two rows; cross-row swapping preserves identities and locks the fixed prefix", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await enter(page);
  await custom(page, "8, 7, 6, 5, 4, 3, 2, -1");
  const cards = page.locator(".selection-tile");
  await expect(cards).toHaveCount(8);
  const boxes = await cards.evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect(); return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
  }));
  expect(new Set(boxes.map(box => box.top)).size).toBe(2);
  expect(boxes.every(box => box.left >= 0 && box.right <= 320 && box.top >= 0 && box.bottom <= 568)).toBe(true);
  expect(await page.locator(".selection-board-scroll").evaluate(node => node.scrollWidth - node.clientWidth)).toBe(0);
  // Before choosing, all unfinished cards use the same treatment regardless of value.
  await expect(page.locator(".tile-candidate,.tile-scan")).toHaveCount(0);
  const item = (await page.locator('[data-selection-id="7"]').boundingBox())!;
  const goal = (await page.locator("[data-selection-target]").boundingBox())!;
  await page.mouse.move(item.x + item.width / 2, item.y + item.height / 2);
  await page.mouse.down();
  await page.mouse.move(goal.x + goal.width / 2, goal.y + goal.height / 2, { steps: 15 });
  await expect(page.locator(".goal-over")).toBeVisible();
  await page.mouse.up();
  await expect(page.locator(".selection-world")).toHaveAttribute("data-busy", "false");
  expect(await cards.evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-value"))))).toEqual([-1,7,6,5,4,3,2,8]);
  await expect(page.locator('[data-selection-index="0"]')).toHaveAttribute("data-selection-id", "7");
  await expect(page.locator('.tile-fixed')).toBeDisabled();
  await expect(page.locator(".pack-heading")).toContainText("1/8 đã buộc dây");
  await page.screenshot({ path: ".qa/selection-pack-cross-row.png" });
});

test("touch drags across rows and cancellation leaves the chosen item ready to place", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage(); await enter(page); await custom(page, "8,7,6,5,4,3,2,1");
  const cdp = await context.newCDPSession(page);
  const item = (await page.locator('[data-selection-id="7"]').boundingBox())!;
  const goal = (await page.locator("[data-selection-target]").boundingBox())!;
  const x = item.x + item.width / 2, y = item.y + item.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 10; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (goal.x + goal.width / 2 - x) * step / 10, y: y + (goal.y + goal.height / 2 - y) * step / 10 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator(".selection-world")).toHaveAttribute("data-busy", "false");
  await expect(page.locator('[data-selection-index="0"]')).toHaveAttribute("data-value", "1");
  await expect(page.locator(".selection-score")).toHaveText("250");
  await expect(page.locator(".tile-fixed")).toHaveCount(1);
  const next = (await page.locator('[data-selection-id="6"]').boundingBox())!;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: next.x + next.width / 2, y: next.y + next.height / 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: next.x + next.width / 2, y: next.y + next.height / 2 - 20 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await expect(page.locator(".selection-ghost")).toHaveCount(0);
  await expect(page.locator(".selection-world")).toHaveAttribute("data-phase", "place");
  await expect(page.locator(".selection-score")).toHaveText("350");
  await page.getByRole("button", { name: "Đưa về ô 2", exact: true }).tap();
  await expect(page.locator(".selection-world")).toHaveAttribute("data-busy", "false");
  await expect(page.locator('[data-selection-index="1"]')).toHaveAttribute("data-value", "2");
  await expect(page.locator(".selection-score")).toHaveText("500");
  await context.close();
});

test("demo pauses the real swap animation and settings do not recreate it", async ({ page }) => {
  await enter(page, "Demo");
  await custom(page, "2, 1");
  for (let step = 0; step < 4; step++) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const time = () => page.locator(".selection-tile").first().evaluate(node => node.getAnimations().filter(animation => animation.effect instanceof KeyframeEffect && animation.effect.getKeyframes().some(frame => "transform" in frame)).map(animation => ({ state: animation.playState, time: Number(animation.currentTime) })));
  await expect.poll(async () => (await time()).some(animation => animation.state === "paused")).toBe(true);
  const before = await time();
  await page.waitForTimeout(200);
  expect(await time()).toEqual(before);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  expect(await time()).toEqual(before);
});

test("muted audio still allows haptics and the vibration toggle stops them", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("piggy-sound", "off");
    (window as any).selectionVibrations = [];
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: (pattern: unknown) => { (window as any).selectionVibrations.push(pattern); return true; } });
  });
  await enter(page);
  await custom(page, "3, 1, 2");
  await page.getByRole("button", { name: "Số 3, ô 1", exact: true }).click();
  expect(await page.evaluate(() => (window as any).selectionVibrations)).toContainEqual([25, 40, 25]);
  await page.getByRole("button", { name: "Số 1, ô 2", exact: true }).click();
  expect(await page.evaluate(() => (window as any).selectionVibrations)).toContain(14);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByRole("button", { name: /Rung khi thao tác/ }).click();
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.getByRole("button", { name: "Đưa về ô 1", exact: true }).click();
  expect(await page.evaluate(() => (window as any).selectionVibrations)).not.toContainEqual([12, 25, 18]);
  expect(await page.evaluate(() => localStorage.getItem("algoventure-haptics"))).toBe("off");
});

test("play and demo fit desktop at 100% and remain usable on phone portrait and landscape", async ({ page }) => {
  await enter(page);
  await custom(page, "8,3,3,5,0,9,-99,2");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [width, height] of [[1440, 900], [1536, 707], [1280, 580], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    for (const item of await page.locator(".selection-tile").all()) await expect(item).toBeInViewport({ ratio: 1 });
    if (width >= 1024) {
      expect(await page.locator(".selection-world").evaluate(node => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(1);
      await expect(page.getByRole("button", { name: "Buta gợi ý", exact: true })).toBeInViewport();
    }
    if ([1440, 390].includes(width)) await page.screenshot({ path: `.qa/selection-play-${width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Số -99, ô 7", exact: true }).click();
  await page.screenshot({ path: ".qa/selection-picked-mobile.png" });
  await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
  await page.getByRole("button", { name: "Xem demo", exact: true }).click();
  for (const [width, height] of [[1536, 707], [1280, 580], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    for (const item of await page.locator(".selection-tile").all()) await expect(item).toBeInViewport({ ratio: 1 });
    if (width >= 1024) {
      expect(await page.locator(".selection-world").evaluate(node => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(1);
      await expect(page.getByRole("button", { name: "Bắt đầu", exact: true })).toBeInViewport();
    }
  }
  await page.setViewportSize({ width: 1536, height: 707 });
  await page.screenshot({ path: ".qa/selection-demo-desktop.png" });
});


test("eight-item demo keeps scanning, choosing, swapping and completion visible on small screens", async ({ page }) => {
  await enter(page, "Demo"); await page.emulateMedia({ reducedMotion: "reduce" });
  const input = [8,3,3,5,0,9,-99,2]; await custom(page, input.join(","));
  const frames = createSelectionLesson(input);
  const checkpoints = new Set([0, 1, 2, frames.findIndex(frame => frame.kind === "choose"), frames.findIndex(frame => frame.kind === "place"), frames.length - 1]);
  for (let cursor = 0; cursor < frames.length; cursor++) {
    if (checkpoints.has(cursor)) for (const [width, height] of [[320,568],[390,844],[844,390],[1280,580],[1440,900]]) {
      await page.setViewportSize({ width, height });
      expect(await page.locator(".selection-world").evaluate(node => node.scrollHeight - node.clientHeight), `${width} ${frames[cursor].kind}`).toBeLessThanOrEqual(1);
      for (const node of await page.locator(".selection-tile,.selection-content h2,.selection-task,.selection-controls,.selection-dialogue p").all()) await expect(node).toBeInViewport({ ratio: 1 });
      const board = (await page.locator(".pack-table").boundingBox())!, controls = (await page.locator(".selection-controls").boundingBox())!;
      if (height > 500) expect(board.y + board.height).toBeLessThanOrEqual(controls.y + 1);
    }
    if (cursor < frames.length - 1) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  }
});


test("keep is always available, rejects an inverted flag without moving items and scores a direct keep once", async ({ page }) => {
  await enter(page); await custom(page, "1,8,2,3");
  const keep = page.getByRole("button", { name: "Giữ nguyên vị trí", exact: true });
  await expect(keep).toBeVisible();
  await expect(page.locator(".tile-candidate")).toHaveCount(0);
  await keep.dblclick();
  await expect(page.locator(".selection-world")).toHaveAttribute("data-busy", "false");
  await expect(page.locator(".selection-score")).toHaveText("250");
  await expect(page.locator(".tile-fixed")).toHaveCount(1);
  await expect(keep).toBeEnabled();
  const values = () => page.locator(".selection-tile").evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-value"))));
  await keep.click();
  await expect(page.getByRole("status")).toContainText("Ô cờ chưa có số nhỏ nhất");
  await expect(page.locator(".selection-score")).toHaveText("225");
  expect(await values()).toEqual([1,8,2,3]);
  await expect(page.locator(".tile-fixed")).toHaveCount(1);
  await page.getByRole("button", { name: "Số 2, ô 3", exact: true }).click();
  await expect(keep).toBeVisible();
  await keep.click();
  await expect(page.locator(".selection-score")).toHaveText("300");
  await expect(page.locator(".tile-candidate")).toHaveAttribute("data-value", "2");
  expect(await values()).toEqual([1,8,2,3]);
  await page.getByRole("button", { name: "Đưa về ô 2", exact: true }).click();
  await expect(page.locator(".selection-world")).toHaveAttribute("data-busy", "false");
  await expect(page.locator(".selection-score")).toHaveText("450");
  expect(await values()).toEqual([1,2,8,3]);
});

test("direct keep accepts equal minima by touch and handles the final round", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  const page = await context.newPage(); await enter(page); await custom(page, "-1,-1,2");
  const keep = page.getByRole("button", { name: "Giữ nguyên vị trí", exact: true });
  await keep.tap();
  await expect(page.locator(".selection-world")).toHaveAttribute("data-busy", "false");
  await expect(keep).toBeInViewport();
  await keep.focus(); await page.keyboard.press("Enter");
  await expect(page.locator(".selection-victory")).toBeVisible();
  await expect(page.locator(".selection-victory")).toContainText("500 điểm");
  await expect(page.locator(".selection-victory")).toContainText("0 lần đổi chỗ");
  expect(await page.locator(".selection-tile").evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-selection-id"))))).toEqual([0,1,2]);
  await context.close();
});

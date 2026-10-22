import { expect, test, type Locator, type Page } from "@playwright/test";
import { enterTrack } from "./track-navigation";
import { expectLessonFits, expectLessonVisible } from "./lesson-viewport";

async function enter(page: Page, demo = false) {
  await enterTrack(page, "Merge Sort", demo ? "Demo" : "Play");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install(); await page.clock.pauseAt(new Date());
}
async function custom(page: Page, values: string) {
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill(values);
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
}
async function settle(page: Page) { await page.clock.runFor(500); await expect(page.locator(".merge-world")).toHaveAttribute("data-busy", "false"); }
async function splitAll(page: Page) {
  while (await page.locator(".merge-world").getAttribute("data-phase") === "split") {
    await page.getByRole("button", { name: "Tách nhánh", exact: true }).click(); await settle(page);
  }
  await expect(page.locator(".stream-leaf.is-guided")).toHaveCount(0);
}
async function correct(page: Page) {
  const heads = await page.locator('.stream-leaf[data-head="true"]').evaluateAll(nodes => nodes.map(node => ({ id: node.getAttribute("data-item-id"), value: Number(node.getAttribute("data-value")), lane: node.getAttribute("data-lane")! })));
  heads.sort((a, b) => a.value - b.value || (a.lane === "left" ? -1 : 1));
  await page.locator(`button.stream-leaf[data-item-id="${heads[0].id}"]`).click(); await settle(page);
}
async function solve(page: Page) {
  await splitAll(page);
  for (let step = 0; step < 50; step++) {
    const phase = await page.locator(".merge-world").getAttribute("data-phase");
    if (phase === "done") { await expect(page.locator(".merge-victory")).toBeVisible(); return; }
    if (phase === "joined") { await page.locator(".stream-next-group").click(); await settle(page); }
    else await correct(page);
  }
  throw new Error("Stream did not finish");
}
async function dragTo(page: Page, source: Locator, target: Locator) {
  const a = (await source.boundingBox())!, b = (await target.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
  await expect(page.locator(".stream-drag-ghost")).toBeVisible(); await page.mouse.up(); await settle(page);
}

test("manual splits and leaves wait indefinitely; wrong choices can be corrected", async ({ page }) => {
  await enter(page); await custom(page, "2,1");
  await page.clock.runFor(60000); await expect(page.locator(".merge-world")).toHaveAttribute("data-phase", "split");
  await expect(page.locator(".factory-background,.race-surface,.race-lever")).toHaveCount(0);
  await splitAll(page);
  await page.clock.runFor(60000); await expect(page.locator(".merge-world")).toHaveAttribute("data-moves", "0");
  await page.locator('[data-lane="left"][data-head="true"]').click();
  await expect(page.getByRole("status")).toContainText("chưa tới lượt");
  await expect(page.locator(".merge-world")).toHaveAttribute("data-moves", "0");
  await correct(page); await page.clock.runFor(60000);
  await expect(page.locator(".merge-world")).toHaveAttribute("data-moves", "1");
  await expect(page.locator('[data-lane="left"][data-head="true"]')).toBeVisible();
  await solve(page);
});

test("sorts negatives and duplicates stably, saves completion and opens Quick", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await enter(page); await custom(page, "3,-1,3,0"); await solve(page);
  const result = await page.locator('.stream-pond [data-item-id]').evaluateAll(nodes => nodes.map(node => ({ value: Number(node.getAttribute("data-value")), id: Number(node.getAttribute("data-item-id")) })));
  expect(result.map(item => item.value)).toEqual([-1, 0, 3, 3]);
  expect(result.filter(item => item.value === 3).map(item => item.id)).toEqual([0, 2]);
  await expect(page.locator(".merge-victory")).toContainText("950 điểm");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!).merge)).toBe(true);
  await page.clock.resume();
  await page.getByRole("button", { name: "Đi tiếp cùng Buta", exact: true }).click();
  await expect(page.locator("#track-sheet-title")).toHaveText("Quick Sort"); expect(errors).toEqual([]);
});

test("ties take left first; keyboard and mouse drag perform real moves", async ({ page }) => {
  await enter(page); await custom(page, "5,5");
  await dragTo(page, page.getByRole("button", { name: "Tách nhánh", exact: true }), page.locator('[data-split-bank]').first());
  await page.locator('[data-lane="right"][data-head="true"]').press("Enter");
  await expect(page.getByRole("status")).toContainText("nhánh trái");
  await expect(page.locator(".merge-world")).toHaveAttribute("data-moves", "0");
  await dragTo(page, page.locator('[data-lane="left"][data-head="true"]'), page.locator("[data-merge-pond]"));
  await expect(page.locator(".merge-world")).toHaveAttribute("data-moves", "1");
  await page.locator('[data-lane="right"][data-head="true"]').press("Space"); await settle(page);
  await page.locator(".stream-next-group").press("Enter"); await settle(page);
  await expect(page.locator(".merge-victory")).toBeVisible();
});

test("touch can split and move leaves into the pond", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage(); await enter(page); await custom(page, "2,1");
  const cdp = await context.newCDPSession(page);
  async function touchDrag(source: Locator, target: Locator) {
    const a = (await source.boundingBox())!, b = (await target.boundingBox())!, x = a.x + a.width / 2, y = a.y + a.height / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (b.x + b.width / 2 - x) * i / 10, y: y + (b.y + b.height / 2 - y) * i / 10 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await settle(page);
  }
  await touchDrag(page.getByRole("button", { name: "Tách nhánh", exact: true }), page.locator("[data-split-bank]").first());
  await touchDrag(page.locator('[data-lane="right"][data-head="true"]'), page.locator("[data-merge-pond]"));
  await expect(page.locator(".merge-world")).toHaveAttribute("data-moves", "1");
  await touchDrag(page.locator('[data-lane="left"][data-head="true"]'), page.locator("[data-merge-pond]"));
  await page.locator(".stream-next-group").tap(); await settle(page); await expect(page.locator(".merge-victory")).toBeVisible();
  await context.close();
});

test("missed or cancelled drags preserve state; hints, settings and hidden tabs block moves", async ({ page }) => {
  await enter(page); await custom(page, "2,1"); await splitAll(page);
  const leaf = page.locator('[data-lane="right"][data-head="true"]'), box = (await leaf.boundingBox())!;
  for (const cancelled of [false, true]) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y - 30, { steps: 8 });
    if (cancelled) await page.locator(".merge-stream-board").dispatchEvent("pointercancel");
    await page.mouse.up(); await expect(page.locator(".merge-world")).toHaveAttribute("data-moves", "0");
    await expect(page.locator(".merge-score strong")).toHaveText("50");
  }
  await page.getByRole("button", { name: "Buta gợi ý", exact: true }).click();
  await expect(page.locator(".stream-leaf.is-guided")).toHaveCount(0);
  await expect(leaf).toBeDisabled(); await page.clock.runFor(10000); await expect(page.locator(".merge-world")).toHaveAttribute("data-moves", "0");
  await page.getByRole("button", { name: "Đóng gợi ý", exact: true }).click();
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click(); await expect(leaf).toBeDisabled();
  await page.getByRole("button", { name: "Đóng", exact: true }).click(); await expect(leaf).toBeEnabled();
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); }); await expect(leaf).toBeDisabled();
});

test("hard has negatives and duplicates without timers; custom arrays validate", async ({ page }) => {
  await enter(page); await page.getByRole("button", { name: "Tùy chọn", exact: true }).click(); await page.getByLabel("Mảng mẫu").selectOption("hard");
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  const values = (await page.getByLabel("Mảng của bạn", { exact: true }).inputValue()).split(",").map(Number);
  expect(values).toHaveLength(8); expect(values.some(value => value < 0)).toBe(true); expect(new Set(values).size).toBeLessThan(8);
  for (const invalid of ["", "1", "100,2", "1.5,2", "a,2", "1,2,3,4,5,6,7,8,9"]) {
    await page.getByLabel("Mảng của bạn", { exact: true }).fill(invalid); await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click(); await expect(page.getByRole("alert")).toBeVisible();
  }
  await page.getByRole("button", { name: "Đóng", exact: true }).click(); await page.clock.runFor(120000);
  await expect(page.locator(".merge-world")).toHaveAttribute("data-phase", "split"); await expect(page.locator(".merge-stats")).toContainText("Không giới hạn giờ");
});

test("split and merge fit eight leaves on phones, landscape and desktop", async ({ page }) => {
  await enter(page);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng mẫu").selectOption("hard");
  await custom(page, "6,-2,4,4,0,3,-2,5");
  async function check(stage: string) {
    for (const [width, height] of [[1440,900], [1280,580], [390,844], [320,568], [844,390]]) {
      await page.setViewportSize({ width, height }); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await expectLessonFits(page, ".merge-world", 2);
      await expectLessonVisible(page, page.getByRole("button", { name: "Buta gợi ý", exact: true })); await expectLessonVisible(page, page.locator(".merge-stream-board"));
      await page.screenshot({ path: `.qa/merge-stream-${stage}-${width}.png` });
    }
  }
  await check("split"); await splitAll(page);
  while (await page.locator(".merge-world").getAttribute("data-moves") !== "16") {
    if (await page.locator(".merge-world").getAttribute("data-phase") === "joined") { await page.locator(".stream-next-group").click(); await settle(page); } else await correct(page);
  }
  await page.locator(".stream-next-group").click(); await settle(page); await check("merge");
  for (let i = 0; i < 4; i++) await correct(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".qa/merge-stream-preview.png" });
  await solve(page);
});

test("demo steps backwards, pauses, changes speed and never awards completion", async ({ page }) => {
  await enter(page, true); await custom(page, "2,1"); await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  const progress = await page.locator(".merge-demo-progress > span").textContent(); await page.getByRole("button", { name: "Bước trước", exact: true }).click(); await expect(page.locator(".merge-demo-progress > span")).not.toHaveText(progress!);
  await page.getByRole("button", { name: "Bắt đầu", exact: true }).click(); await page.clock.runFor(500); await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const paused = await page.locator(".merge-demo-progress > span").textContent(); await page.clock.runFor(10000); await expect(page.locator(".merge-demo-progress > span")).toHaveText(paused!);
  await page.getByRole("button", { name: /^Tốc độ demo:/ }).click(); await expect(page.getByRole("button", { name: /^Tốc độ demo:/ })).toHaveText("1.5x");
  while (await page.getByRole("button", { name: "Bước tiếp", exact: true }).count()) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!).merge)).not.toBe(true);
  await page.getByRole("button", { name: "Tự mình thử", exact: true }).click(); await expect(page.locator(".merge-world")).toHaveAttribute("data-phase", "split");
});

test("demo pauses the moving leaf itself and applies speed to its animation", async ({ page }) => {
  await enter(page, true); await custom(page, "2,1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const motion = () => page.locator(".merge-stream-board").evaluate(node => node.getAnimations({ subtree: true }).filter(animation => ((animation.effect as KeyframeEffect).target as Element)?.matches(".stream-leaf")).map(animation => ({ time: Number(animation.currentTime), state: animation.playState, rate: animation.playbackRate })));
  await expect.poll(async () => (await motion()).some(animation => animation.state === "paused")).toBe(true);
  const before = await motion(); await page.waitForTimeout(150); expect(await motion()).toEqual(before);
  await page.getByRole("button", { name: /^Tốc độ demo:/ }).click();
  expect((await motion()).every(animation => animation.rate === 1.5)).toBe(true);
});

test("every demo frame fits the nature board and controls at small and large viewports", async ({ page }) => {
  await enter(page, true); await custom(page, "4,-1,4,2,0");
  for (const [width, height] of [[320,568], [390,844], [844,390], [1280,580], [1440,900]]) {
    await page.setViewportSize({ width, height }); await page.getByRole("button", { name: "Tùy chọn", exact: true }).click(); await page.getByRole("button", { name: "Chơi lại từ đầu", exact: true }).click();
    for (let frame = 0; frame < 70; frame++) {
      await expectLessonFits(page, ".merge-world", 2);
      await expectLessonVisible(page, page.locator(".merge-controls")); await expectLessonVisible(page, page.locator(".merge-stream-board"));
      await expect(page.locator(".merge-world img[src*=merge-factory]")).toHaveCount(0);
      if (await page.getByRole("button", { name: "Tự mình thử", exact: true }).count()) break;
      await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
    }
    await page.screenshot({ path: `.qa/merge-stream-demo-${width}.png` });
  }
});

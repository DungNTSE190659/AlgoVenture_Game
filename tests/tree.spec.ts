import { expect, test, type Page } from "@playwright/test";
import { TREE_IDS, TREE_TITLES, createTreeCourse, type TreeLessonId } from "../src/engine/tree";
import { TREES } from "../src/engine/learningTrack";

async function enterTree(page: Page, id: TreeLessonId, mode: "demo" | "play" = "play") {
  await page.addInitScript(({ ids, id }) => {
    if (sessionStorage.getItem("tree-qa-seeded")) return;
    sessionStorage.setItem("tree-qa-seeded", "yes");
    const progress = Object.fromEntries(ids.slice(0, ids.indexOf(id)).map(i => [i, true]));
    localStorage.setItem("algoventure.world-progress.v3", JSON.stringify(progress));
    localStorage.setItem("piggy-sound", "off");
  }, { ids: [...TREE_IDS], id });
  await page.goto("/");
  await page.getByRole("button", { name: "Xem chủ đề Cây", exact: true }).click();
  await page.locator(".atlas-enter").click();
  await page.getByRole("button", { name: TREES.find(t => t.id === id)!.name, exact: true }).click();
  await page.getByRole("button", { name: mode === "demo" ? "Xem demo" : "Thử thách", exact: true }).click();
  await expect(page.locator(".tree-game h1")).toHaveText(TREE_TITLES[id]);
}
async function gesture(page: Page, item: string, target: string, touch = false) {
  const source = page.locator(`[data-item="${item}"]`), destination = page.locator(`[data-drop="${target}"]`);
  const a = await source.boundingBox(), b = await destination.boundingBox();
  expect(a).not.toBeNull(); expect(b).not.toBeNull();
  const from = { x: a!.x + a!.width / 2, y: a!.y + a!.height / 2 }, to = { x: b!.x + b!.width / 2, y: b!.y + b!.height / 2 };
  if (touch) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...from, id: 1 }] });
    for (let i = 1; i <= 5; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from.x + (to.x - from.x) * i / 5, y: from.y + (to.y - from.y) * i / 5, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
  } else {
    await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(to.x, to.y, { steps: 5 }); await page.mouse.up();
  }
}
async function withinViewport(page: Page) {
  const size = page.viewportSize()!;
  const metrics = await page.locator(".tree-game").evaluate(el => ({ width: el.clientWidth, height: el.clientHeight, scrollWidth: el.scrollWidth, scrollHeight: el.scrollHeight }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(size.width + 1);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(size.height + 1);
  const documentSize = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
  expect(documentSize.width).toBeLessThanOrEqual(size.width);
  expect(documentSize.height).toBeLessThanOrEqual(size.height);
  for (const selector of [".tree-board", ".tree-supply", ".tree-actions"]) {
    const bounds = await page.locator(selector).boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(0); expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(size.height + 1);
  }
  const clipped = await page.locator(".tree-board-viewport, .tree-side").evaluateAll(elements => elements.filter(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1).map(el => ({ element: el.className, height: el.clientHeight, contentHeight: el.scrollHeight, width: el.clientWidth, contentWidth: el.scrollWidth })));
  expect(clipped).toEqual([]);
}
for (const touch of [false, true]) test.describe(touch ? "Tree mobile touch" : "Tree desktop mouse", () => {
  test.use({ viewport: touch ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: touch, isMobile: touch, reducedMotion: "reduce" });
  for (const id of TREE_IDS) test(`${id} completes every round by drag and preserves progress`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    page.on("response", r => { if (r.url().startsWith("http://127.0.0.1") && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await enterTree(page, id);
    await withinViewport(page);
    await page.screenshot({ path: `.qa/tree-${id}-${touch ? "mobile" : "desktop"}.png` });
    const course = createTreeCourse(id);
    for (const [r, round] of course.rounds.entries()) {
      for (const [i, step] of round.steps.entries()) {
        await expect(page.locator(".tree-mission p")).toHaveText(step.instruction);
        if (i === 0) await withinViewport(page);
        await gesture(page, step.item, step.target, touch);
      }
      await withinViewport(page);
      if (r === course.rounds.length - 1) await page.screenshot({ path: `.qa/tree-${id}-${touch ? "mobile" : "desktop"}-final.png` });
      await page.getByRole("button", { name: "Kiểm tra cây", exact: false }).click();
    }
    await expect(page.getByRole("heading", { name: "Khu rừng đã thêm xanh!" })).toBeVisible();
    await expect(page.locator(".victory-summary")).toContainText(`${course.rounds.reduce((n, r) => n + r.steps.length, 0) * 100} điểm`);
    expect(await page.evaluate(id => JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!)[id], id)).toBe(true);
    await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
    await expect(page.locator(".tree-mission p")).toHaveText(course.rounds[0].steps[0].instruction);
    await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
    await expect(page.locator(".track-viewport")).toBeVisible();
    await page.reload();
    expect(await page.evaluate(id => JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!)[id], id)).toBe(true);
    expect(errors).toEqual([]);
  });
});

test.describe("Tree controls and recovery", () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  test("wrong drop, missed drop, pointercancel, undo and keyboard placement", async ({ page }) => {
    await enterTree(page, "tree-basics");
    const source = page.locator('[data-item="seed:20"]'), root = page.locator('[data-drop="slot:0"]');
    await gesture(page, "seed:20", "slot:0");
    await expect(page.locator(".tree-local-feedback")).toContainText("20 có thể làm gốc của một cây khác");
    await expect(page.locator(".tree-score")).toHaveText("0");
    const start = await source.boundingBox();
    await page.mouse.move(start!.x + 20, start!.y + 20); await page.mouse.down();
    await page.mouse.move(start!.x + 40, start!.y - 30);
    await source.dispatchEvent("pointercancel", { pointerId: 1 });
    await page.mouse.up();
    await expect(page.locator(".tree-drag-ghost")).toHaveCount(0);
    await page.locator('[data-item="seed:40"]').focus(); await page.keyboard.press("Enter");
    await root.focus(); await page.keyboard.press("Space");
    await expect(page.locator('[data-slot="0"]')).toHaveText("40");
    await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
    await expect(page.locator('[data-item="seed:40"]')).toBeVisible();
    const a = await source.boundingBox();
    await page.mouse.move(a!.x + 20, a!.y + 20); await page.mouse.down(); await page.mouse.move(5, 5); await page.mouse.up();
    await expect(page.locator(".tree-drag-ghost")).toHaveCount(0);
    await expect(page.locator('[data-item="seed:40"]')).toBeVisible();
    await page.getByRole("button", { name: "Buta gợi ý", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible(); await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Buta gợi ý", exact: true })).toBeFocused();
  });
  test("Demo deletion does not grant completion; speed/settings/pause work", async ({ page }) => {
    await enterTree(page, "bst-delete", "demo");
    const count = createTreeCourse("bst-delete").rounds.reduce((n, r) => n + r.steps.length + 1, -1);
    await page.getByRole("button", { name: "Phát demo", exact: true }).click();
    await page.getByRole("button", { name: "Tốc độ demo 1x", exact: true }).click();
    await expect(page.getByRole("button", { name: "Tốc độ demo 1.5x", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
    const before = await page.locator(".tree-demo-status").innerText();
    await page.waitForTimeout(1700);
    expect(await page.locator(".tree-demo-status").innerText()).toBe(before);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Tùy chọn", exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: "Phát demo", exact: true })).toBeVisible();
    for (let i = 0; i < count; i++) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
    await expect(page.getByRole("button", { name: "Xem lại từ đầu", exact: true })).toBeVisible();
    const progress = await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!));
    expect(progress["bst-delete"]).not.toBe(true);
    await page.getByRole("button", { name: "Tự mình thử", exact: true }).first().click();
    await expect(page.locator(".tree-play")).toBeVisible();
  });
  test("corrupt storage recovers and the new region is reachable", async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem("algoventure.world-progress.v3", "{broken"); localStorage.setItem("algoventure.tree-speed", "bogus"); });
    await page.goto("/");
    await page.getByRole("button", { name: "Xem chủ đề Cây", exact: true }).click(); await page.locator(".atlas-enter").click();
    await expect(page.locator(".track-stop")).toHaveCount(6);
    await page.getByRole("button", { name: "Xem demo", exact: true }).click();
    await expect(page.getByRole("button", { name: "Tốc độ demo 1x", exact: true })).toBeVisible();
  });
  test("all deletion cases can be completed with the keyboard", async ({ page }) => {
    await enterTree(page, "bst-delete");
    for (const round of createTreeCourse("bst-delete").rounds) {
      for (const step of round.steps) {
        await page.locator(`[data-item="${step.item}"]`).focus(); await page.keyboard.press("Enter");
        await page.locator(`[data-drop="${step.target}"]`).focus(); await page.keyboard.press("Space");
      }
      await page.getByRole("button", { name: "Kiểm tra cây", exact: false }).click();
    }
    await expect(page.locator(".tree-victory")).toBeVisible();
  });
  test("double activation verifies a round once and settings survive a reload", async ({ page }) => {
    await enterTree(page, "bst-insert");
    await gesture(page, "seed:40", "slot:0");
    await page.getByRole("button", { name: "Kiểm tra cây", exact: false }).evaluate(el => { (el as HTMLButtonElement).click(); (el as HTMLButtonElement).click(); });
    await expect(page.locator(".tree-meta")).toContainText("2/3");
    await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
    await page.getByRole("button", { name: "Hiệu ứng âm thanh", exact: false }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("piggy-sound"))).toBe("on");
    await page.reload();
    expect(await page.evaluate(() => localStorage.getItem("piggy-sound"))).toBe("on");
  });
});

test.describe("Tree Demo coverage", () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  for (const id of TREE_IDS) test(`${id} Demo reaches the end and can step back`, async ({ page }) => {
    await enterTree(page, id, "demo");
    await withinViewport(page);
    const course = createTreeCourse(id);
    for (const [r, round] of course.rounds.entries()) {
      for (const step of round.steps) {
        await expect(page.locator(".tree-mission p")).toHaveText(step.instruction);
        await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
      }
      if (r < course.rounds.length - 1) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
    }
    await expect(page.getByRole("button", { name: "Xem lại từ đầu", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Bước trước", exact: true }).click();
    await expect(page.locator(".tree-mission p")).toHaveText(course.rounds.at(-1)!.steps.at(-1)!.instruction);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!));
    expect(saved[id]).not.toBe(true);
  });
});

for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) test(`single-step Demo moves the actual node at ${size.width}px`, async ({ page }) => {
  await page.setViewportSize(size);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await enterTree(page, "tree-basics", "demo");
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  const flight = page.locator(".tree-motion-flight").first();
  await expect(flight).toBeVisible();
  await expect(page.locator('[data-slot="0"]')).toHaveCSS("opacity", "0");
  const start = await flight.boundingBox();
  await page.waitForTimeout(200);
  const moved = await flight.boundingBox();
  expect(Math.abs(moved!.x - start!.x) + Math.abs(moved!.y - start!.y)).toBeGreaterThan(5);
  await expect(flight).toHaveCount(0);
  await expect(page.locator('[data-slot="0"]')).toBeVisible();
  await withinViewport(page);
});
test("Tree Demo shows only the moving Buta until it arrives", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await enterTree(page, "bst-delete", "demo");
  for (const round of createTreeCourse("bst-delete").rounds.slice(0, 2)) {
    for (let i = 0; i <= round.steps.length; i++) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  }
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  const destination = page.locator('[data-tree-motion="pig"]');
  await expect(page.locator(".tree-motion-flight")).toBeVisible();
  await expect(destination).toHaveCSS("opacity", "0");
  await expect(page.locator(".tree-motion-flight")).toHaveCount(0);
  await expect(destination).toHaveCSS("opacity", "1");
});
for (const width of [1440, 390]) test(`Tree planting explains local and ancestor violations at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await enterTree(page, "tree-basics");
  const course = createTreeCourse("tree-basics");
  for (const round of course.rounds.slice(0, 2)) {
    for (const step of round.steps) await gesture(page, step.item, step.target);
    await page.getByRole("button", { name: "Kiểm tra cây", exact: false }).click();
  }
  for (const step of course.rounds[2].steps) {
    if (step.item === "seed:30" || step.item === "seed:50") {
      await gesture(page, step.item, step.item === "seed:30" ? "slot:5" : "slot:6");
      await expect(page.locator(".tree-local-feedback")).toContainText(step.item === "seed:30" ? "30 < gốc 40" : "50 < 60");
      await expect(page.locator(".tree-local-feedback")).not.toContainText("Đề bài");
      await withinViewport(page);
    }
    await gesture(page, step.item, step.target);
  }
  await expect(page.getByRole("button", { name: "Kiểm tra cây", exact: false })).toBeVisible();
});
for (const touch of [false, true]) test(`Tree labels accept any matching node on ${touch ? "mobile" : "desktop"}`, async ({ page }) => {
  await page.setViewportSize(touch ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterTree(page, "tree-basics");
  for (const step of createTreeCourse("tree-basics").rounds[0].steps) await gesture(page, step.item, step.target, touch);
  await page.getByRole("button", { name: "Kiểm tra cây", exact: false }).click();
  for (const [item, target] of [["label:Gốc", "slot:0"], ["label:Lá", "slot:6"], ["label:Cha", "slot:0"], ["label:Độ sâu 2", "slot:5"], ["label:Độ sâu 0", "slot:0"], ["label:Độ sâu 1", "slot:2"]] as const) await gesture(page, item, target, touch);
  await expect(page.locator('[data-slot="0"] + .tree-node-label')).toContainText("Cha");
  await expect(page.locator('[data-slot="2"] + .tree-node-label')).toContainText("Độ sâu 1");
  await expect(page.locator('[data-slot="5"] + .tree-node-label')).toContainText("Độ sâu 2");
  await expect(page.locator('[data-slot="6"] + .tree-node-label')).toContainText("Lá");
  await page.getByRole("button", { name: "Kiểm tra cây", exact: false }).click();
  await expect(page.locator(".tree-mission h2")).toHaveText("Một tán cây lớn hơn");
  await withinViewport(page);
});

test("animated Demo freezes its moving object when paused or hidden", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await enterTree(page, "tree-basics", "demo");
  await page.getByRole("button", { name: "Phát demo", exact: true }).click();
  const ghost = page.locator(".tree-motion-flight").first();
  await expect(ghost).toBeVisible();
  await expect.poll(() => ghost.evaluate(el => el.getAnimations()[0]?.playState)).toBe("running");
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await expect.poll(() => ghost.evaluate(el => el.getAnimations()[0]?.playState)).toBe("paused");
  const before = await ghost.evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(400);
  expect(await ghost.evaluate(el => getComputedStyle(el).transform)).toBe(before);
  await page.getByRole("button", { name: "Phát demo", exact: true }).click();
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect.poll(() => ghost.evaluate(el => el.getAnimations()[0]?.playState)).toBe("paused");
  const status = await page.locator(".tree-demo-status").innerText();
  await page.waitForTimeout(2500);
  expect(await page.locator(".tree-demo-status").innerText()).toBe(status);
});

test("small portrait, tablet and landscape fit the tree and actions without scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterTree(page, "bst-insert");
  const course = createTreeCourse("bst-insert");
  for (const round of course.rounds.slice(0, 2)) {
    for (const step of round.steps) {
      await page.locator(`[data-item="${step.item}"]`).click(); await page.locator(`[data-drop="${step.target}"]`).click();
    }
    await page.getByRole("button", { name: "Kiểm tra cây", exact: false }).click();
  }
  for (const step of course.rounds[2].steps.slice(0, 3)) {
    await page.locator(`[data-item="${step.item}"]`).click(); await page.locator(`[data-drop="${step.target}"]`).click();
  }
  for (const [width, height] of [[320, 568], [768, 1024], [844, 390], [390, 844], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await withinViewport(page);
    const overlap = await page.locator(".tree-node").evaluateAll(nodes => {
      const rects = nodes.map(node => node.getBoundingClientRect());
      return rects.some((a, i) => rects.slice(i + 1).some(b => Math.min(a.right, b.right) > Math.max(a.left, b.left) + 1 && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 1));
    });
    expect(overlap).toBe(false);
    for (const selector of [".tree-board", ".tree-supply", ".tree-actions"]) {
      const bounds = await page.locator(selector).boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    }
    await page.screenshot({ path: `.qa/tree-deep-${width}x${height}.png`, fullPage: true });
  }
});

test("seven-seed Demo fits short windows and keeps the star score beside Settings", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterTree(page, "tree-basics", "demo");
  const course = createTreeCourse("tree-basics");
  const framesBeforeLastRound = course.rounds.slice(0, 2).reduce((n, r) => n + r.steps.length + 1, 0);
  for (let i = 0; i < framesBeforeLastRound; i++) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".tree-items [data-item]")).toHaveCount(7);
  for (const [width, height] of [[1440, 900], [1366, 768], [1251, 594], [1280, 600], [390, 844], [375, 667], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await withinViewport(page);
    const score = await page.locator(".tree-hud").boundingBox(), settings = await page.getByRole("button", { name: "Tùy chọn", exact: true }).boundingBox();
    expect(score!.x + score!.width).toBeLessThanOrEqual(settings!.x);
    expect(Math.abs(score!.y + score!.height / 2 - settings!.y - settings!.height / 2)).toBeLessThan(2);
    await expect(page.locator(".tree-score svg")).toBeVisible();
    await page.screenshot({ path: `.qa/tree-compact-demo-${width}x${height}.png` });
  }
  await page.setViewportSize({ width: 320, height: 568 });
  for (const step of course.rounds[2].steps) {
    await expect(page.locator(".tree-mission p")).toHaveText(step.instruction);
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
    await withinViewport(page);
  }
});

for (const id of ["tree-traversal", "bst-delete"] as const) test(`${id} Demo keeps every explanation and control visible in short viewports`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterTree(page, id, "demo");
  for (const [r, round] of createTreeCourse(id).rounds.entries()) {
    for (let i = 0; i <= round.steps.length; i++) {
      for (const [width, height] of [[320, 568], [844, 390], [1251, 594]]) {
        await page.setViewportSize({ width, height });
        await withinViewport(page);
      }
      if (i < round.steps.length || r < createTreeCourse(id).rounds.length - 1) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
    }
  }
});

test("a second finger and cancelled touch leave the board and score intact", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await enterTree(page, "tree-basics");
  const source = (await page.locator('[data-item="seed:40"]').boundingBox())!;
  const x = source.x + source.width / 2, y = source.y + source.height / 2;
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - 35, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y - 35, id: 1 }, { x: x + 60, y, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await expect(page.locator(".tree-drag-ghost")).toHaveCount(0);
  await expect(page.locator(".tree-score")).toHaveText("0");
  await expect(page.locator(".tree-mission p")).toHaveText(createTreeCourse("tree-basics").rounds[0].steps[0].instruction);
  await gesture(page, "seed:40", "slot:0", true);
  await expect(page.locator(".tree-score")).toHaveText("100");
  expect(errors).toEqual([]);
  await context.close();
});

for (const id of ["tree-basics", "bst-delete"] as const) test(`${id} victory returns to the correct available map stop`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterTree(page, id);
  for (const round of createTreeCourse(id).rounds) {
    for (const step of round.steps) {
      await page.locator(`[data-item="${step.item}"]`).click();
      await page.locator(`[data-drop="${step.target}"]`).click();
    }
    await page.getByRole("button", { name: "Kiểm tra cây", exact: false }).click();
  }
  await page.getByRole("button", { name: "Đi tiếp cùng Buta", exact: true }).click();
  await expect(page.locator(".track-header h1")).toHaveText("Cây");
  await expect(page.locator("#track-sheet-title")).toHaveText(id === "tree-basics" ? "Duyệt cây" : "Xóa nút khỏi BST");
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeEnabled();
});

async function reachDeletionChoice(page: Page) {
  await enterTree(page, "bst-delete");
  for (const round of createTreeCourse("bst-delete").rounds.slice(0, 2)) {
    for (const step of round.steps) await gesture(page, step.item, step.target);
    await page.getByRole("button", { name: "Kiểm tra cây", exact: false }).click();
  }
  await gesture(page, "pig", "slot:0");
}
for (const touch of [false, true]) test.describe(touch ? "BST predecessor touch" : "BST predecessor mouse", () => {
  test.use({ viewport: touch ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: touch, isMobile: touch, reducedMotion: "reduce" });
  test("left at 20 is valid, undo can switch methods, and 30 replaces 40", async ({ page }) => {
    await reachDeletionChoice(page);
    await expect(page.locator(".tree-score")).toHaveText("400");
    await gesture(page, "pig", "slot:1", touch);
    await expect(page.locator(".tree-score")).toHaveText("500");
    await expect(page.locator(".tree-local-feedback")).toContainText("predecessor");
    await expect(page.locator(".tree-mission p")).toContainText("đi hết về phải");
    await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
    await gesture(page, "pig", "slot:2", touch);
    await expect(page.locator(".tree-score")).toHaveText("500");
    await expect(page.locator(".tree-mission p")).toContainText("đi hết về trái");
    await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
    await gesture(page, "pig", "slot:1", touch);
    const round = createTreeCourse("bst-delete", "predecessor").rounds[2];
    for (const step of round.steps.slice(2)) {
      if (step.target === "tray") {
        await expect(page.locator('[data-slot="0"]')).toHaveText("40");
        await expect(page.locator(".tree-replacement-source")).toHaveText("40");
      }
      await gesture(page, step.item, step.target, touch);
      if (step.target === "tray") {
        await expect(page.locator('[data-slot="0"]')).toHaveText("+");
        await expect(page.locator('[data-slot="4"]')).toHaveText("30");
        await expect(page.locator(".tree-replacement-source")).toHaveAttribute("data-slot", "4");
      }
      if (step.target === "slot:0") {
        await expect(page.locator('[data-slot="0"]')).toHaveText("30");
        await expect(page.locator('[data-slot="4"]')).toHaveCount(0);
        await withinViewport(page);
      }
    }
    await expect(page.locator('[data-slot="0"]')).toHaveText("30");
    await expect(page.locator('[data-slot="4"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="12"]')).toHaveText("55");
    await expect(page.locator(".tree-score")).toHaveText("800");
    await withinViewport(page);
    await page.screenshot({ path: `.qa/tree-predecessor-${touch ? "mobile" : "desktop"}.png` });
    await page.getByRole("button", { name: "Kiểm tra cây", exact: false }).click();
    await expect(page.locator(".tree-victory")).toBeVisible();
    await expect(page.getByRole("img", { name: "3 trên 3 sao" })).toBeVisible();
  });
});

test("wrong predecessor branch explains why and preserves the current node", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await reachDeletionChoice(page);
  await gesture(page, "pig", "slot:1");
  await gesture(page, "pig", "slot:3");
  await expect(page.locator(".tree-local-feedback")).toContainText("Đang tìm predecessor: đi phải");
  await expect(page.locator('[data-item="pig"]')).toHaveCount(1);
  await expect(page.locator(".tree-score")).toHaveText("475");
  await gesture(page, "pig", "slot:4");
  await expect(page.locator(".tree-local-feedback")).toContainText("30 là predecessor");
  await expect(page.locator(".tree-score")).toHaveText("575");
});

test("Demo can show predecessor and switch back to successor safely", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterTree(page, "bst-delete", "demo");
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByRole("button", { name: "Predecessor · Lớn nhất bên trái", exact: true }).click();
  await page.keyboard.press("Escape");
  const course = createTreeCourse("bst-delete", "predecessor");
  for (const [r, round] of course.rounds.entries()) {
    for (const step of round.steps) {
      await expect(page.locator(".tree-mission p")).toHaveText(step.instruction);
      if (r === 2) for (const [width, height] of [[320, 568], [844, 390]]) { await page.setViewportSize({ width, height }); await withinViewport(page); }
      await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
    }
    if (r < 2) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  }
  await expect(page.locator('[data-slot="0"]')).toHaveText("30");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!)["bst-delete"])).not.toBe(true);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByRole("button", { name: "Predecessor · Lớn nhất bên trái", exact: true }).click();
  await expect(page.locator('[data-slot="0"]')).toHaveText("30");
  await page.getByRole("button", { name: "Successor · Nhỏ nhất bên phải", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="0"]')).toHaveText("40");
  await expect(page.locator(".tree-mission p")).toHaveText("Đặt Buta lên nút 40 cần xóa.");
});

for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) test(`contextual deletion error remains readable at ${size.width}x${size.height}`, async ({ page }) => {
  await page.setViewportSize(size);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await reachDeletionChoice(page);
  await gesture(page, "pig", "slot:1");
  await gesture(page, "pig", "slot:3");
  const text = page.locator(".tree-local-feedback");
  await expect(text).toContainText("Bạn đưa Buta tới nút 10.");
  await expect(text).toContainText("20 vẫn còn con phải");
  await expect(text).toContainText("Đang tìm predecessor: đi phải");
  await withinViewport(page);
  const bounds = await text.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual((await page.locator(".tree-actions").boundingBox())!.y);
  await page.screenshot({ path: `.qa/tree-error-${size.width}x${size.height}.png` });
});

for (const [id, wrongItem, wrongTarget, expected] of [
  ["tree-basics", "seed:20", "slot:0", "20 có thể làm gốc của một cây khác"],
  ["tree-traversal", "card:1", "result", "cha 40 chưa được ghi"],
  ["bst", "node:0", "slot:1", "Sau đổi chỗ"],
] as const) test(`${id} explains an incorrect move and keeps the step recoverable`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterTree(page, id);
  const mission = await page.locator(".tree-mission p").innerText();
  await gesture(page, wrongItem, wrongTarget);
  await expect(page.locator(".tree-local-feedback")).toContainText(expected);
  await expect(page.locator(".tree-mission p")).toHaveText(mission);
  await withinViewport(page);
  const step = createTreeCourse(id).rounds[0].steps[0];
  await gesture(page, step.item, step.target);
  await expect(page.locator(".tree-local-feedback")).toHaveText(step.explanation);
});

for (const [id, item, expected] of [
  ["bst-search", "pig", "30 < 40, nhưng bạn đi phải"],
  ["bst-insert", "seed:25", "25 < 40, nhưng bạn đi phải"],
] as const) test(`${id} explains the exact comparison on a wrong branch`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterTree(page, id);
  const course = createTreeCourse(id);
  if (id === "bst-insert") {
    const initial = course.rounds[0].steps[0]; await gesture(page, initial.item, initial.target);
    await page.getByRole("button", { name: "Kiểm tra cây", exact: false }).click();
  }
  await gesture(page, item, "slot:0"); await gesture(page, item, "slot:2");
  await expect(page.locator(".tree-local-feedback")).toContainText(expected);
  await withinViewport(page);
  await gesture(page, item, "slot:1");
  await expect(page.locator(".tree-local-feedback")).not.toHaveClass(/retry/);
});

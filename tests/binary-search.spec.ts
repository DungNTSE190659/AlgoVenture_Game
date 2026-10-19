import { expect, test, type Page } from "@playwright/test";

async function enter(page: Page, demo = false) {
  await page.addInitScript(() => { if (!localStorage.getItem("algoventure.world-progress.v3")) localStorage.setItem("algoventure.world-progress.v3", '{"linear":true}'); });
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Xem chủ đề Mảng", exact: true }).click();
  await page.locator(".atlas-enter").click();
  await page.getByRole("button", { name: "Lộ trình Search", exact: true }).click();
  await page.getByRole("button", { name: demo ? "Xem demo" : "Thử thách", exact: true }).click();
  await expect(page.locator(demo ? ".binary-demo" : ".binary-play")).toBeVisible();
}
async function solve(page: Page) {
  for (let guesses = 0; guesses < 8; guesses++) {
    if (await page.locator(".binary-world").getAttribute("data-phase") !== "playing") break;
    const candidates = page.locator(".binary-tile:not(:disabled)");
    await candidates.nth(Math.floor(((await candidates.count()) - 1) / 2)).click();
  }
  await expect(page.locator(".binary-world")).toHaveAttribute("data-phase", "won");
}
test("starts at 10 and grows to 100, midpoint play wins within budget and persists completion", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await enter(page);
  for (const count of [10, 20, 30, 50, 80, 100]) {
    await expect(page.locator(".binary-tile")).toHaveCount(count);
    await solve(page);
    if (count !== 100) {
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3") || "{}").binary)).not.toBe(true);
      await page.getByRole("button", { name: /Chặng tiếp theo/ }).click();
    }
  }
  await expect(page.getByRole("dialog", { name: "Hoàn thành Binary Search!", exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "3 trên 3 sao", exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3") || "{}").binary)).toBe(true);
  expect(await page.evaluate(() => Number(localStorage.getItem("algoventure.binary-record.v1")))).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
  await expect(page.locator(".binary-tile")).toHaveCount(10);
  await expect(page.locator(".play-score strong")).toHaveText("0");
  expect(errors).toEqual([]);
});
test("higher and lower eliminate complete halves across rows; old guesses cannot be repeated", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .65; });
  await enter(page); // secret 7
  await page.getByRole("button", { name: "Số 5", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Số bí mật lớn hơn 5");
  await expect(page.locator(".binary-tile:disabled")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "Số 5, đã loại", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Số 8", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Số bí mật nhỏ hơn 8");
  await expect(page.locator(".binary-tile:not(:disabled)")).toHaveText(["6", "7"]);
  await page.getByRole("button", { name: "Số 7", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".binary-world")).toHaveAttribute("data-phase", "won");
});
test("poor guesses exhaust the budget, reveal the answer and retry without awarding progress", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .999; });
  await enter(page);
  for (const n of [1, 2, 3, 4]) await page.getByRole("button", { name: `Số ${n}`, exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Hết lượt! Số bí mật là 10");
  await expect(page.locator(".binary-tile:not(:disabled)")).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3") || "{}").binary)).not.toBe(true);
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.locator(".binary-tile:not(:disabled)")).toHaveCount(10);
  await expect(page.locator(".binary-stats")).toContainText("4 lượt còn lại");
  await page.getByRole("button", { name: "Buta gợi ý", exact: true }).click();
  await expect(page.locator(".binary-hint")).toContainText("chọn số giữa");
});
test("100 cells wrap into fewer columns on phones without horizontal overflow or footer overlap", async ({ page }) => {
  await enter(page);
  for (let i = 0; i < 5; i++) { await solve(page); await page.getByRole("button", { name: /Chặng tiếp theo/ }).click(); }
  for (const [width, height] of [[1440, 900], [1280, 720], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await expect(page.locator(".binary-tile")).toHaveCount(100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const columns = await page.locator(".binary-grid").evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").length);
    expect(columns).toBeLessThanOrEqual(width <= 390 ? 5 : 15);
    if (width >= 1280) expect(columns).toBeGreaterThanOrEqual(10);
    const first = (await page.locator(".binary-tile").first().boundingBox())!;
    expect(first.width).toBeGreaterThanOrEqual(44);
    expect(first.height).toBeGreaterThanOrEqual(44);
    await page.getByRole("button", { name: "Số 100", exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Số 100", exact: true })).toBeInViewport();
    const board = (await page.locator(".binary-board-scroll").boundingBox())!;
    const footer = (await page.locator(".binary-footer").boundingBox())!;
    expect(board.y + board.height).toBeLessThanOrEqual(footer.y + 1);
    if ([1440, 390].includes(width)) await page.screenshot({ path: `.qa/binary-100-${width}.png` });
  }
});
test("demo has shared playback, replay and play actions without awarding completion", async ({ page }) => {
  await enter(page, true);
  const next = page.getByRole("button", { name: "Bước tiếp", exact: true });
  await next.click();
  await page.getByRole("button", { name: "Bước trước", exact: true }).click();
  await expect(page.getByRole("button", { name: "Bước trước", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: /^Tốc độ demo:/ }).click();
  await expect(page.getByRole("button", { name: /^Tốc độ demo:/ })).toHaveText("1.5x");
  while (await next.count()) await next.click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3") || "{}").binary)).not.toBe(true);
  await expect(page.getByRole("button", { name: "Tự mình thử", exact: true })).toHaveClass(/button-green/);
  await page.getByRole("button", { name: "Xem lại từ đầu", exact: true }).click();
  await expect(page.getByRole("button", { name: "Bước trước", exact: true })).toBeDisabled();
  while (await next.count()) await next.click();
  await page.getByRole("button", { name: "Tự mình thử", exact: true }).click();
  await expect(page.locator(".binary-play")).toBeVisible();
});
test("touch guesses shrink the interval and keyboard arrows work on the wrapped grid", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage(); await enter(page);
  await page.getByRole("button", { name: "Số 5", exact: true }).tap();
  await expect(page.locator(".binary-stats")).toContainText("3 lượt còn lại");
  if (await page.locator(".binary-world").getAttribute("data-phase") === "playing") {
    const active = page.locator(".binary-tile:not(:disabled)");
    await active.first().focus(); await page.keyboard.press("End");
    await expect(active.last()).toBeFocused();
  }
  await context.close();
});

test("demo compares before removing a half, keeps the current midpoint and teaches both branches", async ({ page }) => {
  await enter(page, true);
  const next = page.getByRole("button", { name: "Bước tiếp", exact: true });
  await expect(page.locator(".binary-index")).toHaveText(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  await expect(page.locator(".is-middle")).toHaveCount(0);
  await next.click();
  await expect(page.locator(".is-middle")).toHaveAttribute("data-value", "5");
  await expect(page.locator(".binary-stats")).toContainText("0 lần so sánh");
  await next.click();
  await expect(page.locator(".binary-step-math")).toHaveAttribute("aria-label", "7 lớn hơn 5");
  await expect(page.locator(".is-middle")).toHaveAttribute("data-value", "5");
  await expect(page.locator(".is-eliminated")).toHaveCount(0);
  await next.click();
  await expect(page.locator(".is-eliminated")).toHaveCount(5);
  await expect(page.locator(".binary-step-math")).toHaveCount(0);
  await expect(page.locator(".is-middle")).toHaveCount(0);
  await next.click(); await next.click();
  await expect(page.locator(".is-middle")).toHaveAttribute("data-value", "8");
  await expect(page.locator(".binary-step-math")).toHaveAttribute("aria-label", "7 nhỏ hơn 8");
  await expect(page.locator(".is-eliminated")).toHaveCount(5);
  await next.click();
  await expect(page.locator(".is-eliminated")).toHaveCount(8);
  while (await next.count()) await next.click();
  await expect(page.locator(".binary-range")).toHaveText("Kết quả: chỉ số 6");
  await expect(page.locator(".binary-stats")).toContainText("4 lần so sánh");
});

test("demo narration and controls never overlap the grid or equation on short screens", async ({ page }) => {
  await enter(page, true);
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  for (const [width, height] of [[1440, 900], [1280, 720], [390, 844], [375, 667], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const board = (await page.locator(".binary-board-scroll").boundingBox())!;
    const math = (await page.locator(".binary-step-explanation").boundingBox())!;
    const dialogue = (await page.locator(".binary-dialogue").boundingBox())!;
    const controls = (await page.locator(".binary-controls").boundingBox())!;
    expect(board.y + board.height).toBeLessThanOrEqual(math.y + 1);
    expect(math.y + math.height).toBeLessThanOrEqual(dialogue.y + 1);
    expect(dialogue.y + dialogue.height).toBeLessThanOrEqual(controls.y + 1);
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Bước tiếp", exact: true })).toBeInViewport();
    if ([1440, 390, 320].includes(width)) await page.screenshot({ path: `.qa/binary-demo-layout-${width}.png` });
  }
});

test("demo autoplay respects live speed and pause while stepping through comparison stages", async ({ page }) => {
  await enter(page, true);
  await page.clock.install(); await page.clock.pauseAt(new Date());
  await page.getByRole("button", { name: "Bắt đầu", exact: true }).click();
  await page.clock.runFor(800);
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await page.clock.runFor(10000);
  await expect(page.locator(".binary-world")).toHaveAttribute("data-frame", "0");
  await page.getByRole("button", { name: /^Tốc độ demo:/ }).click();
  await page.getByRole("button", { name: /^Tốc độ demo:/ }).click();
  await expect(page.getByRole("button", { name: /^Tốc độ demo:/ })).toHaveText("2x");
  await page.getByRole("button", { name: "Bắt đầu", exact: true }).click();
  await page.clock.runFor(3000);
  await expect(page.locator(".binary-world")).not.toHaveAttribute("data-frame", "0");
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const frozen = await page.locator(".binary-world").getAttribute("data-frame");
  await page.clock.runFor(10000);
  await expect(page.locator(".binary-world")).toHaveAttribute("data-frame", frozen!);
});

import { expect, test, type Page } from "@playwright/test";
const progressKey = "algoventure.world-progress.v3";
async function enterLinear(page: Page, mode: "Demo" | "Play" = "Play") {
  await page.goto("/");
  await page.getByRole("button", { name: "Xem chủ đề Mảng", exact: true }).click();
  await page.locator(".atlas-enter").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Lộ trình Search", exact: true }).click();
  await page.getByRole("button", { name: "Linear Search", exact: true }).click();
  await page.getByRole("button", { name: mode === "Demo" ? "Xem demo" : "Thử thách", exact: true }).click();
  await expect(page.locator(mode === "Demo" ? ".linear-demo" : ".linear-play")).toBeVisible();
}
async function progress(page: Page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key) || "{}"), progressKey); }
async function freeze(page: Page) { await page.clock.install(); await page.clock.pauseAt(new Date()); }
async function custom(page: Page, values: string, target: string) {
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill(values);
  await page.getByLabel("Giá trị cần tìm", { exact: true }).fill(target);
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
}
async function solveRound(page: Page) {
  const target = await page.locator(".linear-target strong").innerText();
  const interval = await page.locator(".linear-board").evaluate(node => parseFloat((node as HTMLElement).style.getPropertyValue("--scan-time")));
  await page.getByRole("button", { name: "Bắt đầu dò", exact: true }).click();
  for (let i = 0; i < 30; i++) {
    if (await page.locator(".linear-play").getAttribute("data-phase") === "end") {
      await page.getByRole("button", { name: "Không có trong bài", exact: true }).click(); return;
    }
    if (await page.locator('.linear-tile[aria-current="step"] strong').innerText() === target) {
      await page.getByRole("button", { name: "Chốt lá này", exact: true }).click(); return;
    }
    await page.clock.runFor(interval + 1);
  }
  throw new Error("Did not finish scanning the array");
}
test("six escalating orders reward combo, persist a record and unlock Binary only on victory", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await enterLinear(page); await freeze(page);
  await expect(page.locator(".is-covered")).toHaveCount(5);
  await expect(page.locator(".play-score strong")).toHaveText("0");
  for (let round = 0; round < 6; round++) {
    await solveRound(page);
    if (round < 5) {
      expect((await progress(page)).linear).not.toBe(true);
      await page.getByRole("button", { name: "Chặng tiếp theo", exact: true }).click();
    }
  }
  await expect(page.getByRole("dialog", { name: "Hoàn thành Linear Search!", exact: true })).toBeVisible();
  await expect.poll(async () => (await progress(page)).linear).toBe(true);
  await expect.poll(() => page.evaluate(() => Number(localStorage.getItem("algoventure.linear-record.v1")))).toBeGreaterThan(900);
  await expect(page.getByRole("img", { name: "3 trên 3 sao", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
  await expect(page.locator(".is-covered")).toHaveCount(5);
  await expect(page.locator(".play-score strong")).toHaveText("0");
  await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
  await page.getByRole("button", { name: "Binary Search", exact: true }).click();
  await expect(page.locator(".stop-locked")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("wrong stops cost hearts, retry resets cells, defeat never completes a lesson", async ({ page }) => {
  await enterLinear(page); await freeze(page); await custom(page, "3, 4, 5", "4");
  for (let life = 3; life > 0; life--) {
    await page.getByRole("button", { name: "Bắt đầu dò", exact: true }).click();
    await page.getByRole("button", { name: "Chốt lá này", exact: true }).click();
    await expect(page.getByRole("img", { name: `${life - 1} tim còn lại`, exact: true })).toBeVisible();
    if (life > 1) {
      await page.getByRole("button", { name: "Thử lại chặng này", exact: true }).click();
      await expect(page.locator(".is-covered")).toHaveCount(3);
    }
  }
  await expect(page.getByRole("dialog", { name: "Hết tim rồi!", exact: true })).toBeVisible();
  expect((await progress(page)).linear).not.toBe(true);
  await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
  await expect(page.getByRole("img", { name: "3 tim còn lại", exact: true })).toBeVisible();
});
test("passing a first duplicate fails, touching it succeeds, and pause preserves scan", async ({ page }) => {
  await enterLinear(page); await freeze(page); await custom(page, "3, -2, -2, 0", "-2");
  await page.getByRole("button", { name: "Bắt đầu dò", exact: true }).click();
  await page.clock.runFor(1151);
  await expect(page.getByRole("button", { name: "Lá chỉ số 0, đã xem", exact: true })).toHaveClass(/is-covered/);
  await expect(page.getByRole("button", { name: "Lá chỉ số 0, đã xem", exact: true }).locator(".card-value")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Lá chỉ số 1, giá trị -2", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.clock.runFor(10000);
  await page.getByRole("button", { name: "Đóng tùy chọn", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lá chỉ số 1, giá trị -2", exact: true })).toBeEnabled();
  await page.clock.runFor(1151);
  await expect(page.locator(".linear-play")).toHaveAttribute("data-phase", "missed");
  await expect(page.getByRole("img", { name: "2 tim còn lại", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Thử lại chặng này", exact: true }).click();
  await page.getByRole("button", { name: "Bắt đầu dò", exact: true }).click();
  await page.clock.runFor(1151);
  await page.getByRole("button", { name: "Lá chỉ số 1, giá trị -2", exact: true }).click();
  await expect(page.locator(".linear-result")).toContainText("Kết quả: 1");
  await expect(page.getByRole("dialog", { name: "Hoàn thành Linear Search!", exact: true })).toBeVisible();
});

test("24 illustrated cards wrap by device, keep row order and load raster artwork", async ({ page }) => {
  const responses: number[] = [];
  page.on("response", response => { if (response.url().includes("/assets/cards/") && response.url().endsWith(".webp")) responses.push(response.status()); });
  await enterLinear(page); await freeze(page);
  for (let round = 0; round < 5; round++) { await solveRound(page); await page.getByRole("button", { name: "Chặng tiếp theo", exact: true }).click(); }
  await expect(page.locator(".linear-card")).toHaveCount(24);
  expect(responses).toEqual([200, 200]);
  const interval = await page.locator(".linear-board").evaluate(node => parseFloat((node as HTMLElement).style.getPropertyValue("--scan-time")));
  expect(interval).toBe(650);
  for (const [width, height] of [[1440, 900], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    const cols = await page.locator(".linear-board").evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").filter(n => parseFloat(n) > 0).length);
    expect(cols).toBeGreaterThanOrEqual(width >= 1280 ? 8 : 3);
    if (width <= 390) expect(cols).toBeLessThanOrEqual(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const first = (await page.locator(".linear-card").first().boundingBox())!;
    expect(first.width).toBeGreaterThanOrEqual(60);
    expect(first.height / first.width).toBeCloseTo(1.5, 1);
    expect(await page.locator(".linear-card-back").first().evaluate(node => getComputedStyle(node).backgroundImage)).toContain("sage-back.webp");
    await expect(page.locator(".linear-card svg")).toHaveCount(0);
    if ([1440, 390].includes(width)) await page.screenshot({ path: `.qa/linear-cards-24-${width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Bắt đầu dò", exact: true }).click();
  for (let i = 0; i < 23; i++) await page.clock.runFor(interval + 1);
  await expect(page.locator(".linear-card.is-current")).toBeInViewport();
  await expect(page.getByRole("button", { name: "Chốt lá này", exact: true })).toBeInViewport();
});
test("absent claims require full scan and invalid input cannot start", async ({ page }) => {
  await enterLinear(page); await freeze(page); await custom(page, "-2, nope", "-2");
  await expect(page.getByRole("alert")).toContainText("2–24 số nguyên");
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("-3, -3");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lá chỉ số 1, chưa mở", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Bắt đầu dò", exact: true }).click();
  await page.getByRole("button", { name: "Không có trong bài", exact: true }).click();
  await expect(page.locator(".linear-play")).toHaveAttribute("data-phase", "missed");
  await page.getByRole("button", { name: "Thử lại chặng này", exact: true }).click();
  await solveRound(page);
  await expect(page.locator(".linear-result")).toContainText("Kết quả: -1");
});
test("arcade fits phone and landscape and long boards follow the active cell", async ({ page }) => {
  await enterLinear(page); await freeze(page);
  for (const [width, height] of [[1440, 900], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const board = (await page.locator(".linear-board-scroll").boundingBox())!;
    const footer = (await page.locator(".linear-footer").boundingBox())!;
    expect(board.y + board.height).toBeLessThanOrEqual(footer.y);
    await page.getByRole("button", { name: "Bắt đầu dò", exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Bắt đầu dò", exact: true })).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await custom(page, "1, 1, 1, 1, 1, 1, 1, 1, 9", "9");
  await page.getByRole("button", { name: "Bắt đầu dò", exact: true }).click();
  for (let i = 0; i < 8; i++) await page.clock.runFor(1151);
  await expect(page.getByRole("button", { name: "Lá chỉ số 8, giá trị 9", exact: true })).toBeInViewport();
  await page.getByRole("button", { name: "Chốt lá này", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Hoàn thành Linear Search!", exact: true })).toBeVisible();
});

test("demo steps backward, pauses autoplay and never awards completion", async ({ page }) => {
  await enterLinear(page, "Demo");
  const nextStep = page.getByRole("button", { name: "Bước tiếp", exact: true });
  const previousStep = page.getByRole("button", { name: "Bước trước", exact: true });
  await expect(previousStep).toBeDisabled();
  await nextStep.click();
  await expect(previousStep).toBeEnabled();
  await previousStep.click();
  await expect(previousStep).toBeDisabled();
  await page.getByRole("button", { name: "Bắt đầu", exact: true }).click();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const pausedProgress = await page.getByRole("progressbar").getAttribute("value");
  await page.waitForTimeout(2000);
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", pausedProgress!);
  for (let step = 0; step < 20 && await nextStep.isVisible() && await nextStep.isEnabled(); step++) await nextStep.click();
  await expect(nextStep).toHaveCount(0);
  expect((await progress(page)).linear).not.toBe(true);
  await expect(page.getByRole("dialog", { name: "Hoàn thành Linear Search!", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toHaveCount(0);
  const tryIt = page.getByRole("button", { name: "Tự mình thử", exact: true });
  await expect(tryIt).toHaveClass(/button-green/);
  await page.getByRole("button", { name: "Xem lại từ đầu", exact: true }).click();
  await expect(previousStep).toBeDisabled();
  for (let step = 0; step < 20 && await nextStep.count(); step++) await nextStep.click();
  await tryIt.click();
  await expect(page.locator(".linear-play")).toBeVisible();
  expect((await progress(page)).linear).not.toBe(true);
});

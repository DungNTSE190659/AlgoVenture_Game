import { expect, test, type Page } from "@playwright/test";
import { enterTrack } from "./track-navigation";

async function enter(page: Page, mode = "Play") { await enterTrack(page, "Insertion Sort", mode); }
async function custom(page: Page, values: string) {
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill(values);
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
}
async function solve(page: Page) {
  for (let move = 0; move < 60; move++) {
    await expect(page.locator(".insertion-world")).toHaveAttribute("data-busy", "false");
    if (await page.locator(".insertion-victory").count()) return;
    const pick = page.getByRole("button", { name: /^Nhấc số / });
    if (await pick.count()) { await pick.click(); continue; }
    const held = Number(await page.locator(".tile-held").getAttribute("data-value"));
    const hole = Number(await page.locator("[data-insertion-hole]").getAttribute("data-insertion-hole"));
    const left = page.locator(`.insertion-tile[data-index="${hole - 1}"]`);
    const shift = hole > 0 && Number(await left.getAttribute("data-value")) > held;
    await page.getByRole("button", { name: shift ? "Dịch sang phải" : "Chèn vào ô trống", exact: true }).click();
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
  await page.getByRole("button", { name: "Chèn vào ô trống", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("3 lớn hơn -1");
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
  await expect(page.locator("#track-sheet-title")).toHaveText("Quick Sort");
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
  await expect(page.locator(".slot-over")).toBeVisible();
  await page.mouse.up();
  await expect(page.locator(".insertion-victory")).toBeVisible();
});

test("touch supports lifting and dragging a key into its slot", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await enter(page);
  await custom(page, "1, 2");
  await page.getByRole("button", { name: "Nhấc số 2", exact: true }).tap();
  await expect(page.locator(".insertion-world")).toHaveAttribute("data-busy", "false");
  const key = (await page.locator(".tile-held").boundingBox())!;
  const hole = (await page.locator("[data-insertion-hole]").boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const x = key.x + key.width / 2, y = key.y + key.height / 2;
  const toX = hole.x + hole.width / 2, toY = hole.y + hole.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 10; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (toX - x) * step / 10, y: y + (toY - y) * step / 10 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator(".insertion-victory")).toBeVisible();
  await context.close();
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
  await expect(page.getByRole("alert")).toContainText("2 đến 8 số nguyên");
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
  await page.getByRole("button", { name: /^Nhấc số / }).click();
  expect(await page.evaluate(() => (window as unknown as { vibrations: unknown[] }).vibrations)).toContain(14);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByRole("button", { name: /Rung khi thao tác/ }).click();
  await expect(page.getByRole("button", { name: /Rung khi thao tác/ })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.getByRole("button", { name: "Dịch sang phải", exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { vibrations: unknown[] }).vibrations)).not.toContainEqual([12, 25, 18]);
  expect(await page.evaluate(() => localStorage.getItem("algoventure-haptics"))).toBe("off");
});

test("long arrays fit a scrollable board in portrait, landscape and desktop", async ({ page }) => {
  await enter(page);
  await custom(page, "8, 7, 6, 5, 4, 3, 2, 1");
  for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await expect(page.locator(".insertion-board-scroll")).toBeVisible();
    const button = page.getByRole("button", { name: /^Nhấc số / });
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeInViewport();
  }
  await page.screenshot({ path: ".qa/insertion-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".qa/insertion-mobile.png" });
});

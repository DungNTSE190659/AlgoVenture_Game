import { expect, test } from "@playwright/test";
import { mapLessonName } from "../src/engine/curriculumMap";
import { ALL_LESSONS, lessonAvailable } from "../src/engine/learningTrack";
import { enterTrack } from "./track-navigation";

test("finishing a demo leaves completion and the next lesson locked", async ({ page }) => {
  await enterTrack(page, "Bubble Sort", "Demo");
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("2, 1");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  const next = page.getByRole("button", { name: "Bước tiếp", exact: true });
  // Bound traversal so a broken demo cannot leave the test looping indefinitely.
  for (let step = 0; step < 50 && await next.count(); step++) await next.click();
  await expect(page.getByRole("button", { name: "Tự mình thử", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
  await expect(page.locator('[data-lesson="bubble"]')).not.toHaveClass(/is-complete/);
  await expect(page.locator('[data-lesson="selection"]')).toHaveClass(/is-locked/);
});

test("all lessons appear once in the horizontal roadmap and rotate to a vertical spine on phones", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Learning Map", exact: true })).toBeVisible();
  await expect(page.locator(".roadmap-topic")).toHaveCount(6);
  await expect(page.locator(".roadmap-lesson")).toHaveCount(ALL_LESSONS.length);
  const ids = await page.locator(".roadmap-lesson").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-lesson")));
  expect(new Set(ids).size).toBe(ALL_LESSONS.length);
  await expect(page.getByRole("button", { name: "Bubble Sort", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Mở nhánh Array" }).click();
  await expect(page.getByRole("button", { name: "Bubble Sort", exact: true })).toBeVisible();
  await page.waitForTimeout(650);
  for (const [width, height] of [[1440, 900], [1280, 720], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(550);
    const boxes = await page.locator(".roadmap-topic-node").evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect(); return { x: box.x, y: box.y };
    }));
    if (width > 1000) {
      expect(Math.max(...boxes.map(box => box.y)) - Math.min(...boxes.map(box => box.y))).toBeLessThan(2);
      expect(boxes[5].x).toBeGreaterThan(boxes[0].x);
    } else {
      expect(Math.max(...boxes.map(box => box.x)) - Math.min(...boxes.map(box => box.x))).toBeLessThan(2);
      expect(boxes[5].y).toBeGreaterThan(boxes[0].y);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(await page.locator(".curriculum-map").evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.screenshot({ path: `.qa/roadmap-${width}.png`, fullPage: true });
  }
});

test.describe("phone map", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("data structures reveal one branch at a time and fold back into a compact phone map", async ({ page }) => {
    await page.goto("/");
    const map = page.locator(".curriculum-map");
    await page.evaluate(() => document.fonts.ready);
    const collapsedHeight = await map.evaluate(node => node.scrollHeight);
    await expect(page.locator(".roadmap-topic-node")).toHaveCount(6);
    await expect(page.getByRole("button", { name: "Bubble Sort", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Mở nhánh Array" }).tap();
    await expect(page.getByRole("button", { name: "Bubble Sort", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Mở nhánh Tree" }).tap();
    await expect(page.getByRole("button", { name: "Bubble Sort", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tree Basics", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Thu gọn Tree" }).tap();
    await expect(page.getByRole("button", { name: "Tree Basics", exact: true })).toHaveCount(0);
    await expect(page.locator(".roadmap-topic.is-expanded")).toHaveCount(0);
    await expect.poll(() => map.evaluate(node => node.scrollHeight)).toBeLessThanOrEqual(collapsedHeight + 1);
    await page.screenshot({ path: ".qa/roadmap-collapsed-390.png" });
  });
});

test("locked and upcoming lessons remain discoverable without bypassing prerequisites", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mở nhánh Array" }).click();
  await page.getByRole("button", { name: "Selection Sort", exact: true }).click();
  await expect(page.locator(".roadmap-detail")).toContainText("Hoàn thành Bubble Sort");
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Mở nhánh Graph" }).click();
  await page.getByRole("button", { name: "DFS", exact: true }).click();
  await expect(page.locator(".roadmap-detail")).toContainText("đang được phát triển");
  await expect(page.getByRole("button", { name: "Xem demo", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Mở nhánh Array" }).click();
  await page.getByRole("button", { name: "Bubble Sort", exact: true }).click();
  await page.getByRole("button", { name: "Thử thách", exact: true }).click();
  await expect(page.locator(".bubble-play")).toBeVisible();
  await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
  await expect(page.locator(".curriculum-map")).toBeVisible();
  await expect(page.locator('[data-lesson="bubble"]')).toHaveAttribute("aria-pressed", "true");
});

test("every shipped lesson opens both demo and challenge from the same map", async ({ page }) => {
  await page.addInitScript(ids => localStorage.setItem("algoventure.world-progress.v3", JSON.stringify(Object.fromEntries(ids.map(id => [id, true])))), ALL_LESSONS.map(lesson => lesson.id));
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  for (const lesson of ALL_LESSONS.filter(lesson => lessonAvailable(lesson.id))) {
    for (const mode of ["Xem demo", "Thử thách"]) await test.step(`${lesson.name}: ${mode}`, async () => {
      await page.locator(".roadmap-topic").filter({ has: page.locator(`[data-lesson="${lesson.id}"]`) }).locator(".roadmap-topic-node").click();
      await page.getByRole("button", { name: mapLessonName(lesson), exact: true }).click();
      await page.getByRole("button", { name: mode, exact: true }).click();
      await expect(page.locator(".curriculum-map")).toHaveCount(0);
      await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
      await expect(page.locator(".curriculum-map")).toBeVisible();
    });
  }
  expect(errors).toEqual([]);
  await expect(page.locator(".roadmap-lesson.is-complete")).toHaveCount(ALL_LESSONS.length);
});

test("phone selection can open a different structure and return to its place on the map", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Mở nhánh Stack" }).click();
  await page.getByRole("button", { name: "Stack", exact: true }).click();
  await expect(page.locator("#roadmap-detail-title")).toHaveText("Stack");
  await page.getByRole("button", { name: "Thử thách", exact: true }).click();
  await expect(page.locator(".stack-world")).toBeVisible();
  await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
  await expect(page.locator('[data-lesson="stack"]')).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Mở nhánh Stack" }).click();
  const selected = (await page.getByRole("button", { name: "Stack", exact: true }).boundingBox())!;
  expect(selected.y).toBeGreaterThanOrEqual(0);
  expect(selected.y + selected.height).toBeLessThanOrEqual(844);
  await expect(page.locator("#roadmap-lesson-popup")).toBeHidden();
});

test("completion persists and opens the next lesson on the unified map", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mở nhánh Array" }).click();
  await page.getByRole("button", { name: "Bubble Sort", exact: true }).click();
  await page.getByRole("button", { name: "Thử thách", exact: true }).click();
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("2, 1");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await page.locator('[data-bubble-id="1"]').focus(); await page.keyboard.press("ArrowLeft");
  await page.getByRole("button", { name: "Kết thúc thuật toán", exact: true }).click();
  await expect(page.locator(".bubble-victory")).toBeVisible();
  await page.getByRole("button", { name: /Đi tiếp cùng/ }).click();
  await expect(page.locator('[data-lesson="selection"]')).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Mở nhánh Array" }).click();
  await page.getByRole("button", { name: "Selection Sort", exact: true }).click();
  await expect(page.locator("#roadmap-detail-title")).toHaveText("Selection Sort");
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeEnabled();
  await expect(page.locator('[data-lesson="bubble"]')).toHaveClass(/is-complete/);
  await page.reload();
  await expect(page.locator('[data-lesson="bubble"]')).toHaveClass(/is-complete/);
  await expect(page.locator(".roadmap-progress")).toContainText("1 / 25");
});

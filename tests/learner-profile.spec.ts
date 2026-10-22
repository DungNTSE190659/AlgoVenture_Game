import { expect, test, type Page } from "@playwright/test";
import { ACTIVITY_KEY, PROFILE_KEY } from "../src/engine/learnerProfile";
import { STORAGE_KEY } from "../src/engine/learningTrack";

async function openProfile(page: Page) {
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Hồ sơ của tôi", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Hành trình của bạn" })).toBeVisible();
}

test("profile edits persist and preview never changes real progress or identity", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openProfile(page);
  await expect(page.locator(".profile-stats article").first()).toContainText("0 / 25");
  await page.getByRole("button", { name: "Chỉnh sửa hồ sơ" }).click();
  await page.getByLabel("Tên hiển thị").fill("   ");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Hãy nhập tên hiển thị");
  await page.getByLabel("Tên hiển thị").fill("Minh Explorer");
  await page.getByRole("button", { name: "Chọn avatar Buta 3" }).click();
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Minh Explorer" })).toBeVisible();
  const identity = await page.evaluate(key => localStorage.getItem(key), PROFILE_KEY);
  const progress = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
  await page.getByRole("button", { name: "Xem hồ sơ mẫu" }).click();
  await expect(page.getByText("Bạn đang xem dữ liệu minh họa.", { exact: false })).toBeVisible();
  await expect(page.locator(".profile-stats article").first()).toContainText("11 / 25");
  await page.screenshot({ path: ".qa/profile-overview-desktop.png" });
  await page.locator(".profile-content").evaluate(el => el.scrollTo({ top: el.scrollHeight }));
  await page.screenshot({ path: ".qa/profile-overview-bottom.png" });
  await page.getByRole("button", { name: "Về dữ liệu của tôi" }).click();
  await expect(page.locator(".profile-stats article").first()).toContainText("0 / 25");
  expect(await page.evaluate(key => localStorage.getItem(key), PROFILE_KEY)).toBe(identity);
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(progress);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Hồ sơ của tôi", exact: true })).toBeFocused();
  await page.reload();
  await page.getByRole("button", { name: "Hồ sơ của tôi", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Minh Explorer" })).toBeVisible();
  await expect(page.getByAltText("Avatar Buta của người chơi")).toHaveAttribute("src", /thinking.webp$/);
});

test("real completion, badge conditions and history are displayed without fabricated stars", async ({ page }) => {
  await page.addInitScript(({ storage, activity }) => {
    localStorage.setItem(storage, JSON.stringify({ bubble: true, linear: true, binary: true, unknown: true }));
    localStorage.setItem(activity, JSON.stringify([{ lesson: "binary", kind: "completed", at: Date.now() }, { lesson: "linear", kind: "completed", at: Date.now() - 86400000 }, { lesson: "stack", kind: "demo", at: Date.now() - 2 * 86400000 }]));
  }, { storage: STORAGE_KEY, activity: ACTIVITY_KEY });
  await openProfile(page);
  await expect(page.locator(".profile-stats article").first()).toContainText("3 / 25");
  await expect(page.locator(".profile-stats article").nth(1)).toContainText("Chưa tổng hợp dữ liệu sao");
  await expect(page.locator(".profile-stats article").nth(2)).toContainText("2 ngày");
  await page.getByRole("button", { name: "Thành tích", exact: false }).click();
  await expect(page.locator(".profile-badge.is-earned")).toHaveCount(2);
  await page.getByRole("button", { name: "Lịch sử", exact: true }).click();
  await expect(page.locator(".profile-history-row")).toHaveCount(3);
  await page.getByLabel("Lọc lịch sử học tập").selectOption("demo");
  await expect(page.locator(".profile-history-row")).toHaveCount(1);
  await expect(page.locator(".profile-history-row")).toContainText("Stack");
});

test("continue opens the correct lesson and records new demo visits", async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify([{ lesson: "queue", kind: "demo", at: Date.now() }])), ACTIVITY_KEY);
  await openProfile(page);
  await page.getByRole("button", { name: "Tiếp tục hành trình", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lộ trình Stack & Queue" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#track-sheet-title")).toHaveText("Queue");
  await page.getByRole("button", { name: "Xem demo", exact: true }).click();
  await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
  await page.getByRole("button", { name: "Bản đồ thế giới", exact: true }).click();
  await page.getByRole("button", { name: "Hồ sơ của tôi", exact: true }).click();
  await page.getByRole("button", { name: "Lịch sử", exact: true }).click();
  await expect(page.locator(".profile-history-row").first()).toContainText("Queue");
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? "[]"), ACTIVITY_KEY);
  expect(saved[0]).toMatchObject({ lesson: "queue", kind: "demo" });
});

test("profile opens classrooms without leaving stacked dialogs", async ({ page }) => {
  await openProfile(page);
  await page.getByRole("button", { name: "Mở lớp học", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Lớp học của tôi");
});

for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
  test(`profile tabs and preview remain usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openProfile(page);
    await page.getByRole("button", { name: "Xem hồ sơ mẫu" }).click();
    await page.getByAltText("Avatar Buta của người chơi").evaluate(async (node: HTMLImageElement) => { await node.decode(); });
    await page.screenshot({ path: `.qa/profile-mobile-${viewport.width}.png` });
    for (const name of ["Tiến độ", "Thành tích", "Lịch sử", "Tổng quan"]) {
      await page.getByRole("button", { name: new RegExp(`^${name}`) }).first().click();
      await expect(page.getByRole("button", { name: new RegExp(`^${name}`) }).first()).toHaveAttribute("aria-current", "page");
      const overflow = await page.locator(".profile-dialog").evaluate(el => [...el.querySelectorAll(".profile-content, .profile-body")].map(node => node.scrollWidth - node.clientWidth));
      expect(overflow.every(n => n <= 1)).toBe(true);
      if (name === "Thành tích") await page.screenshot({ path: `.qa/profile-badges-${viewport.width}.png` });
    }
    await page.getByRole("button", { name: "Về dữ liệu của tôi" }).click();
    await expect(page.getByRole("heading", { name: "Nhà thám hiểm", exact: true })).toBeVisible();
  });
}

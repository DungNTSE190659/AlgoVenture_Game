import { expect, test, type Page } from "@playwright/test";

async function enterBfs(page: Page, mode: "Xem demo" | "Thử thách") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("algoventure.world-progress.v3", JSON.stringify({})));
  await page.goto("/");
  await page.getByRole("button", { name: "Xem chủ đề Đồ thị" }).click();
  await page.getByRole("button", { name: "Vào vùng đất" }).click();
  await page.getByRole("button", { name: "BFS", exact: true }).click();
  await page.getByRole("button", { name: mode, exact: true }).click();
}

test("BFS demo can be stepped through and launches the playable challenge", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await enterBfs(page, "Xem demo");

  await expect(page.locator(".graph-board")).toBeVisible();
  await expect(page.locator(".step-indicator")).toContainText("1 /");
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".step-indicator")).toContainText("2 /");

  while (await page.getByRole("button", { name: "Bước tiếp", exact: true }).count()) {
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  }
  await page.getByRole("button", { name: "Tự mình thử", exact: true }).click();
  await expect(page.locator(".graph-queue-panel")).toContainText("A");
  expect(errors).toEqual([]);
});

test("BFS challenge validates moves, supports hint and undo, then shows the shortest path", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await enterBfs(page, "Thử thách");

  const vertices = page.locator(".graph-board g[role=button]");
  await vertices.nth(2).click();
  await expect(page.getByRole("status")).toContainText("đầu queue");
  await expect(page.locator(".graph-queue-panel")).toContainText("A");

  await page.getByRole("button", { name: /Buta gợi ý/ }).click();
  await expect(page.locator(".graph-hint")).toContainText(/đỉnh A/i);
  await page.getByRole("button", { name: "Đóng gợi ý" }).click();

  await vertices.nth(0).click();
  await expect(page.locator(".graph-queue-panel")).toContainText("Rỗng");
  await page.getByRole("button", { name: "Hoàn tác" }).click();
  await expect(page.locator(".graph-queue-panel")).toContainText("A");

  const tutorialMoves = [0, 1, 2, 1, 3, 2, 4, 3, 4];
  for (const vertexId of tutorialMoves) await vertices.nth(vertexId).click();

  await expect(page.locator(".graph-victory")).toBeVisible();
  await expect(page.locator(".graph-result-path")).toContainText("A → C → E");
  expect(errors).toEqual([]);
});

import type { Page } from "@playwright/test";

// Existing Quick gameplay tests start with the preceding lessons completed.
export async function enterTrack(page: Page, algorithm: string, mode: string) {
  await page.addInitScript((quick) => localStorage.setItem("algoventure.world-progress.v3", JSON.stringify({ array: true, linear: true, ...(quick ? { bubble: true, selection: true, insertion: true, merge: true } : {}) })), algorithm === "Quick Sort");
  await page.goto("/");
  await page.getByRole("button", { name: "Xem chủ đề Mảng", exact: true }).click();
  await page.locator(".atlas-enter").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: algorithm, exact: true }).click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: mode === "Demo" ? "Xem demo" : "Thử thách", exact: true }).click();
}

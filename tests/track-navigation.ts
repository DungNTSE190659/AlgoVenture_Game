import type { Page } from "@playwright/test";

// Existing Quick gameplay tests start with the preceding lessons completed.
export async function enterTrack(page: Page, algorithm: string, mode: string) {
  await page.addInitScript((name) => localStorage.setItem("algoventure.world-progress.v3", JSON.stringify({ linear: true, ...(name === "Selection Sort" ? { bubble: true } : {}), ...(name === "Insertion Sort" ? { bubble: true, selection: true } : {}), ...(name === "Merge Sort" ? { bubble: true, selection: true, insertion: true } : {}), ...(name === "Quick Sort" ? { bubble: true, selection: true, insertion: true, merge: true } : {}) })), algorithm);
  await page.goto("/");
  await page.getByRole("button", { name: "Xem chủ đề Mảng", exact: true }).click();
  await page.locator(".atlas-enter").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (["Linear Search", "Binary Search"].includes(algorithm)) await page.getByRole("button", { name: "Lộ trình Search", exact: true }).click();
  if (["Stack", "Queue"].includes(algorithm)) await page.getByRole("button", { name: "Lộ trình Stack & Queue", exact: true }).click();
  await page.getByRole("button", { name: algorithm, exact: true }).click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: mode === "Demo" ? "Xem demo" : "Thử thách", exact: true }).click();
}

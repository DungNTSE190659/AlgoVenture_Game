import { expect, test } from "@playwright/test";
import { enterTrack } from "./track-navigation";
import { forestInput, sendFriend } from "./quick-forest-helpers";

const games = [
  ["Bubble Sort", ".bubble-world"], ["Selection Sort", ".selection-world"],
  ["Insertion Sort", ".insertion-world"], ["Merge Sort", ".merge-world"],
  ["Quick Sort", ".quick-forest-world"],
] as const;

test("all Sort modes place the framed board left, Buta beside speech, and controls at the sidebar bottom", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [name] of games) for (const mode of ["Play", "Demo"]) {
    await enterTrack(page, name, mode);
    const board = (await page.locator(".array-board-pane").boundingBox())!;
    const side = (await page.locator(".array-guide").boundingBox())!;
    expect(board.x + board.width).toBeLessThan(side.x);
    expect(board.width).toBeGreaterThan(side.width);
    const speech = page.locator(mode === "Play" ? ".array-instruction" : ".array-demo-dialogue p");
    const pig = page.locator(mode === "Play" ? ".array-challenge-dialogue > .pig" : ".array-demo-dialogue .pig");
    const pigBox = (await pig.boundingBox())!, speechBox = (await speech.boundingBox())!;
    expect(pigBox.x + pigBox.width).toBeLessThanOrEqual(speechBox.x);
    const controls = (await page.locator(".array-guide-actions").boundingBox())!;
    expect(controls.y + controls.height).toBeGreaterThanOrEqual(880);
    for (const button of await page.locator(".array-guide button:visible").all()) await expect(button).toBeInViewport({ ratio: .99 });
    await page.screenshot({ path: `.qa/array-${name.split(" ")[0].toLowerCase()}-${mode.toLowerCase()}-sidebar.png` });
  }
});

for (const [name, root] of games) for (const mode of ["Play", "Demo"]) {
  test(`${name} ${mode} fits short and tall phones without scrolling or clipped controls`, async ({ page }) => {
    await enterTrack(page, name, mode);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
    await page.getByLabel(name === "Quick Sort" ? "Các phần tử của mảng" : "Mảng của bạn", { exact: true }).fill(name === "Insertion Sort" ? "-99,99,4,3,2,1" : "-99,99,6,5,4,3,2,1");
    await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
    for (const [width, height] of [[320, 568], [390, 844], [568, 320], [844, 390]]) {
      await page.setViewportSize({ width, height });
      await expect.poll(() => page.locator(root).evaluate(el => Math.max(el.scrollHeight - el.clientHeight, el.scrollWidth - el.clientWidth))).toBeLessThanOrEqual(1);
      for (const button of await page.locator(`${root} button:visible`).all()) {
        await expect(button).toBeInViewport({ ratio: .99 });
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
  });
}

for (const group of ["small", "equal"] as const) {
  test(`Quick keeps seven friends in the ${group} group and the check button visible`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterTrack(page, "Quick Sort", "Play");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await forestInput(page, group === "small" ? [99, 7, 6, 5, 4, 3, 2, 1] : [5, 5, 5, 5, 5, 5, 5, 5]);
    await sendFriend(page, 0, "pivot");
    for (let id = 1; id < 8; id++) await sendFriend(page, id, group);
    for (const [width, height] of [[320, 568], [390, 844], [568, 320], [844, 390]]) {
      await page.setViewportSize({ width, height });
      await expect.poll(() => page.locator(".quick-forest-world").evaluate(el => Math.max(el.scrollHeight - el.clientHeight, el.scrollWidth - el.clientWidth))).toBeLessThanOrEqual(1);
      for (const friend of await page.locator(".qf-friend").all()) await expect(friend).toBeInViewport({ ratio: .99 });
      await expect(page.getByRole("button", { name: "Kiểm tra nhóm", exact: true })).toBeInViewport({ ratio: 1 });
    }
    await page.getByRole("button", { name: "Kiểm tra nhóm", exact: true }).click();
    if (group === "equal") await expect(page.locator(".qf-victory")).toBeVisible();
    else await expect(page.locator(".qf-map button:enabled")).toHaveCount(1);
  });
}

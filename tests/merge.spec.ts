import { expect, test, type Page } from "@playwright/test";
import { enterTrack } from "./track-navigation";
import { expectLessonFits, expectLessonVisible } from "./lesson-viewport";

async function enter(page: Page, demo = false) {
  await enterTrack(page, "Merge Sort", demo ? "Demo" : "Play");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install(); await page.clock.pauseAt(new Date());
}
async function custom(page: Page, values: string) {
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill(values);
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
}
test("demo steps backwards, pauses, changes speed and never awards completion", async ({ page }) => {
  await enter(page, true); await custom(page, "2,1"); await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  const progress = await page.locator(".merge-demo-progress > span").textContent(); await page.getByRole("button", { name: "Bước trước", exact: true }).click(); await expect(page.locator(".merge-demo-progress > span")).not.toHaveText(progress!);
  await page.getByRole("button", { name: "Phát demo", exact: true }).click(); await page.clock.runFor(500); await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const paused = await page.locator(".merge-demo-progress > span").textContent(); await page.clock.runFor(10000); await expect(page.locator(".merge-demo-progress > span")).toHaveText(paused!);
  await page.getByRole("button", { name: /^Tốc độ demo:/ }).click(); await expect(page.getByRole("button", { name: /^Tốc độ demo:/ })).toHaveText("1.5x");
  while (await page.getByRole("button", { name: "Bước tiếp", exact: true }).count()) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!).merge)).not.toBe(true);
  await page.getByRole("button", { name: "Tự mình thử", exact: true }).click(); await expect(page.locator(".merge-world")).toHaveAttribute("data-phase", "choose");
});

test("demo pauses the moving leaf itself and applies speed to its animation", async ({ page }) => {
  await enter(page, true); await custom(page, "2,1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const motion = () => page.locator(".merge-demo-board").evaluate(node => node.getAnimations({ subtree: true }).filter(animation => ((animation.effect as KeyframeEffect).target as Element)?.matches(".stream-leaf")).map(animation => ({ time: Number(animation.currentTime), state: animation.playState, rate: animation.playbackRate })));
  await expect.poll(async () => (await motion()).some(animation => animation.state === "paused")).toBe(true);
  const before = await motion(); await page.waitForTimeout(150); expect(await motion()).toEqual(before);
  await page.getByRole("button", { name: /^Tốc độ demo:/ }).click();
  expect((await motion()).every(animation => animation.rate === 1.5)).toBe(true);
});

test("every demo frame fits the studio board and controls at small and large viewports", async ({ page }) => {
  await enter(page, true); await custom(page, "-99,8,4,4,0,3,-2,99");
  for (const [width, height] of [[320,568], [390,844], [844,390], [1280,580], [1440,900]]) {
    await page.setViewportSize({ width, height }); await page.getByRole("button", { name: "Tùy chọn", exact: true }).click(); await page.getByRole("button", { name: "Chơi lại từ đầu", exact: true }).click();
    await expect(page.locator(".merge-stream-map,.stream-branch-picker,.stream-split-handle,.merge-stats")).toHaveCount(0);
    for (let frame = 0; frame < 70; frame++) {
      await expectLessonFits(page, ".merge-world", 2);
      expect(await page.locator('.merge-world').evaluate(n=>({x:n.scrollWidth-n.clientWidth,y:n.scrollHeight-n.clientHeight}))).toEqual({x:0,y:0});
      await expectLessonVisible(page, page.locator(".merge-controls")); await expectLessonVisible(page, page.locator(".merge-demo-board"));
      await expect(page.locator(".merge-world img[src*=merge-factory]")).toHaveCount(0);
      if (await page.getByRole("button", { name: "Tự mình thử", exact: true }).count()) break;
      await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
    }
    await page.screenshot({ path: `.qa/merge-stream-demo-${width}.png` });
  }
});

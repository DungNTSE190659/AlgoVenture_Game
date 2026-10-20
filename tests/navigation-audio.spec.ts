import { expect, test, type Page } from "@playwright/test";
import { ARRAYS } from "../src/engine/learningTrack";

async function trace(page: Page) {
  await page.evaluate(async () => {
    const resource = performance.getEntriesByType("resource").find(entry => new URL(entry.name).pathname === "/src/audio/gameAudio.ts")!.name;
    const { gameAudio } = await import(resource);
    const cues: string[] = [];
    (window as any).navigationSounds = cues;
    const play = gameAudio.play.bind(gameAudio);
    gameAudio.play = (cue: any) => {
      const played = play(cue);
      if (played) cues.push(cue);
      return played;
    };
  });
}
async function sounds(page: Page) { return page.evaluate(() => (window as any).navigationSounds as string[]); }
async function clear(page: Page) { await page.evaluate(() => { (window as any).navigationSounds.length = 0; }); }

test("first interaction sounds once; topic arrows, keyboard and mouse drags have directional cues", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await trace(page);
  expect(await sounds(page)).toEqual([]);
  await page.getByRole("button", { name: "Chủ đề tiếp theo", exact: true }).click();
  await expect.poll(() => sounds(page)).toEqual(["topic-next"]);
  await page.getByRole("button", { name: "Chủ đề trước", exact: true }).click();
  await expect(page.locator("#atlas-title")).toHaveText("Mảng");
  await expect.poll(() => page.locator(".atlas-carousel").evaluate(node => node.scrollLeft)).toBe(0);
  await clear(page);
  const area = (await page.locator(".atlas-carousel").boundingBox())!;
  await page.mouse.move(340, area.y + area.height / 2);
  await page.mouse.down();
  await page.mouse.move(60, area.y + area.height / 2, { steps: 15 });
  await page.mouse.up();
  await expect(page.locator("#atlas-title")).toHaveText("Danh sách");
  await expect.poll(() => sounds(page)).toEqual(["topic-next"]);
  await page.getByRole("button", { name: "Xem chủ đề Mảng", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#atlas-title")).toHaveText("Mảng");
  expect((await sounds(page)).at(-1)).toBe("topic-prev");
});

test("new unlock footsteps follow walking; browsing old lessons stays silent and locked lessons have a soft cue", async ({ page }) => {
  await page.goto("/");
  await page.locator(".atlas-enter").click();
  await page.getByRole("button", { name: "Thử thách", exact: true }).click();
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("1, 2");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  await page.getByRole("button", { name: "Giữ nguyên", exact: true }).click();
  await trace(page);
  await page.getByRole("button", { name: "Đi tiếp cùng Buta", exact: true }).click();
  await expect(page.locator(".buta-walking")).toBeVisible();
  await expect.poll(async () => (await sounds(page)).filter(cue => cue.startsWith("step-")).length).toBeGreaterThanOrEqual(2);
  expect((await sounds(page)).filter(cue => cue.startsWith("step-")).slice(0, 2)).toEqual(["step-left", "step-right"]);
  await page.getByRole("button", { name: "Tắt âm thanh", exact: true }).click();
  const muted = (await sounds(page)).length;
  await page.waitForTimeout(350);
  expect((await sounds(page)).length).toBe(muted);
  await page.getByRole("button", { name: "Bật âm thanh", exact: true }).click();
  await expect.poll(() => sounds(page)).toContain("sound-on");
  await expect(page.locator(".buta-walking")).toHaveCount(0);
  expect(await sounds(page)).toContain("arrive");
  const steps = (await sounds(page)).filter(cue => cue.startsWith("step-")).length;
  await page.waitForTimeout(350);
  expect((await sounds(page)).filter(cue => cue.startsWith("step-")).length).toBe(steps);
  const position = await page.locator(".track-buta").getAttribute("style");
  await clear(page);
  await page.getByRole("button", { name: "Bubble Sort", exact: true }).click();
  await expect(page.locator("#track-sheet-title")).toHaveText("Bubble Sort");
  await expect(page.locator(".track-buta")).toHaveAttribute("style", position!);
  await expect(page.locator(".track-buta")).toHaveAttribute("aria-label", "Buta đang ở Selection Sort");
  await expect(page.getByRole("button", { name: "Thử thách", exact: true })).toBeEnabled();
  await page.waitForTimeout(400);
  expect(await sounds(page)).toEqual(["island-select"]);
  await expect(page.locator(".buta-walking")).toHaveCount(0);
  await clear(page);
  await page.getByRole("button", { name: "Quick Sort", exact: true }).click();
  await expect.poll(() => sounds(page)).toEqual(["locked"]);
  await expect(page.locator(".buta-walking")).toHaveCount(0);
});

test("world travel arrives with sound and reduced motion skips walking sounds", async ({ page }) => {
  await page.addInitScript(data => localStorage.setItem("algoventure.world-progress.v3", JSON.stringify(data)), Object.fromEntries(ARRAYS.map(lesson => [lesson.id, true])));
  await page.goto("/");
  await trace(page);
  await page.getByRole("button", { name: "Xem chủ đề Mảng", exact: true }).click();
  await page.locator(".atlas-enter").click();
  await expect(page.locator(".atlas-buta.buta-walking")).toBeVisible();
  await expect(page.locator(".learning-map")).toBeVisible();
  expect(await sounds(page)).toContain("arrive");
  expect((await sounds(page)).some(cue => cue.startsWith("step-"))).toBe(true);
  await page.getByRole("button", { name: "Bản đồ thế giới", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Xem chủ đề Danh sách", exact: true }).click();
  await clear(page);
  await page.locator(".atlas-enter").click();
  await expect(page.locator(".learning-map")).toBeVisible();
  expect(await sounds(page)).toEqual(["arrive"]);
});

test("buttons open and close panels with a single cue, and muted preference survives reload", async ({ page }) => {
  await page.goto("/");
  await page.locator(".atlas-enter").click();
  await page.getByRole("button", { name: "Xem demo", exact: true }).click();
  await trace(page);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await expect.poll(() => sounds(page)).toEqual(["ui-open"]);
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect.poll(() => sounds(page)).toEqual(["ui-open", "ui-close"]);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByRole("button", { name: /Hiệu ứng âm thanh/ }).click();
  await clear(page);
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  expect(await sounds(page)).toEqual([]);
  await page.reload();
  await trace(page);
  await page.getByRole("button", { name: "Chủ đề tiếp theo", exact: true }).click();
  expect(await sounds(page)).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem("piggy-sound"))).toBe("off");
});

test("a real touch swipe sounds once without opening a topic", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  await trace(page);
  const cdp = await context.newCDPSession(page);
  const area = (await page.locator(".atlas-carousel").boundingBox())!;
  const y = area.y + area.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 340, y }] });
  for (let step = 1; step <= 12; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 340 - step * 23, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator("#atlas-title")).toHaveText("Danh sách");
  await expect.poll(() => sounds(page)).toEqual(["topic-next"]);
  await expect(page.locator(".learning-map")).toHaveCount(0);
  await context.close();
});

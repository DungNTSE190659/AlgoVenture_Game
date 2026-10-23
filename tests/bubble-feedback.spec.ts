import { expect, test } from "@playwright/test";
import { enterTrack } from "./track-navigation";

for (const touch of [false, true]) test(`drag preview preserves tile and label size (${touch ? "touch" : "mouse"})`, async ({ browser }) => {
  const context = await browser.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: touch, isMobile: touch });
  const page = await context.newPage();
  await enterTrack(page, "Bubble Sort", "Play");
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill(touch ? "8,7,6,5,4,3,2,1" : "8,3,6,2,5");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();
  const tile = page.locator(".bubble-tile").first();
  const bounds = (await tile.boundingBox())!;
  const font = await tile.locator("strong").evaluate(node => getComputedStyle(node).fontSize);
  const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
  const cdp = touch ? await context.newCDPSession(page) : null;
  if (cdp) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + 12, y: y - 30, id: 1 }] });
  } else {
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 12, y - 30, { steps: 4 });
  }
  const ghost = page.locator(".bubble-drag-ghost");
  await expect(ghost).toBeVisible();
  const preview = (await ghost.boundingBox())!;
  expect(preview.width).toBeCloseTo(bounds.width, 1);
  expect(preview.height).toBeCloseTo(bounds.height, 1);
  expect(await ghost.locator("strong").evaluate(node => getComputedStyle(node).fontSize)).toBe(font);
  if (cdp) await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  else await page.mouse.up();
  await expect(ghost).toHaveCount(0);
  await context.close();
});

test("touch focus is limited to the number tiles", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await enterTrack(page, "Bubble Sort", "Play");
  const tile = page.locator('.bubble-tile').first();
  const hint = page.getByRole("button", { name: "Cáo gợi ý", exact: true });
  const corners = () => tile.evaluate(node => getComputedStyle(node, "::after").opacity);
  await tile.tap();
  await expect(tile).toHaveAttribute("data-touch-focus", "true");
  await expect.poll(corners).toBe("1");
  await hint.tap();
  await expect(tile).not.toHaveAttribute("data-touch-focus", "true");
  await expect.poll(corners).toBe("0");
  await expect(hint).not.toHaveAttribute("data-touch-focus", "true");
  expect(await hint.evaluate(node => getComputedStyle(node, "::after").content)).toBe("none");
  await expect(page.locator('.bubble-hint')).toBeVisible();
  await page.touchscreen.tap(5, 90);
  await expect(hint).not.toHaveAttribute("data-touch-focus", "true");
  await context.close();
});

test("Bubble controls show focus corners without lifting and respect mute", async ({ page }) => {
  await enterTrack(page, "Bubble Sort", "Play");
  await page.evaluate(async () => {
    const resource = performance.getEntriesByType("resource").find(entry => new URL(entry.name).pathname === "/src/audio/gameAudio.ts")!.name;
    const { gameAudio, readSoundPreference } = await import(resource);
    const played: string[] = [];
    (window as any).bubblePlayed = played;
    const play = gameAudio.play.bind(gameAudio);
    gameAudio.play = (cue: any) => {
      const result = play(cue);
      if (readSoundPreference()) played.push(cue);
      return result;
    };
  });
  const hint = page.getByRole("button", { name: "Cáo gợi ý", exact: true });
  const tile = page.locator(".bubble-tile").first();
  const focusOpacity = () => tile.evaluate(node => getComputedStyle(node, "::after").opacity);
  const shift = () => hint.evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m42);
  await page.mouse.move(5, 80);
  await page.waitForTimeout(120);
  await tile.hover();
  await expect.poll(shift).toBe(0);
  await expect.poll(focusOpacity).toBe("1");
  await expect.poll(() => page.evaluate(() => (window as any).bubblePlayed)).toContain("bubble-hover");
  await page.mouse.move(5, 80);
  await expect.poll(shift).toBe(0);
  await expect.poll(focusOpacity).toBe("0");
  await hint.hover();
  expect(await hint.evaluate(node => getComputedStyle(node, "::after").content)).toBe("none");
  await page.locator(".bubble-buta-character").hover();
  expect(await page.locator(".bubble-buta-character").evaluate(node => getComputedStyle(node, "::after").content)).toBe("none");
  await hint.hover();
  await page.mouse.down();
  await expect.poll(shift).toBe(2);
  await page.mouse.up();
  await expect(page.locator(".bubble-hint")).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).bubblePlayed)).toContain("hint");

  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByRole("button", { name: /Hiệu ứng âm thanh/ }).click();
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.mouse.move(5, 80);
  await page.evaluate(() => { (window as any).bubblePlayed.length = 0; });
  await hint.hover();
  await hint.click();
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => (window as any).bubblePlayed)).toEqual([]);
  await expect.poll(shift).toBe(0);
  await expect.poll(focusOpacity).toBe("0");
});

test("the Bubble sound pack renders non-silent waveforms with bounded peaks and soft tails", async ({ page }) => {
  await page.goto("/");
  const results = await page.evaluate(async () => {
    const resource = performance.getEntriesByType("resource").find(entry => new URL(entry.name).pathname === "/src/audio/gameAudio.ts")!.name;
    const { renderCue } = await import(resource);
    const { bubbleSounds } = await import(new URL("./bubbleSounds.ts", resource).href);
    const results = [];
    for (const cue of Object.keys(bubbleSounds)) {
      const context = new OfflineAudioContext(2, 96000, 48000);
      renderCue(context, context.destination, cue, 0, "bubble");
      const rendered = await context.startRendering();
      const samples = rendered.getChannelData(0);
      let peak = 0, energy = 0;
      for (const sample of samples) {
        peak = Math.max(peak, Math.abs(sample));
        energy += sample * sample;
      }
      results.push({ cue, peak, energy, tail: Math.max(...samples.slice(-480).map(Math.abs)) });
    }
    return results;
  });
  expect(results.length).toBeGreaterThanOrEqual(12);
  for (const result of results) {
    expect(result.peak, result.cue).toBeGreaterThan(.001);
    expect(result.peak, result.cue).toBeLessThan(.1);
    expect(result.energy, result.cue).toBeGreaterThan(.001);
    expect(result.tail, result.cue).toBeLessThan(.0001);
  }
});

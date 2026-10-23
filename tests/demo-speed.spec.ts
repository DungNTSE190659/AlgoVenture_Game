import { expect, test, type Page } from "@playwright/test";
import { enterTrack } from "./track-navigation";

async function position(page: Page) {
  return page.locator(".lesson-world").count().then(async count => count
    ? page.locator(".lesson-world").getAttribute("data-frame")
    : page.getByRole("progressbar").getAttribute("value"));
}

for (const algorithm of ["Quick Sort", "Bubble Sort", "Selection Sort", "Insertion Sort"]) {
  test(`${algorithm}: live speed changes preserve elapsed time and accelerate the next step`, async ({ page }) => {
    await enterTrack(page, algorithm, "Demo");
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.evaluate(() => {
      const nativeTimeout = window.setTimeout.bind(window);
      (window as any).demoWaits = [];
      window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
        if (new Error().stack?.includes("useDemoPlayback")) (window as any).demoWaits.push(delay);
        return nativeTimeout(handler, delay, ...args);
      }) as typeof window.setTimeout;
    });
    await page.getByRole("button", { name: algorithm === "Quick Sort" ? "Phát demo" : "Bắt đầu", exact: true }).click();
    const initial = await position(page);
    const waits = () => page.evaluate(() => (window as any).demoWaits as number[]);
    const original = (await waits()).at(-1)!;
    expect(original).toBeGreaterThan(1000);
    await page.clock.runFor(400);
    const speed = page.getByRole("button", { name: /^Tốc độ demo:/ });
    await speed.click();
    await expect(speed).toHaveText("1.5x");
    const atOneAndHalf = (await waits()).at(-1)!;
    expect(atOneAndHalf).toBeCloseTo((original - 400) / 1.5, -2);
    await page.clock.runFor(200);
    await speed.click();
    await expect(speed).toHaveText("2x");
    const atDouble = (await waits()).at(-1)!;
    expect(atDouble).toBeCloseTo((original - 400 - 300) / 2, -2);
    await page.clock.runFor(Math.max(0, atDouble - 100));
    expect(await position(page)).toBe(initial);
    await page.clock.runFor(150);
    await expect.poll(() => position(page)).not.toBe(initial);
  });

  test(`${algorithm}: tile motion follows 1x, 1.5x and 2x`, async ({ page }) => {
    await enterTrack(page, algorithm, "Demo");
    const next = page.getByRole("button", { name: "Bước tiếp", exact: true });
    let found = false;
    for (let step = 0; step < 35 && await next.count(); step++) {
      await next.click();
      found = await page.evaluate(() => {
        const animation = document.getAnimations().find(candidate => {
          const target = (candidate.effect as KeyframeEffect)?.target;
          return target instanceof Element && target.matches(".lesson-cell, .bubble-tile, .selection-tile, .insertion-tile, .qf-friend");
        });
        if (!animation) return false;
        animation.pause();
        (window as any).testedDemoAnimation = animation;
        return true;
      });
      if (found) break;
    }
    expect(found).toBe(true);
    const rate = () => page.evaluate(() => ((window as any).testedDemoAnimation as Animation).playbackRate);
    expect(await rate()).toBe(1);
    const speed = page.getByRole("button", { name: /^Tốc độ demo:/ });
    await speed.click();
    await expect.poll(rate).toBe(1.5);
    await speed.click();
    await expect.poll(rate).toBe(2);
    await speed.click();
    await expect.poll(rate).toBe(1);
  });
}

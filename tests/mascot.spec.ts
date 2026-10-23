import { expect, test } from "@playwright/test";
import { enterTrack } from "./track-navigation";

for (const width of [390, 1440]) {
  test(`2D Buta loads every emotion and keeps its demo layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await enterTrack(page, "Quick Sort", "Demo");
    const pig = page.locator(".qf-dialogue .pig");
    await expect(pig).toHaveAccessibleName("Buta vui vẻ");
    await expect(pig.locator(".pig-still")).toHaveAttribute("src", /assets\/buta\/2d\/happy\.webp$/);
    await expect(pig).toHaveAttribute("data-animated", "true");
    const box = await pig.boundingBox();
    expect(box).not.toBeNull();
    const assets = await page.evaluate(async () => {
      return Promise.all(["happy", "thinking", "oops", "celebrate", "pointing", "explaining", "surprised", "proud"].map(async mood => {
        const image = new Image();
        image.src = `/assets/buta/2d/${mood}.webp`;
        await image.decode();
        return { mood, width: image.naturalWidth, height: image.naturalHeight };
      }));
    });
    expect(assets).toHaveLength(8);
    expect(assets.every(asset => asset.width > 0 && asset.width === asset.height)).toBe(true);
    // Advancing changes the real artwork while the narrator box stays stable.
    for (let step = 0; step < 10 && await pig.getAttribute("data-mood") !== "thinking"; step++) {
      await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
    }
    await expect(pig).toHaveAttribute("data-mood", "thinking");
    await expect(pig.locator(".pig-sheet")).toHaveAttribute("src", /motion\/thinking\.webp$/);
    await expect(pig).toHaveAccessibleName("Buta đang suy nghĩ");
    await expect(pig).toHaveAttribute("data-animated", "true");
    const after = await pig.boundingBox();
    expect(after!.height).toBeGreaterThan(40);
    expect(after!.width).toBeCloseTo(box!.width, 0);
    expect(after!.height).toBeCloseTo(box!.height, 0);
    expect(after!.x).toBeGreaterThanOrEqual(0);
    expect(after!.x + after!.width).toBeLessThanOrEqual(width);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(pig.locator(".pig-still")).toBeVisible();
    await expect(pig.locator(".pig-clip")).toBeHidden();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForTimeout(350); // Let the new pose's decoded texture reach the compositor for visual QA.
    await page.screenshot({ path: `.qa/buta-2d-demo-${width}.png` });
  });
}

test("Buta animates different drawn poses, freezes for settings and respects reduced motion", async ({ page }) => {
  await enterTrack(page, "Quick Sort", "Demo");
  const sheet = page.locator(".qf-dialogue .pig-sheet");
  await expect(page.locator(".qf-dialogue .pig")).toHaveAttribute("data-animated", "true");
  // Sample the actual CSS animation at two different drawn frames.
  const frames = await sheet.evaluate(node => {
    const animation = node.getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
    const first = getComputedStyle(node).transform;
    animation.currentTime = 500;
    const blink = getComputedStyle(node).transform;
    animation.play();
    return [first, blink];
  });
  expect(frames[0]).not.toEqual(frames[1]);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await expect.poll(() => sheet.evaluate(node => getComputedStyle(node).animationPlayState)).toBe("paused");
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect.poll(() => sheet.evaluate(node => getComputedStyle(node).animationPlayState)).toBe("running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".qf-dialogue .pig-still")).toBeVisible();
  await expect.poll(() => sheet.evaluate(node => node.getAnimations().length)).toBe(0);
});

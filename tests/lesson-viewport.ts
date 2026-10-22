import { expect, type Locator, type Page } from "@playwright/test";

// Portrait may scroll vertically to preserve readable text and touch targets.
// Desktop and landscape must still fit without scrolling.
export async function expectLessonFits(page: Page, root: string, tolerance = 1) {
  const portrait = await page.evaluate(() => matchMedia("(max-width: 700px) and (orientation: portrait)").matches);
  await expect.poll(() => page.locator(root).evaluate((node, vertical) => vertical
    ? node.scrollHeight - node.clientHeight : node.scrollWidth - node.clientWidth, !portrait),
  { message: `${root} overflow at ${JSON.stringify(page.viewportSize())}` }).toBeLessThanOrEqual(tolerance);
}

export async function expectLessonVisible(page: Page, locator: Locator) {
  const portrait = await page.evaluate(() => matchMedia("(max-width: 700px) and (orientation: portrait)").matches);
  if (portrait)
    await locator.scrollIntoViewIfNeeded();
  // Scroll offsets are rounded to whole pixels by Chromium.
  await expect(locator).toBeInViewport({ ratio: portrait ? .99 : 1 });
}

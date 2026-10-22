import { expect, test } from '@playwright/test';
import { LINEAR_STRUCTURES } from '../src/engine/learningTrack';

const sizes = [
  { width: 320, height: 568 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 2560, height: 1440 },
];

for (const lesson of LINEAR_STRUCTURES) {
  test(`${lesson.name} adapts to phones, laptops and large monitors`, async ({ page }, testInfo) => {
    for (const mode of ['demo', 'challenge']) {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/');
      await page.locator('.topic-dots button').nth(1).click();
      await page.locator('.atlas-enter').click();
      await page.getByRole('button', { name: lesson.name, exact: true }).click();
      await page.locator(`.sheet-${mode}`).click();
      for (const size of sizes) {
        await page.setViewportSize(size);
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(size.width);
        expect(await page.locator('.linked-world').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        const bank = page.locator('.linked-bank');
        const bankBox = await bank.boundingBox();
        for (const card of await bank.locator('.linked-node-body').all()) {
          const box = await card.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(bankBox!.x);
          expect(box!.x + box!.width).toBeLessThanOrEqual(bankBox!.x + bankBox!.width);
        }
        if (mode === 'demo' && size.width > 600 && size.height > 540) {
          expect(await page.locator('.linked-content').evaluate(el => el.clientHeight)).toBeGreaterThan(150);
          await expect(page.getByRole('button', { name: 'Bắt đầu', exact: true })).toBeInViewport();
        }
        const last = page.locator('.linked-null-target');
        await last.scrollIntoViewIfNeeded();
        await expect(last).toBeInViewport();
        const control = mode === 'demo'
          ? page.getByRole('button', { name: 'Bắt đầu', exact: true })
          : page.getByRole('button', { name: 'Kiểm tra', exact: true });
        await control.scrollIntoViewIfNeeded();
        await expect(control).toBeInViewport();
        if (lesson.id === 'linked-traversal' && mode === 'demo') {
          await page.screenshot({ path: testInfo.outputPath(`${size.width}x${size.height}.png`) });
        }
      }
    }
  });
}

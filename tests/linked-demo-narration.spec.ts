import { expect, test } from '@playwright/test';
import { LINEAR_STRUCTURES } from '../src/engine/learningTrack';

for (const lesson of LINEAR_STRUCTURES) {
  test(`${lesson.name}: each frame explains its action and statistics replay correctly`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('.topic-dots button').nth(1).click();
    await page.locator('.atlas-enter').click();
    await page.getByRole('button', { name: lesson.name, exact: true }).click();
    await page.locator('.sheet-demo').click();
    await expect(page.locator('.linked-hud')).toContainText('0 lần đặt khối');
    await expect(page.locator('.linked-hud')).toContainText('0 lần nối dây');
    const total = Number(await page.locator('progress').getAttribute('max'));
    let previous = await page.locator('.linked-demo-dialogue p').innerText();
    for (let step = 0; step < total; step++) {
      await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
      const text = await page.locator('.linked-demo-dialogue p').innerText();
      expect(text).not.toBe(previous);
      expect(text).not.toContain('undefined');
      previous = text;
    }
    await expect(page.locator('.linked-hud')).not.toContainText('0 lần đặt khối');
    await expect(page.locator('.linked-hud')).not.toContainText('0 lần nối dây');
    const result = await page.locator('.linked-hud').textContent();
    await page.getByRole('button', { name: 'Bước trước', exact: true }).click();
    await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
    await expect(page.locator('.linked-hud')).toHaveText(result!);
    await page.getByRole('button', { name: 'Xem lại từ đầu', exact: true }).click();
    await expect(page.locator('.linked-hud')).toContainText('0 lần đặt khối');
    await expect(page.locator('.linked-hud')).toContainText('0 lần nối dây');
    await expect(page.locator('.linked-hud')).toContainText('Lượt kiểm tra 0');
  });
}

test('Construction score rewards correct positions without rewarding repeated placements', async ({ page }) => {
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.locator('.sheet-challenge').click();
  await expect(page.locator('.linked-hud .play-score')).toHaveAttribute('aria-label', '0 điểm');
  await page.getByRole('button', { name: 'Khối 7 ở khay', exact: true }).click();
  await page.locator('[data-linked-slot="0"]').click();
  await expect(page.locator('.linked-hud .play-score')).toHaveAttribute('aria-label', '100 điểm');
  await expect(page.locator('.linked-hud')).toContainText('1 lần đặt khối');
  await page.getByRole('button', { name: 'Khối 7 ở hàng lắp', exact: true }).click();
  await page.locator('[data-linked-slot="0"]').click();
  await expect(page.locator('.linked-hud .play-score')).toHaveAttribute('aria-label', '100 điểm');
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
  await expect(page.locator('.linked-hud')).toContainText('Lượt kiểm tra 1');
  await expect(page.locator('.linked-hud .play-score')).toHaveAttribute('aria-label', '75 điểm');
});

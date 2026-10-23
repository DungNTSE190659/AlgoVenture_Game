import { expect, test } from '@playwright/test';

test('spiral rope moves toward the next node, pauses with Demo/settings, and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    localStorage.setItem('piggy-sound', 'off');
    localStorage.setItem('algoventure.world-progress.v3', JSON.stringify({ 'tree-basics': true }));
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Xem chủ đề Cây', exact: true }).click();
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', { name: 'Duyệt cây', exact: true }).click();
  await page.locator('.sheet-demo').click();
  await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
  const ropes = page.locator('.tree-signal-branches');
  const flow = page.locator('.tree-rope-flow').first();
  await expect(ropes).toHaveAttribute('data-route', '0,1');
  await expect(page.locator('[data-flow="0>1"]')).toHaveCount(1);
  await expect(flow).toHaveCSS('animation-play-state', 'paused');
  await page.getByRole('button', { name: 'Phát demo', exact: true }).click();
  await expect(flow).toHaveCSS('animation-play-state', 'running');
  const start = await flow.evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(120);
  expect(await flow.evaluate(el => getComputedStyle(el).transform)).not.toBe(start);
  await page.getByRole('button', { name: 'Tùy chọn', exact: true }).click();
  await expect(flow).toHaveCSS('animation-play-state', 'paused');
  const frozen = await flow.evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(120);
  expect(await flow.evaluate(el => getComputedStyle(el).transform)).toBe(frozen);
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(flow).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.tree-signal-packet')).toHaveCSS('display', 'none');
});

import { expect, test } from '@playwright/test';

test('Linked map loads desktop/mobile sprites and opens the selected lesson', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().includes('/linked/map/') && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('algoventure.world-progress.v3', JSON.stringify(Object.fromEntries(['linked-list', 'linked-traversal', 'linked-search', 'linked-insertion', 'linked-deletion', 'linked-reversal'].map(id => [id, true])))));
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', { name: 'Linked List Deletion', exact: true }).click();
  for (const size of [{ width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    const profile = size.width <= 700 ? 'mobile' : 'desktop';
    await expect(page.locator('.track-sheet')).toHaveCSS('background-image', new RegExp(`sheet-${profile}\\.svg`));
    const selected = page.locator('.stop-selected .stop-button');
    await selected.hover();
    await expect(selected).toHaveCSS('background-image', new RegExp(`station-linked-deletion-${profile}-selected\\.svg`));
    const demo = page.getByRole('button', { name: 'Xem demo', exact: true });
    await demo.hover();
    await expect(demo).toHaveCSS('background-image', new RegExp(`button-demo-${profile}-hover\\.svg`));
    await expect(demo).toBeInViewport();
    await expect(page.locator('.sheet-challenge')).toBeInViewport();
    expect(await page.locator('main').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    await expect.poll(() => page.locator('.region-linear-structures img').evaluateAll(images => images.filter(el => !(el as HTMLImageElement).complete || !(el as HTMLImageElement).naturalWidth).map(el => (el as HTMLImageElement).src))).toEqual([]);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `.qa/linked-map-assets-${size.width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.sheet-demo').click();
  await expect(page.locator('.linked-world.linked-demo')).toBeVisible();
  await page.getByRole('button', { name: 'Về bản đồ', exact: true }).click();
  await expect(page.locator('#track-sheet-title')).toContainText('Deletion');
  await page.locator('.sheet-challenge').click();
  await expect(page.locator('.linked-world:not(.linked-demo)')).toBeVisible();
  expect(errors).toEqual([]);
});

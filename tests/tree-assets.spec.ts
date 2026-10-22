import { expect, test } from '@playwright/test';

test('Tree island, map and playfield load their desktop/mobile sprites with persistent state skins', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', e => failures.push(e.message));
  page.on('response', response => { if (response.url().includes('/assets/') && response.status() >= 400) failures.push(response.url()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('algoventure.world-progress.v3', JSON.stringify(Object.fromEntries(['tree-basics','tree-traversal','bst','bst-search','bst-insert','bst-delete'].map(id => [id,true]))));
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Xem chủ đề Cây', exact: true }).click();
  await expect.poll(() => page.locator('img[src$="islands/trees.png"]').evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', { name: 'Duyệt cây', exact: true }).click();
  for (const size of [{width:1440,height:900},{width:390,height:844}]) {
    await page.setViewportSize(size);
    await expect(page.locator('.stop-selected .stop-button')).toHaveCSS('background-image', /\/tree\/map\/svg\/station-tree-traversal-/);
    await page.screenshot({path:`.qa/tree-assets-map-${size.width}.png`});
  }
  await page.locator('.sheet-demo').click();
  await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
  for (const size of [{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:844,height:390}]) {
    await page.setViewportSize(size);
    await expect.poll(() => page.locator('.tree-game img').evaluateAll(images => images.filter(el => !(el as HTMLImageElement).complete || !(el as HTMLImageElement).naturalWidth).map(el => (el as HTMLImageElement).src))).toEqual([]);
    await expect(page.locator('.tree-node').first()).toHaveCSS('background-image', /\/tree\/svg\/node-/);
    const next = page.getByRole('button', { name: 'Bước tiếp', exact: true });
    await next.hover();
    await expect.poll(() => next.evaluate(el => getComputedStyle(el,'::before').borderImageSource)).toMatch(/button-icon-.*-hover\.svg/);
    await page.mouse.down();
    await expect.poll(() => next.evaluate(el => getComputedStyle(el,'::before').borderImageSource)).toMatch(/button-icon-.*-pressed\.svg/);
    await page.mouse.move(0,0); await page.mouse.up();
    await page.screenshot({path:`.qa/tree-assets-demo-${size.width}.png`});
  }
  await page.getByRole('button', { name: 'Tùy chọn', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(() => page.locator('.tree-setting-toggle').evaluate(el => getComputedStyle(el,'::before').borderImageSource)).toMatch(/\/tree\/svg\/button-neutral-/);
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  expect(failures).toEqual([]);
});

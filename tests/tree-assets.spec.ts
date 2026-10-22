import { expect, test } from '@playwright/test';
import { createTreeCourse } from '../src/engine/tree';

test('BST node stays green when selected and dragged to the removal tray', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('algoventure.world-progress.v3', JSON.stringify({
    'tree-basics': true, 'tree-traversal': true, bst: true, 'bst-search': true, 'bst-insert': true,
  })));
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'Xem chủ đề Cây', exact: true }).click();
    await page.locator('.atlas-enter').click();
    await page.getByRole('button', { name: 'Xóa nút khỏi BST', exact: true }).click();
    await page.locator('.sheet-challenge').click();
    const node = page.getByRole('button', { name: 'Nút 10', exact: true });
    const skin = await node.evaluate(el => getComputedStyle(el).backgroundImage);
    const from = (await node.boundingBox())!;
    const tray = (await page.locator('[data-drop="tray"]').boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 + 25, from.y - 25, { steps: 3 });
    await expect(node).toHaveCSS('background-image', skin);
    await expect(page.locator('.tree-drag-ghost')).toHaveCSS('background-image', skin);
    await page.screenshot({ path: `.qa/tree-green-node-drag-${viewport.width}.png` });
    await page.mouse.move(tray.x + tray.width / 2, tray.y + tray.height / 2, { steps: 3 });
    await page.mouse.up();
    await expect(node).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Kiểm tra cây', exact: false })).toBeVisible();
  }
});

test('dragging a purple label preserves its skin and keeps tree nodes vivid', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const course = createTreeCourse('tree-basics');
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'Xem chủ đề Cây', exact: true }).click();
    await page.locator('.atlas-enter').click();
    await page.locator('.sheet-challenge').click();
    for (const step of course.rounds[0].steps) {
      await page.locator(`[data-item="${step.item}"]`).click();
      await page.locator(`[data-drop="${step.target}"]`).click();
    }
    await page.getByRole('button', { name: 'Kiểm tra cây', exact: false }).click();
    const label = page.locator('.tree-supply-label').first();
    const node = page.locator('.tree-node').first();
    const originalNodeSkin = await node.evaluate(el => getComputedStyle(el).backgroundImage);
    const labelSkin = await label.evaluate(el => getComputedStyle(el, '::before').borderImageSource);
    const box = (await label.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 30, box.y + box.height / 2 + 40, { steps: 3 });
    await expect(page.locator('.tree-drag-ghost')).toBeVisible();
    expect(await page.locator('.tree-drag-ghost').evaluate(el => getComputedStyle(el, '::before').borderImageSource)).toBe(labelSkin);
    await expect(node).toHaveCSS('background-image', originalNodeSkin);
    await expect(node).toHaveCSS('opacity', '1');
    await expect(node).toHaveCSS('outline-style', 'solid');
    await page.screenshot({ path: `.qa/tree-label-drag-${viewport.width}.png` });
    const target = (await node.boundingBox())!;
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 3 });
    await page.mouse.up();
    await expect(page.locator('.tree-node-label')).toHaveText('Gốc');
    expect(await page.locator('.tree-node-label').evaluate(el => getComputedStyle(el, '::before').borderImageSource)).toBe(labelSkin);
  }
});

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
    await expect.poll(() => page.locator('.region-trees img').evaluateAll(images => images.filter(el => !(el as HTMLImageElement).complete || !(el as HTMLImageElement).naturalWidth).map(el => (el as HTMLImageElement).src))).toEqual([]);
    const brokenBackgrounds = await page.evaluate(async () => {
      const selectors = ['.stop-land', '.stop-selected .stop-button', '.stop-caption', '.track-sheet', '.sheet-number', '.sheet-demo', '.sheet-challenge', '.track-progress > div'];
      return (await Promise.all(selectors.map(async selector => {
        const element = document.querySelector(`.region-trees ${selector}`);
        const url = element && getComputedStyle(element).backgroundImage.match(/url\("?([^\")]+)"?\)/)?.[1];
        if (!url) return selector;
        const image = new Image();
        image.src = url;
        try { await image.decode(); return null; } catch { return selector; }
      }))).filter(Boolean);
    });
    expect(brokenBackgrounds).toEqual([]);
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

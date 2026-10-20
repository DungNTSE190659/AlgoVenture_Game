import { test, expect } from '@playwright/test';
import { LINEAR_STRUCTURES } from '../src/engine/learningTrack';

for (const lesson of LINEAR_STRUCTURES) {
  test(`${lesson.name}: dragged blocks match and demo hardware stays opaque`, async ({ page }) => {
    await page.goto('/');
    await page.locator('.topic-dots button').nth(1).click();
    await page.locator('.atlas-enter').click();
    await page.getByRole('button', { name: lesson.name, exact: true }).click();
    await page.locator('.sheet-challenge').click();
    const source = page.locator('.linked-node-body').filter({ visible: true }).first();
    const appearance = (el: Element) => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return { color: s.backgroundColor, border: s.borderRadius, width: r.width, height: r.height, text: el.textContent };
    };
    const expected = await source.evaluate(appearance);
    const box = await source.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + 100, box!.y + 100, { steps: 5 });
    await expect(page.locator('.linked-drag-ghost .linked-node-body')).toBeVisible();
    expect(await page.locator('.linked-drag-ghost .linked-node-body').evaluate(appearance)).toEqual(expected);
    await page.mouse.up();
    await page.getByRole('button', { name: 'Về bản đồ', exact: true }).click();
    await page.locator('.sheet-demo').click();
    if (lesson.id !== 'linked-reversal') {
      await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
      if (lesson.id !== 'linked-list') await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
    }
    await expect(page.locator('[data-linked-demo-motion]')).toHaveCount(0);
    const nails = page.locator('.linked-nail');
    expect(await nails.count()).toBeGreaterThan(0);
    for (const nail of await nails.all()) {
      await expect(nail).toHaveCSS('opacity', '1');
      await expect(nail.locator('.linked-nail-head')).toHaveCSS('filter', 'none');
    }
    for (const path of await page.locator('[data-demo-wire]').all()) {
      expect(await path.getAttribute('d')).toMatch(/^M .* L /);
      await expect(path).toHaveCSS('opacity', '1');
    }
  });
}

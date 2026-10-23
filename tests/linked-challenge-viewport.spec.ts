import { expect, test } from '@playwright/test';
import { LINEAR_STRUCTURES } from '../src/engine/learningTrack';

for (const lesson of LINEAR_STRUCTURES) test(`${lesson.id} challenge fits desktop without scrolling`, async ({ page }) => {
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', { name: lesson.name, exact: true }).click();
  await page.locator('.sheet-challenge').click();
  for (const size of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1280, height: 600 }, { width: 1024, height: 600 }, { width: 390, height: 844 }, { width: 375, height: 667 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(size);
    await expect.poll(() => page.locator('.linked-world').evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
    await expect(page.getByRole('button', { name: 'Kiểm tra', exact: true })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Làm lại', exact: true })).toBeInViewport();
    const check = (await page.getByRole('button', { name: 'Kiểm tra', exact: true }).boundingBox())!;
    const reset = (await page.getByRole('button', { name: 'Làm lại', exact: true }).boundingBox())!;
    expect(reset.y).toBeGreaterThan(check.y);
    expect(reset.x + reset.width).toBeLessThanOrEqual(size.width);
    const boxes = await page.locator('.linked-bank .linked-node-body, .linked-slot, .linked-null-target').evaluateAll(elements => elements.map(el => { const box = el.getBoundingClientRect(); return { left: box.left, right: box.right, top: box.top, bottom: box.bottom }; }));
    for (const box of boxes) { expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(size.width); expect(box.top).toBeGreaterThanOrEqual(0); expect(box.bottom).toBeLessThanOrEqual(size.height); }
    const slots = await page.locator('.linked-slot').evaluateAll(elements => elements.map(el => { const box = el.getBoundingClientRect(); return { x: box.x, y: box.y, h: box.height }; }));
    for (let i = 1; i < slots.length; i++) { expect(slots[i].x).toBeCloseTo(slots[0].x, 0); expect(slots[i].y).toBeGreaterThanOrEqual(slots[i - 1].y + slots[i - 1].h); }
    const bank = (await page.locator('.linked-bank').boundingBox())!;
    const assembly = (await page.locator('.linked-assembly').boundingBox())!;
    if (size.width <= 700) {
      const hint = (await page.getByRole('button', { name: 'Buta gợi ý', exact: true }).boundingBox())!;
      expect(Math.abs(check.y - hint.y)).toBeLessThan(2);
      expect(Math.abs((check.x + hint.x + hint.width) / 2 - size.width / 2)).toBeLessThan(2);
      expect(assembly.y + assembly.height).toBeLessThan(check.y);
    }
    expect(assembly.x + assembly.width).toBeLessThan(bank.x);
    expect(bank.height).toBeLessThan(assembly.height);
    await expect(page.getByRole('button', { name: 'Buta gợi ý', exact: true })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Hoàn tác', exact: true })).toBeDisabled();
    expect(await page.locator('.linked-challenge-guide').evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
    if (lesson.id === 'linked-reversal' && [1366, 390, 320].includes(size.width)) await page.screenshot({ path: `.qa/linked-sidebar-${size.width}.png` });
  }
});

for (const lesson of LINEAR_STRUCTURES) test(`${lesson.id} sidebar hint and undo restore actual game objects`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', { name: lesson.name, exact: true }).click();
  await page.locator('.sheet-challenge').click();
  const undo = page.getByRole('button', { name: 'Hoàn tác', exact: true });
  await expect(undo).toBeDisabled();
  if (lesson.id === 'linked-reversal') {
    const anchor = page.locator('.journey-slot').first().locator('[data-wire-source]');
    const target = await anchor.getAttribute('data-wire-target');
    const source = await anchor.getAttribute('data-wire-source');
    await page.getByRole('button', { name: `Đinh của khối ${source}`, exact: true }).click();
    await expect(anchor).toHaveAttribute('data-wire-target', 'null');
    await undo.click();
    await expect(anchor).toHaveAttribute('data-wire-target', target!);
  } else {
    const source = page.locator('.linked-bank .linked-node-body').first();
    const value = (await source.innerText()).trim();
    await source.click();
    await page.locator('.linked-slot').first().click();
    await expect(page.locator('.linked-slot').first()).toContainText(value);
    await expect(undo).toBeEnabled();
    await undo.click();
    await expect(page.locator('.linked-slot .linked-node-body')).toHaveCount(0);
    await expect(page.locator('.linked-bank .linked-node-body').filter({ hasText: value })).toBeVisible();
  }
  await expect(undo).toBeDisabled();
  await page.getByRole('button', { name: 'Buta gợi ý', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Buta gợi ý', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.linked-challenge-guide [role="status"]')).not.toBeEmpty();
  await page.getByRole('button', { name: 'Làm lại', exact: true }).click();
  await expect(undo).toBeDisabled();
});

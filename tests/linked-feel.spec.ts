import { test, expect, type Page, type Locator } from '@playwright/test';

async function open(page: Page, lesson: string, mode = 'challenge') {
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', { name: `Linked List ${lesson}`, exact: true }).click();
  await page.locator(`.sheet-${mode}`).click();
}
async function enter(button: Locator) { await button.focus(); await button.press('Enter'); }

test('options stop Demo and restore focus on Escape', async ({ page }) => {
  await open(page, 'Construction', 'demo');
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
  const options = page.getByRole('button', { name: 'Tùy chọn', exact: true });
  await options.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const step = await page.locator('progress').getAttribute('value');
  await page.waitForTimeout(2800);
  await expect(page.locator('progress')).toHaveAttribute('value', step!);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(options).toBeFocused();
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
  await expect(page.locator('progress')).not.toHaveAttribute('value', step!);
});

test('Reversal can be completed entirely using keyboard activation', async ({ page }) => {
  await open(page, 'Reversal');
  const original = [7, 2, 9, 4], reversed = [...original].reverse();
  const nail = (v: number) => page.getByRole('button', { name: `Đinh của khối ${v}`, exact: true });
  for (const v of original) await enter(nail(v));
  for (const v of original) {
    await enter(page.getByRole('button', { name: `Khối ${v} ở hàng lắp`, exact: true }));
    await enter(page.getByRole('button', { name: 'Trả khối về khay', exact: true }));
    await expect(page.getByRole('button', { name: `Khối ${v} ở khay`, exact: true })).toBeVisible();
  }
  for (const [i, v] of reversed.entries()) {
    await enter(page.getByRole('button', { name: `Khối ${v} ở khay`, exact: true }));
    await enter(page.getByRole('button', { name: `Ô lắp ${i + 1}`, exact: true }));
  }
  for (const [i, v] of reversed.entries()) {
    await enter(nail(v));
    await enter(page.getByRole('button', { name: i === reversed.length - 1 ? 'Lỗ NULL' : `Lỗ của khối ${reversed[i + 1]}`, exact: true }));
  }
  await enter(page.getByRole('button', { name: 'Kiểm tra', exact: true }));
  await expect(page.locator('.victory-screen')).toBeVisible();
});

test('cancelled touch restores the detached Reversal wire', async ({ page }) => {
  await open(page, 'Reversal');
  const nail = page.getByRole('button', { name: 'Đinh của khối 7', exact: true });
  await nail.dispatchEvent('pointerdown', { pointerId: 42, isPrimary: true, pointerType: 'touch', clientX: 200, clientY: 200 });
  await expect(page.locator('[data-wire-source="7"]')).toHaveAttribute('data-wire-target', 'null');
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 42, isPrimary: true })));
  await expect(page.locator('[data-wire-source="7"]')).toHaveAttribute('data-wire-target', '2');
  await expect(page.locator('.linked-drag-ghost')).toHaveCount(0);
});

test('Construction keeps board and check action visible on a typical phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 'Construction');
  await expect(page.getByRole('button', { name: 'Kiểm tra', exact: true })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Lỗ NULL', exact: true })).toBeInViewport();
  expect(await page.locator('.linked-world').evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
});

import { test, expect } from '@playwright/test';
import { LINEAR_STRUCTURES } from '../src/engine/learningTrack';
test.use({ hasTouch: true });

for (const lesson of LINEAR_STRUCTURES) {
  test(`${lesson.name} fits vertically on a phone in Demo and challenge`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('.topic-dots button').nth(1).click();
    await page.locator('.atlas-enter').click();
    await page.getByRole('button', { name: lesson.name, exact: true }).click();
    for (const mode of ['demo', 'challenge']) {
      await page.locator(`.sheet-${mode}`).click();
      for (const width of [320, 390, 540]) {
        await page.setViewportSize({ width, height: 844 });
        if (mode === 'demo') await expect(page.getByRole('button', { name: 'Bắt đầu', exact: true })).toBeInViewport();
        const bankBox = await page.locator('.linked-bank').boundingBox();
        const assemblyBox = await page.locator('.linked-assembly').boundingBox();
        expect(bankBox!.x + bankBox!.width).toBeLessThanOrEqual(assemblyBox!.x);
        expect(Math.abs(bankBox!.y - assemblyBox!.y)).toBeLessThan(1);
        let previousCardBottom = 0;
        for (const card of await page.locator('.linked-bank .linked-node-body').all()) {
          const box = await card.boundingBox();
          expect(box!.y).toBeGreaterThanOrEqual(previousCardBottom);
          expect(box!.x).toBeGreaterThanOrEqual(bankBox!.x);
          expect(box!.x + box!.width).toBeLessThanOrEqual(bankBox!.x + bankBox!.width);
          previousCardBottom = box!.y + box!.height;
        }
        const slots = page.locator('.linked-slot');
        let bottom = 0;
        for (const slot of await slots.all()) {
          const box = await slot.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(width);
          expect(box!.y).toBeGreaterThanOrEqual(bottom);
          bottom = box!.y + box!.height;
        }
        const board = page.locator('.journey-chain, .linked-board');
        expect(await board.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        expect((await page.locator('.linked-null-target').boundingBox())!.y).toBeGreaterThan(bottom);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      }
      if (mode === 'demo') {
        const count = Number(await page.locator('progress').getAttribute('max'));
        for (let step = 0; step < count; step++) await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
        await expect(page.locator('.linked-complete-check').first()).toBeAttached();
        await page.getByRole('button', { name: 'Tự mình thử', exact: true }).click();
        await page.getByRole('button', { name: 'Về bản đồ', exact: true }).click();
      }
    }
    // Desktop uses the same two vertical columns with more room for the cards.
    await page.setViewportSize({ width: 1366, height: 900 });
    const slots = page.locator('.linked-slot');
    const first = await slots.first().boundingBox(), last = await slots.last().boundingBox();
    expect(Math.abs(first!.x - last!.x)).toBeLessThan(2);
    expect(last!.y).toBeGreaterThan(first!.y);
  });
}

test('Construction can be completed by tapping vertically placed blocks and connectors', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.locator('.sheet-challenge').click();
  for (const [index, value] of [7, 2, 9, 4].entries()) {
    await page.getByRole('button', { name: `Khối ${value} ở khay`, exact: true }).tap();
    await page.locator(`[data-linked-slot="${index}"]`).tap();
  }
  for (const [index, value] of [7, 2, 9, 4].entries()) {
    await page.getByRole('button', { name: `Đinh của khối ${value} đang rời`, exact: true }).tap();
    await page.locator(`.ll-hole[data-node="${['b', 'c', 'd', 'null'][index]}"]`).tap();
  }
  for (const path of await page.locator('[data-demo-wire]').all()) {
    const numbers = (await path.getAttribute('d'))!.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    expect(Math.abs(numbers[0] - numbers[2])).toBeLessThan(1);
    expect(numbers[3]).toBeGreaterThan(numbers[1]);
  }
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
  await expect(page.locator('.victory-screen')).toBeVisible();
});

test('Traversal supports touch placement, vertical wires and following the pig', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', { name: 'Linked List Traversal', exact: true }).click();
  await page.locator('.sheet-challenge').click();
  const values = [5, 1, 8, 3];
  for (const [index, value] of values.entries()) {
    await page.getByRole('button', { name: `Khối ${value} ở khay`, exact: true }).tap();
    await page.getByRole('button', { name: `Đặt khối vào ô ${index + 1}`, exact: true }).tap();
  }
  for (const [index, value] of values.entries()) {
    await page.getByRole('button', { name: `Đinh của khối ${value}`, exact: true }).tap();
    await page.getByRole('button', { name: index < 3 ? `Lỗ của khối ${values[index + 1]}` : 'Lỗ NULL', exact: true }).tap();
  }
  await page.getByRole('button', { name: 'Lắp xong · Bắt đầu duyệt' }).tap();
  await page.getByRole('button', { name: 'Cầm heo nhỏ' }).tap();
  await page.getByRole('button', { name: 'Lỗ của khối 5', exact: true }).tap();
  for (let i = 0; i < values.length; i++) await page.getByRole('button', { name: 'Đi theo next', exact: true }).tap();
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).tap();
  await expect(page.locator('.victory-screen')).toBeVisible();
});

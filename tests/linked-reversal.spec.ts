import { test, expect } from '@playwright/test';

test('Reversal starts connected and supports manual disassembly and rebuilding', async ({ page }) => {
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', { name: 'Linked List Reversal', exact: true }).click();
  await page.locator('.sheet-challenge').click();
  const original = [7, 2, 9, 4], reversed = [...original].reverse();
  const bankHeight = (await page.locator('.linked-bank').boundingBox())!.height;
  const node = (value: number) => page.getByRole('button', { name: `Khối ${value} ở hàng lắp`, exact: true });
  const nail = (value: number) => page.getByRole('button', { name: `Đinh của khối ${value}`, exact: true });
  const hole = (value: number) => page.getByRole('button', { name: `Lỗ của khối ${value}`, exact: true });
  for (let index = 0; index < original.length; index++) {
    await expect(page.locator('.journey-slot').nth(index).locator('[data-wire-source]')).toHaveAttribute('data-wire-target', String(original[index + 1] ?? 'null'));
  }
  await expect(page.locator('.journey-nail[data-null-docked="true"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
  await expect(page.locator('.victory-screen')).toHaveCount(0);
  const checkButton = page.getByRole('button', { name: 'Kiểm tra', exact: true });
  const feedback = page.locator('.linked-play-feedback');
  await expect(checkButton).toHaveCSS('background-color', 'rgb(247, 255, 248)');
  await expect(checkButton).toHaveCSS('color', 'rgb(89, 135, 124)');
  await expect(feedback).toHaveCSS('color', 'rgb(181, 116, 96)');
  expect((await feedback.boundingBox())!.y).toBeGreaterThan((await checkButton.boundingBox())!.y + (await checkButton.boundingBox())!.height);
  await node(7).dragTo(page.locator('[data-journey-bank]'));
  await expect(node(7)).toBeVisible();
  await expect(page.locator('.linked-play-feedback')).toContainText('tháo hết dây');
  for (const value of original) await nail(value).click();
  for (const value of original) {
    await node(value).dragTo(page.locator('[data-journey-bank]'));
    await expect(page.getByRole('button', { name: `Khối ${value} ở khay`, exact: true })).toBeVisible();
    expect((await page.locator('.linked-bank').boundingBox())!.height).toBe(bankHeight);
    await expect(page.locator('.journey-slot .linked-slot-label')).toHaveText(['HEAD', 'VỊ TRÍ 2', 'VỊ TRÍ 3', 'TAIL']);
  }
  for (const [index, value] of reversed.entries()) {
    await page.getByRole('button', { name: `Khối ${value} ở khay`, exact: true }).dragTo(page.getByRole('button', { name: `Đặt khối vào ô ${index + 1}` }));
    expect((await page.locator('.linked-bank').boundingBox())!.height).toBe(bankHeight);
  }
  await nail(4).dragTo(hole(9));
  await nail(9).dragTo(hole(2));
  // Reject a cycle and two incoming pointers to the same hole.
  await nail(2).dragTo(hole(4));
  await expect(page.locator('.linked-play-feedback')).toContainText('vòng tròn');
  await nail(7).dragTo(hole(9), { force: true });
  await expect(page.locator('.linked-play-feedback')).toContainText('đã có đinh');
  await nail(2).dragTo(hole(7));
  await nail(7).dragTo(page.getByRole('button', { name: 'Lỗ NULL', exact: true }));
  await expect(page.locator('.victory-screen')).toHaveCount(0);
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
  await expect(page.locator('.victory-screen')).toBeVisible();
  await page.getByRole('button', { name: 'Chơi lại', exact: true }).click();
  await expect(page.locator('.journey-slot').first()).toContainText('7');
});

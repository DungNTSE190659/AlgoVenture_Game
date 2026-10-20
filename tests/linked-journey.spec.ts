import { test, expect } from '@playwright/test';

test('placed blocks swap on occupied cards and return to the bank with links detached', async ({ page }) => {
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', { name: 'Linked List Traversal', exact: true }).click();
  await page.locator('.sheet-challenge').click();
  for (const [index, value] of [5, 1, 3, 8].entries()) {
    await page.getByRole('button', { name: `Khối ${value} ở khay`, exact: true }).dragTo(page.getByRole('button', { name: `Đặt khối vào ô ${index + 1}` }));
  }
  await page.getByRole('button', { name: 'Khối 3 ở hàng lắp', exact: true }).dragTo(page.getByRole('button', { name: 'Khối 8 ở hàng lắp', exact: true }));
  await expect(page.locator('.journey-slot').nth(2)).toContainText('8');
  await expect(page.locator('.journey-slot').nth(3)).toContainText('3');
  await page.getByRole('button', { name: 'Đinh của khối 5', exact: true }).scrollIntoViewIfNeeded();
  const nail = await page.getByRole('button', { name: 'Đinh của khối 5', exact: true }).boundingBox();
  const hole = await page.getByRole('button', { name: 'Lỗ của khối 1', exact: true }).boundingBox();
  await page.mouse.move(nail!.x + nail!.width / 2, nail!.y + nail!.height / 2);
  await page.mouse.down();
  await page.mouse.move(hole!.x + hole!.width / 2, hole!.y + hole!.height / 2, { steps: 12 });
  // Allow the moving nail to render over the hole before releasing the mouse.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.mouse.up();
  await expect(page.locator('.journey-slot').first().locator('[data-wire-source]')).toHaveAttribute('data-wire-target', '1');
  await page.getByRole('button', { name: 'Đinh của khối 5', exact: true }).click();
  await page.getByRole('button', { name: 'Lỗ của khối 8', exact: true }).click();
  await expect(page.locator('.journey-slot').first().locator('[data-wire-source]')).toHaveAttribute('data-wire-target', '8');
  await page.getByRole('button', { name: 'Đinh của khối 5', exact: true }).click();
  await page.getByRole('button', { name: 'Lỗ của khối 1', exact: true }).click();
  await page.getByRole('button', { name: 'Khối 1 ở hàng lắp', exact: true }).dragTo(page.locator('[data-journey-bank]'));
  await expect(page.getByRole('button', { name: 'Khối 1 ở khay', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đặt khối vào ô 2' })).toBeVisible();
  await expect(page.locator('.journey-slot').first().locator('[data-wire-source]')).toHaveAttribute('data-wire-target', 'null');
  await page.getByRole('button', { name: 'Khối 1 ở khay', exact: true }).dragTo(page.getByRole('button', { name: 'Đặt khối vào ô 2' }));
  await expect(page.locator('.journey-slot').nth(1)).toContainText('1');
});

for (const lesson of ['Traversal', 'Search', 'Insertion', 'Deletion']) {
  test(`${lesson}: build, carry pig, follow next and finish`, async ({ page }) => {
    await page.goto('/');
    await page.locator('.topic-dots button').nth(1).click();
    await page.locator('.atlas-enter').click();
    await page.getByRole('button', { name: `Linked List ${lesson}`, exact: true }).click();
    await page.locator('.sheet-challenge').click();
    const values = lesson === 'Traversal' ? [5, 1, 8, 3] : lesson === 'Search' ? [4, 9, 2, 7] : [8, 3, 6];
    for (const [index, value] of values.entries()) {
      await page.getByRole('button', { name: `Khối ${value} ở khay`, exact: true }).click();
      await page.getByRole('button', { name: `Đặt khối vào ô ${index + 1}` }).click();
    }
    await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
    await expect(page.locator('.victory-screen')).toHaveCount(0);
    // Placement alone is insufficient; the links must be built too.
    await page.getByRole('button', { name: 'Lắp xong · Bắt đầu duyệt' }).click();
    await expect(page.getByRole('button', { name: 'Cầm heo nhỏ' })).toHaveCount(0);
    for (let index = 0; index < values.length - 1; index++) {
      await page.getByRole('button', { name: `Đinh của khối ${values[index]}`, exact: true }).click();
      await page.getByRole('button', { name: `Lỗ của khối ${values[index + 1]}`, exact: true }).click();
    }
    await page.getByRole('button', { name: `Đinh của khối ${values[values.length - 1]}`, exact: true }).dragTo(page.getByRole('button', { name: 'Lỗ NULL', exact: true }));
    await expect(page.locator('.journey-nail[data-null-docked="true"]')).toHaveCount(1);
    await page.getByRole('button', { name: 'Lắp xong · Bắt đầu duyệt' }).click();
    await page.getByRole('button', { name: 'Cầm heo nhỏ' }).dragTo(page.getByRole('button', { name: `Khối ${values[0]} ở hàng lắp`, exact: true }));
    await expect(page.locator('.journey-current')).toContainText(String(values[0]));
    if (lesson === 'Traversal') {
      for (const value of values) await page.getByRole('button', { name: 'Đi theo next', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'Đi theo next', exact: true }).click();
      if (lesson === 'Search') await page.getByRole('button', { name: 'Đã tìm thấy', exact: true }).click();
      if (lesson === 'Insertion') {
        await page.getByRole('button', { name: 'Chèn tại đây' }).click();
        await page.getByRole('button', { name: 'Khối 5 ở khay', exact: true }).dragTo(page.getByRole('button', { name: 'Chèn vào vị trí 2', exact: true }));
        await expect(page.getByRole('button', { name: 'Đinh của khối 3', exact: true })).toBeEnabled();
        await expect(page.getByRole('button', { name: 'Đinh của khối 5', exact: true })).toBeEnabled();
        await page.getByRole('button', { name: 'Đinh của khối 3', exact: true }).click();
        await expect(page.locator('.journey-slot').nth(1).locator('[data-wire-source]')).toHaveAttribute('data-wire-target', 'null');
        await page.getByRole('button', { name: 'Đinh của khối 5', exact: true }).dragTo(page.getByRole('button', { name: 'Lỗ của khối 6', exact: true }));
        await expect(page.locator('.journey-slot').nth(2).locator('[data-wire-source]')).toHaveAttribute('data-wire-target', '6');
        // Detach the newly connected wire again, then reconnect it.
        await page.getByRole('button', { name: 'Đinh của khối 5', exact: true }).click();
        await expect(page.locator('.journey-slot').nth(2).locator('[data-wire-source]')).toHaveAttribute('data-wire-target', 'null');
        await page.getByRole('button', { name: 'Lỗ của khối 6', exact: true }).click();
        await page.getByRole('button', { name: 'Đinh của khối 3', exact: true }).dragTo(page.getByRole('button', { name: 'Lỗ của khối 5', exact: true }));
      }
      if (lesson === 'Deletion') {
        await expect(page.getByRole('button', { name: 'Xóa nút này' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Đinh của khối 3', exact: true })).toBeEnabled();
        await page.getByRole('button', { name: 'Khối 3 ở hàng lắp', exact: true }).click();
        await page.getByRole('button', { name: 'Khối 3 ở hàng lắp', exact: true }).dragTo(page.locator('[data-journey-bank]'));
        await expect(page.getByRole('button', { name: 'Khối 3 ở hàng lắp', exact: true })).toBeVisible();
        await expect(page.locator('.linked-play-feedback')).toContainText('Khối vẫn còn dây nối');
        await page.getByRole('button', { name: 'Đinh của khối 3', exact: true }).click();
        await page.getByRole('button', { name: 'Đinh của khối 8', exact: true }).dragTo(page.getByRole('button', { name: 'Lỗ của khối 6', exact: true }));
        await expect(page.getByRole('button', { name: 'Đưa nút 3 về khay' })).toHaveCount(0);
        await page.getByRole('button', { name: 'Khối 3 ở hàng lắp', exact: true }).dragTo(page.locator('[data-journey-bank]'));
        await expect(page.getByRole('button', { name: 'Khối 3 ở khay', exact: true })).toBeVisible();
      }
    }
    await expect(page.locator('.victory-screen')).toHaveCount(0);
    if (lesson === 'Insertion') {
      await page.getByRole('button', { name: 'Đinh của khối 5', exact: true }).click();
      await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
      await expect(page.locator('.victory-screen')).toHaveCount(0);
      await expect(page.locator('.linked-play-feedback')).toContainText('Chưa hoàn thành');
      await page.getByRole('button', { name: 'Đinh của khối 5', exact: true }).dragTo(page.getByRole('button', { name: 'Lỗ của khối 6', exact: true }));
    }
    await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
    await expect(page.locator('.victory-screen')).toBeVisible();
  });
}

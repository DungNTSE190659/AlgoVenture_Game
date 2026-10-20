import { test, expect } from '@playwright/test';
import { LINEAR_STRUCTURES } from '../src/engine/learningTrack';

for (const [index, lesson] of LINEAR_STRUCTURES.entries()) {
  test(`${lesson.name}: Next moves a block between the bank and assembly`, async ({ page }) => {
    await page.goto('/');
    await page.locator('.topic-dots button').nth(1).click();
    await page.locator('.atlas-enter').click();
    await page.getByRole('button', { name: lesson.name, exact: true }).click();
    await page.locator('.sheet-demo').click();
    const next = page.getByRole('button', { name: 'Bước tiếp', exact: true });
    // Reversal first detaches the four nails, then selects the first block.
    const beforeMove = index === 0 ? 0 : index === 5 ? 5 : 1;
    for (let step = 0; step < beforeMove; step++) await next.click();
    await next.click();
    const moving = page.locator('[data-linked-demo-motion^="node-"]').first();
    await expect(moving).toHaveCount(1);
    const movingId = (await moving.getAttribute('data-linked-demo-motion'))!.slice(5);
    const wire = page.locator(`[data-demo-wire="${movingId}"]`);
    const nail = page.locator(`.linked-world [data-demo-nail="${movingId}"]`);
    if (await wire.count()) await expect(wire).toHaveCSS('visibility', 'hidden');
    if (await nail.count()) await expect(nail).toHaveCSS('visibility', 'hidden');
    const start = await moving.boundingBox();
    await page.waitForTimeout(180);
    const middle = await moving.boundingBox();
    expect(Math.hypot(middle!.x - start!.x, middle!.y - start!.y)).toBeGreaterThan(5);
    await expect(page.locator('[data-linked-demo-motion]')).toHaveCount(0);
    if (await wire.count()) await expect(wire).toHaveCSS('visibility', 'visible');
    if (await nail.count()) await expect(nail).toHaveCSS('visibility', 'visible');
    await expect(page.locator('.linked-demo .linked-node-body[style*="hidden"]')).toHaveCount(0);
    // Rapid forward/back navigation must clean up every temporary flight.
    await next.click();
    await page.getByRole('button', { name: 'Bước trước', exact: true }).click();
    await expect(page.locator('[data-linked-demo-motion]')).toHaveCount(0);
  });
}

test('Traversal animates wire endpoints and the pig; autoplay uses the same movement', async ({ page }) => {
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', { name: 'Linked List Traversal', exact: true }).click();
  await page.locator('.sheet-demo').click();
  const next = page.getByRole('button', { name: 'Bước tiếp', exact: true });
  // Four blocks (8 actions), select nail, connect it.
  for (let step = 0; step < 10; step++) await next.click();
  await expect(page.locator('[data-linked-demo-motion^="nail-"]').first()).toBeAttached();
  await expect.poll(() => page.locator('.journey-wires path').first().evaluate(path => path.getAnimations().length)).toBeGreaterThan(0);
  // Finish building (16 actions), ready, pick up pig, place on HEAD.
  for (let step = 10; step < 19; step++) await next.click();
  await expect(page.locator('[data-linked-demo-motion="pig"]')).toHaveCount(1);
  await expect(page.locator('[data-linked-demo-motion]')).toHaveCount(0);
  await page.getByRole('button', { name: /Tốc độ demo/ }).click();
  await page.getByRole('button', { name: /Tốc độ demo/ }).click();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.locator('[data-linked-demo-motion="pig"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
  const paused = page.locator('[data-linked-demo-motion="pig"]');
  await expect(paused).toHaveCount(1);
  await expect.poll(() => paused.evaluate(el => el.getAnimations().every(animation => animation.playState === 'paused'))).toBe(true);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const position = await paused.boundingBox();
  await page.waitForTimeout(150);
  const held = await paused.boundingBox();
  expect(Math.abs(held!.y - position!.y)).toBeLessThan(1);
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.locator('[data-linked-demo-motion]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Về bản đồ', exact: true }).click();
  await expect(page.locator('[data-linked-demo-motion]')).toHaveCount(0);
});

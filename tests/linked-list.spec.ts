import { expect, test } from "@playwright/test";
import { LINEAR_STRUCTURES } from "../src/engine/learningTrack";

test('all six Linked List stops open for a new player', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await expect(page.locator('.track-stop')).toHaveCount(6);
  await expect(page.locator('.stop-locked')).toHaveCount(0);
  await page.getByRole('button', {name: 'Linked List Reversal', exact: true}).click();
  await expect(page.locator('.sheet-demo')).toBeEnabled();
  await expect(page.locator('.sheet-challenge')).toBeEnabled();
  await page.locator('.sheet-challenge').click();
  await expect(page.getByRole('heading', {name: 'Đảo 4 nút'})).toBeVisible();
});

for (const [index, lesson] of LINEAR_STRUCTURES.entries()) {
  test(`${lesson.name} has Demo and challenge`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate(progress => localStorage.setItem("algoventure.world-progress.v3", JSON.stringify(progress)), Object.fromEntries(LINEAR_STRUCTURES.slice(0,index).map(item => [item.id,true])));
    await page.reload();
    await page.locator('.topic-dots button').nth(1).click();
    await page.locator('.atlas-enter').click();
    await expect(page.locator('.track-stop')).toHaveCount(6);
    await expect(page.locator('.linked-level-picker')).toHaveCount(0);
    await page.locator('.sheet-demo').click();
    await expect(page.locator('.linked-demo-player')).toBeVisible();
    await expect(page.locator('.linked-panel')).toHaveCount(2);
    await expect(page.locator('.linked-algorithm-slot, .linked-slot')).toHaveCount([4,4,4,3,3,4][index]);
    const count = Number((await page.locator('.linked-demo-player').innerText()).match(/Bước 1\/(\d+)/)![1]);
    await expect(page.locator('.linked-question-card')).toHaveCount(0);
    for (let frame = 1; frame < count; frame++) {
      await page.locator('.linked-demo-player .round-button').last().click();
      await expect(page.locator('.linked-demo-player')).toContainText(`${frame + 1}/${count}`);

    }
    await page.locator('.linked-demo-player .button-green').click();
    await expect(page.locator('.linked-demo-player')).toHaveCount(0);
    await expect(page.locator(index === 0 ? '.linked-board' : '.linked-action-guide')).toBeVisible();
  });
}

test('four block construction fits phone and connects by tapping', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.locator('.sheet-challenge').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const bank = page.locator('.linked-bank .linked-node-body');
  await expect(bank).toHaveCount(4);
  for (const [value,index] of [[7,0],[2,1],[9,2],[4,3]]) {
    await page.locator('.linked-bank .linked-node-body').filter({hasText:String(value)}).click();
    await page.locator(`[data-linked-slot="${index}"]`).click();
  }
  const order = ['a','b','c','d'];
  for (let index=0;index<3;index++) {
    await page.locator('.linked-nail').nth(index).click();
    await page.locator(`.ll-hole[data-node="${order[index+1]}"]`).click();
  }
  await expect(page.locator('.linked-intro')).toContainText('7 → 2 → 9 → 4');
  await page.getByRole('button', {name: 'Kiểm tra', exact: true}).click();
  await expect(page.locator('.victory-screen')).toHaveCount(0);
  await page.getByRole('button', {name: 'Đinh của khối 4 đang rời', exact: true}).dragTo(page.getByRole('button', {name: 'Lỗ NULL', exact: true}));
  await expect(page.getByRole('button', {name: 'Đinh của khối 4 đang cắm vào NULL', exact: true})).toBeVisible();
  await expect(page.locator('.victory-screen')).toHaveCount(0);
  await page.getByRole('button', {name: 'Kiểm tra', exact: true}).click();
  await expect(page.locator('.victory-screen')).toBeVisible();
});

test('Traversal keeps the Construction layout on a phone', async ({ page }) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('algoventure.world-progress.v3', JSON.stringify({'linked-list': true})));
  await page.reload();
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.locator('.sheet-demo').click();
  await expect(page.locator('.linked-panel')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.locator('.linked-demo-player .round-button').last().click();
  await expect(page.locator('.linked-bank .node-selected')).toHaveCount(1);
  await page.locator('.linked-demo-player .round-button').last().click();
  await expect(page.locator('.journey-slot').first()).toContainText('5');
});

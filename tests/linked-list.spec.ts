import { expect, test } from "@playwright/test";
import { LINEAR_STRUCTURES } from "../src/engine/learningTrack";
import { LINKED_DEMOS } from "../src/engine/linkedDemo";
import { LINKED_ACTIONS } from "../src/engine/linkedActions";

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
    const count = index === 0 ? 8 : LINKED_DEMOS[lesson.id as keyof typeof LINKED_DEMOS].length;
    await expect(page.locator('.linked-question-card')).toHaveCount(0);
    for (let frame = 1; frame < count; frame++) {
      await page.locator('.linked-demo-player .round-button').last().click();
      await expect(page.locator('.linked-demo-player')).toContainText(`${frame + 1}/${count}`);
      if (index > 0) {
        await expect(page.locator('.linked-demo-buta')).toContainText(LINKED_DEMOS[lesson.id as keyof typeof LINKED_DEMOS][frame].note);
      }
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
  await expect(page.locator('.victory-screen')).toBeVisible();
});

test('Linked List challenges use node, cursor and nail gestures', async ({ page }) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const lesson of LINEAR_STRUCTURES.slice(1)) {
    await page.goto('/');
    await page.locator('.topic-dots button').nth(1).click();
    await page.locator('.atlas-enter').click();
    await page.getByRole('button', {name: lesson.name, exact: true}).click();
    await page.locator('.sheet-challenge').click();
    await expect(page.locator('.linked-question-card')).toHaveCount(0);
    for (const action of LINKED_ACTIONS[lesson.id as keyof typeof LINKED_ACTIONS]) {
      const source = action.kind === 'nail' ? page.getByRole('button', {name: `Đinh của khối ${action.from}`})
        : action.kind === 'node' && action.from === 3 ? page.getByRole('button', {name: 'Khối 3 ở hàng lắp'})
        : action.kind === 'node' ? page.locator('.linked-bank-new') : page.locator('.linked-drag-token');
      const target = typeof action.to === 'number' ? action.kind === 'nail'
        ? page.getByRole('button', {name: `Lỗ của khối ${action.to}`}) : page.locator(`.linked-node-body[data-linked-target="${action.to}"]`)
        : page.locator(`[data-linked-target="${action.to}"]`).first();
      await source.click();
      await target.click();
    }
    await expect(page.locator('.victory-screen')).toBeVisible();
  }
});

test('mouse can drag a cursor and plug a nail', async ({ page }) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', {name: 'Linked List Traversal', exact: true}).click();
  await page.locator('.sheet-challenge').click();
  await page.locator('.linked-drag-token').dragTo(page.locator('.linked-node-body[data-linked-target="0"]'));
  await expect(page.locator('.linked-action-guide')).toContainText('Current đang ở nút 5');
  await page.getByRole('button', {name: 'Về bản đồ'}).click();
  await page.getByRole('button', {name: 'Linked List Insertion', exact: true}).click();
  await page.locator('.sheet-challenge').click();
  await page.locator('.linked-bank-new').dragTo(page.locator('.linked-insert-target'));
  await page.getByRole('button', {name: 'Đinh của khối 5'}).dragTo(page.getByRole('button', {name: 'Lỗ của khối 6'}));
  await expect(page.locator('.linked-action-guide')).toContainText('Đã nối 5');
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
  await expect(page.locator('.linked-algorithm-slot').first().locator('.demo-node-active')).toHaveCount(1);
  await page.locator('.linked-demo-player .round-button').last().click();
  await expect(page.locator('.linked-algorithm-slot').first().locator('.demo-link-active')).toHaveCount(1);
});

import { expect, test } from '@playwright/test';
import { LINEAR_STRUCTURES } from '../src/engine/learningTrack';

for (const lesson of LINEAR_STRUCTURES) test(`${lesson.id} Demo keeps every frame in the shared sidebar layout`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', { name: lesson.name, exact: true }).click();
  await page.locator('.sheet-demo').click();
  const frames = Number(await page.locator('.linked-demo-step-status progress').getAttribute('max'));
  for (let frame = 0; frame <= frames; frame++) {
    for (const size of [{ width: 1366, height: 768 }, { width: 1280, height: 600 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(size);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const layout = await page.evaluate(() => {
        const root = document.querySelector('.linked-world')!;
        const board = document.querySelector('.linked-assembly')!.getBoundingClientRect();
        const bank = document.querySelector('.linked-bank')!.getBoundingClientRect();
        const guide = document.querySelector('.linked-demo-dialogue')!;
        const bad = [...document.querySelectorAll('.linked-slot, .linked-null-target, .linked-bank .linked-node-body, .linked-demo-dialogue p, .linked-demo-controls button')].filter(el => {
          const b = el.getBoundingClientRect(); return b.x < 0 || b.y < 0 || b.right > innerWidth + 1 || b.bottom > innerHeight + 1;
        }).map(el => el.className);
        return { extra: root.scrollHeight - root.clientHeight, left: board.right < bank.left, guideOverflow: guide.scrollHeight - guide.clientHeight, bad };
      });
      expect(layout, `${lesson.id} frame ${frame}, ${size.width}x${size.height}`).toEqual({ extra: 0, left: true, guideOverflow: 0, bad: [] });
      if (size.width <= 700) {
        const play = (await page.locator('.linked-demo-playback .chunky-button').boundingBox())!;
        expect(Math.abs(play.x + play.width / 2 - size.width / 2)).toBeLessThan(2);
      }
      if (frame === 4 && [1366, 390].includes(size.width)) await page.screenshot({ path: `.qa/${lesson.id}-demo-sidebar-${size.width}.png` });
    }
    if (frame < frames) await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Tự mình thử', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xem lại từ đầu', exact: true }).click();
  await expect(page.locator('.linked-demo-step-status')).toContainText('1 /');
});

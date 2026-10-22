import { expect, test, type Locator } from '@playwright/test';

const skin = (button: Locator) => button.evaluate(el => getComputedStyle(el, '::before').borderImageSource);

async function openReversal(page: import('@playwright/test').Page, mode: 'challenge' | 'demo' = 'challenge') {
  await page.goto('/');
  await page.locator('.topic-dots button').nth(1).click();
  await page.locator('.atlas-enter').click();
  await page.getByRole('button', { name: 'Linked List Reversal', exact: true }).click();
  await page.locator(`.sheet-${mode}`).click();
}

test('check and hint keep sprite skins when hovered, pressed and keyboard focused', async ({ page }) => {
  await openReversal(page);
  for (const [label, asset] of [['Kiểm tra', 'btn-check-mint'], ['Buta gợi ý', 'btn-hint-yellow']]) {
    const button = page.getByRole('button', { name: label, exact: true });
    await page.mouse.move(0, 0);
    await expect.poll(() => skin(button)).toMatch(new RegExp(`/${asset}\\.svg`));
    await button.hover();
    await expect.poll(() => skin(button)).toMatch(new RegExp(`/${asset}-hover\\.svg`));
    await page.mouse.down();
    await expect.poll(() => skin(button)).toMatch(new RegExp(`/${asset}-pressed\\.svg`));
    await expect(button).toHaveCSS('box-shadow', 'none');
    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await button.focus();
    await expect(button).toBeFocused();
    await expect.poll(() => skin(button)).toMatch(new RegExp(`/${asset}\\.svg`));
  }
  for (const size of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await expect.poll(() => page.locator('.linked-landscape-asset').evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    await expect(page.locator('.linked-assembly')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const missing = await page.locator('.linked-world img').evaluateAll(elements => elements.filter(el => !(el as HTMLImageElement).complete || !(el as HTMLImageElement).naturalWidth).map(el => (el as HTMLImageElement).src));
    expect(missing).toEqual([]);
    await page.screenshot({ path: `.qa/linked-portable-assets-${size.width}.png` });
  }
});

test('demo and settings use the shared background and state sprites', async ({ page }) => {
  await openReversal(page, 'demo');
  const back = page.getByRole('button', { name: 'Bước trước', exact: true });
  await expect(back).toBeDisabled();
  await expect.poll(() => skin(back)).toMatch(/btn-icon-squircle-disabled\.svg/);
  await expect.poll(() => page.locator('.linked-landscape-asset').evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', { name: 'Tùy chọn', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const audio = page.getByRole('button', { name: /Âm thanh:/ });
  await audio.hover();
  await expect.poll(() => skin(audio)).toMatch(/btn-action-green-hover\.svg/);
  await page.getByRole('button', { name: 'Đóng tùy chọn', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});


test('try button keeps a sliced sprite at rest and through hover and press', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openReversal(page, 'demo');
  const button = page.locator('.linked-demo-try');
  for (const width of [1366, 1024]) {
    await page.setViewportSize({ width, height: 768 });
    await page.mouse.move(0, 0);
    await expect(button).toBeVisible();
    const resting = await button.boundingBox();
    await expect.poll(() => skin(button)).toMatch(/btn-icon-squircle\.svg/);
    await expect(button).toHaveCSS('background-image', 'none');
    const slicing = await button.evaluate(el => {
      const s = getComputedStyle(el, '::before');
      return { slice: s.borderImageSlice, widths: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth] };
    });
    expect(slicing).toEqual({ slice: '20 fill', widths: ['18px', '18px', '18px', '18px'] });
    await button.screenshot({ path: `.qa/linked-try-normal-${width}.png` });
    await button.hover();
    await expect.poll(() => skin(button)).toMatch(/btn-icon-squircle-hover\.svg/);
    expect(await button.boundingBox()).toEqual(resting);
    await button.screenshot({ path: `.qa/linked-try-hover-${width}.png` });
    await page.mouse.down();
    await expect.poll(() => skin(button)).toMatch(/btn-icon-squircle-pressed\.svg/);
    expect(await button.boundingBox()).toEqual(resting);
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }
  await button.click();
  await expect(page.locator('.linked-world.linked-demo')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Kiểm tra', exact: true })).toBeVisible();
});

test('mobile assembly has vertical room and Buta speaks inside a sprite panel', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openReversal(page, 'demo');
  for (const size of [{ width: 390, height: 844 }, { width: 375, height: 667 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(size);
    const slot = (await page.locator('.linked-slot').first().boundingBox())!;
    const block = (await page.locator('.linked-node-body').first().boundingBox())!;
    expect(slot.height - block.height).toBeGreaterThanOrEqual(size.height > 600 ? 28 : 8);
    expect(block.y - slot.y).toBeGreaterThan(0);
    expect(slot.y + slot.height - block.y - block.height).toBeGreaterThan(0);
    const pig = (await page.locator('.linked-demo-dialogue > .pig').boundingBox())!;
    expect(pig.width).toBeGreaterThanOrEqual(72);
    const speech = page.locator('.linked-demo-dialogue .linked-speech');
    await expect.poll(() => skin(speech)).toMatch(/panel-speech\.svg/);
    expect(await speech.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
    await expect(page.locator('.linked-demo-dialogue p')).not.toBeEmpty();
    await expect.poll(() => page.locator('.linked-demo-dialogue .pig-still').evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: `.qa/linked-roomy-speech-${size.width}.png` });
  }
});

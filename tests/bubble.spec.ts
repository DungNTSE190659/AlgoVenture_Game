import { enterTrack } from "./track-navigation";
import { test, expect, type Page } from "@playwright/test";

async function enter(page: Page, mode = "Play") {
  await enterTrack(page, "Bubble Sort", mode);
  await expect(page.locator(".bubble-world")).toBeVisible();
}
async function custom(page: Page, values: string) {
  if (await page.locator(".victory-screen[open]").count())
    await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill(values);
  await page
    .getByRole("button", { name: "Dùng mảng này", exact: true })
    .click();
}

async function values(page: Page) {
  return page.locator('.bubble-tile').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('data-value'))));
}

test("Buta stands in the scene and replays the same brief praise when clicked", async ({ page }) => {
  page.setDefaultTimeout(6000);
  await enter(page);
  await custom(page, '3, 1, 2');
  const buta = page.getByRole('button', { name: 'Buta: nghe lại lời khen', exact: true });
  const recap = page.locator('.bubble-recap');
  await expect(buta.locator('.pig')).toBeVisible();
  expect(await buta.evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await expect(page.getByText('Bước vừa làm', { exact: true })).toHaveCount(0);
  await buta.click();
  await expect(recap).toHaveCount(0);
  await page.locator('[data-bubble-id="1"]').focus();
  await page.keyboard.press('ArrowLeft');
  const praise = 'Bạn đã đổi 3 và 1 thành 1, 3. Cặp này đúng rồi!';
  await expect(recap).toHaveText(praise);
  await expect(page.locator('.bubble-hint')).toHaveCount(0);
  for (const [width, height] of [[390, 844], [320, 568], [1280, 720]]) {
    await page.setViewportSize({ width, height });
    await buta.click();
    await expect(recap).toHaveText(praise);
    const bounds = await page.locator('.bubble-companion').boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `.qa/bubble-buta-praise-${width}.png`, fullPage: true });
  }
  await expect(recap).toHaveCount(0, { timeout: 4500 });
  await expect(buta).toBeVisible();
  await buta.click();
  await expect(recap).toHaveText(praise);
  expect(await values(page)).toEqual([1, 3, 2]);
  await page.getByRole('button', { name: 'Kết thúc thuật toán', exact: true }).click();
  await expect(recap).toHaveCount(0);
  await buta.click();
  await expect(recap).toHaveText(praise);
  await page.locator('[data-bubble-id="0"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(recap).toContainText('Bạn đã đổi 3 và 2 thành 2, 3.');
  await page.getByRole('button', { name: 'Buta gợi ý', exact: true }).click();
  await expect(recap).toHaveCount(0);
  await expect(page.locator('.bubble-hint')).toBeVisible();
  await buta.click();
  await expect(page.locator('.bubble-hint')).toHaveCount(0);
  await expect(recap).toContainText('đổi 3 và 2 thành 2, 3');
  await page.getByRole('button', { name: 'Kết thúc thuật toán', exact: true }).click();
  await page.getByRole('button', { name: 'Chơi lại', exact: true }).click();
  await buta.click();
  await expect(recap).toHaveCount(0);
});

test("ordered pairs skip silently while accuracy counts only player actions", async ({ page }) => {
  await enter(page);
  await custom(page, '1, 3, 2, 4');
  await expect(page.getByRole('button', { name: /Giữ nguyên/ })).toHaveCount(0);
  await expect(page.locator('.bubble-topline,.bubble-star-meter,.bubble-pair-window,.bubble-tile.is-active')).toHaveCount(0);
  // The first ordered pair is skipped, but swapping it is still a mistake.
  await page.locator('[data-bubble-id="0"]').focus();
  await page.keyboard.press('ArrowRight');
  expect(await values(page)).toEqual([1, 3, 2, 4]);
  await expect(page.getByRole('status')).toContainText('Chưa đúng bước');
  await page.getByRole('button', { name: 'Buta gợi ý', exact: true }).click();
  await expect(page.locator('.bubble-hint')).toContainText('ô 2 và 3');
  await page.locator('[data-bubble-id="2"]').focus();
  await page.keyboard.press('ArrowLeft');
  expect(await values(page)).toEqual([1, 2, 3, 4]);
  await expect(page.locator('.bubble-victory')).toHaveCount(0);
  await page.getByRole('button', { name: 'Kết thúc thuật toán', exact: true }).click();
  await expect(page.locator('.bubble-victory .victory-stars')).toHaveAttribute('aria-label', '2 trên 3 sao');
  const summary = page.locator('.bubble-victory .bubble-result-summary');
  await expect(summary).toContainText('50%');
  await expect(summary).toContainText('Bước đã thực hiện2');
  await expect(summary).toContainText('Cặp đã so sánh5');
  await expect(summary).toContainText('Lượt so sánh2');
  await page.getByRole('button', { name: 'Chơi lại', exact: true }).click();
  expect(await values(page)).toEqual([1, 3, 2, 4]);
});

for (const touch of [false, true]) test(`all bubbles accept drag attempts; wrong pair and jumps count as mistakes (${touch ? 'touch' : 'mouse'})`, async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enter(page);
  await custom(page, '4, 1, 2');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const cdp = touch ? await context.newCDPSession(page) : null;
  async function drag(id: number, target: number | 'outside') {
    const from = (await page.locator(`[data-bubble-id="${id}"]`).boundingBox())!;
    const to = target === 'outside' ? { x: 10, y: 5, width: 0, height: 0 } : (await page.locator(`[data-index="${target}"]`).boundingBox())!;
    const x = from.x + from.width / 2, y = from.y + from.height / 2;
    const endX = to.x + to.width / 2, endY = to.y + to.height / 2;
    if (cdp) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: endX, y: endY, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(x, y); await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 8 }); await page.mouse.up();
    }
  }
  await drag(0, 'outside');
  await drag(2, 1);
  expect(await values(page)).toEqual([4, 1, 2]);
  await drag(0, 2);
  expect(await values(page)).toEqual([4, 1, 2]);
  await drag(1, 0);
  expect(await values(page)).toEqual([1, 4, 2]);
  await drag(0, 2);
  expect(await values(page)).toEqual([1, 2, 4]);
  await page.getByRole('button', { name: 'Kết thúc thuật toán', exact: true }).click();
  await expect(page.locator('.bubble-victory')).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test("five mistakes end the round and the result uses accuracy, with replay or demo", async ({ page }) => {
  await enter(page);
  await custom(page, '3, 1, 2');
  const keep = page.getByRole('button', { name: 'Kết thúc thuật toán', exact: true });
  for (let mistake = 1; mistake <= 4; mistake++) {
    await keep.click();
    await expect(keep).toBeEnabled();
    await expect(page.locator('.bubble-failure')).toHaveCount(0);
  }
  // A successful step contributes to accuracy while the five-error limit stays in force.
  await page.locator('[data-bubble-id="1"]').focus();
  await page.keyboard.press('ArrowLeft');
  expect(await values(page)).toEqual([1, 3, 2]);
  await keep.click();
  const failure = page.getByRole('dialog', { name: 'Hết lượt thử rồi!' });
  await expect(failure).toBeVisible();
  await expect(failure.getByRole('img', { name: '1 trên 3 sao' })).toBeVisible();
  await expect(failure).toContainText('xem lại Demo');
  await expect(failure.locator('.bubble-result-summary')).toContainText('16,7%');
  await expect(page.locator('.bubble-tile:enabled')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('algoventure.world-progress.v3') || '{}').bubble)).not.toBe(true);
  await failure.getByRole('button', { name: 'Chơi lại', exact: true }).click();
  expect(await values(page)).toEqual([3, 1, 2]);
  for (let i = 0; i < 5; i++) await keep.click();
  await expect(failure.getByRole('img', { name: '0 trên 3 sao' })).toBeVisible();
  await expect(failure.locator('.bubble-result-summary')).toContainText('0%');
  await failure.getByRole('button', { name: 'Xem lại Demo', exact: true }).click();
  await expect(page.locator('.bubble-demo')).toBeVisible();
  expect(await values(page)).toEqual([3, 1, 2]);
  await page.getByRole('button', { name: 'Về bản đồ', exact: true }).click();
  await page.getByRole('button', { name: 'Thử thách', exact: true }).click();
});

test("demo explains swap, equality and early exit; controls and custom array persist into play", async ({
  page,
}) => {
  await enter(page, "Demo");
  await custom(page, "2, 1, 1");
  const speed = page.getByRole("button", { name: /^Tốc độ demo:/ });
  await speed.click();
  await speed.click();
  await expect(speed).toHaveText("2x");
  await page.getByRole("button", { name: "Bắt đầu", exact: true }).click();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const progress = await page.locator(".bubble-step-status>span").textContent();
  await page.waitForTimeout(1800);
  expect(await page.locator(".bubble-step-status>span").textContent()).toBe(
    progress,
  );
  const titles: string[] = [];
  while (
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).count()
  ) {
    titles.push((await page.locator(".bubble-content h2").textContent())!);
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  }
  expect(titles).toContain("Hai số bằng nhau");
  await expect(page.locator(".bubble-dialogue")).toContainText(
    "không có lần đổi chỗ nào",
  );
  await page.getByRole("button", { name: "Tự mình thử", exact: true }).click();
  await expect(page.locator(".bubble-play")).toBeVisible();
  expect(
    await page
      .locator(".bubble-tile")
      .evaluateAll((nodes) =>
        nodes.map((n) => Number(n.getAttribute("data-value"))),
      ),
  ).toEqual([2, 1, 1]);
});
test("eight bubbles and dialogue fit laptop and phone widths; settings reject malformed input", async ({
  page,
}) => {
  await enter(page, "Demo");
  await custom(page, "-99, 0, 8, 3, 3, 4, -5, 99");
  for (const [width, height] of [
    [1440, 900],
    [1280, 720],
    [390, 844],
    [320, 568],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    const boxes = await page.locator(".bubble-tile").evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return { left: r.left, right: r.right };
      }),
    );
    expect(boxes.every((r) => r.left >= 0 && r.right <= width)).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `.qa/bubble-demo-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("2, 1.5, 4");
  await page
    .getByRole("button", { name: "Dùng mảng này", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("số nguyên");
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
  await page.getByRole("button", { name: "Thử thách", exact: true }).click();
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 568],
  ]) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const blocks = await page.locator(".bubble-tile").evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { left: r.left, right: r.right };
      }),
    );
    expect(blocks.every((box) => box.left >= 0 && box.right <= width)).toBe(
      true,
    );
    await page.screenshot({
      path: `.qa/bubble-relay-${width}.png`,
      fullPage: true,
    });
  }
});

test("demo pauses the actual swap animation and does not replay finished moves after settings", async ({
  page,
}) => {
  await enter(page, "Demo");
  for (let step = 0; step < 3; step++)
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".bubble-content h2")).toHaveText("Đổi chỗ hai số");
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  const tile = page.locator('[data-bubble-id="0"]');
  const time = await tile.evaluate((node) =>
    Number(node.getAnimations()[0]?.currentTime),
  );
  expect(time).toBeGreaterThanOrEqual(0);
  await page.waitForTimeout(200);
  expect(
    await tile.evaluate((node) => Number(node.getAnimations()[0]?.currentTime)),
  ).toBe(time);
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect
    .poll(() =>
      tile.evaluate(
        (node) => Number(node.getAnimations()[0]?.currentTime) || 1350,
      ),
    )
    .toBeGreaterThan(time);
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  expect(
    await tile.evaluate(
      (node) =>
        node
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
    ),
  ).toBe(0);
});

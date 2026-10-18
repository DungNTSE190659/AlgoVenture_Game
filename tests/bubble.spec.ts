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
async function push(page: Page, side: 0 | 1) {
  const blocks = page.locator('.bubble-tile[data-active="true"]');
  await expect(blocks.nth(side)).toBeEnabled();
  const a = (await blocks.nth(0).boundingBox())!,
    b = (await blocks.nth(1).boundingBox())!;
  const box = side === 0 ? a : b;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const goal =
    side === 0
      ? b.x + b.width / 2 + 2
      : Math.min(page.viewportSize()!.width - 10, x + (b.x - a.x) * 0.75);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(goal, y, { steps: 10 });
  await page.mouse.up();
}
async function solve(page: Page) {
  for (let step = 0; step < 45; step++) {
    if (await page.locator(".bubble-victory").count()) return;
    const next = page.getByRole("button", {
      name: "Lượt tiếp theo",
      exact: true,
    });
    if (await next.count()) {
      await next.click();
      continue;
    }
    const blocks = page.locator('.bubble-tile[data-active="true"]');
    await expect(blocks.first()).toBeEnabled();
    const pair = await blocks.evaluateAll((nodes) =>
      nodes.map((n) => Number(n.getAttribute("data-value"))),
    );
    await push(page, pair[0] > pair[1] ? 0 : 1);
    await expect(page.locator(".bubble-play")).toHaveAttribute(
      "data-busy",
      "false",
    );
  }
  throw new Error("Bubble game did not finish");
}
test("relay play rejects the smaller carrier and sorts through adjacent passes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  await custom(page, "4, 1, 3, 2");
  await push(page, 1);
  await expect(page.getByRole("status")).toContainText(
    "Bong bóng bên trái lớn hơn",
  );
  await expect(page.locator(".bubble-topline")).toContainText("0 lần so sánh");
  await solve(page);
  expect(
    await page
      .locator(".bubble-tile")
      .evaluateAll((nodes) =>
        nodes.map((n) => Number(n.getAttribute("data-value"))),
      ),
  ).toEqual([1, 2, 3, 4]);
  await expect(page.locator(".bubble-topline")).toContainText("6 lần so sánh");
  await page
    .getByRole("button", { name: "Đi tiếp cùng Buta", exact: true })
    .click();
  await expect(page.locator('.track-stop.stop-complete')).toHaveCount(1);
  await expect(page.locator('#track-sheet-title')).toHaveText('Selection Sort');
  await expect(page.getByRole('button', { name: 'Thử thách', exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});

test("visible keep action advances ordered pairs once and rejects an inverted pair", async ({
  page,
}) => {
  await enter(page);
  await custom(page, "3, 6, 2");
  const keep = page.getByRole("button", { name: "Giữ nguyên", exact: true });
  await expect(keep).toBeVisible();
  await keep.dblclick();
  await expect(page.locator(".bubble-topline")).toContainText("1 lần so sánh");
  await expect(keep).toBeEnabled();
  expect(
    await page
      .locator('.bubble-tile[data-active="true"]')
      .evaluateAll((nodes) =>
        nodes.map((node) => Number(node.getAttribute("data-value"))),
      ),
  ).toEqual([6, 2]);
  await keep.click();
  await expect(page.getByRole("status")).toContainText(
    "Bong bóng bên trái lớn hơn",
  );
  await expect(page.locator(".bubble-topline")).toContainText("1 lần so sánh");
  await push(page, 0);
  await page
    .getByRole("button", { name: "Lượt tiếp theo", exact: true })
    .click();
  await push(page, 0);
  await expect(page.locator(".bubble-victory")).toBeVisible();
});

test("keep is discoverable for equal values and works by touch and keyboard at the end of a pass", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await enter(page);
  await custom(page, "2, 2, 3");
  const keep = page.getByRole("button", { name: "Giữ nguyên", exact: true });
  await keep.tap();
  await expect(keep).toBeEnabled();
  await expect(page.locator(".bubble-topline")).toContainText("1 lần so sánh");
  await keep.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".bubble-victory")).toBeVisible();
  await expect(page.locator(".bubble-topline")).toContainText("2 lần so sánh");
  await custom(page, "3, 6, 2, 5, 8");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: ".qa/bubble-keep-action.png" });
  await context.close();
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
test("touch relay and keyboard both finish without duplicate comparisons", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await enter(page);
  await custom(page, "2, 1, 3");
  const cdp = await context.newCDPSession(page);
  async function touchPush(side: 0 | 1) {
    const pair = page.locator('.bubble-tile[data-active="true"]');
    await expect(pair.first()).toBeEnabled();
    const a = (await pair.nth(0).boundingBox())!,
      b = (await pair.nth(1).boundingBox())!;
    const box = side === 0 ? a : b,
      x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    const goal =
      side === 0
        ? b.x + b.width / 2 + 2
        : Math.min(380, x + (b.x - a.x) * 0.75);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 1 }],
    });
    for (let i = 1; i <= 8; i++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + ((goal - x) * i) / 8, y, id: 1 }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }
  await touchPush(0);
  await expect(page.locator(".bubble-topline")).toContainText("1 lần so sánh");
  await touchPush(1);
  await page.getByRole("button", { name: "Lượt tiếp theo", exact: true }).tap();
  const right = page.locator('.bubble-tile[data-active="true"]').nth(1);
  await expect(right).toBeEnabled();
  await right.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".bubble-victory")).toBeVisible();
  await expect(page.locator(".bubble-topline")).toContainText("3 lần so sánh");
  await context.close();
});

test("holding a bubble carries it across multiple neighbours and hands off at a larger bubble", async ({
  page,
}) => {
  await enter(page);
  await custom(page, "9, 1, 2, 3, 4");
  let first = (await page.locator('[data-bubble-id="0"]').boundingBox())!,
    last = (await page.locator('[data-bubble-id="4"]').boundingBox())!;
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await page.mouse.down();
  await page.mouse.move(last.x + last.width / 2 + 3, last.y + last.height / 2, {
    steps: 15,
  });
  await expect(
    page.getByRole("button", { name: "Lượt tiếp theo", exact: true }),
  ).toBeVisible();
  await page.mouse.up();
  await expect(page.locator(".bubble-topline")).toContainText("4 lần so sánh");
  await expect(page.locator(".bubble-topline")).toContainText("4 lần đổi chỗ");
  expect(
    await page
      .locator(".bubble-tile")
      .evaluateAll((nodes) =>
        nodes.map((n) => Number(n.getAttribute("data-value"))),
      ),
  ).toEqual([1, 2, 3, 4, 9]);
  await custom(page, "3, 1, 5, 2");
  first = (await page.locator('[data-bubble-id="0"]').boundingBox())!;
  last = (await page.locator('[data-bubble-id="3"]').boundingBox())!;
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await page.mouse.down();
  await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2, {
    steps: 15,
  });
  await expect(page.getByRole("status")).toContainText(
    "Cặp này đã đúng thứ tự",
  );
  await page.mouse.up();
  await expect(page.locator(".bubble-topline")).toContainText("1 lần so sánh");
  await expect(page.locator(".bubble-score")).toHaveText("100");
  await solve(page);
  await expect(page.locator(".bubble-victory")).toBeVisible();
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

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
      : a.x + a.width / 2 - 2;
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
    if (pair[0] > pair[1]) await push(page, 0);
    else await page.getByRole("button", { name: "Giữ nguyên", exact: true }).click();
    await expect(page.locator(".bubble-play")).toHaveAttribute(
      "data-busy",
      "false",
    );
  }
  throw new Error("Bubble game did not finish");
}
test("bridge play accepts the smaller friend dragged left and sorts through adjacent passes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  await custom(page, "4, 1, 3, 2");
  await push(page, 1);
  await expect(page.locator(".bubble-play")).toHaveAttribute("data-busy", "false");
  await expect(page.locator(".bubble-topline")).toContainText("1 lần so sánh");
  await expect(page.locator(".bubble-topline")).toContainText("1 lần đổi chỗ");
  expect(await page.locator(".bubble-overview-item").evaluateAll(nodes =>
    nodes.map(node => Number(node.getAttribute("data-value"))),
  )).toEqual([1, 4, 3, 2]);
  await solve(page);
  expect(
    await page
      .locator(".bubble-overview-item")
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

test("either friend swaps the current pair once, including the 6 and 5 example", async ({ page }) => {
  await enter(page);
  for (const side of [0, 1] as const) {
    await custom(page, "3, 2, 6, 5, 8");
    await push(page, 0);
    const keep = page.getByRole("button", { name: "Giữ nguyên", exact: true });
    await expect(keep).toBeEnabled();
    await keep.click();
    await expect(page.locator(".bubble-play")).toHaveAttribute("data-busy", "false");
    await push(page, side);
    await expect(page.locator(".bubble-play")).toHaveAttribute("data-busy", "false");
    expect(await page.locator(".bubble-overview-item").evaluateAll(nodes =>
      nodes.map(node => Number(node.getAttribute("data-value"))),
    )).toEqual([2, 3, 5, 6, 8]);
    await expect(page.locator(".bubble-topline")).toContainText("3 lần so sánh");
    await expect(page.locator(".bubble-topline")).toContainText("2 lần đổi chỗ");
    await expect(page.locator(".bubble-score")).toHaveText("300");
  }
  await custom(page, "6, 5");
  await page.locator('.bubble-tile[data-active="true"]').nth(1).press("ArrowLeft");
  await expect(page.locator(".bubble-victory")).toBeVisible();
  await expect(page.locator(".bubble-topline")).toContainText("1 lần đổi chỗ");
});

test("visible keep action advances ordered pairs once and rejects an inverted pair", async ({
  page,
}) => {
  await enter(page);
  await custom(page, "3, 6, 2");
  const keep = page.getByRole("button", { name: "Giữ nguyên", exact: true });
  await expect(keep).toBeVisible();
  await push(page, 1);
  await expect(page.getByRole("status")).toContainText("Bấm Giữ nguyên");
  await expect(page.locator(".bubble-topline")).toContainText("0 lần so sánh");
  await expect(page.locator(".bubble-score")).toHaveText("0");
  expect(await page.locator(".bubble-overview-item").evaluateAll(nodes =>
    nodes.map(node => Number(node.getAttribute("data-value"))),
  )).toEqual([3, 6, 2]);
  await page.locator('.bubble-tile[data-active="true"]').nth(1).press("ArrowRight");
  await expect(page.locator(".bubble-topline")).toContainText("0 lần so sánh");
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
    "Số bên trái lớn hơn",
  );
  await expect(page.locator(".bubble-topline")).toContainText("1 lần so sánh");
  await push(page, 0);
  await page
    .getByRole("button", { name: "Lượt tiếp theo", exact: true })
    .click();
  await push(page, 0);
  await expect(page.locator(".bubble-victory")).toBeVisible();
});

test("current friends never reveal the answer and missed or cancelled drops do not move them", async ({ page }) => {
  await enter(page); await custom(page, "6, 5, 2");
  const appearance = await page.locator('.bubble-tile[data-active="true"]').evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    return [style.width, style.height, style.backgroundImage, style.borderColor, style.boxShadow];
  }));
  expect(appearance[0]).toEqual(appearance[1]);
  for (const cancelled of [false, true]) {
    const tile = (await page.locator('.bubble-tile[data-index="0"]').boundingBox())!;
    await page.mouse.move(tile.x + tile.width / 2, tile.y + tile.height / 2); await page.mouse.down();
    await page.mouse.move(tile.x + tile.width / 2, tile.y - 40, { steps: 10 });
    if (cancelled) await page.locator(".bubble-bridge-board").dispatchEvent("pointercancel");
    await page.mouse.up();
    await expect(page.locator(".bubble-topline")).toContainText("0 lần so sánh");
    await expect(page.locator(".bubble-score")).toHaveText("0");
    await expect(page.locator(".bubble-drag-ghost")).toHaveCount(0);
  }
  await push(page, 1);
  await expect(page.locator(".bubble-world")).toHaveAttribute("data-busy", "false");
  expect(await page.locator(".bubble-overview-item").evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-value"))))).toEqual([5, 6, 2]);
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
  await page.locator('.bubble-tile[data-active="true"]').nth(1).press("Enter");
  await expect(page.getByRole("status")).toContainText("Bấm Giữ nguyên");
  await expect(page.locator(".bubble-topline")).toContainText("0 lần so sánh");
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
    titles.push((await page.locator(".bubble-dialogue p").textContent())!);
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  }
  expect(titles.some(text => text.includes("Hai số đều bằng"))).toBe(true);
  await expect(page.locator(".bubble-dialogue")).toContainText(
    "không có lần đổi chỗ nào",
  );
  await page.getByRole("button", { name: "Tự mình thử", exact: true }).click();
  await expect(page.locator(".bubble-play")).toBeVisible();
  expect(
    await page
      .locator(".bubble-overview-item")
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
        : a.x + a.width / 2 - 2;
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
  await touchPush(1);
  await expect(page.locator(".bubble-topline")).toContainText("1 lần so sánh");
  await touchPush(1);
  await expect(page.getByRole("status")).toContainText("Bấm Giữ nguyên");
  await expect(page.locator(".bubble-topline")).toContainText("1 lần so sánh");
  await page.getByRole("button", { name: "Giữ nguyên", exact: true }).tap();
  await page.getByRole("button", { name: "Lượt tiếp theo", exact: true }).tap();
  const right = page.locator('.bubble-tile[data-active="true"]').nth(1);
  await expect(right).toBeEnabled();
  await right.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("status")).toContainText("Bấm Giữ nguyên");
  await expect(page.locator(".bubble-topline")).toContainText("2 lần so sánh");
  await page.getByRole("button", { name: "Giữ nguyên", exact: true }).press("Enter");
  await expect(page.locator(".bubble-victory")).toBeVisible();
  await expect(page.locator(".bubble-topline")).toContainText("3 lần so sánh");
  await context.close();
});

test("one drag answers one pair; Buta follows and friends in camp stay fixed", async ({ page }) => {
  await enter(page);
  await custom(page, "9, 1, 2, 3, 4");
  const guide = page.locator(".bridge-buta");
  const initialGuide = await guide.evaluate(node => (node as HTMLElement).style.left);
  for (const friend of await page.locator('.bridge-friend[data-active="false"]').all()) await expect(friend).toBeDisabled();
  // Dropping over an unrelated member of the visible party must not swap.
  const start = (await page.locator('.bridge-friend[data-index="0"]').boundingBox())!;
  const unrelated = (await page.locator('.bridge-friend[data-index="3"]').boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(unrelated.x + unrelated.width / 2, unrelated.y + unrelated.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator(".bubble-topline")).toContainText("0 lần so sánh");
  const pair = page.locator('.bubble-tile[data-active="true"]');
  const a = (await pair.nth(0).boundingBox())!, b = (await pair.nth(1).boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
  await page.waitForTimeout(650);
  await expect(page.locator(".bubble-topline")).toContainText("0 lần so sánh");
  await page.mouse.up();
  await expect(page.locator(".bubble-world")).toHaveAttribute("data-busy", "false");
  await expect(page.locator(".bubble-topline")).toContainText("1 lần so sánh");
  expect(await pair.evaluateAll(nodes => nodes.map(node => Number(node.getAttribute("data-value"))))).toEqual([9, 2]);
  await expect(page.locator(".bubble-focus-status")).toHaveText("Cặp 2–3");
  expect(await guide.evaluate(node => (node as HTMLElement).style.left)).not.toBe(initialGuide);
  await expect(page.getByRole("status")).toBeEmpty();
  await expect(page.locator('.bubble-tile[data-active="true"]')).toHaveCount(2);
  await expect(page.locator(".bubble-overview-item")).toHaveCount(5);
  for (let i = 0; i < 3; i++) { await push(page, 0); await expect(page.locator(".bubble-world")).toHaveAttribute("data-busy", "false"); }
  await expect(page.locator(".bubble-overview-item.is-settled")).toHaveCount(1);
  await expect(page.locator(".bubble-overview-item.is-settled")).toHaveAttribute("data-value", "9");
  await page.getByRole("button", { name: "Lượt tiếp theo", exact: true }).click();
  await expect(page.locator(".bubble-bridge-board")).toHaveAttribute("data-focus-pair", "0");
  expect(await guide.evaluate(node => (node as HTMLElement).style.left)).toBe(initialGuide);
  await expect(page.locator(".bubble-overview-item.is-settled")).toHaveCount(1);
  await solve(page);
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
    const boxes = await page.locator(".bubble-overview-item").evaluateAll((nodes) =>
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
    const blocks = await page.locator(".bubble-overview-item").evaluateAll((nodes) =>
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
  await expect(page.locator(".bubble-dialogue p")).toContainText("đã sang trái");
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

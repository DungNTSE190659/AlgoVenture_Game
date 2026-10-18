import { enterTrack } from "./track-navigation";
import { expect, test, type Page, type CDPSession } from "@playwright/test";
import { createExpedition, finishIsland } from "../src/engine/expedition";

async function enter(page: Page) {
  await enterTrack(page, "Quick Sort", "Play");
  await expect(page.locator(".cargo-pool")).toBeVisible();
}
async function drop(page: Page, id: number, zone: string) {
  const source = page.locator(`[data-cargo="${id}"]`),
    target = page.locator(`[data-drop="${zone}"]`);
  await source.scrollIntoViewIfNeeded();
  const a = (await source.boundingBox())!,
    b = (await target.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + Math.min(b.height / 2, 80), {
    steps: 12,
  });
  await page.mouse.up();
}
async function custom(page: Page, values: number[]) {
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Các phần tử của mảng").fill(values.join(", "));
  await page
    .getByRole("button", { name: "Dùng mảng này", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function solve(page: Page, values: number[]) {
  let model = createExpedition(values);
  while (model.islands.length) {
    const island = model.islands.at(-1)!;
    const name = `Khám phá đảo ${island.cargo.map((id) => model.cargo.find((item) => item.id === id)!.value).join(", ")}`;
    const choice = page.getByRole("button", { name, exact: true });
    if (await choice.count()) await choice.click();
    await expect(page.locator(".cargo-pool .cargo-crate")).toHaveCount(
      island.cargo.length,
    );
    const pivot = island.cargo[Math.floor(island.cargo.length / 2)];
    const pivotValue = model.cargo.find((item) => item.id === pivot)!.value;
    const small: number[] = [],
      large: number[] = [];
    await drop(page, pivot, "pivot");
    for (const id of [...island.cargo].reverse().filter((id) => id !== pivot)) {
      const group =
        model.cargo.find((item) => item.id === id)!.value <= pivotValue
          ? "small"
          : "large";
      (group === "small" ? small : large).push(id);
      await drop(page, id, group);
    }
    await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
    const result = finishIsland(model, island.id, { pivot, small, large });
    if (!result.ok) throw new Error("Invalid test partition");
    model = result.expedition;
    await expect(page.locator(".trail-fixed")).toHaveCount(model.fixed.length);
    await expect(page.locator(".expedition-world")).not.toHaveClass(
      /expedition-celebrating/,
    );
  }
  await expect(page.locator(".expedition-victory")).toBeVisible();
  const result = await page
    .locator(".expedition-trail-blocks > span")
    .allTextContents();
  expect(result.map(Number)).toEqual([...values].sort((a, b) => a - b));
}

test("real mouse dragging allows wrong placements, undo, corrections and choosing the right island first", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await enter(page);
  await expect(page.locator(".expedition-hint")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Kiểm tra", exact: true }),
  ).toBeDisabled();
  await drop(page, 4, "pivot");
  await expect(
    page.getByRole("button", { name: "Kiểm tra", exact: true }),
  ).toBeDisabled();
  await drop(page, 0, "small");
  await drop(page, 1, "small");
  await drop(page, 2, "large");
  await drop(page, 3, "small");
  await expect(
    page.getByRole("button", { name: "Kiểm tra", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".expedition-score")).toContainText("1.000");
  await expect(page.locator(".cargo-wrong")).toHaveCount(0);
  await page.getByRole("button", { name: "Hoàn tác lượt kéo" }).click();
  await expect(page.locator('.cargo-pool [data-cargo="3"]')).toBeVisible();
  await drop(page, 3, "small");
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(page.locator(".cargo-wrong")).toHaveCount(1);
  await expect(page.locator(".expedition-score")).toContainText("950");
  await expect(page.locator(".expedition-hint")).toHaveCount(0);
  await drop(page, 0, "large");
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(page.locator(".expedition-island")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Khám phá đảo 6, 8", exact: true })
    .click();
  await drop(page, 0, "pivot");
  await drop(page, 2, "small");
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(page.locator(".cargo-pool .cargo-crate")).toHaveCount(2);
  await drop(page, 1, "pivot");
  await drop(page, 3, "small");
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await expect(page.locator(".expedition-victory")).toBeVisible();
  expect(
    (
      await page.locator(".expedition-trail-blocks > span").allTextContents()
    ).map(Number),
  ).toEqual([2, 3, 5, 6, 8]);
  await page
    .getByRole("button", { name: "Đi tiếp cùng Buta", exact: true })
    .click();
  await expect(page.locator("#track-sheet-title")).toHaveText("Binary Search");
  expect(errors).toEqual([]);
});

test("any pivot and free crate order solve negative and duplicate values", async ({
  page,
}) => {
  await enter(page);
  const values = [-3, 5, 2, -3, 7, 0, 2, 4];
  await custom(page, values);
  await solve(page, values);
  await expect(page.locator(".expedition-victory")).toContainText(
    "0 lần sửa nhóm",
  );
});

test("keyboard users can pick up, place, change their pivot and complete a round", async ({
  page,
}) => {
  await enter(page);
  await custom(page, [9, -2]);
  async function keyPlace(id: number, target: string) {
    await page.locator(`[data-cargo="${id}"]`).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: target, exact: true }).focus();
    await page.keyboard.press("Enter");
  }
  await keyPlace(1, "Đặt khối làm chốt");
  await keyPlace(0, "Đặt khối làm chốt");
  await expect(page.locator('.cargo-pivot [data-cargo="0"]')).toBeVisible();
  await keyPlace(1, "Đưa khối vào nhóm nhỏ");
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".expedition-victory")).toBeVisible();
});

async function touchDrop(
  page: Page,
  cdp: CDPSession,
  id: number,
  zone: string,
) {
  const a = (await page.locator(`[data-cargo="${id}"]`).boundingBox())!;
  const b = (await page.locator(`[data-drop="${zone}"]`).boundingBox())!;
  const x = a.x + a.width / 2,
    y = a.y + a.height / 2,
    tx = b.x + b.width / 2,
    ty = b.y + b.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 12; step++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: x + ((tx - x) * step) / 12, y: y + ((ty - y) * step) / 12 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
}
test("touch drags work on a phone without native HTML drag and drop", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await enter(page);
  await custom(page, [9, -2]);
  const cdp = await context.newCDPSession(page);
  await touchDrop(page, cdp, 0, "pivot");
  await expect(page.locator('.cargo-pivot [data-cargo="0"]')).toBeVisible();
  await touchDrop(page, cdp, 1, "large");
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).tap();
  await expect(page.locator(".expedition-score")).toContainText("950");
  await touchDrop(page, cdp, 1, "small");
  await expect(page.locator('.zone-small [data-cargo="1"]')).toBeVisible();
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).tap();
  await expect(page.locator(".expedition-victory")).toBeVisible();
  await context.close();
});

test("hints are requested, charged once per island and pause the hard timer", async ({
  page,
}) => {
  await page.clock.install();
  await enter(page);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByRole("combobox", { name: "Cấp độ" }).selectOption("hard");
  await page.clock.runFor(61000);
  await expect(page.locator(".expedition-score")).toContainText("950");
  await page.getByRole("button", { name: "Buta gợi ý", exact: false }).click();
  await expect(
    page.getByRole("region", { name: "Gợi ý của Buta" }),
  ).toBeVisible();
  await page.clock.runFor(120000);
  await expect(page.locator(".expedition-score")).toContainText("900");
  await page.getByRole("button", { name: "Đóng gợi ý" }).click();
  await page.getByRole("button", { name: "Buta gợi ý", exact: false }).click();
  await expect(page.locator(".expedition-score")).toContainText("900");
  await page.getByRole("button", { name: "Đóng gợi ý" }).click();
  await page.clock.runFor(61000);
  await expect(page.locator(".expedition-score")).toContainText("850");
  await expect(page.locator(".expedition-hint")).toHaveCount(0);
});

test("drag targets fit laptops and phones; large groups remain reachable", async ({
  page,
}) => {
  for (const [width, height] of [
    [1884, 859],
    [1440, 900],
    [1280, 720],
    [390, 844],
    [375, 667],
    [320, 568],
    [844, 390],
    [667, 375],
  ]) {
    await page.setViewportSize({ width, height });
    await enter(page);
    await custom(page, [1, 2, 3, 4, 5, 6, 7, 8]);
    await page.screenshot({ path: `.qa/expedition-${width}x${height}.png` });
    const layout = await page.evaluate(() => ({
      width: document.body.scrollWidth,
      targets: [...document.querySelectorAll<HTMLElement>("[data-drop]")].map(
        (item) => {
          const r = item.getBoundingClientRect();
          return { left: r.left, right: r.right, width: r.width };
        },
      ),
    }));
    expect(layout.width).toBeLessThanOrEqual(width);
    for (const box of layout.targets) {
      expect(box.left).toBeGreaterThanOrEqual(-1);
      expect(box.right).toBeLessThanOrEqual(width + 1);
      expect(box.width).toBeGreaterThan(40);
    }
    if (width >= 1000) {
      await drop(page, 7, "pivot");
      for (const id of [0, 1, 2, 3, 4, 5, 6]) await drop(page, id, "small");
      await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
      await expect(page.locator(".trail-fixed")).toHaveCount(1);
    }
  }
});

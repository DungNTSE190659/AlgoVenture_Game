import { enterTrack } from "./track-navigation";
import { expect, test, type Page } from "@playwright/test";

async function lesson(page: Page) {
  await enterTrack(page, "Quick Sort", "Demo");
}
async function until(page: Page, kind: string) {
  for (let guard = 0; guard < 100; guard++) {
    if (
      (await page.locator(".lesson-world").getAttribute("data-kind")) === kind
    )
      return;
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  }
  throw new Error(`Never reached ${kind}`);
}

test("lesson highlights comparison, animates actual swaps, fixes pivots, then explains recursion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await lesson(page);
  await expect(page.getByText("XEM HEO LÀM MẪU", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator(".demo-badge")).toHaveCount(0);
  const sizing = await page.evaluate(() => ({
    title: parseFloat(
      getComputedStyle(document.querySelector(".lesson-title")!).fontSize,
    ),
    text: parseFloat(
      getComputedStyle(document.querySelector(".lesson-narration p")!).fontSize,
    ),
    cell: document.querySelector(".lesson-cell")!.getBoundingClientRect().width,
  }));
  expect(sizing.title).toBeGreaterThanOrEqual(36);
  expect(sizing.text).toBeGreaterThanOrEqual(23);
  expect(sizing.cell).toBeGreaterThanOrEqual(104);
  await until(page, "SCAN");
  await expect(page.locator(".lesson-pig-stage .pig")).toHaveAttribute(
    "data-mood",
    "thinking",
  );
  await expect(page.locator(".cell-scan")).toHaveAttribute("data-index", "0");
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".lesson-comparison")).toHaveAttribute(
    "aria-label",
    "8 > 5",
  );
  await expect(page.locator(".lesson-pig-stage .pig")).toHaveAttribute(
    "data-mood",
    "surprised",
  );
  await page.screenshot({ path: ".qa/demo-comparison-final.png" });
  await until(page, "SWAP");
  await expect(page.locator(".lesson-swap-arcs")).toBeVisible();
  await expect(page.locator(".lesson-cell").first()).toContainText("8");
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".lesson-cell").first()).toContainText("3");
  const moving = await page
    .locator(".lesson-array-row")
    .evaluate(
      (row) =>
        row
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === "running").length,
    );
  expect(moving).toBeGreaterThanOrEqual(2);
  await page.getByRole("button", { name: "Phát demo", exact: true }).click();
  await page
    .getByRole("button", { name: "Tạm dừng demo", exact: true })
    .click();
  const paused = await page
    .locator(".lesson-array-row")
    .evaluate(
      (row) =>
        row
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === "paused").length,
    );
  expect(paused).toBeGreaterThanOrEqual(2);
  await until(page, "FIXED");
  await expect(page.locator(".cell-fixed")).toContainText("5");
  await expect(page.locator(".lesson-pig-stage .pig")).toHaveAttribute(
    "data-mood",
    "celebrate",
  );
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".lesson-split")).toBeVisible();
  expect(await page.locator(".split-left i").allTextContents()).toEqual([
    "3",
    "2",
  ]);
  expect(await page.locator(".split-right i").allTextContents()).toEqual([
    "8",
    "6",
  ]);
  await page.screenshot({ path: ".qa/demo-recursion-final.png" });
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".lesson-world")).toHaveAttribute(
    "data-kind",
    "FOCUS",
  );
  await expect(page.locator(".cell-inactive,.cell-fixed")).toHaveCount(3);
  expect(errors).toEqual([]);
});

test("settings pauses the lesson; arrays accept negatives and duplicates", async ({
  page,
}) => {
  await page.clock.install();
  await lesson(page);
  await page.getByRole("button", { name: "Phát demo", exact: true }).click();
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  const current = await page
    .locator(".lesson-world")
    .getAttribute("data-frame");
  await page.clock.runFor(15000);
  await expect(page.locator(".lesson-world")).toHaveAttribute(
    "data-frame",
    current!,
  );
  await page.getByLabel("Các phần tử của mảng").fill("2, -1, 2, 0, -5");
  await page
    .getByRole("button", { name: "Dùng mảng này", exact: true })
    .click();
  await expect(page.locator(".lesson-world")).toHaveAttribute(
    "data-frame",
    "0",
  );
  await until(page, "DONE");
  expect(await page.locator(".lesson-number").allTextContents()).toEqual([
    "-5",
    "-1",
    "0",
    "2",
    "2",
  ]);
  await expect(
    page.getByRole("button", { name: "Tự mình thử", exact: true }),
  ).toBeVisible();
});

test("custom arrays use their own length, preserve speed, and restart the lesson", async ({
  page,
}) => {
  const frozenTime = Date.now();
  await page.clock.install({ time: frozenTime });
  await page.clock.pauseAt(frozenTime + 1000);
  await lesson(page);
  const speed = page.getByRole("button", { name: /^Tốc độ demo:/ });
  await expect(speed).toHaveText("1x");
  for (const next of ["1.5x", "2x", "1x", "1.5x", "2x"]) {
    await speed.click();
    await expect(speed).toHaveText(next);
  }
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await expect(page.getByRole("slider")).toHaveCount(0);
  await page.getByLabel("Các phần tử của mảng").fill("8, 3, 6, 2, 5, 9, 10, 6");
  await page
    .getByRole("button", { name: "Dùng mảng này", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".lesson-world")).toHaveAttribute(
    "data-frame",
    "0",
  );
  expect(await page.locator(".lesson-number").allTextContents()).toEqual([
    "8",
    "3",
    "6",
    "2",
    "5",
    "9",
    "10",
    "6",
  ]);
  await expect(speed).toHaveText("2x");
  await page.getByRole("button", { name: "Phát demo", exact: true }).click();
  const pivotDuration = await page.evaluate(async () => {
    const { createLesson } = await import("/src/engine/lesson.ts");
    return createLesson([8, 3, 6, 2, 5, 9, 10, 6])[1].duration;
  });
  await page.clock.runFor(pivotDuration / 2 - 100);
  await expect(page.locator(".lesson-world")).toHaveAttribute(
    "data-frame",
    "1",
  );
  await page.clock.runFor(200);
  await expect(page.locator(".lesson-world")).toHaveAttribute(
    "data-frame",
    "2",
  );
  await page
    .getByRole("button", { name: "Tạm dừng demo", exact: true })
    .click();
  await until(page, "DONE");
  expect(await page.locator(".lesson-number").allTextContents()).toEqual([
    "2",
    "3",
    "5",
    "6",
    "6",
    "8",
    "9",
    "10",
  ]);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Các phần tử của mảng").fill("−3; 2; 0;");
  await page.getByLabel("Các phần tử của mảng").press("Enter");
  await expect(page.locator(".lesson-world")).toHaveAttribute(
    "data-frame",
    "0",
  );
  expect(await page.locator(".lesson-number").allTextContents()).toEqual([
    "-3",
    "2",
    "0",
  ]);
  await expect(speed).toHaveText("2x");
  await until(page, "DONE");
  expect(await page.locator(".lesson-number").allTextContents()).toEqual([
    "-3",
    "0",
    "2",
  ]);
});

test("invalid custom arrays stay editable and demo samples do not restrict custom values", async ({
  page,
}) => {
  await lesson(page);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  const input = page.getByLabel("Các phần tử của mảng");
  const apply = page.getByRole("button", {
    name: "Dùng mảng này",
    exact: true,
  });
  for (const value of [
    "",
    "1",
    "1,2,3,4,5,6,7,8,9",
    "1,100",
    "2,3.5",
    "1,abc",
  ]) {
    await input.fill(value);
    await apply.click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveValue(value);
  }
  await page.getByRole("combobox", { name: "Cấp độ" }).selectOption("hard");
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await input.fill("-99, 99");
  await apply.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.locator(".lesson-number").allTextContents()).toEqual([
    "-99",
    "99",
  ]);
});

test("important lesson content fits all viewport sizes with a legible laptop presentation", async ({
  page,
}) => {
  await lesson(page);
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
    if (
      await page
        .getByRole("button", { name: "Xem lại từ đầu", exact: true })
        .count()
    )
      await page
        .getByRole("button", { name: "Xem lại từ đầu", exact: true })
        .click();
    for (const kind of ["PIVOT", "DECIDE", "SPLIT"]) {
      await until(page, kind);
      await page.waitForTimeout(150);
      const rects = await page.evaluate(() => {
        const rect = (s: string) => {
          const r = document.querySelector(s)!.getBoundingClientRect();
          return {
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          };
        };
        return {
          world: rect(".lesson-world"),
          title: rect(".lesson-title"),
          board: rect(".lesson-board"),
          explanation: rect(".lesson-explanation"),
          narration: rect(".lesson-narration"),
          controls: rect(".lesson-controls"),
          speed: rect(".lesson-speed-button"),
        };
      });
      for (const [name, rect] of Object.entries(rects)) {
        expect(
          rect.left,
          `${width} ${kind} ${name} left`,
        ).toBeGreaterThanOrEqual(-1);
        expect(
          rect.right,
          `${width} ${kind} ${name} right`,
        ).toBeLessThanOrEqual(width + 1);
        expect(rect.top, `${width} ${kind} ${name} top`).toBeGreaterThanOrEqual(
          -1,
        );
        expect(
          rect.bottom,
          `${width} ${kind} ${name} bottom`,
        ).toBeLessThanOrEqual(height + 1);
      }
      expect(
        rects.board.bottom,
        `${width} ${kind} board versus explanation`,
      ).toBeLessThanOrEqual(rects.explanation.top + 1);
      expect(
        rects.narration.bottom,
        `${width} ${kind} text versus controls`,
      ).toBeLessThanOrEqual(rects.controls.top + 1);
      if (width >= 1000) {
        const font = await page
          .locator(".lesson-narration p")
          .evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
        expect(font).toBeGreaterThanOrEqual(20);
      }
      if (kind === "DECIDE")
        await page.screenshot({
          path: `.qa/lesson-final-${width}x${height}.png`,
        });
    }
    await until(page, "DONE");
  }
});

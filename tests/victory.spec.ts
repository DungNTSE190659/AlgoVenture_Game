import { enterTrack } from "./track-navigation";
import { test, expect, type Page } from "@playwright/test";

async function enter(page: Page, algorithm: string, mode = "Play") {
  await enterTrack(page, algorithm, mode);
}
async function custom(page: Page, algorithm: string) {
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page
    .getByLabel(
      algorithm === "Bubble Sort" ? "Mảng của bạn" : "Các phần tử của mảng",
      { exact: true },
    )
    .fill("1, 2");
  await page
    .getByRole("button", { name: "Dùng mảng này", exact: true })
    .click();
}
async function win(page: Page, algorithm: string) {
  if (algorithm === "Bubble Sort")
    await page.getByRole("button", { name: "Giữ nguyên", exact: true }).click();
  else {
    for (const [id, target] of [
      [0, "Đặt khối làm chốt"],
      [1, "Đưa khối vào nhóm lớn"],
    ] as const) {
      await page.locator(`[data-cargo="${id}"]`).focus();
      await page.keyboard.press("Enter");
      await page.getByRole("button", { name: target, exact: true }).click();
    }
    await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  }
  await expect(page.locator(".victory-celebration")).toBeVisible();
  const panel = page.getByRole("dialog", {
    name: "Mảng đã được sắp xếp!",
    exact: true,
  });
  await expect(panel).toBeVisible();
  expect(await panel.evaluate((node) => node.matches(":modal"))).toBe(true);
  await expect(
    panel.locator(".bubble-tile,.expedition-result-array"),
  ).toHaveCount(0);
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest(".victory-screen")),
    ),
  ).toBe(true);
  await expect(page.locator(".victory-celebration .pig")).toHaveAttribute(
    "data-mood",
    "celebrate",
  );
}
for (const algorithm of ["Bubble Sort", "Quick Sort"])
  test(`${algorithm} celebrates, replays, upgrades through each level and returns to algorithm selection`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await enter(page, algorithm);
    await custom(page, algorithm);
    await win(page, algorithm);
    await expect(
      page.getByRole("button", { name: "Chơi lại", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Tăng độ khó", exact: true }),
    ).toBeVisible();
    await page.waitForTimeout(650);
    await page.screenshot({
      path: `.qa/victory-${algorithm.split(" ")[0]}.png`,
    });
    await page.getByRole("button", { name: "Chơi lại", exact: true }).click();
    await expect(page.locator(".victory-celebration")).toHaveCount(0);
    if (algorithm === "Bubble Sort")
      await expect(page.locator(".bubble-tile")).toHaveCount(2);
    else await expect(page.locator(".cargo-pool .cargo-crate")).toHaveCount(2);
    await win(page, algorithm);
    for (const [level, count] of [
      ["medium", 7],
      ["hard", 8],
    ] as const) {
      await page
        .getByRole("button", { name: "Tăng độ khó", exact: true })
        .click();
      await expect(page.locator(".victory-celebration")).toHaveCount(0);
      await expect(
        page.locator(
          algorithm === "Bubble Sort"
            ? ".bubble-tile"
            : ".cargo-pool .cargo-crate",
        ),
      ).toHaveCount(count);
      await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
      await expect(page.getByRole("combobox")).toHaveValue(level);
      await page.getByRole("button", { name: "Đóng", exact: true }).click();
      await custom(page, algorithm);
      await win(page, algorithm);
    }
    await expect(
      page.getByRole("button", { name: "Tăng độ khó", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Đi tiếp cùng Buta", exact: true })
      .click();
    if (algorithm === 'Bubble Sort') {
      await expect(page.locator('.learning-map')).toBeVisible();
      await expect(page.locator('#track-sheet-title')).toHaveText('Selection Sort');
      await expect(page.getByRole('button', {name:'Thử thách',exact:true})).toBeEnabled();
    } else {
      await expect(page.locator('.learning-map')).toBeVisible();
      await expect(page.locator('#track-sheet-title')).toHaveText('Quick Sort');
      await expect(page.locator('.track-buta')).toHaveAttribute('aria-label', 'Buta đang ở Quick Sort');
      await expect(page.getByRole('button', {name:'Linear Search',exact:true})).toHaveCount(0);
    }
  });

test("Bubble demo uses a clear background and circles; play removes the redundant legend", async ({
  page,
}) => {
  await enter(page, "Bubble Sort", "Demo");
  await expect(page.locator(".world-scenery")).toHaveCount(0);
  expect(
    await page
      .locator(".bubble-tile")
      .first()
      .evaluate((node) => getComputedStyle(node).borderRadius),
  ).toBe("50%");
  await page.screenshot({ path: ".qa/bubble-white-demo.png" });
  await page.getByRole("button", { name: "Về bản đồ", exact: true }).click();
  await page.getByRole("button", { name: "Thử thách", exact: true }).click();
  await expect(page.locator(".bubble-legend")).toHaveCount(0);
  await expect(page.locator(".bubble-pair-window")).toBeVisible();
});

test("touch array submission and victory actions never leak a click into the next game", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await enter(page, "Bubble Sort");
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).tap();
  await page.getByLabel("Mảng của bạn", { exact: true }).fill("1, 2");
  await page.getByRole("button", { name: "Dùng mảng này", exact: true }).tap();
  await page.waitForTimeout(450);
  await expect(page.locator(".bubble-topline")).toContainText("0 lần so sánh");
  await page.getByRole("button", { name: "Giữ nguyên", exact: true }).tap();
  await expect(page.locator(".victory-celebration")).toBeVisible();
  await page.getByRole("button", { name: "Chơi lại", exact: true }).tap();
  await expect(page.locator(".bubble-topline")).toContainText("0 lần so sánh");
  await page.getByRole("button", { name: "Giữ nguyên", exact: true }).tap();
  await expect(page.locator(".victory-celebration")).toBeVisible();
  await page.getByRole("button", { name: "Tăng độ khó", exact: true }).tap();
  await page.waitForTimeout(450);
  await expect(page.locator(".bubble-tile")).toHaveCount(7);
  await expect(page.locator(".bubble-topline")).toContainText("0 lần so sánh");
  await context.close();
});

import { expect, test } from '@playwright/test';
import { enterTrack } from './track-navigation';
test("demo supports next/back, play/pause, speed and full completion", async ({
  page,
}) => {
  await enterTrack(page, "Quick Sort", "Demo");
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".step-indicator")).toContainText("2 /");
  await page.getByRole("button", { name: "Bước trước", exact: true }).click();
  await expect(page.locator(".step-indicator")).toContainText("1 /");
  const speed = page.getByRole("button", { name: /^Tốc độ demo:/ });
  await speed.click();
  await expect(speed).toHaveText("1.5x");
  await speed.click();
  await expect(speed).toHaveText("2x");
  await page.getByRole("button", { name: "Phát demo", exact: true }).click();
  await expect(page.locator(".lesson-world")).toHaveAttribute(
    "data-frame",
    "1",
  );
  await page
    .getByRole("button", { name: "Tạm dừng demo", exact: true })
    .click();
  const frozen = await page.locator(".step-indicator").textContent();
  await page.waitForTimeout(1000);
  expect(await page.locator(".step-indicator").textContent()).toBe(frozen);
  while (
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).count()
  )
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Tự mình thử", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tự mình thử", exact: true }).click();
  await expect(page.locator(".expedition-hint-button")).toBeVisible();
});


import { expect, test } from "@playwright/test";
import { enterTrack } from "./track-navigation";

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`Bubble studio keeps its board, companion and controls arranged at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const mode of ["Demo", "Play"]) {
      await enterTrack(page, "Bubble Sort", mode);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
      await page.getByLabel("Mảng của bạn", { exact: true }).fill("-99, 0, 8, 3, 3, 4, -5, 99");
      await page.getByRole("button", { name: "Dùng mảng này", exact: true }).click();

      await expect(page.locator(".bubble-studio")).toHaveCSS("background-color", "rgb(145, 145, 255)");
      await expect(page.locator(".bubble-tile")).toHaveCount(8);
      const layout = await page.evaluate(() => {
        const box = (selector: string) => {
          const node = document.querySelector(selector)!;
          const rect = node.getBoundingClientRect();
          return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width };
        };
        return {
          back: box('[aria-label="Về bản đồ"]'), title: box(".bubble-header h1"), settings: box('[aria-label="Tùy chọn"]'),
          board: box(".bubble-board"), sidebar: box(".bubble-sidebar"),
          fox: box(".bubble-sidebar .bubble-fox"), speech: box(".bubble-chat"),
          controls: box(".bubble-controls, .bubble-action-area"),
          tiles: [...document.querySelectorAll(".bubble-tile")].map(node => {
            const rect = node.getBoundingClientRect();
            return { x: rect.x, right: rect.right, width: rect.width };
          }),
          scrollWidth: document.documentElement.scrollWidth,
        };
      });
      expect(layout.back.right).toBeLessThanOrEqual(layout.title.x);
      expect(layout.title.right).toBeLessThanOrEqual(layout.settings.x);
      expect(layout.scrollWidth).toBeLessThanOrEqual(viewport.width);
      for (const tile of layout.tiles) {
        expect(tile.x).toBeGreaterThanOrEqual(0);
        expect(tile.right).toBeLessThanOrEqual(viewport.width + 1);
        expect(tile.width).toBeGreaterThanOrEqual(24);
      }
      if (viewport.width > 1000) expect(layout.board.right).toBeLessThanOrEqual(layout.sidebar.x);
      else expect(layout.board.bottom).toBeLessThanOrEqual(layout.sidebar.y);
      expect(layout.fox.right).toBeLessThanOrEqual(layout.speech.x);
      expect(layout.speech.bottom).toBeLessThanOrEqual(layout.controls.y);

      const controls = page.locator(mode === "Demo" ? ".bubble-playback button" : ".bubble-step-actions button");
      await expect(controls).toHaveCount(mode === "Demo" ? 3 : 2);
      if (mode === "Demo") {
        await expect(controls.first()).toHaveAccessibleName("Bước trước");
        await expect(controls.nth(1)).toHaveAccessibleName("Bắt đầu");
        await expect(controls.last()).toHaveAccessibleName("Bước tiếp");
      } else {
        await expect(controls.first()).toHaveAccessibleName("Kết thúc thuật toán");
        await expect(controls.last()).toHaveAccessibleName("Cáo gợi ý");
      }
      for (const button of await controls.all()) {
        await button.scrollIntoViewIfNeeded();
        await expect(button).toBeInViewport();
      }
    }
  });
}

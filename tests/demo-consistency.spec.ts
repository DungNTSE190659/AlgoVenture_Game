import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { enterTrack } from "./track-navigation";

const algorithms = ["Bubble Sort", "Selection Sort", "Insertion Sort", "Merge Sort", "Quick Sort", "Linear Search", "Binary Search", "Stack", "Queue"];
for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 720 }, { width: 1280, height: 580 }, { width: 390, height: 844 }, { width: 375, height: 667 }, { width: 320, height: 568 }, { width: 844, height: 390 }, { width: 667, height: 375 }]) {
  test(`algorithm demo interface stays consistent at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const audit: Record<string, unknown> = {};
    for (const algorithm of algorithms) {
      await enterTrack(page, algorithm, "Demo");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(page.locator(".demo-panel .pig")).toHaveAttribute("data-animated", "true");
      const root = page.locator("main");
      const appearance = await root.evaluate(el => {
        function measure(selector: string) {
          const target = el.querySelector(selector);
          if (!target) return null;
          const style = getComputedStyle(target), box = target.getBoundingClientRect();
          return { width: box.width, height: box.height, x: box.x, y: box.y, color: style.color, background: style.backgroundColor, image: style.backgroundImage, font: style.fontSize, radius: style.borderRadius, shadow: style.boxShadow };
        }
        return { pig: measure(".pig"), narration: measure(".lesson-narration p, .bubble-dialogue p, .selection-dialogue p, .insertion-dialogue p"), bubble: measure(".lesson-narration, .bubble-dialogue p, .selection-dialogue p, .insertion-dialogue p"), primary: measure("footer .chunky-button"), previous: measure("button[aria-label='Bước trước']"), header: measure(".lesson-header h1"), back: measure("button[aria-label='Về bản đồ']"), speed: measure(".lesson-speed-button"), progress: measure(".demo-panel progress, .lesson-progress > div"), root: { width: el.clientWidth, scrollWidth: el.scrollWidth, height: el.clientHeight, scrollHeight: el.scrollHeight } };
      });
      audit[algorithm] = appearance;
      const reference = audit[algorithms[0]] as typeof appearance;
      for (const part of ["pig", "primary", "previous", "back", "speed", "progress"] as const) {
        expect(appearance[part], `${algorithm}: ${part}`).not.toBeNull();
        for (const property of ["width", "height"] as const) expect(appearance[part]![property], `${algorithm}: ${part}.${property}`).toBeCloseTo(reference[part]![property], 1);
      }
      for (const part of ["primary", "previous", "header", "back", "speed", "bubble", "progress"] as const) {
        for (const property of ["background", "image", "color", "font", "radius", "shadow"] as const) {
          expect(appearance[part]![property], `${algorithm}: ${part}.${property}`).toBe(reference[part]![property]);
        }
      }
      for (const property of ["color", "font"] as const) expect(appearance.narration![property], `${algorithm}: narration.${property}`).toBe(reference.narration![property]);
      expect(appearance.root.scrollWidth, `${algorithm}: no horizontal page overflow`).toBeLessThanOrEqual(viewport.width);
      for (const part of ["pig", "primary", "previous", "speed", "bubble"] as const) {
        const box = appearance[part]!;
        expect(box.y, `${algorithm}: ${part} top`).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height, `${algorithm}: ${part} bottom`).toBeLessThanOrEqual(viewport.height + 1);
        expect(box.x, `${algorithm}: ${part} left`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${algorithm}: ${part} right`).toBeLessThanOrEqual(viewport.width + 1);
      }
      await page.screenshot({ path: `.qa/demo-${algorithm.split(" ")[0].toLowerCase()}-${viewport.width}.png`, animations: "disabled" });
      await expect(root).toBeVisible();
    }
    writeFileSync(`.qa/demo-audit-${viewport.width}.json`, JSON.stringify(audit, null, 2));
  });
}

test("every algorithm demo uses the same green completion action and can replay", async ({ page }) => {
  for (const algorithm of algorithms) {
    await enterTrack(page, algorithm, "Demo");
    await page.emulateMedia({ reducedMotion: "reduce" });
    const next = page.getByRole("button", { name: "Bước tiếp", exact: true });
    let steps = 0;
    while (await next.count() && steps < 150) { await next.click(); steps++; }
    expect(steps).toBeLessThan(150);
    const tryIt = page.getByRole("button", { name: "Tự mình thử", exact: true });
    await expect(tryIt).toHaveCSS("background-color", "rgb(142, 180, 114)");
    await expect(page.locator(".demo-panel .pig")).toHaveAttribute("data-mood", "celebrate");
    await page.getByRole("button", { name: "Xem lại từ đầu", exact: true }).click();
    await expect(page.getByRole("button", { name: "Bước trước", exact: true })).toBeDisabled();
    await expect(page.locator(".demo-panel .chunky-button")).toHaveCSS("background-color", "rgb(162, 132, 204)");
  }
});

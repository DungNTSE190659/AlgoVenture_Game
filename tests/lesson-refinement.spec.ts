import { enterTrack } from "./track-navigation";
import { test, expect, type Page } from "@playwright/test";
async function enter(page: Page) {
  await enterTrack(page, "Quick Sort", "Demo");
}

test("destination explains keep, real swap, and same-position cases", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enter(page);
  await expect(page.locator(".lesson-narration")).toContainText(
    "Quick Sort có nhiều cách chọn chốt",
  );
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".lesson-narration")).toContainText(
    "Giữ 5 ở cuối giúp mình xét các số phía trước",
  );
  await expect(
    page.getByRole("img", { name: "Ô nhận số nhỏ tiếp theo: 0", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".lesson-narration")).toContainText("Giữ 8 ở ô 0");
  await expect(page.locator(".lesson-narration")).not.toContainText("bên phải");
  await expect(page.locator(".lesson-target-readout")).toContainText("0");
  await page.waitForTimeout(350);
  await page.screenshot({ path: ".qa/lesson-keep-explained.png" });
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".cell-scan")).toHaveAttribute("data-index", "1");
  await expect(page.locator(".lesson-goal-slot")).toHaveAttribute(
    "data-target-index",
    "0",
  );
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".lesson-narration")).toContainText(
    "Hai ô khác nhau",
  );
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".lesson-position-reason")).toContainText(
    "Ô 1 ≠ ô 0",
  );
  await page.waitForTimeout(350);
  await page.screenshot({ path: ".qa/lesson-swap-explained.png" });
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByLabel("Các phần tử của mảng").fill("2,2,2,2,2");
  await page
    .getByRole("button", { name: "Dùng mảng này", exact: true })
    .click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  await expect(page.locator(".lesson-narration")).toContainText(
    "Đổi với chính mình",
  );
  await expect(page.locator(".lesson-decision-copy")).toContainText(
    "Đúng ô rồi, giữ nguyên",
  );
  await expect(page.locator(".lesson-swap-arcs")).toHaveCount(0);
});

test("real synthesized cues are audible, short, and do not clip", async ({
  page,
}) => {
  await enter(page);
  const rendered = await page.evaluate(async () => {
    const audio = await import("/src/audio/gameAudio.ts");
    const cues = [
      "tap",
      "drop",
      "topic-next",
      "topic-prev",
      "island-select",
      "locked",
      "step-left",
      "step-right",
      "arrive",
      "ui-open",
      "ui-close",
      "sound-on",
      "enter",
      "pivot",
      "scan",
      "keep",
      "small",
      "swap",
      "bubble-swap",
      "pivot-move",
      "split",
      "finish",
      "correct",
      "retry",
      "hint",
    ];
    const results = [];
    for (const cue of cues) {
      const context = new OfflineAudioContext(2, 88200, 44100);
      audio.renderCue(context, context.destination, cue, 0);
      const buffer = await context.startRendering();
      const samples = buffer.getChannelData(0);
      let energy = 0,
        peak = 0,
        last = 0;
      for (let index = 0; index < samples.length; index++) {
        const value = samples[index];
        energy += value * value;
        peak = Math.max(peak, Math.abs(value));
        if (Math.abs(value) > 0.0001) last = index;
      }
      results.push({
        cue,
        rms: Math.sqrt(energy / samples.length),
        peak,
        duration: last / 44100,
      });
    }
    return results;
  });
  for (const sound of rendered) {
    expect(sound.rms, sound.cue).toBeGreaterThan(0.001);
    expect(sound.peak, sound.cue).toBeLessThan(0.5);
    expect(sound.duration, sound.cue).toBeLessThan(1.9);
  }
});

test("sounds follow actions, mute persists, and pausing cancels pending sounds", async ({
  page,
}) => {
  await enter(page);
  await page.evaluate(async () => {
    const source = performance
      .getEntriesByType("resource")
      .find(
        (entry) => new URL(entry.name).pathname === "/src/audio/gameAudio.ts",
      )!.name;
    const { gameAudio } = await import(source);
    const trace: { played: string[]; stopped: number } = {
      played: [],
      stopped: 0,
    };
    (window as any).__soundTrace = trace;
    const play = gameAudio.play.bind(gameAudio),
      stop = gameAudio.stop.bind(gameAudio);
    gameAudio.play = (cue: any) => {
      const played = play(cue);
      if (played) trace.played.push(cue);
      return played;
    };
    gameAudio.stop = () => {
      trace.stopped++;
      stop();
    };
  });
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  const trace = await page.evaluate(() => (window as any).__soundTrace.played);
  expect(trace).toEqual(["pivot", "scan", "keep"]);
  await page.getByRole("button", { name: "Phát demo", exact: true }).click();
  await page
    .getByRole("button", { name: "Tạm dừng demo", exact: true })
    .click();
  expect(
    await page.evaluate(() => (window as any).__soundTrace.stopped),
  ).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
  await page.getByRole("button", { name: "Tắt âm thanh", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Bật âm thanh", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => localStorage.getItem("piggy-sound"))).toBe(
    "off",
  );
  await page.getByRole("button", { name: "Tiếp tục xem", exact: true }).click();
  const count = await page.evaluate(
    () => (window as any).__soundTrace.played.length,
  );
  await page.getByRole("button", { name: "Bước tiếp", exact: true }).click();
  expect(
    await page.evaluate(() => (window as any).__soundTrace.played.length),
  ).toBe(count);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Bật âm thanh", exact: true }),
  ).toBeVisible();
});

import { expect, it } from "vitest";
import { createLesson } from "../engine/lesson";
import { lessonSound } from "./lessonSound";

it("uses neutral sounds for a larger value and movement sounds only on actual movement", () => {
  const frames = createLesson([8, 3, 6, 2, 5]);
  expect(lessonSound(frames[0])).toBeNull();
  expect(
    lessonSound(frames.find((frame) => frame.decision === "keep-large")!),
  ).toBe("keep");
  expect(lessonSound(frames.find((frame) => frame.kind === "SWAP")!)).toBe(
    "tap",
  );
  expect(lessonSound(frames.find((frame) => frame.kind === "MOVED")!)).toBe(
    "swap",
  );
  expect(lessonSound(frames.find((frame) => frame.kind === "FIXED")!)).toBe(
    "pivot-move",
  );
  expect(lessonSound(frames.at(-1)!)).toBe("finish");
});

it("does not play a swoosh when the pivot stays in the same position", () => {
  const fixed = createLesson([1, 2, 3, 4, 5]).find(
    (frame) => frame.kind === "FIXED",
  )!;
  expect(fixed.swapIds).toBeNull();
  expect(lessonSound(fixed)).toBe("pivot");
});

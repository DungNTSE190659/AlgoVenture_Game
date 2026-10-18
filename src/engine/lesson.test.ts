import { describe, expect, it } from "vitest";
import { createLesson } from "./lesson";

describe("teaching timeline", () => {
  it.each([
    [8, 3, 6, 2, 5],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [2, 2, 2, 2, 2],
    [-3, 5, 2, -3, 7, 0, 2, 4],
    [1],
    [],
  ])(
    "has correct snapshots, groups and fixed pivots for %j",
    (...input: number[]) => {
      const original = [...input];
      const frames = createLesson(input);
      const sorted = [...input].sort((a, b) => a - b);
      expect(input).toEqual(original);
      expect(frames[0].kind).toBe("INTRO");
      expect(frames.at(-1)!.kind).toBe("DONE");
      expect(frames.at(-1)!.items.map((item) => item.value)).toEqual(sorted);
      for (const frame of frames) {
        expect(
          frame.items.map((item) => item.value).sort((a, b) => a - b),
        ).toEqual(sorted);
        expect(new Set(frame.items.map((item) => item.id)).size).toBe(
          input.length,
        );
        expect(frame.narration).not.toMatch(/chạm|nhấp|bấm|điểm/i);
        expect(frame.narration).not.toMatch(
          /[≤≥<>=→↔≠]|\bA\[|(?<!\p{L})[ij](?!\p{L})/u,
        );
        expect(frame.title.length).toBeGreaterThan(0);
        for (const position of frame.settled)
          expect(frame.items[position].value).toBe(sorted[position]);
        const pivot = frame.items[frame.pivotIndex]?.value;
        if (
          pivot !== undefined &&
          !["FOCUS", "INTRO", "DONE"].includes(frame.kind)
        ) {
          for (let index = frame.range[0]; index <= frame.range[1]; index++) {
            if (frame.settled.includes(index) || index === frame.pivotIndex)
              continue;
            if (index <= frame.boundary)
              expect(frame.items[index].value).toBeLessThanOrEqual(pivot);
            else if (index <= frame.processedEnd)
              expect(frame.items[index].value).toBeGreaterThan(pivot);
          }
        }
        if (frame.equation)
          expect(frame.equation.operator === "≤").toBe(
            frame.equation.a <= frame.equation.b,
          );
        if (frame.split) {
          expect(
            frame.split.left.every((value) => value <= frame.split!.pivot),
          ).toBe(true);
          expect(
            frame.split.right.every((value) => value > frame.split!.pivot),
          ).toBe(true);
        }
      }
    },
  );

  it("shows observe → decide → swap preview → movement as separate beats", () => {
    const frames = createLesson([8, 3, 6, 2, 5]);
    const compare = frames.findIndex(
      (frame) =>
        frame.kind === "SCAN" && frame.items[frame.scanIndex!].value === 3,
    );
    expect(
      frames.slice(compare, compare + 4).map((frame) => frame.kind),
    ).toEqual(["SCAN", "DECIDE", "SWAP", "MOVED"]);
    expect(frames[compare + 2].items.map((item) => item.value)).toEqual([
      8, 3, 6, 2, 5,
    ]);
    expect(frames[compare + 3].items.map((item) => item.value)).toEqual([
      3, 8, 6, 2, 5,
    ]);
    expect(frames[compare + 3].swapIds).toEqual([0, 1]);
  });

  it("explains a pivot becoming fixed and the unsorted child arrays before recursion", () => {
    const frames = createLesson([8, 3, 6, 2, 5]);
    const split = frames.findIndex((frame) => frame.kind === "SPLIT");
    expect(frames[split - 1].kind).toBe("FIXED");
    expect(frames[split].split).toEqual({
      left: [3, 2],
      pivot: 5,
      right: [8, 6],
    });
    expect(frames[split + 1].kind).toBe("FOCUS");
    expect(frames[split + 1].range).toEqual([0, 1]);
  });

  it("never mutates earlier frames while producing swaps", () => {
    const frames = createLesson([8, 3, 6, 2, 5]);
    frames[0].items[0].value = 999;
    expect(frames[1].items[0].value).toBe(8);
  });

  it("explains why the first large element stays physically at the start", () => {
    const frames = createLesson([8, 3, 6, 2, 5]);
    const keep = frames.find((frame) => frame.decision === "keep-large")!;
    expect(keep.nextSlot).toBe(0);
    expect(keep.scanIndex).toBe(0);
    expect(keep.boundary).toBe(-1);
    expect(keep.narration).toContain("Giữ 8 ở ô 0");
    expect(keep.narration).toContain("Ô 0 vẫn chờ số nhỏ hơn hoặc bằng 5");
    expect(keep.equation!.result).toBe("Giữ ở ô 0");
    expect(keep.narration).not.toContain("bên phải");
  });

  it("connects the reason to the exact source and destination rather than swapping with the pivot", () => {
    const frames = createLesson([8, 3, 6, 2, 5]);
    const decision = frames.find((frame) => frame.decision === "swap-small")!;
    expect(decision.scanIndex).toBe(1);
    expect(decision.nextSlot).toBe(0);
    expect(decision.narration).toContain("đang chứa 8");
    expect(decision.narration).toContain("Hai ô khác nhau");
    const preview = frames.find((frame) => frame.kind === "SWAP")!;
    expect(preview.swapIds).toEqual([0, 1]);
    expect(preview.targetRole).toBe("small");
    expect(preview.narration).toContain("Chốt 5 chưa di chuyển");
    const moved = frames[preview.id + 1];
    expect(moved.nextSlot).toBe(1);
    expect(moved.boundary).toBe(0);
  });

  it("distinguishes an already correct slot, including equality with the pivot", () => {
    const frames = createLesson([2, 2, 2, 2, 2]);
    const self = frames.find((frame) => frame.decision === "keep-small")!;
    expect(self.scanIndex).toBe(self.nextSlot);
    expect(self.narration).toContain("2 bằng chốt 2");
    expect(self.narration).toContain("Đổi với chính mình");
    expect(self.equation!.result).toBe("Đúng ô rồi, giữ nguyên");
    expect(frames.filter((frame) => frame.swapIds !== null)).toHaveLength(0);
    const pivot = frames.find((frame) => frame.decision === "keep-pivot")!;
    expect(pivot.pivotIndex).toBe(pivot.nextSlot);
    expect(pivot.targetRole).toBe("pivot");
  });

  it("explains an empty small group when the pivot is the smallest number", () => {
    const frame = createLesson([9, 8, 7, 6, 1]).find(
      (frame) => frame.decision === "place-pivot",
    )!;
    expect(frame.nextSlot).toBe(0);
    expect(frame.narration).toContain("Nhóm nhỏ đang rỗng");
    expect(frame.narration).toContain("chốt phải vào ô 0");
  });
  it("explains that the pivot is next when the last scanned number is large", () => {
    const frame = createLesson([9, 8, 7, 6, 1]).find(
      (frame) => frame.kind === "DECIDE" && frame.scanIndex === 3,
    )!;
    expect(frame.decision).toBe("keep-large");
    expect(frame.narration).toContain("Đã xét hết");
    expect(frame.narration).toContain("bước sau sẽ đặt chốt vào ô 0");
    expect(frame.narration).not.toContain("Gặp số");
  });
});

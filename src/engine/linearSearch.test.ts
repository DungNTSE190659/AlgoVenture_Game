import { describe, expect, it } from "vitest";
import { createLinearSearch, createLinearSearchLesson, expectedLinearAction, linearSearchMove } from "./linearSearch";

describe("Linear Search", () => {
  it("requires inspection in sequence and rejects decisions before comparison", () => {
    const input = [8, 3, 8];
    const initial = createLinearSearch(input, 3);
    expect(linearSearchMove(initial, "found")).toBeNull();
    expect(linearSearchMove(initial, "continue")).toBeNull();
    expect(linearSearchMove(initial, "inspect", 1)).toBeNull();
    expect(linearSearchMove(initial, "inspect", -1)).toBeNull();
    const inspected = linearSearchMove(initial, "inspect", 0)!;
    expect(inspected.comparisons).toBe(1);
    expect(inspected.inspected).toEqual([0]);
    expect(linearSearchMove(inspected, "inspect")).toBeNull();
    expect(linearSearchMove(inspected, "found")).toBeNull();
    expect(linearSearchMove(inspected, "absent")).toBeNull();
    const next = linearSearchMove(inspected, "continue")!;
    expect(next.cursor).toBe(1);
    expect(next.phase).toBe("inspect");
    expect(next.comparisons).toBe(1);
    expect(initial.inspected).toEqual([]);
    expect(initial.phase).toBe("inspect");
    expect(inspected.phase).toBe("decide");
    expect(input).toEqual([8, 3, 8]);
  });

  it("stops at the first occurrence and refuses to skip a match", () => {
    const inspected = linearSearchMove(createLinearSearch([5, 5, 2], 5), "inspect")!;
    expect(linearSearchMove(inspected, "continue")).toBeNull();
    expect(linearSearchMove(inspected, "absent")).toBeNull();
    const done = linearSearchMove(inspected, "found")!;
    expect(done.result).toBe(0);
    expect(done.comparisons).toBe(1);
    for (const action of ["inspect", "continue", "found", "absent"] as const) {
      expect(linearSearchMove(done, action)).toBeNull();
    }
  });

  it("permits absent only after inspecting the final mismatch", () => {
    const initial = createLinearSearch([7], 4);
    expect(linearSearchMove(initial, "absent")).toBeNull();
    const inspected = linearSearchMove(initial, "inspect")!;
    expect(linearSearchMove(inspected, "continue")).toBeNull();
    expect(linearSearchMove(inspected, "found")).toBeNull();
    const done = linearSearchMove(inspected, "absent")!;
    expect(done.result).toBe(-1);
    expect(done.comparisons).toBe(1);
    expect(createLinearSearch([], 3)).toMatchObject({ phase: "done", result: -1, comparisons: 0 });
  });

  it("agrees with indexOf and maintains the checked prefix for all small inputs", () => {
    for (let length = 0; length <= 4; length++) {
      for (let code = 0; code < 3 ** length; code++) {
        let digits = code;
        const input = Array.from({ length }, () => { const n = digits % 3 - 1; digits = Math.floor(digits / 3); return n; });
        for (const target of [-1, 0, 1, 2]) {
          let state = createLinearSearch(input, target);
          let moves = 0;
          while (state.phase !== "done" && moves++ < length * 2 + 1) {
            state = linearSearchMove(state, expectedLinearAction(state)!)!;
            expect(state.inspected).toEqual(Array.from({ length: state.comparisons }, (_, i) => i));
            expect(state.items.map(item => item.value)).toEqual(input);
          }
          expect(state.phase).toBe("done");
          expect(state.result).toBe(input.indexOf(target));
          expect(state.comparisons).toBe(state.result === -1 ? input.length : state.result! + 1);
        }
      }
    }
  });

  it("produces deterministic lesson snapshots with the same comparison count as gameplay", () => {
    const cases: [number[], number][] = [[[], 2], [[2], 2], [[9, -2, 9, 0], 0], [[2, 2], 3], [[0, -1, -1], -1]];
    for (const [input, target] of cases) {
      const frames = createLinearSearchLesson(input, target);
      expect(frames).toEqual(createLinearSearchLesson(input, target));
      const final = frames.at(-1)!;
      expect(final.state.result).toBe(input.indexOf(target));
      expect(final.state.phase).toBe("done");
      expect(final.cue).toBe("finish");
      expect(frames[0].state.inspected).toEqual([]);
    }
  });

  it("rejects non-finite inputs", () => {
    expect(() => createLinearSearch([Number.NaN], 1)).toThrow();
    expect(() => createLinearSearch([1], Number.POSITIVE_INFINITY)).toThrow();
  });
});

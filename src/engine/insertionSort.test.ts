import { describe, expect, it } from "vitest";
import { createInsertion, createInsertionLesson, insertionMove, needsShift, type InsertionAction } from "./insertionSort";

describe("Insertion Sort", () => {
  it("moves a hole left, rejects premature insertion, and never mutates snapshots", () => {
    const initial = createInsertion([4, 2, 3]);
    const picked = insertionMove(initial, "pick")!;
    expect(picked.key).toEqual({ id: 1, value: 2 });
    expect(picked.items.map(item => item?.value)).toEqual([4, undefined, 3]);
    expect(insertionMove(picked, "insert")).toBeNull();
    const shifted = insertionMove(picked, "shift")!;
    expect(shifted.hole).toBe(0);
    expect(insertionMove(shifted, "shift")).toBeNull();
    expect(insertionMove(shifted, "insert")!.items.map(item => item?.value)).toEqual([2, 4, 3]);
    expect(initial.items.map(item => item?.value)).toEqual([4, 2, 3]);
    expect(picked.items[0]?.value).toBe(4);
  });
  it("preserves all identities and stable duplicate order for every small input", () => {
    for (let code = 0; code < 625; code++) {
      let value = code;
      const input = Array.from({ length: 4 }, () => { const n = value % 5 - 2; value = Math.floor(value / 5); return n; });
      let state = createInsertion(input);
      for (let move = 0; state.phase !== "done" && move < 40; move++) {
        const action: InsertionAction = state.phase === "pick" ? "pick" : needsShift(state) ? "shift" : "insert";
        state = insertionMove(state, action)!;
        const cargo = [...state.items.filter(item => item !== null), ...(state.key ? [state.key] : [])];
        expect(cargo.map(item => item.id).sort()).toEqual([0, 1, 2, 3]);
        expect(state.items.filter(item => item === null)).toHaveLength(state.key ? 1 : 0);
      }
      expect(state.phase).toBe("done");
      expect(state.items).toEqual(input.map((value, id) => ({ value, id })).sort((a, b) => a.value - b.value));
      expect(insertionMove(state, "pick")).toBeNull();
    }
  });
  it("uses the same transitions for the demo and completes negative, equal, sorted and reversed inputs", () => {
    for (const input of [[], [3], [1, 2], [2, 2], [8, 7, 6, 5, 4, 3, 2, 1], [-99, 99, 0, -99]]) {
      const frames = createInsertionLesson(input);
      expect(frames.at(-1)!.state.phase).toBe("done");
      expect(frames.at(-1)!.state.items.map(item => item!.value)).toEqual([...input].sort((a, b) => a - b));
      expect(frames.at(-1)!.cue).toBe("finish");
    }
    expect(createInsertionLesson([2, 2]).some(frame => frame.cue === "bubble-swap")).toBe(false);
  });
});

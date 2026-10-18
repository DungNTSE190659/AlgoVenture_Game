import { describe, expect, it } from "vitest";
import { chooseSelection, createSelection, createSelectionLesson, placeSelection, selectionMinimum } from "./selectionSort";

describe("Selection Sort", () => {
  it("rejects non-minima, fixed numbers and incorrect targets without mutating snapshots", () => {
    const first = createSelection([4, 1, 3, 2]);
    expect(chooseSelection(first, 0)).toBeNull();
    expect(chooseSelection(first, 99)).toBeNull();
    const picked = chooseSelection(first, 1)!;
    expect(placeSelection(picked, 2)).toBeNull();
    expect(chooseSelection(picked, 1)).toBeNull();
    const placed = placeSelection(picked, 0)!;
    expect(placed.items.map(item => item.value)).toEqual([1, 4, 3, 2]);
    expect(placed.swaps).toBe(1);
    expect(chooseSelection(placed, 1)).toBeNull();
    expect(first.items.map(item => item.value)).toEqual([4, 1, 3, 2]);
    expect(picked.items).toBe(first.items);
  });
  it("sorts all small inputs, preserves identities, and fixes a correct prefix each round", () => {
    for (let code = 0; code < 625; code++) {
      let value = code;
      const input = Array.from({ length: 4 }, () => { const number = value % 5 - 2; value = Math.floor(value / 5); return number; });
      let state = createSelection(input);
      while (state.phase !== "done") {
        const chosen = selectionMinimum(state)!;
        const before = state;
        state = placeSelection(chooseSelection(state, chosen.id)!, state.start)!;
        expect(state.items.map(item => item.id).sort()).toEqual([0, 1, 2, 3]);
        expect(state.items.slice(0, state.start).map(item => item.value)).toEqual([...input].sort((a, b) => a - b).slice(0, state.start));
        expect(before.items.map(item => item.value)).toHaveLength(input.length);
      }
      expect(state.items.map(item => item.value)).toEqual([...input].sort((a, b) => a - b));
      expect(state.rounds).toBe(3);
      expect(placeSelection(state, 0)).toBeNull();
    }
  });
  it("accepts either equal minimum, supports no-op placement, and never claims stability", () => {
    const equal = createSelection([2, 1, 1]);
    expect(chooseSelection(equal, 1)).not.toBeNull();
    expect(chooseSelection(equal, 2)).not.toBeNull();
    const sorted = createSelection([1, 2]);
    expect(placeSelection(chooseSelection(sorted, 0)!, 0)?.swaps).toBe(0);
    let state = createSelection([2, 2, 1]);
    while (state.phase !== "done") state = placeSelection(chooseSelection(state, selectionMinimum(state)!.id)!, state.start)!;
    expect(state.items.filter(item => item.value === 2).map(item => item.id)).toEqual([1, 0]);
  });
  it("demo scans the whole suffix before selecting, then uses the same swap engine", () => {
    for (const input of [[], [1], [1, 2], [3, 3, -99, 99, 0], [8, 7, 6, 5, 4, 3, 2, 1]]) {
      const frames = createSelectionLesson(input);
      expect(frames.at(-1)!.kind).toBe("done");
      expect(frames.at(-1)!.state.items.map(item => item.value)).toEqual([...input].sort((a, b) => a - b));
      expect(frames.filter(frame => frame.kind === "scan")).toHaveLength(input.length * (input.length - 1) / 2);
    }
    expect(() => createSelection([NaN])).toThrow();
  });
});

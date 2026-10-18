import { describe, expect, it } from "vitest";
import {
  createArray,
  createQuickSortSteps,
  validateSelection,
  type Step,
} from "./quicksort";

function assertValidTimeline(input: number[]) {
  const original = [...input];
  const steps = createQuickSortSteps(input);
  const sorted = [...input].sort((a, b) => a - b);
  expect(input).toEqual(original);
  expect(steps.at(-1)!.actionType).toBe("DONE");
  expect(steps.at(-1)!.arrayState).toEqual(sorted);
  for (let k = 0; k < steps.length; k++) {
    const step = steps[k];
    expect([...step.arrayState].sort((a, b) => a - b)).toEqual(sorted);
    expect(new Set(step.items.map((item) => item.id)).size).toBe(input.length);
    expect(step.items.map((item) => item.value)).toEqual(step.arrayState);
    for (const index of step.sortedIndices)
      expect(step.arrayState[index]).toBe(sorted[index]);
    if (step.actionType === "DONE") {
      expect(step.sortedIndices.length).toBe(input.length);
      continue;
    }
    const [left, right] = step.activeRange;
    expect(step.pivotIndex).toBe(right);
    expect(
      step.expectedIndices.every((index) => index >= left && index <= right),
    ).toBe(true);
    expect(validateSelection(step, [...step.expectedIndices].reverse())).toBe(
      true,
    );
    const after = [...step.arrayState];
    if (step.actionType === "SWAP" || step.actionType === "PLACE_PIVOT") {
      const [a, b = a] = step.expectedIndices;
      [after[a], after[b]] = [after[b], after[a]];
      if (step.actionType === "PLACE_PIVOT") {
        const position = step.i + 1;
        expect(
          after
            .slice(left, position)
            .every((value) => value <= after[position]),
        ).toBe(true);
        expect(
          after
            .slice(position + 1, right + 1)
            .every((value) => value > after[position]),
        ).toBe(true);
      }
    }
    expect(steps[k + 1].arrayState).toEqual(after);
    if (step.actionType === "COMPARE")
      expect(step.comparingIndices).toEqual([step.j, right]);
  }
}

describe("Lomuto timeline", () => {
  it.each([
    [],
    [1],
    [8, 3, 6, 2, 5],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [7, 7, 7, 7],
    [5, 2, 5, 1, 5, 2, 9, 5],
    [0, -5, 8, -5, 0],
    [2, 1],
    [1, 2],
  ])("has valid snapshots and partitions for %j", (...values: number[]) =>
    assertValidTimeline(values),
  );

  it("sorts 300 seeded arrays and preserves every partition invariant", () => {
    let seed = 4521;
    const next = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let test = 0; test < 300; test++) {
      const input = Array.from(
        { length: Math.floor(next() * 9) },
        () => Math.floor(next() * 11) - 5,
      );
      assertValidTimeline(input);
    }
  });

  it("uses ≤ so duplicate pivots stay in the left partition", () => {
    const steps = createQuickSortSteps([2, 1, 2]);
    const placement = steps.find((step) => step.actionType === "PLACE_PIVOT")!;
    expect(placement.i + 1).toBe(2);
    expect(placement.expectedIndices).toEqual([2]);
  });

  it("does not alias snapshot arrays or the source input", () => {
    const input = [3, 1, 2];
    const steps = createQuickSortSteps(input);
    steps[0].arrayState[0] = 999;
    steps[0].items[0].value = 999;
    expect(steps[1].arrayState[0]).toBe(3);
    expect(steps[1].items[0].value).toBe(3);
    expect(input).toEqual([3, 1, 2]);
  });

  it.each([NaN, Infinity, -Infinity])(
    "rejects non-finite value %s",
    (value) => {
      expect(() => createQuickSortSteps([value])).toThrow();
    },
  );
});

describe("validator", () => {
  const steps = createQuickSortSteps([8, 3, 6, 2, 5]);
  const compare = steps.find((step) => step.actionType === "COMPARE")!;
  it("accepts the correct pair in either order", () => {
    expect(validateSelection(compare, [0, 4])).toBe(true);
    expect(validateSelection(compare, [4, 0])).toBe(true);
  });
  it.each([[0], [0, 0], [0, 3], [0, 4, 2], [-1, 4]])(
    "rejects invalid selection %j",
    (...indices: number[]) => {
      expect(validateSelection(compare, indices)).toBe(false);
    },
  );
  it("never advances DONE with a selection", () => {
    expect(validateSelection(steps.at(-1) as Step, [])).toBe(false);
  });
});

describe("level generator", () => {
  it("uses five/seven/eight elements and guarantees hard-level duplicates", () => {
    for (let i = 0; i < 100; i++) {
      expect(createArray("easy")).toHaveLength(5);
      expect(createArray("medium")).toHaveLength(7);
      const hard = createArray("hard");
      expect(hard).toHaveLength(8);
      expect(new Set(hard).size).toBeLessThan(8);
      assertValidTimeline(hard);
    }
  });
});

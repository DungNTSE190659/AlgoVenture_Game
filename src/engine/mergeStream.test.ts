import { describe, expect, it } from "vitest";
import { createMergeStream, nextStreamGroup, selectStreamGroup, splitStreamGroup, takeStreamLeaf } from "./mergeStream";
import { mergeExpected } from "./mergeSort";

describe("Suối Hợp Nhất", () => {
  it("requires manual splits, keeps contiguous identities and allows choosing either branch", () => {
    const initial = createMergeStream([4, 3, 2, 1]);
    expect(takeStreamLeaf(initial, "left", 0)).toBe(initial);
    const split = splitStreamGroup(initial);
    expect(initial.groups).toHaveLength(1);
    expect(split.groups.map(group => group.items.map(item => item.id))).toEqual([[0, 1], [2, 3]]);
    const rightFirst = splitStreamGroup(selectStreamGroup(split, "rootR"));
    expect(rightFirst.groups.map(group => group.items.map(item => item.id))).toEqual([[0, 1], [2], [3]]);
    expect(rightFirst.phase).toBe("split");
    expect(splitStreamGroup(rightFirst).phase).toBe("merge");
  });
  it("rejects wrong, non-head and unstable choices without ending or changing the board", () => {
    const run = splitStreamGroup(createMergeStream([5, 5]));
    const wrong = takeStreamLeaf(run, "right", 1);
    expect(wrong.sorting).toBe(run.sorting);
    expect(wrong.phase).toBe("merge");
    expect(wrong.mistakes).toBe(1);
    expect(wrong.feedback).toContain("nhánh trái");
    const first = takeStreamLeaf(wrong, "left", 0);
    expect(first.sorting.moves).toBe(1);
    expect(first.sorting.right).toHaveLength(1);
    expect(nextStreamGroup(first)).toBe(first);
    const second = takeStreamLeaf(first, "right", 1);
    expect(second.phase).toBe("joined");
    expect(takeStreamLeaf(second, "left", 0)).toBe(second);
    expect(nextStreamGroup(second).phase).toBe("done");
  });
  it("finishes odd, reverse, negative and duplicate arrays stably without mutating snapshots", () => {
    for (const values of [[4, 3, 2, 1], [3, -1, 3, 0, -1], [8, 7, 6, 5, 4, 3, 2, 1], [5, 5], [1, 2, 3], [], [4]]) {
      let run = createMergeStream(values), guard = 0;
      while (run.phase !== "done" && guard++ < 100) {
        const before = JSON.stringify(run);
        const previous = run;
        if (run.phase === "split") run = splitStreamGroup(run);
        else if (run.phase === "joined") run = nextStreamGroup(run);
        else {
          const expected = mergeExpected(run.sorting)!;
          run = takeStreamLeaf(run, run.sorting.left[0]?.id === expected.id ? "left" : "right", expected.id);
        }
        expect(JSON.stringify(previous)).toBe(before);
        expect(run.groups.flatMap(group => group.items.map(item => item.id))).toEqual(values.map((_, id) => id));
      }
      expect(run.phase).toBe("done");
      expect(run.sorting.assembled).toEqual(values.map((value, id) => ({ value, id })).sort((a, b) => a.value - b.value || a.id - b.id));
      expect(run.score).toBe(run.splits * 50 + run.sorting.moves * 100);
    }
  });
});

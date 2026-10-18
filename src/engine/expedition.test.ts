import { describe, expect, it } from "vitest";
import {
  createExpedition,
  emptyArrangement,
  finishIsland,
  moveCargo,
} from "./expedition";

describe("player-controlled partitions", () => {
  it.each([
    [8, 3, 6, 2, 5],
    [2, 2, 2, 2, 2],
    [-3, 5, 2, -3, 7, 0, 2, 4],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [0],
    [],
  ])(
    "sorts with arbitrary pivots, crate order and child order: %j",
    (...values: number[]) => {
      let state = createExpedition(values);
      const original = JSON.stringify(state);
      let count = 0;
      while (state.islands.length) {
        const previous = state;
        const snapshot = JSON.stringify(previous);
        const island = state.islands.at(-1)!;
        const pivot = island.cargo[Math.floor(island.cargo.length / 2)];
        const value = state.cargo.find((item) => item.id === pivot)!.value;
        const others = [...island.cargo].reverse().filter((id) => id !== pivot);
        const result = finishIsland(state, island.id, {
          pivot,
          small: others.filter(
            (id) => state.cargo.find((item) => item.id === id)!.value <= value,
          ),
          large: others.filter(
            (id) => state.cargo.find((item) => item.id === id)!.value > value,
          ),
        });
        expect(result.ok).toBe(true);
        if (!result.ok) throw Error("Unexpected rejected partition");
        state = result.expedition;
        expect(JSON.stringify(previous)).toBe(snapshot);
        for (const id of state.fixed) {
          const position = state.cargo.findIndex((item) => item.id === id);
          expect(state.cargo[position].value).toBe(
            [...values].sort((a, b) => a - b)[position],
          );
        }
        expect(++count).toBeLessThanOrEqual(values.length);
      }
      expect(state.cargo.map((item) => item.value)).toEqual(
        [...values].sort((a, b) => a - b),
      );
      expect(new Set(state.cargo.map((item) => item.id)).size).toBe(
        values.length,
      );
      expect(state.fixed).toHaveLength(values.length);
      expect(JSON.stringify(createExpedition(values))).toBe(original);
    },
  );
  it("accepts free placements, catches wrong groups only at commitment, and permits correction", () => {
    const state = createExpedition([8, 3, 5]);
    let placed = moveCargo(emptyArrangement(), 2, "pivot");
    placed = moveCargo(placed, 0, "small");
    placed = moveCargo(placed, 1, "large");
    expect(finishIsland(state, "root", placed)).toEqual({
      ok: false,
      reason: "wrong-group",
      wrong: [0, 1],
    });
    placed = moveCargo(placed, 0, "large");
    placed = moveCargo(placed, 1, "small");
    const result = finishIsland(state, "root", placed);
    expect(
      result.ok && result.expedition.cargo.map((item) => item.value),
    ).toEqual([3, 5, 8]);
  });
  it("rejects missing, duplicated or foreign crates without mutating the board", () => {
    const state = createExpedition([1, 2, 3]);
    for (const arrangement of [
      { pivot: 2, small: [0], large: [] },
      { pivot: 2, small: [0, 0], large: [] },
      { pivot: 2, small: [0, 99], large: [] },
    ])
      expect(finishIsland(state, "root", arrangement)).toMatchObject({
        ok: false,
        reason: "missing",
      });
    expect(
      finishIsland(state, "root", { pivot: 99, small: [0], large: [1] }),
    ).toMatchObject({ ok: false, reason: "pivot" });
    expect(state.cargo.map((item) => item.value)).toEqual([1, 2, 3]);
  });
  it("changing or returning the pivot resets placements; equality belongs to the small group", () => {
    const placed = { pivot: 2, small: [0], large: [1] };
    expect(moveCargo(placed, 1, "pivot")).toEqual({
      pivot: 1,
      small: [],
      large: [],
    });
    expect(moveCargo(placed, 2, "pool")).toEqual(emptyArrangement());
    const equal = finishIsland(createExpedition([2, 2]), "root", {
      pivot: 0,
      small: [],
      large: [1],
    });
    expect(equal).toMatchObject({
      ok: false,
      reason: "wrong-group",
      wrong: [1],
    });
    expect(
      finishIsland(createExpedition([2, 2]), "root", {
        pivot: 0,
        small: [1],
        large: [],
      }).ok,
    ).toBe(true);
  });
});

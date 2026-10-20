import { describe, expect, it } from "vitest";
import { claimSearchRun, createSearchOrders, createSearchRun, scanSearchRun, searchReward, startSearchRun } from "./linearRun";

describe("Linear Search expedition", () => {
  it("reveals one position at a time and punishes passing the first match", () => {
    let run = startSearchRun(createSearchRun({ values: [2, 5, 5, 1], target: 5, interval: 900 }));
    run = scanSearchRun(run);
    expect(run).toMatchObject({ cursor: 0, comparisons: 1 });
    expect(claimSearchRun(run).phase).toBe("missed");
    run = scanSearchRun(run);
    expect(claimSearchRun(run)).toMatchObject({ phase: "won", result: 1, comparisons: 2 });
    expect(scanSearchRun(run)).toMatchObject({ phase: "missed", cursor: 1 });
  });
  it("requires checking every position before an absent claim, including the final match", () => {
    let run = startSearchRun(createSearchRun({ values: [-1, 2], target: 4, interval: 900 }));
    expect(claimSearchRun(run, true).phase).toBe("missed");
    run = scanSearchRun(scanSearchRun(run));
    expect(claimSearchRun(run, true).phase).toBe("missed");
    run = scanSearchRun(run);
    expect(claimSearchRun(run, true)).toMatchObject({ phase: "won", result: -1, comparisons: 2 });
    let last = startSearchRun(createSearchRun({ values: [1, 4], target: 4, interval: 800 }));
    last = scanSearchRun(scanSearchRun(last));
    expect(claimSearchRun(last)).toMatchObject({ phase: "won", result: 1 });
    expect(scanSearchRun(last).phase).toBe("missed");
  });
  it("generates six varied orders with increasing length and tempo", () => {
    for (let seed = 1; seed <= 40; seed++) {
      let n = seed;
      const orders = createSearchOrders(() => { n = (n * 1664525 + 1013904223) >>> 0; return n / 2 ** 32; });
      expect(orders.map(order => order.values.length)).toEqual([5, 8, 12, 16, 20, 24]);
      expect(orders.every((order, i) => i === 0 || order.interval < orders[i - 1].interval)).toBe(true);
      expect(orders[0].interval).toBeGreaterThan(orders[5].interval);
      orders.forEach((order, round) => {
        const index = order.values.indexOf(order.target);
        expect(index === -1).toBe(round === 2 || round === 5);
        if (round % 2 === 1 && index !== -1) expect(order.values[index + 1]).toBe(order.target);
        let run = startSearchRun(createSearchRun(order));
        while (run.phase === "scanning") {
          run = scanSearchRun(run);
          if (run.cursor === index && index !== -1) run = claimSearchRun(run);
        }
        if (run.phase === "end") run = claimSearchRun(run, true);
        expect(run.phase).toBe("won");
        expect(run.comparisons).toBe(index === -1 ? order.values.length : index + 1);
      });
    }
  });
  it("rewards fast correct decisions and caps the combo multiplier", () => {
    expect(searchReward(0, 400, 1000).points).toBeGreaterThan(searchReward(0, 800, 1000).points);
    expect(searchReward(4, 400, 1000).points).toBeGreaterThan(searchReward(0, 400, 1000).points);
    expect(searchReward(100, 400, 1000).multiplier).toBe(4);
  });
});

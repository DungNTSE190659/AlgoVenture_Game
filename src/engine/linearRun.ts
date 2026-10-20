export type SearchOrder = { values: number[]; target: number; interval: number };
export type SearchRun = {
  order: SearchOrder; cursor: number; phase: "ready" | "scanning" | "end" | "won" | "missed";
  comparisons: number; result: number | null;
};
export const RUN_LENGTH = 6;
export const CARD_COUNTS = [5, 8, 12, 16, 20, 24] as const;
export const CARD_INTERVALS = [1400, 1200, 1050, 900, 780, 650] as const;
export const RUN_RECORD_KEY = "algoventure.linear-record.v1";

/** Every expedition includes duplicates, missing targets, and longer unsorted arrays. */
export function createSearchOrders(random: () => number = Math.random): SearchOrder[] {
  return Array.from({ length: RUN_LENGTH }, (_, round) => {
    const length = CARD_COUNTS[round];
    const target = 2 + Math.floor(random() * 8);
    const candidates = Array.from({ length: 10 }, (_, i) => i + 1).filter(value => value !== target);
    const values = Array.from({ length }, () => candidates[Math.floor(random() * candidates.length)]);
    if (round !== 2 && round !== 5) {
      const first = 1 + Math.floor(random() * (length - 2));
      values[first] = target;
      if (round % 2 === 1) values[first + 1] = target;
    }
    return { values, target, interval: CARD_INTERVALS[round] };
  });
}
export function createSearchRun(order: SearchOrder): SearchRun {
  return { order, cursor: -1, phase: "ready", comparisons: 0, result: null };
}
export function startSearchRun(state: SearchRun): SearchRun {
  return state.phase === "ready" ? { ...state, phase: "scanning" } : state;
}
/** A missed first occurrence ends the attempt instead of silently skipping it. */
export function scanSearchRun(state: SearchRun): SearchRun {
  if (state.phase !== "scanning") return state;
  if (state.cursor >= 0 && state.order.values[state.cursor] === state.order.target) return { ...state, phase: "missed" };
  if (state.cursor === state.order.values.length - 1) return { ...state, phase: "end" };
  return { ...state, cursor: state.cursor + 1, comparisons: state.comparisons + 1 };
}
export function claimSearchRun(state: SearchRun, absent = false): SearchRun {
  if (state.phase !== "scanning" && state.phase !== "end") return state;
  const first = state.order.values.indexOf(state.order.target);
  const correct = absent ? state.phase === "end" && first === -1 : state.cursor === first && first !== -1;
  return { ...state, phase: correct ? "won" : "missed", result: correct ? absent ? -1 : state.cursor : null };
}
export function searchReward(streak: number, reaction: number, interval: number) {
  const multiplier = Math.min(4, 1 + Math.floor(streak / 2));
  const quick = reaction <= interval * .6;
  return { points: (quick ? 150 : 100) * multiplier, multiplier, quick };
}

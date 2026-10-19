import { describe, expect, it } from "vitest";
import { BINARY_LEVELS, binaryGuess, binaryGuessLimit, binaryMiddle, binaryRoundPoints, createBinaryLesson, createBinarySearch } from "./binarySearch";
describe("Binary Search", () => {
  it("starts at ten and increases the board size", () => {
    expect(BINARY_LEVELS[0]).toBe(10);
    expect(BINARY_LEVELS.every((n, i) => i === 0 || n > BINARY_LEVELS[i - 1])).toBe(true);
  });
  it("can find every secret within budget, including exact powers of two", () => {
    for (const count of [1, 2, 4, 8, 16, ...BINARY_LEVELS]) for (let secret = 1; secret <= count; secret++) {
      let state = createBinarySearch(count, secret);
      while (state.phase === "playing") state = binaryGuess(state, binaryMiddle(state))!;
      expect(state.phase).toBe("won");
      expect(state.guesses.length).toBeLessThanOrEqual(binaryGuessLimit(count));
      expect(state.guesses.at(-1)).toBe(secret);
    }
  });
  it("eliminates the guessed value and wrong half, preserving the input", () => {
    const initial = createBinarySearch(10, 7);
    const higher = binaryGuess(initial, 5)!;
    expect(higher).toMatchObject({ low: 6, high: 10, direction: "higher", phase: "playing" });
    expect(binaryGuess(higher, 3)).toBeNull();
    expect(binaryGuess(higher, 5)).toBeNull();
    const lower = binaryGuess(higher, 8)!;
    expect(lower).toMatchObject({ low: 6, high: 7, direction: "lower" });
    expect(initial.guesses).toEqual([]);
    expect(binaryGuess(lower, 7)?.phase).toBe("won");
  });
  it("loses after exhausting guesses but permits a win on the final guess", () => {
    let state = createBinarySearch(10, 10);
    for (const value of [1, 2, 3, 4]) state = binaryGuess(state, value)!;
    expect(state.phase).toBe("lost");
    expect(binaryGuess(state, 10)).toBeNull();
    expect(binaryRoundPoints(state)).toBe(0);
    let last = createBinarySearch(10, 10);
    for (const value of [1, 2, 3, 10]) last = binaryGuess(last, value)!;
    expect(last.phase).toBe("won");
    expect(binaryRoundPoints(last)).toBe(100);
  });
  it("creates deterministic demo frames without granting gameplay progress", () => {
    expect(createBinaryLesson()).toEqual(createBinaryLesson());
    expect(createBinaryLesson().at(-1)?.state.phase).toBe("won");
    expect(() => createBinarySearch(0)).toThrow();
    expect(() => createBinarySearch(10, 11)).toThrow();
  });
  it("teaches both directions in distinct probe, comparison and narrowing stages", () => {
    const frames = createBinaryLesson();
    expect(frames.map(frame => frame.kind)).toEqual(["intro", "probe", "compare", "narrow", "probe", "compare", "narrow", "probe", "compare", "narrow", "probe", "compare", "done"]);
    expect(frames.filter(frame => frame.kind === "probe").map(frame => frame.focus)).toEqual([5, 8, 6, 7]);
    expect(frames.filter(frame => frame.kind === "compare").map(frame => frame.relation)).toEqual([">", "<", ">", "="]);
    expect(frames[1].state.guesses).toHaveLength(0);
    expect(frames[2].state).toMatchObject({ low: 1, high: 10, guesses: [5] });
    expect(frames[3].state).toMatchObject({ low: 6, high: 10, guesses: [5] });
    expect(frames[5].state).toMatchObject({ low: 6, high: 10, guesses: [5, 8] });
    expect(frames[6].state).toMatchObject({ low: 6, high: 7 });
    expect(frames.at(-1)).toMatchObject({ resultIndex: 6, state: { phase: "won", guesses: [5, 8, 6, 7] } });
  });
  it("keeps narration and snapshots consistent and allows enough time to read each step", () => {
    const frames = createBinaryLesson();
    for (const frame of frames) {
      expect(frame.duration).toBeGreaterThanOrEqual(2400);
      expect(frame.state.low).toBeLessThanOrEqual(frame.state.secret);
      expect(frame.state.high).toBeGreaterThanOrEqual(frame.state.secret);
      if (frame.focus !== null) expect(frame.focus).toBeGreaterThanOrEqual(frame.state.low);
    }
    expect(frames[0].narration).toContain("tăng dần");
    expect(frames[0].narration).toContain("Chỉ số bắt đầu từ 0");
    expect(frames[0].focus).toBeNull();
  });
});

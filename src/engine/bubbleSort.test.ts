import { describe, expect, it } from "vitest";
import {
  bubbleMove,
  createBubble,
  createBubbleLesson,
  nextBubblePass,
} from "./bubbleSort";

describe("Bubble Sort adjacent comparisons", () => {
  it("sorts exhaustively with stable identities, fixed tails, and immutable snapshots", () => {
    for (let length = 2; length <= 7; length++) {
      const cases = 3 ** length;
      for (let code = 0; code < cases; code++) {
        let digits = code;
        const values = Array.from({ length }, () => {
          const n = (digits % 3) - 1;
          digits = Math.floor(digits / 3);
          return n;
        });
        let state = createBubble(values);
        while (state.phase !== "done") {
          if (state.phase === "pass") {
            state = nextBubblePass(state);
            continue;
          }
          const before = JSON.stringify(state),
            old = state;
          const swap =
            state.items[state.pair].value > state.items[state.pair + 1].value;
          expect(bubbleMove(state, !swap)).toBeNull();
          state = bubbleMove(state, swap)!;
          expect(JSON.stringify(old)).toBe(before);
          const tail = state.items
            .slice(state.end + 1)
            .map((item) => item.value);
          expect(tail).toEqual(
            [...values].sort((a, b) => a - b).slice(state.end + 1),
          );
          expect(state.comparisons).toBeLessThanOrEqual(
            (length * (length - 1)) / 2,
          );
        }
        expect(state.items.map((item) => item.id)).toEqual(
          values
            .map((value, id) => ({ value, id }))
            .sort((a, b) => a.value - b.value)
            .map((item) => item.id),
        );
      }
    }
  });
  it("ends after a full unchanged pass, without skipping an unseen pair", () => {
    let state = createBubble([-99, 0, 0, 99]);
    state = bubbleMove(state, false)!;
    expect(state.phase).toBe("compare");
    state = bubbleMove(state, false)!;
    expect(state.phase).toBe("compare");
    state = bubbleMove(state, false)!;
    expect(state.phase).toBe("done");
    expect(state.early).toBe(true);
    expect(state.comparisons).toBe(3);
    expect(bubbleMove(state, true)).toBeNull();
  });
  it("demo explains comparisons, equality, pass boundaries and early stopping with the same result as play", () => {
    for (const values of [
      [8, 3, 6, 2, 5],
      [-99, 99, 0, 0],
      [1, 1, 1],
      [2, 1],
    ]) {
      const frames = createBubbleLesson(values);
      expect(frames[0].kind).toBe("intro");
      expect(frames.at(-1)!.state.items.map((item) => item.value)).toEqual(
        [...values].sort((a, b) => a - b),
      );
      expect(frames.at(-1)!.kind).toBe("done");
      for (const frame of frames)
        expect(frame.narration).not.toMatch(/[→←≤≥]|(?:^|\s)[ij](?:\s|$)/);
    }
    expect(
      createBubbleLesson([1, 1, 1]).some(
        (frame) => frame.title === "Hai số bằng nhau",
      ),
    ).toBe(true);
    expect(
      createBubbleLesson([4, 3, 2, 1]).some((frame) => frame.kind === "pass"),
    ).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  bubbleMove,
  bubbleChallengeMove,
  bubbleResults,
  skipOrderedBubblePairs,
  createBubble,
  createBubbleLesson,
  nextBubblePass,
} from "./bubbleSort";

describe('Bubble challenge steps', () => {
  it('rejects other pairs, nonadjacent jumps and unnecessary exchanges without advancing', () => {
    const state = createBubble([8, 3, 6, 2, 5]);
    expect(bubbleChallengeMove(state, 2, 3)).toBeNull();
    expect(bubbleChallengeMove(state, 0, 3)).toBeNull();
    const next = bubbleChallengeMove(state, 1, 0)!;
    expect(next.items.map(item => item.value)).toEqual([3, 8, 6, 2, 5]);
    expect(next.pair).toBe(1);
    expect(state.items.map(item => item.value)).toEqual([8, 3, 6, 2, 5]);
    expect(bubbleChallengeMove(next, 1, 1)).toBeNull();
    expect(bubbleChallengeMove(createBubble([2, 2, 3]), 0, 1)).toBeNull();
    expect(bubbleChallengeMove(createBubble([1, 2]), 0, 1)).toBeNull();
    expect(bubbleMove(createBubble([2, 2]), false)?.phase).toBe('done');
  });
});

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

describe('Bubble result accuracy', () => {
  it('awards stars using exact accuracy thresholds and counts steps', () => {
    const base = createBubble([3, 1, 2]);
    for (const [correct, wrong, stars] of [[0, 0, 0], [0, 5, 0], [1, 4, 1], [1, 1, 2], [2, 1, 2], [3, 0, 3]]) {
      const result = bubbleResults({ ...base, comparisons: correct }, wrong);
      expect(result.stars).toBe(stars);
      expect(result.steps).toBe(correct + wrong);
      expect(result.accuracy).toBe(correct + wrong ? correct / (correct + wrong) : 0);
    }
  });
  it('does not count the next pass until a pair has actually been processed', () => {
    let state = createBubble([3, 1, 2]);
    expect(bubbleResults(state, 0).passes).toBe(0);
    state = bubbleMove(state, true)!;
    expect(bubbleResults(state, 0).passes).toBe(1);
    state = nextBubblePass(bubbleMove(state, true)!);
    expect(bubbleResults(state, 0).passes).toBe(1);
    state = bubbleMove(state, false)!;
    expect(bubbleResults(state, 0).passes).toBe(2);
  });
});

describe('Bubble automatic ordered pairs', () => {
  it('skips initial, consecutive, equal and pass-boundary pairs without changing the array', () => {
    const original = createBubble([1, 2, 2, 4, 3, 5]);
    const ready = skipOrderedBubblePairs(original);
    expect(ready.pair).toBe(3);
    expect(ready.comparisons).toBe(3);
    expect(ready.items).toEqual(original.items);
    expect(original.comparisons).toBe(0);
    const done = skipOrderedBubblePairs(bubbleChallengeMove(ready, 4, 3)!);
    expect(done.phase).toBe('done');
    expect(done.items.map(item => item.value)).toEqual([1, 2, 2, 3, 4, 5]);
    expect(done.comparisons).toBe(9);
    expect(done.swaps).toBe(1);
    expect(bubbleResults(done, 1, true)).toMatchObject({ steps: 2, correct: 1, comparisons: 9, passes: 2, stars: 2, accuracy: 0.5 });
  });
  it('finishes sorted inputs without granting automatic actions as player steps', () => {
    for (const values of [[1, 2], [2, 2], [-1, 0, 0, 3]]) {
      const done = skipOrderedBubblePairs(createBubble(values));
      expect(done.phase).toBe('done');
      expect(done.swaps).toBe(0);
      expect(done.comparisons).toBe(values.length - 1);
      expect(bubbleResults(done, 0, true)).toMatchObject({ steps: 0, correct: 0, stars: 3, accuracy: 1 });
    }
  });
  it('always stops at the next inverted pair until the algorithm completes', () => {
    for (let code = 0; code < 243; code++) {
      let digits = code;
      const values = Array.from({ length: 5 }, () => { const value = digits % 3; digits = Math.floor(digits / 3); return value; });
      let state = skipOrderedBubblePairs(createBubble(values));
      while (state.phase !== 'done') {
        expect(state.phase).toBe('compare');
        expect(state.items[state.pair].value).toBeGreaterThan(state.items[state.pair + 1].value);
        state = skipOrderedBubblePairs(bubbleChallengeMove(state, state.items[state.pair].id, state.pair + 1)!);
      }
      expect(state.items.map(item => item.value)).toEqual([...values].sort((a, b) => a - b));
      expect(state.comparisons).toBeLessThanOrEqual(10);
    }
  });
});

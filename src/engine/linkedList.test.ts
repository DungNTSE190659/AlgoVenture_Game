import { describe, expect, it } from "vitest";
import { connectLinkedNode, createLinkedPuzzle, linkedPuzzleComplete, placeLinkedNode } from "./linkedList";

describe("linked list construction", () => {
  it("keeps links attached to nodes when two mounted nodes exchange slots", () => {
    let puzzle = createLinkedPuzzle();
    puzzle = placeLinkedNode(puzzle, "a", 0);
    puzzle = placeLinkedNode(puzzle, "b", 1);
    puzzle = connectLinkedNode(puzzle, "a", "b");
    puzzle = placeLinkedNode(puzzle, "a", 1);
    expect(puzzle.slots).toEqual(["b", "a", null]);
    expect(puzzle.links.a).toBe("b");
  });

  it("prevents cycles and disconnects links to a node returned to the bank", () => {
    let puzzle = createLinkedPuzzle();
    puzzle = placeLinkedNode(puzzle, "a", 0);
    puzzle = placeLinkedNode(puzzle, "b", 1);
    puzzle = connectLinkedNode(puzzle, "a", "b");
    expect(connectLinkedNode(puzzle, "b", "a")).toBe(puzzle);
    puzzle = placeLinkedNode(puzzle, "b", null);
    expect(puzzle.links.a).toBeNull();
    expect(puzzle.slots).toEqual(["a", null, null]);
  });

  it("requires the correct head, order, next pointers and a free tail nail", () => {
    let puzzle = createLinkedPuzzle();
    puzzle = placeLinkedNode(puzzle, "a", 0);
    puzzle = placeLinkedNode(puzzle, "b", 1);
    puzzle = placeLinkedNode(puzzle, "c", 2);
    puzzle = connectLinkedNode(puzzle, "a", "b");
    puzzle = connectLinkedNode(puzzle, "b", "c");
    expect(linkedPuzzleComplete(puzzle)).toBe(true);
    expect(linkedPuzzleComplete(connectLinkedNode(puzzle, "a", "c"))).toBe(false);
  });
});

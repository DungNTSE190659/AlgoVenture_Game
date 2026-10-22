import { describe, expect, it } from "vitest";
import { TREE_IDS, board, createTreeCourse, deleteBST, insertBST, resolveTreeDrop, searchPath, traverse, treePositions, validBST } from "./tree";

const full = { 0: 40, 1: 20, 2: 60, 3: 10, 4: 30, 5: 50, 6: 70 };
describe("Tree algorithms", () => {
  it("distinguishes all four traversal orders", () => {
    expect(traverse(full, "preorder").map(i => full[i as keyof typeof full])).toEqual([40, 20, 10, 30, 60, 50, 70]);
    expect(traverse(full, "inorder").map(i => full[i as keyof typeof full])).toEqual([10, 20, 30, 40, 50, 60, 70]);
    expect(traverse(full, "postorder").map(i => full[i as keyof typeof full])).toEqual([10, 30, 20, 50, 70, 60, 40]);
    expect(traverse(full, "level")).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(traverse({}, "level")).toEqual([]);
  });
  it("checks ancestor bounds, duplicate keys and disconnected nodes", () => {
    expect(validBST(full)).toBe(true);
    expect(validBST({ ...full, 4: 45 })).toBe(false);
    expect(validBST({ ...full, 4: 40 })).toBe(false);
    expect(validBST({ 1: 20 })).toBe(false);
  });
  it("searches absent and present values and inserts without losing existing nodes", () => {
    expect(searchPath(full, 35)).toEqual([0, 1, 4, 10]);
    expect(searchPath(full, 30)).toEqual([0, 1, 4]);
    expect(insertBST({}, 40)).toEqual({ 0: 40 });
    expect(insertBST(full, 55)).toEqual({ ...full, 12: 55 });
    expect(insertBST(full, 40)).toEqual(full);
  });
  it("deletes leaves, one-child roots and two-child roots with successor children", () => {
    expect(deleteBST({ 0: 40 }, 40)).toEqual({});
    expect(deleteBST({ 0: 40, 1: 20, 3: 10 }, 40)).toEqual({ 0: 20, 1: 10 });
    const result = deleteBST({ ...full, 12: 55 }, 40);
    expect(result).toEqual({ 0: 50, 1: 20, 2: 60, 3: 10, 4: 30, 5: 55, 6: 70 });
    expect(validBST(result)).toBe(true);
    expect(deleteBST(full, 999)).toEqual(full);
  });
  it("also deletes with the predecessor and preserves its remaining left subtree", () => {
    expect(deleteBST(full, 40, "predecessor")).toEqual({ 0: 30, 1: 20, 2: 60, 3: 10, 5: 50, 6: 70 });
    const nodes = { ...full, 9: 25 }, result = deleteBST(nodes, 40, "predecessor");
    expect(result).toEqual({ 0: 30, 1: 20, 2: 60, 3: 10, 4: 25, 5: 50, 6: 70 });
    expect(validBST(result)).toBe(true);
    expect(deleteBST({ 0: 40, 1: 20, 2: 60, 3: 10 }, 40, "predecessor")).toEqual({ 0: 20, 1: 10, 2: 60 });
  });
});
describe("Tree curriculum", () => {
  for (const id of TREE_IDS) it(`${id} has consistent reachable rounds and isolated snapshots`, () => {
    const course = createTreeCourse(id);
    expect(course.rounds.length).toBeGreaterThanOrEqual(3);
    for (const round of course.rounds) {
      expect(round.steps.length).toBeGreaterThan(0);
      for (const [index, step] of round.steps.entries()) {
        expect(step.items.some(item => item.id === step.item)).toBe(true);
        expect(step.targets.some(target => target.id === step.target)).toBe(true);
        expect(resolveTreeDrop(step, step.item, step.target)).toBe(true);
        expect(resolveTreeDrop(step, step.item, "unknown")).toBe(false);
        const before = index ? round.steps[index - 1].after : round.initial;
        expect(before.nodes).not.toBe(step.after.nodes);
        const positions = treePositions(before, step);
        for (const target of step.targets) if (target.slot !== undefined) expect(positions[target.slot]).toBeDefined();
      }
      expect(round.validate(round.steps.at(-1)!.after)).toBe(true);
    }
  });
  it("keeps one-child branches visually on the correct side", () => {
    const positions = treePositions(board({ 0: 40, 1: 20, 3: 10 }));
    expect(positions[3].x).toBeLessThan(positions[1].x);
    expect(positions[1].x).toBeLessThan(positions[0].x);
  });
  it("accepts swapping either of the misplaced nodes", () => {
    const step = createTreeCourse("bst").rounds[0].steps[0];
    expect(resolveTreeDrop(step, "node:2", "slot:1")).toBe(true);
    expect(resolveTreeDrop(step, "node:0", "slot:2")).toBe(false);
  });
  it("removes 40 before moving the replacement and empties its original slot", () => {
    for (const strategy of ["successor", "predecessor"] as const) {
      const round = createTreeCourse("bst-delete", strategy).rounds[2];
      const removal = round.steps[3], move = round.steps[4];
      const slot = strategy === "successor" ? 5 : 4;
      expect(removal.item).toBe("node:0");
      expect(removal.target).toBe("tray");
      expect(removal.after.nodes[0]).toBeUndefined();
      expect(move.item).toBe(`node:${slot}`);
      expect(move.target).toBe("slot:0");
      expect(move.after.nodes[0]).toBe(strategy === "successor" ? 50 : 30);
      expect(move.after.nodes[slot]).toBeUndefined();
      expect(new Set(Object.values(move.after.nodes)).size).toBe(Object.values(move.after.nodes).length);
      if (strategy === "successor") expect(move.after.nodes[12]).toBe(55);
    }
  });
  it("accepts either initial branch and leads to a distinct valid replacement", () => {
    const successor = createTreeCourse("bst-delete", "successor").rounds[2];
    const predecessor = createTreeCourse("bst-delete", "predecessor").rounds[2];
    expect(successor.steps[0].after).toEqual(predecessor.steps[0].after);
    for (const round of [successor, predecessor]) {
      expect(resolveTreeDrop(round.steps[1], "pig", "slot:1")).toBe(true);
      expect(resolveTreeDrop(round.steps[1], "pig", "slot:2")).toBe(true);
      expect(resolveTreeDrop(round.steps[1], "flag", "slot:1")).toBe(false);
      expect(round.validate(round.steps.at(-1)!.after)).toBe(true);
      expect(Object.values(round.steps.at(-1)!.after.nodes).sort((a, b) => a - b)).toEqual([10, 20, 30, 50, 55, 60, 70]);
    }
    expect(successor.steps.at(-1)!.after.nodes[0]).toBe(50);
    expect(predecessor.steps.at(-1)!.after.nodes[0]).toBe(30);
    expect(predecessor.steps[2].target).toBe("slot:4");
    expect(resolveTreeDrop(predecessor.steps[2], "pig", "slot:3")).toBe(false);
  });
});

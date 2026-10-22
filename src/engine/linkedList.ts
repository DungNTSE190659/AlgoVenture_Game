export type LinkedNode = { id: string; value: number; color: string };
export type LinkedPuzzle = {
  nodes: LinkedNode[];
  order: string[];
  slots: (string | null)[];
  links: Record<string, string | null>;
};

export const LINKED_NODES: LinkedNode[] = [
  { id: "a", value: 8, color: "peach" },
  { id: "b", value: 3, color: "mint" },
  { id: "c", value: 6, color: "lavender" },
];
export const LINKED_ORDER = ["a", "b", "c"];
const COLORS = ["peach", "mint", "lavender", "peach"];
export const CONSTRUCTION_LEVELS = {
  1: { values: [8, 3], bank: ["b", "a"] },
  2: { values: [8, 3, 6], bank: ["c", "a", "b"] },
  3: { values: [7, 2, 9, 4], bank: ["d", "b", "a", "c"] },
} as const;

export function createLinkedPuzzle(level: 1 | 2 | 3 = 2): LinkedPuzzle {
  const order = CONSTRUCTION_LEVELS[level].values.map((_, index) => "abcd"[index]);
  return {
    nodes: CONSTRUCTION_LEVELS[level].values.map((value, index) => ({ id: order[index], value, color: COLORS[index] })),
    order,
    slots: order.map(() => null),
    links: Object.fromEntries(order.map(id => [id, null])),
  };
}

export function placeLinkedNode(puzzle: LinkedPuzzle, id: string, slot: number | null): LinkedPuzzle {
  if (!puzzle.nodes.some(node => node.id === id) || (slot !== null && (slot < 0 || slot >= puzzle.slots.length))) return puzzle;
  const slots = [...puzzle.slots];
  const old = slots.indexOf(id);
  if (old === slot) return puzzle;
  const displaced = slot === null ? null : slots[slot];
  if (old >= 0) slots[old] = displaced;
  if (slot !== null) slots[slot] = id;
  const links = { ...puzzle.links };
  if (slot === null) {
    links[id] = null;
    for (const source of Object.keys(links)) if (links[source] === id) links[source] = null;
  }
  if (displaced && old < 0) {
    links[displaced] = null;
    for (const source of Object.keys(links)) if (links[source] === displaced) links[source] = null;
  }
  return { ...puzzle, slots, links };
}

export function connectLinkedNode(puzzle: LinkedPuzzle, from: string, to: string | null): LinkedPuzzle {
  if (!puzzle.slots.includes(from) || (to !== null && (!puzzle.slots.includes(to) || to === from))) return puzzle;
  if (to !== null) {
    let current: string | null = to;
    const seen = new Set<string>();
    while (current && !seen.has(current)) {
      if (current === from) return puzzle;
      seen.add(current);
      current = puzzle.links[current] ?? null;
    }
  }
  return { ...puzzle, links: { ...puzzle.links, [from]: to } };
}

export function linkedPuzzleComplete(puzzle: LinkedPuzzle): boolean {
  return puzzle.order.every((id, index) => puzzle.slots[index] === id
    && puzzle.links[id] === (puzzle.order[index + 1] ?? null));
}

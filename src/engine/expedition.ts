export type Cargo = { id: number; value: number };
export type Island = {
  id: string;
  start: number;
  cargo: number[];
  depth: number;
};
export type Expedition = {
  cargo: Cargo[];
  islands: Island[];
  fixed: number[];
  partitions: number;
};
export type Arrangement = {
  pivot: number | null;
  small: number[];
  large: number[];
};
export const emptyArrangement = (): Arrangement => ({
  pivot: null,
  small: [],
  large: [],
});

/** Player-controlled Quick Sort: any pivot, either child first, any order within a group. */
export function createExpedition(values: readonly number[]): Expedition {
  if (!values.every(Number.isFinite))
    throw new Error("Mảng chỉ chứa số hữu hạn.");
  const cargo = values.map((value, id) => ({ id, value }));
  return {
    cargo,
    islands:
      cargo.length > 1
        ? [
            {
              id: "root",
              start: 0,
              cargo: cargo.map((item) => item.id),
              depth: 0,
            },
          ]
        : [],
    fixed: cargo.length === 1 ? [0] : [],
    partitions: 0,
  };
}

export type PartitionResult =
  | { ok: true; expedition: Expedition; balanced: boolean }
  | {
      ok: false;
      reason: "island" | "pivot" | "missing" | "wrong-group";
      wrong: number[];
    };

export function finishIsland(
  expedition: Expedition,
  islandId: string,
  arrangement: Arrangement,
): PartitionResult {
  const island = expedition.islands.find((item) => item.id === islandId);
  if (!island) return { ok: false, reason: "island", wrong: [] };
  if (arrangement.pivot === null || !island.cargo.includes(arrangement.pivot))
    return { ok: false, reason: "pivot", wrong: [] };
  const all = [...arrangement.small, arrangement.pivot, ...arrangement.large];
  if (
    all.length !== island.cargo.length ||
    new Set(all).size !== all.length ||
    all.some((id) => !island.cargo.includes(id))
  )
    return { ok: false, reason: "missing", wrong: [] };
  const byId = new Map(expedition.cargo.map((item) => [item.id, item]));
  const pivot = byId.get(arrangement.pivot)!.value;
  const wrong = [
    ...arrangement.small.filter((id) => byId.get(id)!.value > pivot),
    ...arrangement.large.filter((id) => byId.get(id)!.value <= pivot),
  ];
  if (wrong.length) return { ok: false, reason: "wrong-group", wrong };
  const cargo = [...expedition.cargo];
  cargo.splice(island.start, all.length, ...all.map((id) => byId.get(id)!));
  const fixed = new Set([...expedition.fixed, arrangement.pivot]);
  const children: Island[] = [];
  for (const [ids, suffix, start] of [
    [arrangement.small, "L", island.start],
    [arrangement.large, "R", island.start + arrangement.small.length + 1],
  ] as const) {
    if (ids.length > 1)
      children.push({
        id: island.id + suffix,
        start,
        cargo: [...ids],
        depth: island.depth + 1,
      });
    else if (ids.length === 1) fixed.add(ids[0]);
  }
  return {
    ok: true,
    expedition: {
      cargo,
      islands: expedition.islands.flatMap((item) =>
        item.id === island.id
          ? children
          : [{ ...item, cargo: [...item.cargo] }],
      ),
      fixed: [...fixed],
      partitions: expedition.partitions + 1,
    },
    balanced:
      Math.abs(arrangement.small.length - arrangement.large.length) <= 1,
  };
}

/** Moving a crate never decides its mathematical group for the player. */
export function moveCargo(
  arrangement: Arrangement,
  id: number,
  destination: "pool" | "pivot" | "small" | "large",
): Arrangement {
  if (destination === "pivot")
    return arrangement.pivot === id
      ? arrangement
      : { pivot: id, small: [], large: [] };
  if (id === arrangement.pivot)
    return destination === "pool" ? emptyArrangement() : arrangement;
  if (destination !== "pool" && arrangement.pivot === null) return arrangement;
  if (destination !== "pool" && arrangement[destination].includes(id))
    return arrangement;
  const next = {
    pivot: arrangement.pivot,
    small: arrangement.small.filter((item) => item !== id),
    large: arrangement.large.filter((item) => item !== id),
  };
  if (destination !== "pool") next[destination].push(id);
  return next;
}

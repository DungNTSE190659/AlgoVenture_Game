import type { TreeBoard, TreeStep, TraversalOrder } from './tree';

/** Adjacent parent/child hops, including the return through the common ancestor. */
export function treeSignalPath(from: number, to: number): number[] {
  const ancestors = (slot: number) => {
    const result = [slot];
    while (slot > 0) { slot = Math.floor((slot - 1) / 2); result.push(slot); }
    return result;
  };
  const a = ancestors(from), b = ancestors(to);
  const common = a.find(slot => b.includes(slot))!;
  return [...a.slice(0, a.indexOf(common)), ...b.slice(0, b.indexOf(common) + 1).reverse()];
}

export function nextTreeSignal(scene: TreeBoard, step?: TreeStep, order?: TraversalOrder): number[] {
  if (!step) return [];
  const item = step.items.find(item => item.id === step.item);
  const target = step.targets.find(target => target.id === step.target);
  const to = order ? item?.slot : target?.slot;
  if (to === undefined || item?.kind === 'label' || item?.kind === 'flag') return [];
  const from = order === 'level' ? (to ? Math.floor((to - 1) / 2) : 0)
    : order ? scene.cursor ?? 0
    : item?.kind === 'branch' ? Number(item.id.split(':')[1])
    : scene.cursor ?? item?.slot ?? 0;
  const path = treeSignalPath(from, to);
  // Never signal across an absent/disconnected branch, including an unplanted slot.
  return path.length > 1 && path.every((slot, index) => scene.nodes[slot] !== undefined &&
    (!index || scene.links.includes(Math.max(slot, path[index - 1])))) ? path : [];
}

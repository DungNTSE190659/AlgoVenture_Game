import { describe, expect, it } from 'vitest';
import { createTreeCourse } from './tree';
import { nextTreeSignal, treeSignalPath } from './treeSignals';

describe('Tree rope signal direction', () => {
  it('returns through the common ancestor instead of jumping between siblings', () => {
    expect(treeSignalPath(3, 5)).toEqual([3, 1, 0, 2, 5]);
    expect(treeSignalPath(4, 1)).toEqual([4, 1]);
    expect(treeSignalPath(0, 0)).toEqual([0]);
  });
  it('follows all four lesson orders, using the parent for queue-based traversal', () => {
    const rounds = createTreeCourse('tree-traversal').rounds;
    for (const round of rounds) {
      let scene = round.initial;
      for (const step of round.steps) {
        const target = step.items.find(item => item.id === step.item)!.slot!;
        const origin = round.traversalOrder === 'level' && target > 0 ? Math.floor((target - 1) / 2) : scene.cursor ?? 0;
        const expected = treeSignalPath(origin, target);
        expect(nextTreeSignal(scene, step, round.traversalOrder)).toEqual(expected.length > 1 ? expected : []);
        scene = step.after;
      }
      expect(nextTreeSignal(scene)).toEqual([]);
    }
  });
  it('does not transmit along an absent link or into an empty target', () => {
    const round = createTreeCourse('tree-traversal').rounds[1];
    expect(nextTreeSignal({ ...round.initial, links: [] }, round.steps[0], 'inorder')).toEqual([]);
    const construction = createTreeCourse('tree-basics').rounds[0];
    expect(nextTreeSignal(construction.initial, construction.steps[0])).toEqual([]);
  });
});

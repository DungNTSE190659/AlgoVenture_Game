import { describe, expect, it } from "vitest";
import { checkTrail, createQuickTrail, emptyTrailArrangement, moveTrailFriend, trailPool } from "./quickTrail";
describe("three-way Quick Sort trail", () => {
  it("does not decide a moved friend's group and rejects wrong or duplicate membership immutably", () => {
    const trail = createQuickTrail([3,3,1,5]), node = trail.nodes[0];
    let arrangement = moveTrailFriend(node, emptyTrailArrangement(), 0, "pivot");
    arrangement = moveTrailFriend(node, arrangement, 1, "small");
    arrangement = moveTrailFriend(node, arrangement, 2, "small");
    arrangement = moveTrailFriend(node, arrangement, 3, "large");
    const original = JSON.stringify(trail);
    expect(checkTrail(trail,"root",arrangement)).toEqual({ ok:false, reason:"wrong", wrong:[1] });
    expect(JSON.stringify(trail)).toBe(original);
    expect(checkTrail(trail,"root",{ ...arrangement, equal:[1] }).ok).toBe(false);
    arrangement = moveTrailFriend(node,arrangement,1,"equal");
    const result = checkTrail(trail,"root",arrangement);
    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.trail.items.map(item => item.value)).toEqual([1,3,3,5]); expect(result.trail.fixed).toHaveLength(4); expect(result.trail.nodes.some(n => n.status === "open")).toBe(false); }
  });
  it("supports any pivot, either pending branch first, negative values and all-equal groups", () => {
    for (const input of [[4,1,3,2],[-3,2,-3,8,2,0,9,4],[2,2,2,2],[8,7,6,5,4,3,2,1],[1,2],[5,1,5,0,2,5,2]]) {
      for (const reverse of [false,true]) {
        let trail = createQuickTrail(input), count = 0;
        while (trail.nodes.some(n => n.status === "open")) {
          expect(++count).toBeLessThan(input.length);
          const candidates = trail.nodes.filter(n => n.status === "open"), node = reverse ? candidates.at(-1)! : candidates[0];
          const pivot = node.ids[reverse ? node.ids.length - 1 : 0], pivotValue = trail.items.find(item => item.id === pivot)!.value;
          let arrangement = moveTrailFriend(node,emptyTrailArrangement(),pivot,"pivot");
          for (const id of trailPool(node,arrangement).reverse()) { const value = trail.items.find(item => item.id === id)!.value; arrangement = moveTrailFriend(node,arrangement,id,value < pivotValue ? "small" : value === pivotValue ? "equal" : "large"); }
          const result = checkTrail(trail,node.id,arrangement); expect(result.ok).toBe(true); if (!result.ok) throw new Error("Invalid partition"); trail = result.trail;
        }
        expect(trail.items.map(item => item.value)).toEqual(input.slice().sort((a,b)=>a-b));
        expect(new Set(trail.fixed).size).toBe(input.length);
        expect(trail.items.map(item => item.id).sort((a,b)=>a-b)).toEqual(input.map((_,i)=>i));
      }
    }
  });
  it("keeps the pivot stationary, resets all groups when changing pivot, rejects foreign IDs and malformed arrays", () => {
    const node = createQuickTrail([3,1,2]).nodes[0];
    let arrangement = moveTrailFriend(node,emptyTrailArrangement(),0,"pivot");
    arrangement = moveTrailFriend(node,arrangement,1,"small");
    expect(moveTrailFriend(node,arrangement,0,"large")).toBe(arrangement);
    expect(moveTrailFriend(node,arrangement,99,"small")).toBe(arrangement);
    expect(moveTrailFriend(node,arrangement,2,"pivot")).toEqual({ pivot:2, small:[], equal:[], large:[] });
    expect(moveTrailFriend(node,arrangement,0,"pool")).toEqual(emptyTrailArrangement());
    for (const input of [[],[1],[1,1.5],[1,100],[NaN,1]]) expect(()=>createQuickTrail(input)).toThrow();
  });
});

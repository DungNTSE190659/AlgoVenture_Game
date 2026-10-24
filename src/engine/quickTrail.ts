import type { Item } from "./quicksort";
export type TrailGroup = "small" | "equal" | "large";
export type TrailDestination = TrailGroup | "pivot" | "pool";
export type TrailArrangement = { pivot: number | null; small: number[]; equal: number[]; large: number[] };
export type TrailNode = { id: string; parent: string | null; start: number; ids: number[]; depth: number; status: "open" | "split" | "done"; pivot: number | null };
export type QuickTrail = { items: Item[]; nodes: TrailNode[]; fixed: number[]; partitions: number };
export const emptyTrailArrangement = (): TrailArrangement => ({ pivot: null, small: [], equal: [], large: [] });
export function createQuickTrail(input: readonly number[]): QuickTrail {
  if (input.length < 2 || input.length > 8 || input.some(n => !Number.isInteger(n) || n < -99 || n > 99)) throw new Error("Cần 2–8 số nguyên từ −99 đến 99.");
  const items = input.map((value, id) => ({ id, value }));
  return { items, nodes: [{ id: "root", parent: null, start: 0, ids: items.map(item => item.id), depth: 0, status: "open", pivot: null }], fixed: [], partitions: 0 };
}
export function trailPool(node: TrailNode, a: TrailArrangement) { const used = new Set([a.pivot, ...a.small, ...a.equal, ...a.large]); return node.ids.filter(id => !used.has(id)); }
export function moveTrailFriend(node: TrailNode, a: TrailArrangement, id: number, destination: TrailDestination): TrailArrangement {
  if (node.status !== "open" || !node.ids.includes(id)) return a;
  if (destination === "pivot") return a.pivot === id ? a : { ...emptyTrailArrangement(), pivot: id };
  if (a.pivot === id) return destination === "pool" ? emptyTrailArrangement() : a;
  if (destination !== "pool" && (a.pivot === null || a[destination].includes(id))) return a;
  const next = { pivot: a.pivot, small: a.small.filter(n => n !== id), equal: a.equal.filter(n => n !== id), large: a.large.filter(n => n !== id) };
  if (destination !== "pool") next[destination].push(id);
  return next;
}
export function checkTrail(trail: QuickTrail, nodeId: string, a: TrailArrangement): { ok: true; trail: QuickTrail; gained: number } | { ok: false; reason: "node" | "missing" | "wrong"; wrong: number[] } {
  const node = trail.nodes.find(n => n.id === nodeId); if (!node || node.status !== "open") return { ok:false, reason:"node", wrong:[] };
  const { pivot, small, equal, large } = a, all = [...small, ...(pivot === null ? [] : [pivot]), ...equal, ...large];
  if (pivot === null || !node.ids.includes(pivot) || all.length !== node.ids.length || new Set(all).size !== all.length || all.some(id => !node.ids.includes(id))) return { ok:false, reason:"missing", wrong:[] };
  const byId = new Map(trail.items.map(item => [item.id,item])), value = byId.get(pivot)!.value;
  const wrong = [...small.filter(id => byId.get(id)!.value >= value), ...equal.filter(id => byId.get(id)!.value !== value), ...large.filter(id => byId.get(id)!.value <= value)];
  if (wrong.length) return { ok:false, reason:"wrong", wrong };
  const items = trail.items.slice(); items.splice(node.start,all.length,...all.map(id => byId.get(id)!));
  const fixed = new Set([...trail.fixed,pivot,...equal]), children: TrailNode[] = [];
  for (const [ids,suffix,start] of [[small,"L",node.start],[large,"R",node.start+small.length+equal.length+1]] as const) {
    if (!ids.length) continue; if (ids.length === 1) fixed.add(ids[0]);
    children.push({ id:node.id+suffix, parent:node.id, start, ids:ids.slice(), depth:node.depth+1, status:ids.length === 1 ? "done" : "open", pivot:null });
  }
  return { ok:true, gained:(fixed.size-trail.fixed.length)*100, trail:{ items, fixed:[...fixed], partitions:trail.partitions+1, nodes:[...trail.nodes.map(n=>n.id === nodeId ? {...n,status:"split" as const,pivot} : n),...children] } };
}
export type QuickTrailFrame = { focusId?: number; trail: QuickTrail; active: string | null; arrangement: TrailArrangement; title: string; narration: string; kind: "intro" | "pivot" | "compare" | "move" | "split" | "done"; duration: number };
export function createQuickTrailLesson(input: readonly number[]): QuickTrailFrame[] {
  let trail=createQuickTrail(input), active:string|null="root", arrangement=emptyTrailArrangement(); const frames:QuickTrailFrame[]=[];
  function add(kind:QuickTrailFrame["kind"],title:string,narration:string,focusId?:number){ frames.push({focusId,trail,active,arrangement,title,narration,kind,duration:Math.max(2200,narration.split(/\s+/).length*145+600)}); }
  add("intro","Chọn mốc và chia nhóm","Chọn một mốc (pivot), chia các số thành nhóm nhỏ hơn, bằng và lớn hơn mốc. Lặp lại với các nhóm nhỏ để sắp xếp cả mảng.");
  while(trail.nodes.some(n=>n.status === "open")){
    const node=trail.nodes.find(n=>n.status === "open")!; active=node.id;arrangement=emptyTrailArrangement();
    const pivot=node.ids[Math.floor(node.ids.length/2)],value=trail.items.find(item=>item.id === pivot)!.value;
    add("pivot","Chọn một số làm mốc",`Mình chọn ${value} làm mốc cho nhóm này. Khi chơi, bạn có thể chọn một số bất kỳ.`,pivot);
    arrangement=moveTrailFriend(node,arrangement,pivot,"pivot");add("pivot",`Mốc hiện tại: ${value}`,`Giữ ${value} ở vị trí mốc rồi so sánh từng số còn lại với nó. Chưa cần xếp thứ tự bên trong các nhóm.`);
    for(const id of trailPool(node,arrangement)){
      const number=trail.items.find(item=>item.id === id)!.value,group:TrailGroup=number < value ? "small" : number === value ? "equal" : "large",relation=group === "small" ? "nhỏ hơn" : group === "equal" ? "bằng" : "lớn hơn";
      add("compare",`So sánh ${number} với ${value}`,`${number} ${relation} ${value}, nên mình đưa thẻ này vào nhóm ${relation} mốc.`,id);arrangement=moveTrailFriend(node,arrangement,id,group);add("move",`${number} đã vào nhóm`,`Thẻ ${number} đã vào nhóm ${relation} mốc. Tiếp tục với số đang chờ nhé.`);
    }
    const result=checkTrail(trail,node.id,arrangement);if(!result.ok)throw new Error("Demo phân nhóm không hợp lệ.");trail=result.trail;active=null;arrangement=emptyTrailArrangement();add("split","Tiếp tục với các nhóm nhỏ","Mốc và các số bằng mốc đã đúng chỗ! Chọn nhóm nhỏ hoặc lớn còn ít nhất hai số để chia tiếp.");
  }
  add("done","Các số đã có thứ tự!","Ghép nhóm nhỏ, nhóm bằng mốc rồi nhóm lớn. Mọi nhánh đều hoàn thành, cả mảng đã được xếp từ bé đến lớn. Đến lượt bạn thử nhé!");return frames;
}

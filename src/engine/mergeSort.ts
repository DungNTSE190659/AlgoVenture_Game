import type { Item } from "./quicksort";

export type MergeNode = { id: string; start: number; end: number; items: Item[]; left?: MergeNode; right?: MergeNode };
export type MergeState = {
  root: MergeNode; tasks: MergeNode[]; taskIndex: number;
  left: Item[]; right: Item[]; output: Item[]; assembled: Item[];
  phase: "merge" | "joined" | "done"; moves: number; completed: number;
};
export type MergeFrame = { state: MergeState; kind: "intro" | "split" | "compare" | "place" | "complete" | "joined" | "done"; title: string; narration: string; groups?: MergeNode[]; chosen?: number };

/** Postorder tasks keep both child runs sorted before their parent can merge. */
export function createMerge(input: readonly number[]): MergeState {
  if (!input.every(Number.isFinite)) throw new Error("Mảng chỉ được chứa số hữu hạn.");
  const tasks: MergeNode[] = [];
  function tree(items: Item[], start: number, id: string): MergeNode {
    const node: MergeNode = { id, start, end: start + items.length, items };
    if (items.length > 1) {
      const mid = Math.floor(items.length / 2);
      node.left = tree(items.slice(0, mid), start, `${id}L`);
      node.right = tree(items.slice(mid), start + mid, `${id}R`);
      tasks.push(node);
    }
    return node;
  }
  const root = tree(input.map((value, id) => ({ value, id })), 0, "root");
  const first = tasks[0];
  return { root, tasks, taskIndex: 0, left: first?.left?.items ?? [], right: first?.right?.items ?? [], output: [], assembled: root.items, phase: first ? "merge" : "done", moves: 0, completed: 0 };
}

export function mergeExpected(state: MergeState): Item | undefined {
  if (state.phase !== "merge") return undefined;
  const a = state.left[0], b = state.right[0];
  return !b || (a && a.value <= b.value) ? a : b;
}

export function advanceMerge(state: MergeState): MergeState {
  if (state.phase !== "joined") return state;
  const taskIndex = state.taskIndex + 1, task = state.tasks[taskIndex];
  if (!task) return { ...state, phase: "done" };
  return { ...state, taskIndex, left: state.assembled.slice(task.left!.start, task.left!.end), right: state.assembled.slice(task.right!.start, task.right!.end), output: [], phase: "merge" };
}

export type MergeLane = "left" | "right";

export function mergeHint(state: MergeState): string {
  const a=state.left[0], b=state.right[0];
  if(!a && !b) return "Nhóm này đã được ghép xong.";
  if(!a || !b) return `Chỉ còn làn ${a ? "A" : "B"}. Hàng tự chạy nốt, không cần đổi cần gạt.`;
  if(a.value===b.value) return `Hai kiện cùng giá trị ${a.value}. Giữ cần ở làn A trước để giữ thứ tự ban đầu.`;
  return `So sánh ${a.value} và ${b.value}. Giữ cần ở làn chứa ${Math.min(a.value,b.value)} trước khi kiện tới cổng.`;
}

/** One gate opening transfers exactly one head, preserving stable merge order. */
export function releaseMerge(state: MergeState, lane: MergeLane): MergeState | null {
  if(state.phase!=="merge") return null;
  const item=state[lane][0];
  if(!item || item.id!==mergeExpected(state)?.id) return null;
  const left=lane==="left"?state.left.slice(1):state.left;
  const right=lane==="right"?state.right.slice(1):state.right;
  const output=[...state.output,item], joined=!left.length&&!right.length;
  const task=state.tasks[state.taskIndex];
  const assembled=joined?[...state.assembled.slice(0,task.start),...output,...state.assembled.slice(task.end)]:state.assembled;
  return {...state,left,right,output,assembled,moves:state.moves+1,completed:state.completed+Number(joined),phase:joined?"joined":"merge"};
}

export function createMergeLesson(input: readonly number[]): MergeFrame[] {
  let state = createMerge(input);
  const frames: MergeFrame[] = [{ state, kind: "intro", title: "Merge Sort", narration: "Merge Sort chia mảng thành hai nửa, tiếp tục chia nhỏ rồi ghép các mảng con đã có thứ tự thành một mảng được sắp xếp.", groups: [state.root] }];
  let groups = [state.root];
  while (groups.some(group => group.left)) {
    groups = groups.flatMap(group => group.left ? [group.left, group.right!] : [group]);
    frames.push({ state, kind: "split", title: "Chia đôi mảng", narration: groups.every(group => !group.left) ? "Mỗi mảng con còn một phần tử nên đã có thứ tự. Bây giờ chúng mình ghép các mảng con lại." : "Chia mỗi mảng con thành hai phần liên tiếp. Giữ nguyên thứ tự phần tử khi chia.", groups });
  }
  while (state.phase !== "done") {
    while (state.left.length || state.right.length) {
      const chosen = mergeExpected(state)!;
      const a = state.left[0], b = state.right[0];
      const narration = !a || !b ? "Một mảng con đã hết. Đưa lần lượt các phần tử còn lại vào mảng kết quả."
        : a.value === b.value ? `Hai phần tử cùng giá trị ${a.value}. Lấy bên trái trước để giữ thứ tự ban đầu.`
        : `So sánh ${a.value} và ${b.value} ở đầu hai mảng con. Đưa ${chosen.value}, phần tử nhỏ hơn, vào mảng kết quả.`;
      frames.push({ state, kind: "compare", title: "So sánh hai phần tử", narration, chosen: chosen.id });
      state = releaseMerge(state, state.left[0]?.id===chosen.id ? "left" : "right")!;
      frames.push({ state, kind: "place", title: "Ghép vào mảng kết quả", narration: `Đưa ${chosen.value} vào vị trí tiếp theo trong mảng kết quả. Chỉ lấy phần tử ở đầu mỗi mảng con.`, chosen: chosen.id });
    }
    frames.push({ state, kind: "complete", title: "Đã ghép đủ phần tử", narration: "Mảng kết quả đã chứa đủ phần tử theo thứ tự từ bé đến lớn." });
    frames.push({ state, kind: "joined", title: "Mảng con đã có thứ tự", narration: "Mảng con đã có thứ tự. Dùng kết quả này để tiếp tục ghép với mảng con bên cạnh." });
    state = advanceMerge(state);
  }
  frames.push({ state, kind: "done", title: "Mảng đã được sắp xếp", narration: "Toàn bộ mảng đã được sắp xếp từ bé đến lớn. Đó là Merge Sort: chia nhỏ rồi hợp nhất. Bây giờ đến lượt bạn!" });
  return frames;
}

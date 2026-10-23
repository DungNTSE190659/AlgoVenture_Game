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
  const values = (items: readonly Item[]) => `[${items.map(item => item.value).join(", ")}]`;
  const frames: MergeFrame[] = [{ state, kind: "intro", title: "Cùng chia nhỏ mảng nhé!", narration: `Mình cùng xếp ${values(state.root.items)} từ bé đến lớn nhé! Đầu tiên, Cáo sẽ chia mảng thành những nhóm nhỏ, rồi ghép chúng lại.`, groups: [state.root] }];
  let groups = [state.root];
  while (groups.some(group => group.left)) {
    const splitting = groups.filter(group => group.left);
    const changes = splitting.map(group => `${values(group.items)} thành ${values(group.left!.items)} và ${values(group.right!.items)}`).join("; ");
    groups = groups.flatMap(group => group.left ? [group.left, group.right!] : [group]);
    const single = groups.every(group => !group.left);
    frames.push({ state, kind: "split", title: single ? "Mỗi số đã có một nhóm riêng" : "Chia đôi thêm một lần", narration: `Mình tách ${changes}. ${single ? "Mỗi nhóm còn một số rồi! Giờ mình ghép lại nhé." : "Các số vẫn giữ nguyên thứ tự. Mình sẽ chia tiếp những nhóm còn nhiều số nhé!"}`, groups });
  }
  while (state.phase !== "done") {
    while (state.left.length || state.right.length) {
      const chosen = mergeExpected(state)!;
      const a = state.left[0], b = state.right[0];
      const lane = a?.id === chosen.id ? "trái" : "phải";
      const opening = state.output.length === 0 ? `Đến lượt ghép ${values(state.left)} với ${values(state.right)} nhé! ` : "";
      const narration = !a || !b
        ? `Bên ${a ? "phải" : "trái"} đã hết rồi. Bên ${lane} còn ${values(a ? state.left : state.right)}, nên mình lấy ${chosen.value} tiếp nhé!`
        : a.value === b.value
          ? `${opening}Hai thẻ đầu đều là ${a.value}! Mình lấy thẻ bên trái trước, để hai thẻ bằng nhau vẫn giữ thứ tự ban đầu.`
          : `${opening}Nhìn hai thẻ đầu này: ${a.value} bên trái và ${b.value} bên phải. ${chosen.value} nhỏ hơn, nên mình chọn bên ${lane}.`;
      frames.push({ state, kind: "compare", title: !a || !b ? `Lấy tiếp số ${chosen.value}` : `So sánh ${a.value} và ${b.value}`, narration, chosen: chosen.id });
      state = releaseMerge(state, lane === "trái" ? "left" : "right")!;
      const position = state.output.length;
      frames.push({ state, kind: "place", title: `${chosen.value} đã vào ô thứ ${position}`, narration: `${chosen.value} đã xuống ô thứ ${position} rồi! ${position === 1 ? "Đây là số đầu tiên của nhóm kết quả." : `Mình đang có ${values(state.output)}, vẫn theo thứ tự từ bé đến lớn.`} ${state.phase === "joined" ? "Hai bên đều hết thẻ, nhóm này vừa ghép xong!" : "Mình xem thẻ tiếp theo nhé."}`, chosen: chosen.id });
    }
    const next = state.tasks[state.taskIndex + 1];
    frames.push({ state, kind: "complete", title: `Ghép xong ${values(state.output)}`, narration: next
      ? `Xong một nhóm rồi: ${values(state.output)}! Mình giữ nhóm này lại. Tiếp theo, mình sẽ ghép các số ở đoạn ${values(state.assembled.slice(next.start, next.end))}.`
      : `Nhìn này, ${values(state.output)} đã đi từ bé đến lớn! Từ những nhóm chỉ có một số, mình đã ghép lại được cả mảng.` });
    // Keep the completed group on screen for its explanation, then start the next merge.
    state = advanceMerge(state);
  }
  frames.push({ state, kind: "done", title: "Mảng đã có thứ tự!", narration: `Mình làm được rồi! Kết quả là ${values(state.assembled)}. Chia nhỏ, rồi ghép từng số theo thứ tự — đó là Merge Sort. Giờ đến lượt bạn thử nhé!` });
  return frames;
}

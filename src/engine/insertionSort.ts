import type { Item } from "./quicksort";

export type InsertionState = {
  items: (Item | null)[];
  cursor: number;
  hole: number;
  key: Item | null;
  phase: "pick" | "compare" | "done";
  shifts: number;
  comparisons: number;
};
export type InsertionAction = "pick" | "shift" | "insert";
export function createInsertion(input: number[]): InsertionState {
  return { items: input.map((value, id) => ({ id, value })), cursor: 1, hole: 1, key: null, phase: input.length < 2 ? "done" : "pick", shifts: 0, comparisons: 0 };
}
export function needsShift(state: InsertionState): boolean {
  return state.phase === "compare" && state.hole > 0 && state.items[state.hole - 1]!.value > state.key!.value;
}
export function insertionMove(state: InsertionState, action: InsertionAction): InsertionState | null {
  if (state.phase === "done") return null;
  const items = [...state.items];
  if (action === "pick") {
    if (state.phase !== "pick") return null;
    const key = items[state.cursor]!;
    items[state.cursor] = null;
    return { ...state, items, key, hole: state.cursor, phase: "compare" };
  }
  if (state.phase !== "compare") return null;
  if (action === "shift") {
    if (!needsShift(state)) return null;
    items[state.hole] = items[state.hole - 1];
    items[state.hole - 1] = null;
    return { ...state, items, hole: state.hole - 1, shifts: state.shifts + 1, comparisons: state.comparisons + 1 };
  }
  if (needsShift(state)) return null;
  items[state.hole] = state.key;
  const cursor = state.cursor + 1;
  return { ...state, items, cursor, key: null, hole: cursor, phase: cursor >= items.length ? "done" : "pick", comparisons: state.comparisons + (state.hole > 0 ? 1 : 0) };
}
export function insertionInstruction(state: InsertionState): string {
  if (state.phase === "done") return "Mảng đã xếp từ bé đến lớn. Các số bằng nhau vẫn giữ thứ tự ban đầu!";
  if (state.phase === "pick") return `Nhấc số ${state.items[state.cursor]!.value} để chèn vào phần màu xanh đã có thứ tự.`;
  if (needsShift(state)) return `${state.items[state.hole - 1]!.value} lớn hơn ${state.key!.value}. Dịch số bên trái sang ô trống để nhường chỗ.`;
  return state.hole === 0 ? `Đã tới đầu mảng. Chèn số ${state.key!.value} vào ô trống.` : `Số bên trái nhỏ hơn hoặc bằng ${state.key!.value}. Chèn vào ô trống, giữ thứ tự các số bằng nhau.`;
}
export type InsertionFrame = { state: InsertionState; title: string; narration: string; cue: "scan" | "pivot" | "bubble-swap" | "correct" | "finish" };
export function createInsertionLesson(input: number[]): InsertionFrame[] {
  let state = createInsertion(input);
  const frames: InsertionFrame[] = [{ state, title: "Xây dãy có thứ tự, từng số một", narration: "Số đầu tiên tự tạo thành một dãy có thứ tự. Mình nhấc từng số tiếp theo, dịch các số lớn hơn sang phải rồi chèn vào ô trống.", cue: "scan" }];
  while (state.phase !== "done") {
    const action: InsertionAction = state.phase === "pick" ? "pick" : needsShift(state) ? "shift" : "insert";
    const narration = insertionInstruction(state);
    const title = action === "pick" ? `Nhấc số ${state.items[state.cursor]!.value}` : action === "shift" ? `Dịch ${state.items[state.hole - 1]!.value} sang phải` : `Chèn ${state.key!.value} vào ô ${state.hole}`;
    state = insertionMove(state, action)!;
    frames.push({ state, title, narration, cue: action === "pick" ? "pivot" : action === "shift" ? "bubble-swap" : "correct" });
  }
  frames.push({ state, title: "Mảng đã được sắp xếp!", narration: insertionInstruction(state), cue: "finish" });
  return frames;
}

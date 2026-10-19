import type { Item } from "./quicksort";

/** Only the current position may be inspected; decisions always follow an inspection. */
export type LinearState = {
  items: Item[];
  target: number;
  cursor: number;
  phase: "inspect" | "decide" | "done";
  comparisons: number;
  result: number | null;
  inspected: number[];
};
export type LinearAction = "inspect" | "continue" | "found" | "absent";

export function createLinearSearch(input: readonly number[], target: number): LinearState {
  if (!input.every(Number.isFinite) || !Number.isFinite(target)) {
    throw new Error("Mảng và số cần tìm chỉ được chứa số hữu hạn.");
  }
  return {
    items: input.map((value, id) => ({ id, value })), target, cursor: 0,
    phase: input.length ? "inspect" : "done", comparisons: 0,
    result: input.length ? null : -1, inspected: [],
  };
}

export function expectedLinearAction(state: LinearState): LinearAction | null {
  if (state.phase === "done") return null;
  if (state.phase === "inspect") return "inspect";
  if (state.items[state.cursor].value === state.target) return "found";
  return state.cursor === state.items.length - 1 ? "absent" : "continue";
}

/** Invalid actions return null without changing the state or charging a comparison. */
export function linearSearchMove(state: LinearState, action: LinearAction, index = state.cursor): LinearState | null {
  if (action !== expectedLinearAction(state) || index !== state.cursor) return null;
  if (action === "inspect") {
    return { ...state, phase: "decide", comparisons: state.comparisons + 1, inspected: [...state.inspected, state.cursor] };
  }
  if (action === "continue") return { ...state, cursor: state.cursor + 1, phase: "inspect" };
  return { ...state, phase: "done", result: action === "found" ? state.cursor : -1 };
}

export function linearSearchInstruction(state: LinearState): string {
  if (state.phase === "done") {
    return state.result === -1
      ? `Đã kiểm tra hết ${state.items.length} ô. Không có số ${state.target} trong mảng.`
      : `Tìm thấy số ${state.target} đầu tiên tại chỉ số ${state.result}, sau ${state.comparisons} lần so sánh.`;
  }
  if (state.phase === "inspect") return `Kiểm tra ô có chỉ số ${state.cursor}, so sánh với số cần tìm ${state.target}.`;
  const value = state.items[state.cursor].value;
  if (value === state.target) return `${value} bằng ${state.target}. Chọn “Đã tìm thấy” và dừng ngay tại lần xuất hiện đầu tiên.`;
  return state.cursor === state.items.length - 1
    ? `${value} khác ${state.target} và đây là ô cuối. Chọn “Không tìm thấy”.`
    : `${value} khác ${state.target}. Chọn “Tiếp tục” để sang ô ngay bên phải.`;
}

export type LinearFrame = {
  state: LinearState;
  title: string;
  narration: string;
  cue: "scan" | "correct" | "finish";
};

/** Demo and gameplay use exactly the same transitions and comparison counter. */
export function createLinearSearchLesson(input: readonly number[], target: number): LinearFrame[] {
  let state = createLinearSearch(input, target);
  const frames: LinearFrame[] = [{
    state, title: "Tìm lần lượt từ trái sang phải",
    narration: `Tìm số ${target} bằng cách kiểm tra từng ô từ chỉ số 0. Dừng khi gặp số cần tìm đầu tiên hoặc đã kiểm tra hết mảng.`, cue: "scan",
  }];
  while (state.phase !== "done") {
    const action = expectedLinearAction(state)!;
    const narration = linearSearchInstruction(state);
    const title = action === "inspect" ? `So sánh ô ${state.cursor}`
      : action === "continue" ? `Chuyển sang ô ${state.cursor + 1}`
      : action === "found" ? `Tìm thấy tại chỉ số ${state.cursor}!` : "Đã kiểm tra hết mảng";
    state = linearSearchMove(state, action)!;
    frames.push({ state, title, narration, cue: state.phase === "done" ? "finish" : action === "inspect" ? "scan" : "correct" });
  }
  frames.push({ state, title: state.result === -1 ? "Không tìm thấy" : "Hoàn thành tìm kiếm!", narration: linearSearchInstruction(state), cue: "finish" });
  return frames;
}

import type { Item } from "./quicksort";
import type { SoundCue } from "../audio/gameAudio";

export type SelectionState = {
  items: Item[];
  start: number;
  chosen: number | null;
  phase: "choose" | "place" | "done";
  rounds: number;
  swaps: number;
};

export function createSelection(input: readonly number[]): SelectionState {
  if (!input.every(Number.isFinite)) throw new Error("Mảng chỉ được chứa số hữu hạn.");
  return {
    items: input.map((value, id) => ({ value, id })),
    start: input.length < 2 ? input.length : 0,
    chosen: null, phase: input.length < 2 ? "done" : "choose", rounds: 0, swaps: 0,
  };
}
export function selectionMinimum(state: SelectionState): Item | undefined {
  return state.items.slice(state.start).reduce<Item | undefined>((minimum, item) => !minimum || item.value < minimum.value ? item : minimum, undefined);
}
export function chooseSelection(state: SelectionState, id: number): SelectionState | null {
  if (state.phase !== "choose") return null;
  const index = state.items.findIndex(item => item.id === id);
  // Any occurrence of the smallest remaining value is a valid choice.
  if (index < state.start || state.items[index]?.value !== selectionMinimum(state)?.value) return null;
  return { ...state, chosen: id, phase: "place" };
}
export function placeSelection(state: SelectionState, target: number): SelectionState | null {
  if (state.phase !== "place" || target !== state.start) return null;
  const source = state.items.findIndex(item => item.id === state.chosen);
  if (source < state.start) return null;
  const items = [...state.items];
  [items[target], items[source]] = [items[source], items[target]];
  const done = target + 1 >= items.length - 1;
  return {
    items, start: done ? items.length : target + 1, chosen: null,
    phase: done ? "done" : "choose", rounds: state.rounds + 1, swaps: state.swaps + Number(source !== target),
  };
}
export function selectionHint(state: SelectionState) {
  if (state.phase === "done") return "Tất cả các số đã xếp từ bé đến lớn!";
  if (state.phase === "place") {
    const chosen = state.items.find(item => item.id === state.chosen)!;
    return state.items[state.start].id === chosen.id
      ? `${chosen.value} đã ở đầu phần chưa xếp. Bấm Giữ nguyên vị trí để cố định số này.`
      : `Đưa ${chosen.value} về ô ${state.start}. Hai số sẽ đổi chỗ, rồi mình bỏ qua ô màu xanh.`;
  }
  return `Tìm số nhỏ nhất trong các ô chưa xanh. Số ${selectionMinimum(state)!.value} là nhỏ nhất; chạm số đó rồi đưa về ô ${state.start}.`;
}
export type SelectionFrame = {
  state: SelectionState;
  kind: "intro" | "scan" | "reason" | "choose" | "place" | "done";
  title: string; narration: string; cue: SoundCue; scan: number | null; candidate: number | null; target: number;
};
export function createSelectionLesson(input: readonly number[]): SelectionFrame[] {
  let state = createSelection(input);
  const frames: SelectionFrame[] = [];
  function add(kind: SelectionFrame["kind"], title: string, narration: string, cue: SoundCue, scan: number | null = null, candidate: number | null = null, target = state.start) {
    frames.push({ kind, title, narration, cue, scan, candidate, target, state });
  }
  add("intro", "Tìm nhỏ nhất, đưa về đầu", "Mỗi lượt, mình tìm số nhỏ nhất trong phần chưa xếp. Đổi số đó với số ở đầu phần này, rồi cố định một ô màu xanh. Lặp lại đến khi hết mảng nhé!", "scan");
  while (state.phase !== "done") {
    let minimum = state.items[state.start];
    for (let index = state.start + 1; index < state.items.length; index++) {
      const item = state.items[index];
      add("scan", `Xét ${item.value} và ${minimum.value}`, `Mình đang giữ ${minimum.value} là số nhỏ nhất tạm thời. Cùng xem ${item.value} có nhỏ hơn không nhé.`, "scan", index, minimum.id);
      const smaller = item.value < minimum.value;
      const old = minimum;
      if (smaller) minimum = item;
      add("reason", smaller ? `${item.value} nhỏ hơn ${old.value}` : `Giữ ứng viên ${minimum.value}`,
        smaller ? `${item.value} nhỏ hơn ${old.value}, nên mình ghi nhớ ${item.value} làm số nhỏ nhất mới. Mình vẫn phải xét hết phần chưa xếp.`
          : item.value === old.value ? `Hai số bằng nhau. Mình giữ ứng viên hiện tại và tiếp tục xem các số còn lại.`
          : `${item.value} lớn hơn ${old.value}, nên ứng viên vẫn là ${old.value}. Mình chưa đổi chỗ ở bước so sánh này.`,
        smaller ? "small" : "keep", index, minimum.id);
    }
    const target = state.start, source = state.items.findIndex(item => item.id === minimum.id), other = state.items[target].value;
    state = chooseSelection(state, minimum.id)!;
    add("choose", `Tìm thấy số nhỏ nhất: ${minimum.value}`, source === target
      ? `${minimum.value} đã đứng đầu phần chưa xếp. Mình giữ nguyên vị trí, không cần đổi với chính nó.`
      : `Đã xét hết phần chưa xếp. Bây giờ đưa ${minimum.value} về ô ${target}, đổi chỗ với ${other}.`, "pivot", null, minimum.id);
    state = placeSelection(state, target)!;
    add("place", source === target ? `Cố định ${minimum.value}` : `Đổi ${minimum.value} với ${other}`,
      `${minimum.value} đã đứng đúng chỗ. ${state.phase === "done" ? "Số cuối cùng cũng tự vào đúng vị trí, cả mảng đã xong!" : "Ô màu xanh được bỏ qua. Lượt tiếp theo, mình tìm số nhỏ nhất trong phần còn lại."}`,
      source === target ? "correct" : "bubble-swap", null, null, target);
  }
  add("done", "Mảng đã được sắp xếp!", "Mỗi lượt cố định một số nhỏ nhất. Bạn đã hiểu Selection Sort rồi! Giờ hãy tự chọn số và đưa về đúng ô nhé.", "finish");
  return frames;
}

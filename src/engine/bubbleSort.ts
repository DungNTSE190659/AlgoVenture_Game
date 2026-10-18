import type { Item } from "./quicksort";
import type { PigMood } from "./lesson";

export type BubbleState = {
  items: Item[];
  pair: number;
  end: number;
  pass: number;
  comparisons: number;
  swaps: number;
  changed: boolean;
  phase: "compare" | "pass" | "done";
  early: boolean;
};
export function createBubble(input: number[]): BubbleState {
  if (
    input.length < 2 ||
    input.length > 8 ||
    input.some((n) => !Number.isInteger(n) || n < -99 || n > 99)
  )
    throw new Error(
      "Cần từ hai đến tám số nguyên từ âm chín mươi chín đến chín mươi chín.",
    );
  return {
    items: input.map((value, id) => ({ id, value })),
    pair: 0,
    end: input.length - 1,
    pass: 1,
    comparisons: 0,
    swaps: 0,
    changed: false,
    phase: "compare",
    early: false,
  };
}
/** A move answers exactly one adjacent comparison. Invalid moves never mutate the state. */
export function bubbleMove(
  state: BubbleState,
  swap: boolean,
): BubbleState | null {
  if (state.phase !== "compare") return null;
  const i = state.pair;
  const needsSwap = state.items[i].value > state.items[i + 1].value;
  if (swap !== needsSwap) return null;
  const items = state.items.slice();
  if (swap) [items[i], items[i + 1]] = [items[i + 1], items[i]];
  const changed = state.changed || swap;
  const last = i + 1 === state.end;
  const done = last && (!changed || state.end === 1);
  return {
    ...state,
    items,
    comparisons: state.comparisons + 1,
    swaps: state.swaps + Number(swap),
    changed,
    pair: last ? i : i + 1,
    end: done ? -1 : last ? state.end - 1 : state.end,
    phase: done ? "done" : last ? "pass" : "compare",
    early: done && !changed,
  };
}
export function nextBubblePass(state: BubbleState): BubbleState {
  return state.phase === "pass"
    ? {
        ...state,
        pair: 0,
        pass: state.pass + 1,
        changed: false,
        phase: "compare",
      }
    : state;
}
export type BubbleFrame = {
  state: BubbleState;
  title: string;
  narration: string;
  mood: PigMood;
  kind: "intro" | "compare" | "reason" | "move" | "pass" | "done";
  duration: number;
};
export function createBubbleLesson(input: number[]): BubbleFrame[] {
  let state = createBubble(input);
  const frames: BubbleFrame[] = [];
  function add(
    kind: BubbleFrame["kind"],
    title: string,
    narration: string,
    mood: PigMood = "explaining",
    snapshot = state,
  ) {
    frames.push({
      kind,
      title,
      narration,
      mood,
      state: snapshot,
      duration: Math.max(2200, narration.split(/\s+/).length * 170 + 900),
    });
  }
  add(
    "intro",
    "Đi từng cặp, từ trái sang phải",
    "Mình sẽ so sánh hai số đứng cạnh nhau. Nếu số bên trái lớn hơn, mình đổi chỗ hai số. Cứ đi như vậy, số lớn nhất sẽ dần trôi về cuối mảng.",
    "happy",
  );
  while (state.phase !== "done") {
    if (state.phase === "pass") {
      const value = state.items[state.end + 1].value;
      add(
        "pass",
        `${value} đã về đúng chỗ`,
        `${value} là số lớn nhất của phần vừa xét, nên đã đứng đúng chỗ ở cuối. Lượt sau mình quay về đầu và bỏ qua phần màu xanh này nhé.`,
        "proud",
      );
      state = nextBubblePass(state);
    }
    const a = state.items[state.pair].value,
      b = state.items[state.pair + 1].value;
    add(
      "compare",
      `So sánh ${a} và ${b}`,
      `Bây giờ mình xét ${a} ở bên trái và ${b} ngay bên phải. Hai số này đã theo thứ tự từ bé đến lớn chưa?`,
      "thinking",
    );
    const swap = a > b;
    add(
      "reason",
      swap
        ? `${a} lớn hơn ${b}`
        : a === b
          ? "Hai số bằng nhau"
          : `${a} nhỏ hơn ${b}`,
      swap
        ? `${a} lớn hơn ${b}, nhưng lại đứng trước. Mình đổi chỗ để ${b} sang trái, còn ${a} tiến thêm một ô về bên phải.`
        : a === b
          ? `Hai số đều bằng ${a}. Chúng đã đúng thứ tự, nên mình giữ nguyên. Những số bằng nhau sẽ không bị đổi thứ tự với nhau.`
          : `${a} nhỏ hơn ${b}, nên cặp này đã đúng thứ tự. Mình giữ nguyên vị trí của hai số nhé.`,
      swap ? "pointing" : "happy",
    );
    const before = state;
    state = bubbleMove(state, swap)!;
    // Keep the old comparison window during the exchange so the motion is legible.
    add(
      "move",
      swap ? "Đổi chỗ hai số" : "Giữ nguyên thứ tự",
      swap
        ? `${b} đã sang trái, ${a} đã sang phải. ${before.pair + 1 === before.end ? "Mình đã xét đến cuối lượt này rồi." : "Mình tiếp tục với cặp kế bên nhé."}`
        : "Không cần đổi chỗ. Mình đã kiểm tra xong cặp này.",
      swap ? "surprised" : "happy",
      { ...state, pair: before.pair, phase: "compare", end: before.end },
    );
  }
  add(
    "done",
    "Mảng đã được sắp xếp!",
    state.early
      ? "Cả lượt vừa rồi không có lần đổi chỗ nào. Nghĩa là mọi cặp cạnh nhau đều đã đúng thứ tự. Mình có thể dừng ngay, không cần đi thêm lượt nữa!"
      : "Mỗi lượt đưa thêm một số lớn về đúng chỗ. Giờ tất cả các số đã xếp từ bé đến lớn rồi. Đến lượt bạn thử nhé!",
    "celebrate",
  );
  return frames;
}

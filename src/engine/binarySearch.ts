export const BINARY_LEVELS = [10, 20, 30, 50, 80, 100] as const;
export const BINARY_RECORD_KEY = "algoventure.binary-record.v1";
export type BinaryState = {
  count: number; secret: number; low: number; high: number; guesses: number[];
  limit: number; phase: "playing" | "won" | "lost"; last: number | null;
  direction: "higher" | "lower" | "equal" | null;
};
/** An exact match is a guess too, including when the remaining range is one. */
export function binaryGuessLimit(count: number) { return Math.floor(Math.log2(count)) + 1; }
export function createBinarySearch(count: number, secret = 1 + Math.floor(Math.random() * count)): BinaryState {
  if (!Number.isInteger(count) || count < 1 || count > 200 || !Number.isInteger(secret) || secret < 1 || secret > count) throw new Error("Invalid binary search range");
  return { count, secret, low: 1, high: count, guesses: [], limit: binaryGuessLimit(count), phase: "playing", last: null, direction: null };
}
export function binaryGuess(state: BinaryState, value: number): BinaryState | null {
  if (state.phase !== "playing" || !Number.isInteger(value) || value < state.low || value > state.high || state.guesses.includes(value)) return null;
  const guesses = [...state.guesses, value];
  const equal = value === state.secret;
  return { ...state, guesses, last: value, direction: equal ? "equal" : value < state.secret ? "higher" : "lower",
    low: value < state.secret ? value + 1 : state.low,
    high: value > state.secret ? value - 1 : state.high,
    phase: equal ? "won" : guesses.length === state.limit ? "lost" : "playing" };
}
export function binaryMiddle(state: BinaryState) { return Math.floor((state.low + state.high) / 2); }
export function binaryRoundPoints(state: BinaryState) {
  return state.phase === "won" ? 100 + (state.limit - state.guesses.length) * 50 : 0;
}
export type BinaryFrame = {
  state: BinaryState; title: string; narration: string;
  kind: "intro" | "probe" | "compare" | "narrow" | "done";
  focus: number | null; relation: ">" | "<" | "=" | null;
  duration: number; resultIndex: number | null;
  mood: "explaining" | "thinking" | "pointing" | "celebrate";
};
export function createBinaryLesson(): BinaryFrame[] {
  let state = createBinarySearch(10, 7);
  const frames: BinaryFrame[] = [];
  function push(kind: BinaryFrame["kind"], title: string, narration: string, focus: number | null = null, relation: BinaryFrame["relation"] = null, snapshot = state) {
    frames.push({ state: { ...snapshot, guesses: [...snapshot.guesses] }, kind, title, narration, focus, relation,
      duration: Math.max(2400, Math.min(7000, narration.split(/\s+/).length * 145 + 700)),
      resultIndex: kind === "done" ? snapshot.secret - 1 : null,
      mood: kind === "done" ? "celebrate" : kind === "probe" ? "pointing" : kind === "compare" ? "thinking" : "explaining" });
  }
  push("intro", "Tìm trong mảng đã sắp xếp", "Mảng đã xếp tăng dần, đọc từ trái sang phải rồi xuống hàng. Chỉ số bắt đầu từ 0. Mình tìm số 7 bằng cách thu hẹp khoảng quanh ô giữa.");
  while (state.phase === "playing") {
    const middle = binaryMiddle(state);
    const index = middle - 1;
    push("probe", `Xét ô giữa: chỉ số ${index}`, state.low === state.high
      ? `Chỉ còn ô có chỉ số ${index}, chứa số ${middle}. Mình vẫn cần so sánh để biết có đúng số cần tìm không.`
      : state.guesses.length === 0
        ? "Hai đầu có chỉ số 0 và 9. Lấy phần nguyên của (0 + 9) / 2 được 4, nên ô giữa chứa số 5."
        : `Chỉ xét các số từ ${state.low} đến ${state.high}. Ô giữa của phần này có chỉ số ${index}, chứa số ${middle}.`, middle);
    const next = binaryGuess(state, middle)!;
    const relation = next.direction === "higher" ? ">" : next.direction === "lower" ? "<" : "=";
    push("compare", "So sánh với số cần tìm", relation === "="
      ? `${state.secret} bằng ${middle}. Đã tìm đúng số ở chỉ số ${index}, mình dừng lại ngay.`
      : relation === ">"
        ? `${state.secret} lớn hơn ${middle}. Vì mảng đã sắp xếp, ô đang xét và mọi ô bên trái nó đều không thể chứa số cần tìm.`
        : `${state.secret} nhỏ hơn ${middle}. Vì mảng đã sắp xếp, ô đang xét và mọi ô bên phải nó đều không thể chứa số cần tìm.`,
      middle, relation, { ...state, guesses: next.guesses, last: middle, direction: next.direction });
    const discardedLow = state.low, discardedHigh = state.high;
    state = next;
    if (state.phase === "won") break;
    push("narrow", relation === ">" ? "Giữ nửa bên phải" : "Giữ nửa bên trái", relation === ">"
      ? `Bỏ các ô chứa số ${discardedLow} đến ${middle}. Khoảng còn lại là ${state.low} đến ${state.high}; bước sau mình chọn lại ô giữa khoảng này.`
      : `Bỏ các ô chứa số ${middle} đến ${discardedHigh}. Khoảng còn lại là ${state.low} đến ${state.high}; không cần quay lại những ô đã loại.`);
  }
  push("done", `Tìm thấy số ${state.secret}!`, `Kết quả là chỉ số ${state.secret - 1}, tức ô thứ ${state.secret}. Gặp đúng số thì dừng; nếu khoảng cần tìm trở thành rỗng thì kết luận không tìm thấy.`, state.secret, "=");
  return frames;
}

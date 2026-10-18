import { createQuickSortSteps, type Item, type Step } from "./quicksort";

export type LessonKind =
  | "INTRO"
  | "FOCUS"
  | "PIVOT"
  | "SCAN"
  | "DECIDE"
  | "SWAP"
  | "MOVED"
  | "FIXED"
  | "SPLIT"
  | "DONE";
export type PigMood =
  | "happy"
  | "thinking"
  | "oops"
  | "celebrate"
  | "pointing"
  | "explaining"
  | "surprised"
  | "proud";
export type LessonFrame = {
  id: number;
  kind: LessonKind;
  items: Item[];
  range: [number, number];
  pivotIndex: number;
  scanIndex: number | null;
  boundary: number;
  processedEnd: number;
  nextSlot: number | null;
  targetRole: "small" | "pivot" | null;
  decision:
    | "keep-large"
    | "keep-small"
    | "swap-small"
    | "place-pivot"
    | "keep-pivot"
    | null;
  settled: number[];
  title: string;
  narration: string;
  equation: {
    a: number;
    b: number;
    operator: "≤" | ">";
    result: string;
  } | null;
  mood: PigMood;
  duration: number;
  swapIds: [number, number] | null;
  split: { left: number[]; pivot: number; right: number[] } | null;
};

/** Pedagogical timeline, independent of the interactive game's validator.
 * Separates observation, decision, movement, and recursion into readable beats.
 * All array snapshots come from the same Lomuto engine used by Play.
 */
export function createLesson(input: readonly number[]): LessonFrame[] {
  const steps = createQuickSortSteps(input);
  const frames: LessonFrame[] = [];
  const push = (
    step: Step,
    changes: Partial<LessonFrame> &
      Pick<LessonFrame, "kind" | "title" | "narration">,
  ) => {
    const frame: LessonFrame = {
      id: frames.length,
      items: step.items.map((item) => ({ ...item })),
      range: [...step.activeRange],
      pivotIndex: step.pivotIndex,
      scanIndex: null,
      boundary: step.i,
      processedEnd: step.activeRange[0] - 1,
      nextSlot: null,
      targetRole: null,
      decision: null,
      settled: [...step.sortedIndices],
      equation: null,
      mood: "explaining",
      duration: 3200,
      swapIds: null,
      split: null,
      ...changes,
    };
    frame.duration = Math.max(
      frame.duration,
      Math.min(8500, frame.narration.split(/\s+/).length * 170 + 900),
    );
    frames.push(frame);
  };
  push(steps[0], {
    kind: "INTRO",
    pivotIndex: -1,
    title: "Xếp các số từ nhỏ đến lớn",
    narration:
      "Mình cùng xếp các số từ nhỏ đến lớn nhé! Quick Sort có nhiều cách chọn chốt. Bài này mình dùng cách Lomuto: chọn số ở cuối mảng đang xét.",
    mood: "happy",
    duration: 4800,
  });

  for (let k = 0; k < steps.length; k++) {
    const step = steps[k];
    const after = steps[k + 1];
    const [left, right] = step.activeRange;
    const pivot = step.arrayState[step.pivotIndex];
    if (step.actionType === "SELECT_PIVOT") {
      if (step.partition > 1)
        push(step, {
          kind: "FOCUS",
          pivotIndex: -1,
          title: `Làm tiếp với ${right - left + 1} số được khoanh`,
          narration:
            "Chốt vừa rồi đã đứng đúng chỗ rồi. Giờ mình làm tương tự với nhóm số được khoanh này nhé!",
          mood: "pointing",
          duration: 3800,
        });
      push(step, {
        kind: "PIVOT",
        title: `Chọn ${pivot} làm chốt`,
        narration:
          step.partition === 1
            ? `Giữ ${pivot} ở cuối giúp mình xét các số phía trước mà chưa đụng đến chốt. Xét xong mới đưa chốt về đúng chỗ. Ô ${left} đang chờ số nhỏ hơn hoặc bằng ${pivot} đầu tiên nhé!`
            : `Mình lại lấy số cuối của nhóm này là ${pivot} làm chốt nhé. Chốt tạm đứng yên ở cuối. Ô ${left} sẽ nhận số nhỏ hơn hoặc bằng ${pivot} đầu tiên.`,
        nextSlot: left,
        targetRole: "small",
        mood: "pointing",
        duration: 4400,
      });
    } else if (step.actionType === "COMPARE") {
      const value = step.arrayState[step.j!];
      const passes = value <= pivot;
      const target = step.i + 1;
      const sameSlot = target === step.j;
      const comparison =
        value === pivot
          ? `${value} bằng chốt ${pivot}, nên cũng vào nhóm nhỏ`
          : `${value} ${passes ? "nhỏ hơn" : "lớn hơn"} chốt ${pivot}`;
      push(step, {
        kind: "SCAN",
        title: `Đến lượt số ${value}`,
        narration: `Mình xem số ${value} ở ô ${step.j} nhé. Ô ${target} đang chờ nhận số nhỏ hơn hoặc bằng chốt. Cùng so ${value} với chốt ${pivot} để biết có đưa vào ô đó không nào.`,
        scanIndex: step.j,
        processedEnd: step.j! - 1,
        nextSlot: step.i + 1,
        targetRole: "small",
        mood: "thinking",
        duration: 3400,
      });
      push(step, {
        kind: "DECIDE",
        title: "So sánh với chốt",
        narration: passes
          ? step.i + 1 === step.j
            ? `${comparison}. ${value} đã ở đúng ô ${target} rồi. Đổi với chính mình thì mảng vẫn như cũ, nên cứ giữ nguyên nhé! Ô ${target + 1} sẽ nhận số nhỏ tiếp theo.`
            : `${comparison}. Mình cần đưa ${value} vào ô ${target}, đang chứa ${step.arrayState[target]}. Nhưng ${value} lại ở ô ${step.j}. Hai ô khác nhau nên mình đổi chỗ hai số nhé!`
          : step.j === right - 1
            ? `${value} lớn hơn chốt ${pivot}, nên không vào nhóm nhỏ. Giữ ${value} ở ô ${step.j} nhé! Đã xét hết các số khác chốt rồi, bước sau sẽ đặt chốt vào ô ${target}.`
            : `${value} lớn hơn chốt ${pivot}, nên không vào nhóm nhỏ. Giữ ${value} ở ô ${step.j} nhé! Ô ${target} vẫn chờ số nhỏ hơn hoặc bằng ${pivot}. Khi gặp số như vậy, mình mới đổi vào ô này.`,
        scanIndex: step.j,
        boundary: passes && step.i + 1 === step.j ? step.i + 1 : step.i,
        processedEnd: !passes || step.i + 1 === step.j ? step.j! : step.j! - 1,
        nextSlot: target,
        targetRole: "small",
        decision: passes
          ? sameSlot
            ? "keep-small"
            : "swap-small"
          : "keep-large",
        equation: {
          a: value,
          b: pivot,
          operator: passes ? "≤" : ">",
          result: passes
            ? step.i + 1 === step.j
              ? "Đúng ô rồi, giữ nguyên"
              : "Khác ô nên cần đổi chỗ"
            : `Giữ ở ô ${step.j}`,
        },
        mood: passes ? "proud" : "surprised",
        duration: 5600,
      });
    } else if (step.actionType === "SWAP") {
      const [a, b] = step.expectedIndices;
      push(step, {
        kind: "SWAP",
        title: `Đổi chỗ ${step.arrayState[a]} và ${step.arrayState[b]}`,
        narration: `Mình đổi ${step.arrayState[b]} ở ô ${b} với ${step.arrayState[a]} ở ô ${a} nhé. ${step.arrayState[b]} sẽ nối vào nhóm nhỏ, còn ${step.arrayState[a]} sang nhóm lớn hơn chốt. Chốt ${pivot} chưa di chuyển.`,
        boundary: step.i - 1,
        processedEnd: step.j! - 1,
        scanIndex: b,
        nextSlot: a,
        targetRole: "small",
        decision: "swap-small",
        swapIds: [step.items[a].id, step.items[b].id],
        mood: "explaining",
        duration: 3000,
      });
      push(step, {
        kind: "MOVED",
        title: `${step.arrayState[b]} đã sang trái`,
        narration:
          step.j! + 1 < right
            ? `Vậy là nhóm nhỏ vừa có thêm ${step.arrayState[b]} rồi! Ô ${step.i + 1} sẽ nhận số nhỏ tiếp theo. Còn số mình sắp xét ở ô ${step.j! + 1}. Hai ô này không nhất thiết trùng nhau nhé.`
            : `Mình đã xét hết các số khác chốt rồi. Nhóm nhỏ kết thúc ở ô ${step.i}, nên ô ${step.i + 1} ngay sau đó sẽ là chỗ của chốt nhé.`,
        items: after.items.map((item) => ({ ...item })),
        boundary: step.i,
        processedEnd: step.j!,
        nextSlot: step.i + 1,
        targetRole: "small",
        swapIds: [step.items[a].id, step.items[b].id],
        mood: "proud",
        duration: 3000,
      });
    } else if (step.actionType === "PLACE_PIVOT") {
      const position = step.i + 1;
      const ids: [number, number] | null =
        position === right
          ? null
          : [step.items[position].id, step.items[right].id];
      push(step, {
        kind: "SWAP",
        title:
          position === right
            ? "Chốt đã đứng ngay ranh giới"
            : `Đặt chốt ${pivot} vào giữa hai nhóm`,
        narration:
          position === right
            ? `Các số vừa xét đều nhỏ hơn hoặc bằng ${pivot}. Chốt đã ở ô ${right}, ngay sau nhóm nhỏ rồi. Mình cứ giữ nguyên nhé, đổi với chính mình cũng không làm mảng khác đi đâu.`
            : `${position === left ? "Nhóm nhỏ đang rỗng" : `Nhóm nhỏ kết thúc ở ô ${step.i}`}, nên chốt phải vào ô ${position}. Mình đổi ${pivot} ở ô ${right} với ${step.arrayState[position]} ở ô ${position} nhé. Chốt sẽ nằm giữa hai nhóm.`,
        processedEnd: right - 1,
        nextSlot: position,
        targetRole: "pivot",
        decision: position === right ? "keep-pivot" : "place-pivot",
        swapIds: ids,
        mood: "pointing",
        duration: 3800,
      });
      const fixedItems = after.items.map((item) => ({ ...item }));
      const split = {
        left: fixedItems.slice(left, position).map((item) => item.value),
        pivot,
        right: fixedItems
          .slice(position + 1, right + 1)
          .map((item) => item.value),
      };
      push(step, {
        kind: "FIXED",
        title: `${pivot} đã ở đúng vị trí!`,
        narration: `${position - left === 0 ? `Không có số nhỏ hơn hoặc bằng ${pivot} ở bên trái` : `Bên trái có ${position - left} số nhỏ hơn hoặc bằng ${pivot}`}. Bên phải chỉ có số lớn hơn chốt. Vậy là ${pivot} đã đúng chỗ rồi! Mình còn phải xếp lại từng nhóm nữa nhé.`,
        items: fixedItems,
        pivotIndex: position,
        boundary: position - 1,
        processedEnd: right,
        settled: [...new Set([...step.sortedIndices, position])],
        swapIds: ids,
        mood: "celebrate",
        duration: 4200,
      });
      push(step, {
        kind: "SPLIT",
        title: "Chia nhỏ, rồi làm lại",
        narration: `Mình giữ nguyên chốt ${pivot} nhé. Các số trong mỗi nhóm vẫn có thể còn lộn xộn, nên mình chọn chốt và chia nhóm tiếp. Nhóm trống hoặc chỉ có một số thì xong rồi!`,
        items: fixedItems,
        pivotIndex: position,
        boundary: position - 1,
        processedEnd: right,
        settled: [...new Set([...step.sortedIndices, position])],
        split,
        mood: "pointing",
        duration: 5000,
      });
    } else {
      push(step, {
        kind: "DONE",
        title: "Tất cả đã theo thứ tự!",
        narration:
          "Xong rồi, các số đã theo thứ tự! Mình đã chọn chốt, so sánh và chia nhóm, rồi làm tương tự với từng nhóm nhỏ hơn. Bạn vừa cùng mình học Quick Sort đấy!",
        boundary: input.length - 1,
        processedEnd: input.length - 1,
        settled: input.map((_, index) => index),
        mood: "celebrate",
        duration: 5000,
      });
    }
  }
  return frames;
}

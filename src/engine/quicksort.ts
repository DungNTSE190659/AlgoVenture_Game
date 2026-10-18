/** Pure, UI-independent Lomuto timeline. Every snapshot is the state BEFORE its action. */
export type ActionType =
  | "SELECT_PIVOT"
  | "COMPARE"
  | "SWAP"
  | "PLACE_PIVOT"
  | "DONE";
export type Item = { id: number; value: number };
export type Step = {
  arrayState: number[];
  items: Item[];
  pivotIndex: number;
  activeRange: [number, number];
  comparingIndices: [number, number] | null;
  actionType: ActionType;
  message: string;
  detail: string;
  expectedIndices: number[];
  i: number;
  j: number | null;
  sortedIndices: number[];
  depth: number;
  partition: number;
  line: number;
};

export function createQuickSortSteps(input: readonly number[]): Step[] {
  if (!input.every(Number.isFinite))
    throw new Error("Mảng chỉ được chứa số hữu hạn.");
  const items: Item[] = input.map((value, id) => ({ value, id }));
  const steps: Step[] = [];
  const sorted = new Set<number>();
  let partition = 0;

  function sort(left: number, right: number, depth: number): void {
    if (left > right) return;
    if (left === right) {
      sorted.add(left);
      return;
    }
    partition++;
    const currentPartition = partition;
    const pivot = items[right].value;
    let i = left - 1;
    const push = (
      actionType: ActionType,
      expectedIndices: number[],
      message: string,
      detail: string,
      j: number | null,
      line: number,
    ) => {
      steps.push({
        items: items.map((item) => ({ ...item })),
        arrayState: items.map((item) => item.value),
        pivotIndex: right,
        activeRange: [left, right],
        comparingIndices: j === null ? null : [j, right],
        actionType,
        expectedIndices,
        message,
        detail,
        i,
        j,
        sortedIndices: [...sorted].sort((a, b) => a - b),
        depth,
        partition: currentPartition,
        line,
      });
    };
    push(
      "SELECT_PIVOT",
      [right],
      `Chọn ${pivot} làm chốt nhé!`,
      currentPartition === 1
        ? `Có nhiều cách chọn chốt; bài này dùng cách Lomuto. Mình giữ ${pivot} ở cuối để xét các số phía trước rồi mới đặt chốt về đúng chỗ. Chạm vào ô ${right} nhé!`
        : `Mình cũng chọn số cuối của nhóm này là ${pivot} làm chốt nhé. Chốt tạm đứng yên để mình xét các số phía trước. Chạm vào ô ${right} nào!`,
      null,
      0,
    );
    for (let j = left; j < right; j++) {
      const value = items[j].value;
      const passes = value <= pivot;
      push(
        "COMPARE",
        [j, right],
        `So sánh ${value} với chốt ${pivot}`,
        `Chạm số ${value} ở ô ${j}, rồi chạm chốt ${pivot} nhé. ${value} ${value === pivot ? "bằng" : passes ? "nhỏ hơn" : "lớn hơn"} chốt, nên ${passes ? "mình sẽ đưa vào nhóm nhỏ" : "mình cứ giữ nguyên ở ô này"}.`,
        j,
        3,
      );
      if (passes) {
        i++;
        if (i !== j) {
          push(
            "SWAP",
            [i, j],
            `Đổi chỗ ${items[i].value} và ${value}`,
            `Ô ${i} đang chờ nhận ${value}, nhưng số này còn ở ô ${j}. Chạm hai ô đó để đổi chỗ nhé. Bạn cũng có thể kéo một khối lên khối còn lại.`,
            j,
            5,
          );
          [items[i], items[j]] = [items[j], items[i]];
        }
      }
    }
    const position = i + 1;
    push(
      "PLACE_PIVOT",
      position === right ? [right] : [position, right],
      `Đưa chốt ${pivot} về vị trí ${position}`,
      position === right
        ? `Chốt đã ở đúng chỗ rồi! Chạm vào ô ${right} để mình tiếp tục nhé.`
        : `Mình cần đặt chốt ngay sau nhóm nhỏ. Đổi số ở ô ${position} với chốt ở ô ${right} nhé. Khi đó, bên trái chốt là các số nhỏ hơn hoặc bằng ${pivot}, bên phải là các số lớn hơn.`,
      null,
      6,
    );
    [items[position], items[right]] = [items[right], items[position]];
    sorted.add(position);
    sort(left, position - 1, depth + 1);
    sort(position + 1, right, depth + 1);
  }
  sort(0, items.length - 1, 0);
  steps.push({
    items: items.map((item) => ({ ...item })),
    arrayState: items.map((item) => item.value),
    pivotIndex: -1,
    activeRange: [0, items.length - 1],
    comparingIndices: null,
    actionType: "DONE",
    message: "Mảng đã được sắp xếp!",
    detail: "Tất cả phần tử đã ở đúng vị trí, từ nhỏ đến lớn. Tuyệt lắm!",
    expectedIndices: [],
    i: -1,
    j: null,
    sortedIndices: items.map((_, index) => index),
    depth: 0,
    partition,
    line: 7,
  });
  return steps;
}

/** Order-independent selection. Identity is by array position, including duplicate values. */
export function validateSelection(
  step: Step,
  selected: readonly number[],
): boolean {
  return (
    step.actionType !== "DONE" &&
    selected.length === step.expectedIndices.length &&
    new Set(selected).size === selected.length &&
    step.expectedIndices.every((index) => selected.includes(index))
  );
}

export type Difficulty = "easy" | "medium" | "hard";
export function createArray(
  difficulty: Difficulty,
  random = Math.random,
): number[] {
  const length = difficulty === "easy" ? 5 : difficulty === "medium" ? 7 : 8;
  const pool = Array.from({ length: 19 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const result = pool.slice(0, length);
  if (difficulty === "hard") result[2] = result[6];
  return result;
}

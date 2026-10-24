import { advanceMerge, createMerge, mergeExpected, releaseMerge, type MergeLane, type MergeNode, type MergeState } from "./mergeSort";

export type MergeStream = {
  sorting: MergeState; groups: MergeNode[]; selected: string;
  phase: "split" | "merge" | "joined" | "done";
  splits: number; mistakes: number; score: number; feedback: string; wrongId?: number;
};
export function createMergeStream(input: readonly number[]): MergeStream {
  const sorting = createMerge(input);
  return { sorting, groups: [sorting.root], selected: sorting.root.id, phase: sorting.phase === "done" ? "done" : "split", splits: 0, mistakes: 0, score: 0, feedback: "" };
}
export function selectStreamGroup(run: MergeStream, id: string): MergeStream {
  return run.phase === "split" && run.groups.some(group => group.id === id && group.left) ? { ...run, selected: id, feedback: "" } : run;
}
export function splitStreamGroup(run: MergeStream): MergeStream {
  if (run.phase !== "split") return run;
  const index = run.groups.findIndex(group => group.id === run.selected), group = run.groups[index];
  if (!group?.left || !group.right) return run;
  const groups = [...run.groups.slice(0, index), group.left, group.right, ...run.groups.slice(index + 1)];
  const next = groups.find(group => group.left);
  return { ...run, groups, selected: next?.id ?? "", phase: next ? "split" : "merge", splits: run.splits + 1, score: run.score + 50, feedback: next ? "Đã chia thành hai nhánh. Tiếp tục với nhóm còn nhiều thẻ." : "Mỗi thẻ đã là một nhóm. Bắt đầu ghép hai nhánh nhỏ nhất nhé!" };
}
export function takeStreamLeaf(run: MergeStream, lane: MergeLane, id: number): MergeStream {
  if (run.phase !== "merge") return run;
  const item = run.sorting[lane][0], expected = mergeExpected(run.sorting);
  if (!item) return run;
  const sorting = id === item.id ? releaseMerge(run.sorting, lane) : null;
  if (!sorting) {
    const equal = id === item.id && item.value === expected?.value;
    return { ...run, wrongId: id, mistakes: run.mistakes + 1, score: Math.max(0, run.score - 25), feedback: "Sai quy tắc Merge Sort (−25 điểm). " + (id !== item.id
      ? "Chỉ lấy thẻ ở đầu nhánh; các thẻ phía sau phải chờ lượt."
      : equal ? "Hai thẻ cùng số: lấy nhánh trái trước để giữ thứ tự các ký tự."
      : `Thẻ ${item.value} chưa tới lượt. So sánh hai thẻ đầu nhánh và lấy số nhỏ hơn nhé.`) };
  }
  return { ...run, wrongId: undefined, sorting, phase: sorting.phase === "joined" ? "joined" : "merge", score: run.score + 100, feedback: "" };
}
export function nextStreamGroup(run: MergeStream): MergeStream {
  if (run.phase !== "joined") return run;
  const sorting = advanceMerge(run.sorting);
  return { ...run, sorting, phase: sorting.phase === "done" ? "done" : "merge", feedback: "" };
}
export function streamHint(run: MergeStream): string {
  if (run.phase === "split") return "Chia nhóm thẻ thành hai nửa liên tiếp. Kéo giọt nước ở giữa sang một bờ, hoặc bấm Tách nhánh. Mỗi nhóm chỉ còn một thẻ thì bắt đầu ghép.";
  if (run.phase === "joined") return "Đã ghép đủ thẻ theo thứ tự. Bấm tiếp tục để đưa nhóm vừa ghép lên nhánh lớn hơn.";
  if (run.phase === "done") return "Dòng suối đã có thứ tự từ bé đến lớn. Thẻ cùng số giữ nguyên thứ tự ký tự.";
  const a = run.sorting.left[0], b = run.sorting.right[0];
  if (!a || !b) return `Nhánh ${a ? "phải" : "trái"} đã hết. Đưa lần lượt từng thẻ đầu nhánh còn lại vào kết quả; chúng không tự trôi.`;
  if (a.value === b.value) return `Hai thẻ đều mang số ${a.value}. Chọn thẻ nhánh trái trước để giữ thứ tự ký tự.`;
  return `So sánh ${a.value} và ${b.value}. Kéo thẻ ${Math.min(a.value, b.value)} ở đầu nhánh vào kết quả trước.`;
}

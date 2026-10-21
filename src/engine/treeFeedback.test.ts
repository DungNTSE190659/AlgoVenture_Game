import { describe, expect, it } from "vitest";
import { createTreeCourse, TREE_IDS, resolveTreeDrop, type BSTReplacement, type TreeLessonId } from "./tree";
import { explainTreeMistake } from "./treeFeedback";

function feedback(lesson: TreeLessonId, r: number, s: number, itemId: string, target: string, strategy: BSTReplacement = "successor") {
  const round = createTreeCourse(lesson, strategy).rounds[r], step = round.steps[s];
  return explainTreeMistake({ lesson, round, step, board: s ? round.steps[s - 1].after : round.initial, item: step.items.find(i => i.id === itemId)!, target });
}
describe("Buta explains the actual Tree mistake", () => {
  it("compares the actual dragged seed with every ancestor before considering script order", () => {
    const round = createTreeCourse("tree-basics").rounds[2];
    const at30 = round.steps.findIndex(s => s.item === "seed:30");
    const at50 = round.steps.findIndex(s => s.item === "seed:50");
    expect(feedback("tree-basics", 2, at30, "seed:30", "slot:6")).toContain("30 < gốc 40");
    expect(feedback("tree-basics", 2, at30, "seed:30", "slot:5")).toContain("nhánh phải của 40");
    expect(feedback("tree-basics", 2, at50, "seed:50", "slot:6")).toContain("50 < 60");
    expect(feedback("tree-basics", 2, at50, "seed:70", "slot:5")).toContain("70 > 60");
    const connect20 = round.steps.findIndex(s => s.item === "branch:0");
    expect(feedback("tree-basics", 2, connect20, "branch:0", "slot:0")).toContain("tạo vòng");
  });
  it("distinguishes wrong seed from wrong child position and occupied slot", () => {
    expect(feedback("tree-basics", 0, 0, "seed:20", "slot:0")).toContain("20 có thể làm gốc của một cây khác");
    expect(feedback("tree-basics", 0, 1, "seed:20", "slot:2")).toContain("20 < gốc 40, nên phải ở nhánh trái");
    expect(feedback("tree-basics", 0, 1, "seed:20", "slot:0")).toContain("đã có 40");
    const large = createTreeCourse("tree-basics").rounds[2];
    const planting30 = large.steps.findIndex(step => step.item === "seed:30");
    expect(feedback("tree-basics", 2, planting30, "seed:30", "slot:5")).toContain("30 < gốc 40, nên phải ở nhánh trái");
    const planting50 = large.steps.findIndex(step => step.item === "seed:50");
    expect(feedback("tree-basics", 2, planting50, "seed:50", "slot:6")).toContain("50 < 60, nên phải ở nhánh trái của 60");
  });
  it("explains why labels do not describe the selected node", () => {
    expect(feedback("tree-basics", 1, 0, "label:Gốc", "slot:1")).toContain("20 có cha là 40");
    expect(feedback("tree-basics", 1, 1, "label:Lá", "slot:0")).toContain("40 còn con 20 và 60");
    expect(feedback("tree-basics", 1, 2, "label:Cha", "slot:3")).toContain("không có nút con");
    expect(feedback("tree-basics", 1, 3, "label:Độ sâu 2", "slot:1")).toContain("độ sâu là 1, không phải 2");
    const leaves = createTreeCourse("tree-basics").rounds[1].steps[1];
    expect(resolveTreeDrop(leaves, "label:Lá", "slot:4")).toBe(true);
    expect(feedback("tree-basics", 1, 4, "label:Độ sâu 0", "slot:1")).toContain("độ sâu là 1, không phải 0");
    expect(feedback("tree-basics", 1, 5, "label:Độ sâu 1", "slot:0")).toContain("độ sâu là 0, không phải 1");
  });
  it("explains all four traversal rules against the selected node", () => {
    expect(feedback("tree-traversal", 0, 0, "card:1", "result")).toContain("cha 40 chưa được ghi");
    expect(feedback("tree-traversal", 1, 0, "card:0", "result")).toContain("cây con trái chưa duyệt");
    expect(feedback("tree-traversal", 2, 0, "card:1", "result")).toContain("con 10 và 30 chưa ghi");
    expect(feedback("tree-traversal", 3, 0, "card:3", "result")).toContain("tầng 2 khi tầng 0 chưa xong");
    expect(feedback("tree-traversal", 3, 1, "card:2", "result")).toContain("phía phải trước nút phía trái");
  });
  it("uses actual ancestor comparisons for repair and planting", () => {
    expect(feedback("bst", 1, 0, "node:6", "slot:5")).toContain("nhánh trái của 40 nhưng 50 > 40");
    expect(feedback("bst", 2, 1, "seed:20", "slot:2")).toContain("20 nằm trong nhánh phải của 40 nhưng 20 < 40");
  });
  it("explains search and insert comparisons using the searched value", () => {
    expect(feedback("bst-search", 0, 1, "pig", "slot:2")).toContain("30 < 40, nhưng bạn đi phải");
    expect(feedback("bst-insert", 1, 1, "seed:25", "slot:2")).toContain("25 < 40, nhưng bạn đi phải");
    expect(feedback("bst-search", 0, 1, "pig", "slot:4")).toContain("nhảy qua tầng");
  });
  it("explains extreme-node selection, replacement and removal errors", () => {
    expect(feedback("bst-delete", 2, 2, "pig", "slot:3", "predecessor")).toContain("20 vẫn còn con phải; đi trái không tìm được số lớn nhất");
    expect(feedback("bst-delete", 2, 2, "pig", "slot:6")).toContain("60 vẫn còn con trái; đi phải không tìm được số nhỏ nhất");
    expect(feedback("bst-delete", 2, 4, "node:1", "slot:0", "predecessor")).toContain("20 không phải predecessor");
    expect(feedback("bst-delete", 2, 3, "node:5", "tray")).toContain("tháo 50 sẽ làm mất");
    expect(feedback("bst-delete", 0, 0, "node:1", "tray")).toContain("tháo 20 sẽ làm mất");
    expect(feedback("bst-delete", 1, 1, "node:2", "slot:1")).toContain("60 không phải nút con còn lại");
  });
  it("produces finite contextual feedback without mutating any board across all rounds", () => {
    for (const strategy of ["successor", "predecessor"] as const) for (const lesson of TREE_IDS) for (const round of createTreeCourse(lesson, strategy).rounds) for (const [s, step] of round.steps.entries()) {
      const board = s ? round.steps[s - 1].after : round.initial, before = JSON.stringify(board);
      const targets = [...new Set([...step.targets.map(t => t.id), ...Object.keys(board.nodes).map(i => `slot:${i}`)])];
      for (const item of step.items) for (const target of targets) {
        if (resolveTreeDrop(step, item.id, target) || target === `slot:${item.slot}`) continue;
        const text = explainTreeMistake({ lesson, round, step, board, item, target });
        expect(text).not.toMatch(/undefined|NaN|chưa đúng vị trí|Đề bài|theo đề bài|đề yêu cầu|được yêu cầu/);
        expect(text).toContain("Bạn đưa");
        expect(text.length).toBeLessThan(450);
      }
      expect(JSON.stringify(board)).toBe(before);
    }
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { ALL_LESSONS, ARRAYS, REGIONS, currentLesson, lessonUnlocked, nextLesson, readTrackProgress, regionComplete, regionForLesson, regionUnlocked, STORAGE_KEY, type Progress } from "./learningTrack";
afterEach(() => vi.unstubAllGlobals());
const completedArrays = Object.fromEntries(ARRAYS.map(lesson => [lesson.id, true])) as Progress;
describe("curriculum and progress", () => {
  it("teaches sorting and searching inside Array without BST prerequisites", () => {
    expect(REGIONS.map(region => region.id)).toEqual(["arrays", "linear-structures", "trees", "graph"]);
    expect(ALL_LESSONS).toHaveLength(20);
    expect(new Set(ALL_LESSONS.map(lesson => lesson.id)).size).toBe(20);
    expect(ARRAYS.map(lesson => lesson.id)).toEqual(["array", "linear", "bubble", "selection", "insertion", "merge", "quick", "binary"]);
    expect(regionForLesson("bubble").id).toBe("arrays");
    expect(regionForLesson("binary").id).toBe("arrays");
    expect(lessonUnlocked("bubble", { array: true, linear: true })).toBe(true);
    expect(lessonUnlocked("bubble", { bst: true, stack: true })).toBe(false);
    expect(lessonUnlocked("linear", { array: true })).toBe(true);
    expect(lessonUnlocked("binary", { array: true, linear: true })).toBe(false);
  });
  it("opens the next region only after every lesson in the previous regions", () => {
    expect(regionUnlocked("arrays", {})).toBe(true);
    expect(regionUnlocked("linear-structures", { array: true })).toBe(false);
    expect(regionComplete("arrays", completedArrays)).toBe(true);
    expect(regionUnlocked("linear-structures", completedArrays)).toBe(true);
    expect(lessonUnlocked("linked-list", completedArrays)).toBe(true);
    expect(nextLesson("binary")?.id).toBe("linked-list");
    expect(nextLesson("queue")?.id).toBe("tree-basics");
    const linear = { ...completedArrays, "linked-list": true, stack: true, queue: true };
    expect(regionUnlocked("trees", linear)).toBe(true);
    expect(regionUnlocked("graph", { ...linear, bst: true })).toBe(false);
    const trees = { ...linear, "tree-basics": true, bst: true, "bst-search": true, "bst-insert": true, "bst-delete": true };
    expect(regionUnlocked("graph", trees)).toBe(true);
    expect(lessonUnlocked("dfs", trees)).toBe(false);
    expect(lessonUnlocked("dfs", { ...trees, "graph-basics": true })).toBe(true);
  });
  it("preserves v2 completions without granting new lessons or skipping gaps", () => {
    vi.stubGlobal("localStorage", { getItem: (key: string) => key === "algoventure.world-progress.v2" ? '{"array":true,"bubble":true,"bst":true,"binary":"true","unknown":true}' : null });
    const progress = readTrackProgress();
    expect(progress).toEqual({ array: true, bubble: true, bst: true });
    expect(currentLesson(progress).id).toBe("linear");
    expect(lessonUnlocked("selection", progress)).toBe(false);
    expect(regionUnlocked("trees", progress)).toBe(false);
  });
  it("imports v1 saves and prefers the current save when it exists", () => {
    vi.stubGlobal("localStorage", { getItem: (key: string) => key === "algoventure.learning-track.v1" ? '{"bubble":true}' : null });
    expect(readTrackProgress()).toEqual({ bubble: true });
    expect(currentLesson(readTrackProgress()).id).toBe("array");
    vi.stubGlobal("localStorage", { getItem: (key: string) => key === STORAGE_KEY ? '{"array":true,"linear":true}' : '{"quick":true}' });
    expect(readTrackProgress()).toEqual({ array: true, linear: true });
  });
  it("recovers from corrupt or unavailable storage", () => {
    vi.stubGlobal("localStorage", { getItem: () => '{broken' });
    expect(readTrackProgress()).toEqual({});
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); } });
    expect(readTrackProgress()).toEqual({});
  });
});

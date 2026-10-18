import { afterEach, describe, expect, it, vi } from "vitest";
import { ALL_LESSONS, ARRAYS, ARRAY_ROUTES, REGIONS, arrayRouteForLesson, currentRouteLesson, currentLesson, lessonUnlocked, nextLesson, readTrackProgress, regionComplete, regionForLesson, regionUnlocked, STORAGE_KEY, type Progress } from "./learningTrack";
afterEach(() => vi.unstubAllGlobals());
const completedArrays = Object.fromEntries(ARRAYS.map(lesson => [lesson.id, true])) as Progress;
describe("curriculum and progress", () => {
  it("teaches sorting and searching inside Array without BST prerequisites", () => {
    expect(REGIONS.map(region => region.id)).toEqual(["arrays", "linear-structures", "trees", "graph"]);
    expect(ALL_LESSONS).toHaveLength(19);
    expect(new Set(ALL_LESSONS.map(lesson => lesson.id)).size).toBe(19);
    expect(ARRAYS.map(lesson => lesson.id)).toEqual(["bubble", "selection", "insertion", "merge", "quick", "linear", "binary"]);
    expect(regionForLesson("bubble").id).toBe("arrays");
    expect(regionForLesson("binary").id).toBe("arrays");
    expect(lessonUnlocked("bubble", { array: true, linear: true })).toBe(true);
    expect(lessonUnlocked("bubble", {})).toBe(true);
    expect(lessonUnlocked("linear", { array: true })).toBe(true);
    expect(lessonUnlocked("binary", { array: true, linear: true })).toBe(true);
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
    expect(progress).toEqual({ bubble: true, bst: true });
    expect(currentLesson(progress).id).toBe("insertion");
    expect(lessonUnlocked("quick", progress)).toBe(false);
    expect(regionUnlocked("trees", progress)).toBe(false);
  });
  it("imports v1 saves and prefers the current save when it exists", () => {
    vi.stubGlobal("localStorage", { getItem: (key: string) => key === "algoventure.learning-track.v1" ? '{"bubble":true}' : null });
    expect(readTrackProgress()).toEqual({ bubble: true });
    expect(currentLesson(readTrackProgress()).id).toBe("insertion");
    vi.stubGlobal("localStorage", { getItem: (key: string) => key === STORAGE_KEY ? '{"array":true,"linear":true}' : '{"quick":true}' });
    expect(readTrackProgress()).toEqual({ linear: true });
  });
  it("recovers from corrupt or unavailable storage", () => {
    vi.stubGlobal("localStorage", { getItem: () => '{broken' });
    expect(readTrackProgress()).toEqual({});
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); } });
    expect(readTrackProgress()).toEqual({});
  });
  it("keeps shipped games playable while unfinished lessons stay on the map", () => {
    expect(currentLesson({}).id).toBe("bubble");
    expect(lessonUnlocked("insertion", {})).toBe(false);
    expect(lessonUnlocked("insertion", { bubble: true })).toBe(true);
    expect(lessonUnlocked("quick", { bubble: true, insertion: true })).toBe(true);
    expect(regionUnlocked("linear-structures", { bubble: true, insertion: true, quick: true })).toBe(false);
  });
  it("keeps Search and Sort independent, with local lesson order and progress", () => {
    expect(ARRAY_ROUTES.map(route => [route.id, route.lessons.map(lesson => lesson.id)])).toEqual([
      ["sort", ["bubble", "selection", "insertion", "merge", "quick"]], ["search", ["linear", "binary"]],
    ]);
    expect(arrayRouteForLesson("binary")?.id).toBe("search");
    expect(arrayRouteForLesson("insertion")?.id).toBe("sort");
    expect(currentRouteLesson("sort", { linear: true }).id).toBe("bubble");
    expect(currentRouteLesson("search", { bubble: true, insertion: true, quick: true }).id).toBe("linear");
    expect(lessonUnlocked("binary", { linear: true })).toBe(true);
    expect(lessonUnlocked("binary", { bubble: true, insertion: true, quick: true })).toBe(false);
    expect(lessonUnlocked("insertion", { linear: true, binary: true })).toBe(false);
    expect(nextLesson("linear")?.id).toBe("binary");
    expect(nextLesson("quick")?.id).toBe("linked-list");
    expect(regionUnlocked("linear-structures", { bubble: true, selection: true, insertion: true, merge: true, quick: true })).toBe(false);
  });
  it("splits saved progress by existing IDs without losing either route", () => {
    vi.stubGlobal("localStorage", { getItem: () => '{"linear":true,"binary":true,"bubble":true,"insertion":true}' });
    const progress = readTrackProgress();
    expect(progress).toEqual({ linear: true, binary: true, bubble: true, insertion: true });
    expect(currentRouteLesson("sort", progress).id).toBe("quick");
    expect(currentRouteLesson("search", progress).id).toBe("binary");
  });
});

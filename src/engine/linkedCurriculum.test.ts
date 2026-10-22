import { afterEach, describe, expect, it, vi } from "vitest";
import { LINKED_LEVELS, completeLinkedLevel, linkedLevelUnlocked, readLinkedLevelProgress } from "./linkedCurriculum";
import { LINKED_CHALLENGES } from "./linkedChallenges";

afterEach(() => vi.unstubAllGlobals());

describe("Linked List curriculum", () => {
  it("provides three playable, distinct screens for every algorithm", () => {
    expect(Object.keys(LINKED_LEVELS)).toHaveLength(6);
    for (const [id, levels] of Object.entries(LINKED_CHALLENGES)) {
      expect(levels).toHaveLength(3);
      expect(levels.map(level => level.title)).toEqual(LINKED_LEVELS[id as keyof typeof LINKED_LEVELS]);
      for (const level of levels) {
        expect(level.questions).toHaveLength(2);
        for (const question of level.questions) expect(question.choices).toContain(question.answer);
      }
    }
  });
  it("unlocks each next screen only after the previous one", () => {
    let progress = {};
    expect(linkedLevelUnlocked("linked-search", 1, progress)).toBe(true);
    expect(linkedLevelUnlocked("linked-search", 2, progress)).toBe(false);
    progress = completeLinkedLevel(progress, "linked-search", 1);
    expect(linkedLevelUnlocked("linked-search", 2, progress)).toBe(true);
    expect(linkedLevelUnlocked("linked-search", 3, progress)).toBe(false);
    progress = completeLinkedLevel(progress, "linked-search", 2);
    expect(linkedLevelUnlocked("linked-search", 3, progress)).toBe(true);
  });
  it("preserves old Linked List completions as three finished screens", () => {
    vi.stubGlobal("localStorage", { getItem: () => '{"linked-search":[1,3],"linked-deletion":[1,"2",2]}' });
    expect(readLinkedLevelProgress({ "linked-list": true })).toEqual({ "linked-list": [1, 2, 3], "linked-search": [1, 3], "linked-deletion": [1, 2] });
  });
});

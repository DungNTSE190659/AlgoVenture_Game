import { afterEach, describe, expect, it, vi } from "vitest";
import { ACTIVITY_KEY, readActivity, recordActivity, resumableLesson, studyStreak, type LearningActivity } from "./learnerProfile";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("learner activity", () => {
  it("counts completed days across Vietnam midnight and tolerates an unfinished current day", () => {
    const entries: LearningActivity[] = [
      { lesson: "bubble", kind: "completed", at: Date.parse("2026-10-21T16:55:00Z") },
      { lesson: "selection", kind: "completed", at: Date.parse("2026-10-21T17:05:00Z") },
      { lesson: "insertion", kind: "demo", at: Date.parse("2026-10-23T03:00:00Z") },
    ];
    expect(studyStreak(entries, Date.parse("2026-10-23T03:00:00Z"))).toBe(2);
    expect(studyStreak(entries, Date.parse("2026-10-24T03:00:00Z"))).toBe(0);
  });
  it("records replayed attempts while suppressing duplicate completion callbacks", () => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) });
    vi.useFakeTimers();
    recordActivity("bubble", "completed"); recordActivity("bubble", "completed");
    expect(readActivity()).toHaveLength(1);
    vi.advanceTimersByTime(2000);
    recordActivity("bubble", "play"); recordActivity("bubble", "completed");
    expect(readActivity()).toHaveLength(3);
    data.set(ACTIVITY_KEY, JSON.stringify([{ lesson: "bubble", kind: "completed", at: 1e30 }, { lesson: "unknown", kind: "play", at: Date.now() }]));
    expect(readActivity()).toEqual([]);
  });
  it("never resumes a locked lesson even if stale history contains it", () => {
    expect(resumableLesson({}, [{ lesson: "quick", kind: "demo", at: Date.now() }], "bubble")).toBe("bubble");
    expect(resumableLesson({}, [{ lesson: "queue", kind: "play", at: Date.now() }], "bubble")).toBe("queue");
  });
});

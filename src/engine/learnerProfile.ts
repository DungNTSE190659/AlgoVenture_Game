import { ALL_LESSONS, lessonAvailable, lessonUnlocked, type Progress, type TrackId } from "./learningTrack";

export const PROFILE_KEY = "algoventure.profile.v1";
export const ACTIVITY_KEY = "algoventure.activity.v1";
export const AVATARS = ["happy", "proud", "thinking", "pointing"] as const;
export type Avatar = typeof AVATARS[number];
export type LearnerIdentity = { name: string; avatar: Avatar; createdAt: number };
export type LearningActivity = { lesson: TrackId; kind: "demo" | "play" | "completed"; at: number };

export function readIdentity(): LearnerIdentity {
  const fallback: LearnerIdentity = { name: "Nhà thám hiểm", avatar: "happy", createdAt: Date.now() };
  try {
    const value = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "null");
    if (!value || typeof value !== "object") return fallback;
    return { name: typeof value.name === "string" && value.name.trim() ? value.name.trim().slice(0, 24) : fallback.name, avatar: AVATARS.includes(value.avatar) ? value.avatar : "happy", createdAt: typeof value.createdAt === "number" && Number.isFinite(value.createdAt) && value.createdAt > 0 ? value.createdAt : fallback.createdAt };
  } catch { return fallback; }
}
export function saveIdentity(value: LearnerIdentity) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(value)); return true; } catch { return false; }
}
export function readActivity(): LearningActivity[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(ACTIVITY_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is LearningActivity => entry && typeof entry === "object" && ALL_LESSONS.some(l => l.id === entry.lesson) && ["demo", "play", "completed"].includes(entry.kind) && typeof entry.at === "number" && Number.isFinite(new Date(entry.at).getTime()) && entry.at > 0).sort((a, b) => b.at - a.at).slice(0, 100);
  } catch { return []; }
}
export function recordActivity(lesson: TrackId, kind: LearningActivity["kind"]) {
  const recent = readActivity(), at = Date.now();
  // Some games report the same completion from more than one effect.
  if (recent[0]?.lesson === lesson && recent[0]?.kind === kind && at - recent[0].at < 1500) return;
  try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify([{ lesson, kind, at }, ...recent].slice(0, 100))); } catch { /* Gameplay remains available without browser storage. */ }
}
export const localDay = (at: number) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
export function studyStreak(activity: LearningActivity[], now = Date.now()) {
  const days = new Set(activity.filter(a => a.kind === "completed").map(a => localDay(a.at)));
  let day = Date.parse(`${localDay(now)}T00:00:00Z`), streak = 0;
  if (!days.has(localDay(now))) day -= 86400000;
  while (days.has(new Date(day).toISOString().slice(0, 10))) { streak++; day -= 86400000; }
  return streak;
}
export function resumableLesson(progress: Progress, activity: LearningActivity[], fallback: TrackId) {
  return activity.find(a => a.kind !== "completed" && lessonAvailable(a.lesson) && lessonUnlocked(a.lesson, progress))?.lesson ?? fallback;
}
export const SAMPLE_PROGRESS: Progress = { bubble: true, selection: true, insertion: true, linear: true, binary: true, stack: true, queue: true, "linked-list": true, "linked-traversal": true, "tree-basics": true, "tree-traversal": true };
export function sampleActivity(now = Date.now()): LearningActivity[] {
  return [
    { lesson: "merge", kind: "demo", at: now - 20 * 60000 },
    { lesson: "insertion", kind: "completed", at: now - 45 * 60000 },
    { lesson: "tree-traversal", kind: "completed", at: now - 86400000 },
    { lesson: "linked-traversal", kind: "completed", at: now - 2 * 86400000 },
    { lesson: "binary", kind: "completed", at: now - 3 * 86400000 },
  ];
}

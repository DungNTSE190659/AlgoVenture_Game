import type { Progress, TrackId } from "./learningTrack";

export type LinkedTrackId = Extract<TrackId, "linked-list" | "linked-traversal" | "linked-search" | "linked-insertion" | "linked-deletion" | "linked-reversal">;
export type LinkedLevel = 1 | 2 | 3;
export type LinkedLevelProgress = Partial<Record<LinkedTrackId, LinkedLevel[]>>;

export const LINKED_LEVELS: Record<LinkedTrackId, readonly [string, string, string]> = {
  "linked-list": ["Nối 2 nút", "Nối 3 nút", "Nối 4 nút"],
  "linked-traversal": ["Đi từng nút", "Đếm số nút", "Tới nút cuối"],
  "linked-search": ["Tìm giá trị", "Tìm vị trí", "Không tìm thấy"],
  "linked-insertion": ["Chèn ở đầu", "Chèn ở giữa", "Chèn ở cuối"],
  "linked-deletion": ["Xóa ở đầu", "Xóa ở giữa", "Xóa ở cuối"],
  "linked-reversal": ["Đảo 2 nút", "Đảo 3 nút", "Đảo 4 nút"],
};

const STORAGE_KEY = "algoventure.linked-levels.v1";

export function readLinkedLevelProgress(track: Progress): LinkedLevelProgress {
  let saved: unknown;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { saved = {}; }
  const result: LinkedLevelProgress = {};
  for (const id of Object.keys(LINKED_LEVELS) as LinkedTrackId[]) {
    if (track[id]) { result[id] = [1, 2, 3]; continue; }
    const raw = saved && typeof saved === "object" ? (saved as Record<string, unknown>)[id] : null;
    if (Array.isArray(raw)) result[id] = [1, 2, 3].filter(level => raw.includes(level)) as LinkedLevel[];
  }
  return result;
}

export function saveLinkedLevelProgress(progress: LinkedLevelProgress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* Progress stays in memory. */ }
}

export function linkedLevelUnlocked(id: LinkedTrackId, level: LinkedLevel, progress: LinkedLevelProgress) {
  return level === 1 || (progress[id] ?? []).includes((level - 1) as LinkedLevel);
}

export function completeLinkedLevel(progress: LinkedLevelProgress, id: LinkedTrackId, level: LinkedLevel): LinkedLevelProgress {
  return { ...progress, [id]: [...new Set([...(progress[id] ?? []), level])].sort() as LinkedLevel[] };
}

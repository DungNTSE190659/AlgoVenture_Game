import type { Difficulty } from "./quicksort";
export type Mode = "demo" | "play";
export const LEVELS: Record<Difficulty, { label: string; count: number }> = {
  easy: { label: "Dễ", count: 5 },
  medium: { label: "Vừa", count: 7 },
  hard: { label: "Khó", count: 8 },
};

export type Algorithm = "quick" | "bubble";

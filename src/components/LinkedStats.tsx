import { GameStats } from "./GameHud";

export type LinkedCounters = { placements: number; connections: number; checks: number; visits: number[] };
export const emptyLinkedCounters = (): LinkedCounters => ({ placements: 0, connections: 0, checks: 0, visits: [] });

export default function LinkedStats({ score }: { score: number; counters: LinkedCounters }) {
  return <GameStats assetIcons score={score} className="linked-hud" scoreClassName="bubble-score">{null}</GameStats>;
}

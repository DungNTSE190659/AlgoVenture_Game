import { GameStats } from "./GameHud";

export type LinkedCounters = { placements: number; connections: number; checks: number; visits: number[] };
export const emptyLinkedCounters = (): LinkedCounters => ({ placements: 0, connections: 0, checks: 0, visits: [] });

export default function LinkedStats({ score, counters }: { score: number; counters: LinkedCounters }) {
  return <GameStats score={score} className="linked-hud" scoreClassName="bubble-score">
    <span>Lượt kiểm tra {counters.checks}</span>
    <span>{counters.placements} lần đặt khối</span>
    <span>{counters.connections} lần nối dây</span>
    <span>{counters.visits.length} nút đã duyệt</span>
  </GameStats>;
}

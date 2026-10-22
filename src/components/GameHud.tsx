import type { ComponentProps, ReactNode } from "react";
import { ArrowLeft, Lightbulb, Settings, Star } from "lucide-react";

/** Header/stats, a growing play area, then a footer anchored to the page bottom.
 * Short screens scroll naturally instead of letting the footer cover the board. */
export function GameLayout({ play = true, className = "", ...props }: ComponentProps<"main"> & { play?: boolean }) {
  return <main {...props} className={`${className} ${play ? "game-play-layout" : ""}`} />;
}

export function GameFooter({ className = "", ...props }: ComponentProps<"footer">) {
  return <footer {...props} className={`game-play-footer ${className}`} />;
}

export function GameHintButton({ children, className = "", ...props }: ComponentProps<"button">) {
  return <button {...props} className={`game-hint-button ${className}`}>
    <Lightbulb size={22} aria-hidden="true" /> Buta gợi ý {children}
  </button>;
}

/** Shared chrome for algorithm screens. Keep board-specific controls in each game. */
export function GameHeader({ title, onBack, onSettings, className = "", play = true, showBack = true }: {
  title: string;
  onBack: () => void;
  onSettings: () => void;
  className?: string;
  play?: boolean;
  showBack?: boolean;
}) {
  return <header className={`lesson-header ${className} ${play ? "play-header" : ""}`}>
    {showBack
      ? <button className="round-button" aria-label="Về bản đồ" onClick={onBack}><ArrowLeft size={25} /></button>
      : <div style={{ width: 46 }} aria-hidden="true" />}
    <h1>{title}</h1>
    <button className="round-button" aria-label="Tùy chọn" onClick={onSettings}><Settings size={25} /></button>
  </header>;
}

export function GameStats({ score, children, className = "", scoreClassName = "" }: {
  score?: number;
  children: ReactNode;
  className?: string;
  scoreClassName?: string;
}) {
  return <div className={`${className} ${score !== undefined ? "play-stats" : ""}`}>
    {score !== undefined && <span className={`play-score ${scoreClassName}`} aria-label={`${score.toLocaleString("vi-VN")} điểm`}>
      <Star size={17} fill="currentColor" aria-hidden="true" />
      <strong>{score.toLocaleString("vi-VN")}</strong>
    </span>}
    {children}
  </div>;
}

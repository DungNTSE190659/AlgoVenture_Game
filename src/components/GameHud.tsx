import type { ComponentProps, ReactNode } from "react";
import { ArrowLeft, Lightbulb, Settings, Star } from "lucide-react";
import * as LinkedIcons from "./LinkedAssetIcons";
import * as TreeIcons from "./TreeAssetIcons";
import ArraySortLayout from "./ArraySortLayout";

/** Shared game chrome; Array Sort uses a board and Buta guide workspace. */
export function GameLayout({ play = true, className = "", children, ...props }: ComponentProps<"main"> & { play?: boolean }) {
  const sort = /\b(bubble-world|selection-world|insertion-world|merge-world|quick-forest-world)\b/.test(className);
  return <main {...props} className={`${className} ${play ? "game-play-layout" : ""} ${sort ? "array-stage" : ""}`}>
    {sort ? <ArraySortLayout play={play}>{children}</ArraySortLayout> : children}
  </main>;
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
export function GameHeader({ title, onBack, onSettings, beforeSettings, className = "", play = true, showBack = true, assetIcons = false, assetTheme }: {
  title: string;
  onBack: () => void;
  onSettings: () => void;
  className?: string;
  play?: boolean;
  showBack?: boolean;
  beforeSettings?: ReactNode;
  assetIcons?: boolean;
  assetTheme?: "tree";
}) {
  const BackIcon = assetTheme === "tree" ? TreeIcons.ArrowLeft : assetIcons ? LinkedIcons.ArrowLeft : ArrowLeft;
  const SettingsIcon = assetTheme === "tree" ? TreeIcons.Settings : assetIcons ? LinkedIcons.Settings : Settings;
  return <header className={`lesson-header ${className} ${play ? "play-header" : ""}`}>
    {showBack
      ? <button className="round-button" aria-label="Về bản đồ" onClick={onBack}><BackIcon size={25} /></button>
      : <div style={{ width: 46 }} aria-hidden="true" />}
    <h1>{title}</h1>
    {beforeSettings}
    <button className="round-button" aria-label="Tùy chọn" onClick={onSettings}><SettingsIcon size={25} /></button>
  </header>;
}

export function GameStats({ score, children, className = "", scoreClassName = "", assetIcons = false, assetTheme }: {
  score?: number;
  children: ReactNode;
  className?: string;
  scoreClassName?: string;
  assetIcons?: boolean;
  assetTheme?: "tree";
}) {
  return <div className={`${className} ${score !== undefined ? "play-stats" : ""}`}>
    {score !== undefined && <span className={`play-score ${scoreClassName}`} aria-label={`${score.toLocaleString("vi-VN")} điểm`}>
      {assetTheme === "tree" ? <TreeIcons.Star size={17} /> : assetIcons ? <LinkedIcons.Star size={17} /> : <Star size={17} fill="currentColor" aria-hidden="true" />}
      <strong>{score.toLocaleString("vi-VN")}</strong>
    </span>}
    {children}
  </div>;
}

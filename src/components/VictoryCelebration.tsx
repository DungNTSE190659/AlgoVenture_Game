import { useEffect, useId, useRef, type ReactNode } from "react";
import { ChevronRight, Map, RotateCcw, Sparkles } from "lucide-react";
import Pig from "./Pig";
import * as TreeIcons from "./TreeAssetIcons";
import { LEVELS } from "../engine/gameConfig";
import type { Difficulty } from "../engine/quicksort";

type Props = {
  className: string;
  title?: string;
  nextLabel?: string;
  stars: number;
  difficulty: Difficulty;
  children: ReactNode;
  onReplay: () => void;
  onHarder: (level: Difficulty) => void;
  onMap: () => void;
};
export default function VictoryCelebration({
  className,
  title = "Mảng đã được sắp xếp!",
  nextLabel = "Tăng độ khó",
  stars,
  difficulty,
  children,
  onReplay,
  onHarder,
  onMap,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const treeArtwork = className.split(" ").includes("tree-victory");
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const panel = dialog.current;
    panel?.showModal();
    titleRef.current?.focus({ preventScroll: true });
    return () => panel?.close();
  }, []);
  const next =
    difficulty === "easy" ? "medium" : difficulty === "medium" ? "hard" : null;
  return (
    <dialog
      className="victory-screen"
      ref={dialog}
      aria-labelledby="victory-screen-title"
      onCancel={(event) => event.preventDefault()}
    >
      <div className={`victory-celebration ${className}`}>
        <h2
          className="victory-title"
          id="victory-screen-title"
          ref={titleRef}
          tabIndex={-1}
        >
          {title}
        </h2>
        <div className="victory-buta">
          <Pig mood="celebrate" />
        </div>
        <div
          className="victory-stars"
          role="img"
          aria-label={`${stars} trên 3 sao`}
        >
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={`victory-award ${index < stars ? "earned" : "unearned"}`}
              aria-hidden="true"
            >
              {stars > index && stars < index + 1 ? <>
                <AwardStar earned={false} />
                <span className="victory-partial-star" style={{ clipPath: `inset(0 ${(1 - (stars - index)) * 100}% 0 0)` }}>
                  <AwardStar earned />
                </span>
              </> : <AwardStar earned={index < stars} />}
            </span>
          ))}
        </div>
        <div className="victory-details">
          <div className="victory-summary">{children}</div>
        </div>
        <div className="victory-actions">
          <button
            className={`chunky-button ${next ? "button-purple" : "button-green"}`}
            onClick={onReplay}
          >
            {treeArtwork ? <TreeIcons.RotateCcw size={19} /> : <RotateCcw size={19} />} Chơi lại
          </button>
          {next && (
            <button
              className="chunky-button button-green"
              onClick={() => onHarder(next)}
              title={`${LEVELS[next].label} · ${LEVELS[next].count} số`}
            >
              <Sparkles size={19} /> {nextLabel}
            </button>
          )}
          <button className="victory-map-button" onClick={onMap}>
            <span className="victory-map-icon" aria-hidden="true">
              {treeArtwork ? <TreeIcons.Map size={21} /> : <Map size={21} />}
            </span>
            <span>Đi tiếp cùng Buta</span>
            {treeArtwork ? <TreeIcons.ChevronRight className="victory-map-arrow" size={19} /> : <ChevronRight
              className="victory-map-arrow"
              size={19}
              aria-hidden="true"
            />}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function AwardStar({ earned }: { earned: boolean }) {
  const id = useId().replaceAll(":", "");
  const outline =
    "M50 7C52 7 54 11 56 15L66 34L88 37C95 38 96 43 91 48L75 64L79 87C80 94 76 97 70 94L50 83L30 94C24 97 20 94 21 87L25 64L9 48C4 43 5 38 12 37L34 34L44 15C46 11 48 7 50 7Z";
  return (
    <svg
      viewBox="0 0 100 112"
      fill="none"
      className="award-star"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={id}
          x1="30"
          y1="8"
          x2="72"
          y2="94"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={earned ? "#fff8b4" : "#f0f0e2"} />
          <stop offset=".42" stopColor={earned ? "#ffdb58" : "#dce1ce"} />
          <stop offset="1" stopColor={earned ? "#f6a822" : "#bcc7b0"} />
        </linearGradient>
      </defs>
      <path
        d={outline}
        transform="translate(0 6)"
        fill={earned ? "#cf8422" : "#99aa8c"}
        stroke={earned ? "#cf8422" : "#99aa8c"}
        strokeWidth="2"
      />
      <path
        d={outline}
        fill={`url(#${id})`}
        stroke={earned ? "#edb23e" : "#bdc8ac"}
        strokeWidth="2"
      />
      <path d="M50 8V50L34 34Z" fill="white" opacity=".35" />
      <path
        d="M50 50L75 64L79 88L50 83Z"
        fill={earned ? "#de8b1a" : "#8a9f7c"}
        opacity=".2"
      />
      <path d="M50 50L30 94L25 64Z" fill="white" opacity=".2" />
      <path
        d="M40 35L49 17M15 42L32 40"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        opacity={earned ? ".65" : ".25"}
      />
      {earned && (
        <g className="award-glints" fill="#fffdf0">
          <path d="M81 16L83 22L89 24L83 26L81 32L79 26L73 24L79 22Z" />
          <circle cx="20" cy="76" r="2" />
          <circle cx="72" cy="80" r="1.5" />
        </g>
      )}
    </svg>
  );
}

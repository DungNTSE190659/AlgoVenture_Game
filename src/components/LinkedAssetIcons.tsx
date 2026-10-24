import type { CSSProperties } from "react";

/** File-backed UI sprites shared with the Unity export. Labels belong to the control. */
const bubbleNames: Record<string, string> = { "arrow-left": "back", "arrow-right": "next", check: "check", lightbulb: "hint", settings: "settings", star: "star", "rotate-ccw": "replay", "undo-2": "previous", x: "close", "volume-2": "sound", "volume-x": "mute", pause: "pause", play: "play", "skip-back": "previous", "skip-forward": "next" };
function icon(name: string) {
  return function AssetIcon({ size = 24, className = "", style }: { size?: number | string; className?: string; style?: CSSProperties }) {
    return <img className={`linked-ui-icon ${className}`} src={`${import.meta.env.BASE_URL}assets/bubble-ui/icon-${bubbleNames[name] ?? name}.svg`} width={size} height={size} style={style} alt="" aria-hidden="true" draggable={false} />;
  };
}

export const ArrowLeft = icon("arrow-left");
export const ArrowRight = icon("arrow-right");
export const Check = icon("check");
export const Lightbulb = icon("lightbulb");
export const Settings = icon("settings");
export const Star = icon("star");
export const RotateCcw = icon("rotate-ccw");
export const Undo2 = icon("undo-2");
export const X = icon("x");
export const Volume2 = icon("volume-2");
export const VolumeX = icon("volume-x");
export const Pause = icon("pause");
export const Play = icon("play");
export const SkipBack = icon("skip-back");
export const SkipForward = icon("skip-forward");

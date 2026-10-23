import type { ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & { size?: number; fill?: string };
const icon = (name: string) => function BubbleIcon({ size = 24, fill, ...props }: Props) {
  const artwork = name === "star" && fill === "none" ? "star-empty" : name;
  return <img {...props} className={`bubble-icon ${props.className ?? ""}`} width={size} height={size}
    src={`${import.meta.env.BASE_URL}assets/bubble-ui/icon-${artwork}.svg`} alt="" aria-hidden="true" draggable={false} />;
};

export const ArrowLeft = icon("back"), Settings = icon("settings"), Check = icon("check"),
  Lightbulb = icon("hint"), Star = icon("star"), Pause = icon("pause"), Play = icon("play"),
  RotateCcw = icon("replay"), SkipBack = icon("previous"), SkipForward = icon("next"),
  Volume2 = icon("sound"), VolumeX = icon("mute"), X = icon("close");

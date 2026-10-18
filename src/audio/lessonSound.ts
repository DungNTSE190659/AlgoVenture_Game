import type { LessonFrame } from "../engine/lesson";
import type { SoundCue } from "./gameAudio";

/** Sound represents the operation, never whether a compared value is "wrong". */
export function lessonSound(frame: LessonFrame): SoundCue | null {
  switch (frame.kind) {
    case "PIVOT":
      return "pivot";
    case "SCAN":
      return "scan";
    case "DECIDE":
      return frame.decision === "keep-large" ? "keep" : "small";
    case "SWAP":
      return "tap";
    case "MOVED":
      return "swap";
    case "FIXED":
      return frame.swapIds ? "pivot-move" : "pivot";
    case "SPLIT":
      return "split";
    case "FOCUS":
      return "enter";
    case "DONE":
      return "finish";
    default:
      return null;
  }
}

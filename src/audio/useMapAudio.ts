import { useEffect, useRef } from "react";
import { gameAudio, type SoundCue } from "./gameAudio";

const footsteps: readonly SoundCue[] = ["step-left", "step-right"];

/** Called by the movement's existing animation clock; no background sound loop. */
export function useMapAudio() {
  const lastStep = useRef(-1);
  useEffect(() => () => gameAudio.stop(footsteps), []);
  return {
    begin() { lastStep.current = -1; gameAudio.unlock(); },
    tick(elapsed: number) {
      const step = Math.floor(elapsed / 240);
      if (step === lastStep.current) return;
      lastStep.current = step;
      gameAudio.play(footsteps[step % 2]);
    },
    arrive() { gameAudio.stop(footsteps); gameAudio.play("arrive"); },
  };
}

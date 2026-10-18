import { useEffect } from "react";
import { gameAudio, type SoundCue } from "./gameAudio";

export function useInterfaceAudio() {
  useEffect(() => {
    const frames = new Set<number>();
    const unlock = () => gameAudio.unlock();
    let press: { button: HTMLButtonElement; version: number } | null = null;
    const begin = (event: Event) => {
      const button = event.target instanceof Element ? event.target.closest("button") : null;
      press = button ? { button, version: gameAudio.requestVersion } : null;
      unlock();
    };
    const key = (event: KeyboardEvent) => {
      if (["Enter", " ", "ArrowLeft", "ArrowRight"].includes(event.key)) begin(event);
    };
    const click = (event: MouseEvent) => {
      const button = event.composedPath().find(node => node instanceof HTMLButtonElement) as HTMLButtonElement | undefined;
      if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return;
      const version = press?.button === button ? press.version : gameAudio.requestVersion;
      press = null;
      const label = button.getAttribute("aria-label") ?? "";
      // These controls already sound the corresponding lesson frame.
      if (label === "Bước tiếp" || label === "Bước trước" || button.classList.contains("track-sound")) return;
      const cue: SoundCue = label === "Tùy chọn" ? "ui-open"
        : /^(Đóng|Về bản đồ|Bản đồ thế giới)/.test(label) ? "ui-close" : "tap";
      const started = performance.now();
      // React action handlers/effects get priority over the generic button sound.
      const frame = requestAnimationFrame(() => {
        frames.delete(frame);
        if (!event.defaultPrevented && gameAudio.requestVersion === version && performance.now() - started < 250) gameAudio.playInterface(cue);
      });
      frames.add(frame);
    };
    document.addEventListener("pointerdown", begin, { capture: true, passive: true });
    document.addEventListener("keydown", key, true);
    document.addEventListener("click", click, true);
    return () => {
      document.removeEventListener("pointerdown", begin, true);
      document.removeEventListener("keydown", key, true);
      document.removeEventListener("click", click, true);
      for (const frame of frames) cancelAnimationFrame(frame);
    };
  }, []);
}

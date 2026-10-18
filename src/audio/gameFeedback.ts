import { gameAudio, type SoundCue } from "./gameAudio";

const patterns: Partial<Record<SoundCue, number | number[]>> = {
  tap: 8, drop: 12, enter: 12, pivot: 14, keep: 10, small: 12, split: [12, 35, 20],
  "bubble-swap": [12, 25, 18], correct: [12, 35, 20],
  retry: [25, 40, 25], hint: 8, finish: [20, 55, 25, 55, 40],
};
let preference = true;
export function readHapticsPreference() {
  try { const stored = localStorage.getItem("algoventure-haptics"); return stored === null || stored === undefined ? preference : stored !== "off"; }
  catch { return preference; }
}
export function stopHaptics() {
  try { if (typeof navigator !== "undefined") navigator.vibrate?.(0); } catch { /* Optional hardware. */ }
}
export function setHapticsEnabled(enabled: boolean) {
  preference = enabled;
  try { localStorage.setItem("algoventure-haptics", enabled ? "on" : "off"); } catch { /* Optional preference. */ }
  if (!enabled) stopHaptics();
}
/** Gameplay only: demonstrations keep their sound cues without vibrating. */
export function playFeedback(cue: SoundCue) {
  gameAudio.play(cue);
  if (typeof document === "undefined" || document.hidden || !readHapticsPreference()) return;
  const pattern = patterns[cue];
  try {
    if (pattern && typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive !== false)
      navigator.vibrate?.(pattern);
  } catch { /* Unsupported or disabled by the device. Visual feedback still works. */ }
}

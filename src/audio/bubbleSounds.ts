import type { SoundCue, Tone } from "./gameAudio";

/** Original soft wooden/plucked tones, tuned to C major. Bubble Sort only. */
export const bubbleSounds: Partial<Record<SoundCue, Tone[]>> = {
  "bubble-hover": [{ at: 0, frequency: 392, end: 440, duration: .09, volume: .012 }],
  "bubble-pick": [{ at: 0, frequency: 294, end: 330, duration: .12, volume: .028, wave: "triangle" }],
  tap: [{ at: 0, frequency: 330, end: 294, duration: .12, volume: .03, wave: "triangle" }],
  "ui-open": [
    { at: 0, frequency: 330, duration: .16, volume: .027 },
    { at: .07, frequency: 392, duration: .19, volume: .024 },
  ],
  "ui-close": [{ at: 0, frequency: 330, end: 262, duration: .16, volume: .025 }],
  "sound-on": [
    { at: 0, frequency: 330, duration: .17, volume: .025 },
    { at: .09, frequency: 523.25, duration: .24, volume: .024 },
  ],
  "bubble-swap": [
    { at: 0, frequency: 330, end: 392, duration: .2, volume: .03, pan: -.15 },
    { at: .18, frequency: 523.25, duration: .26, volume: .032, pan: .15 },
  ],
  swap: [
    { at: 0, frequency: 330, end: 392, duration: .24, volume: .028, pan: -.15 },
    { at: 1.28, frequency: 523.25, duration: .27, volume: .03, pan: .15 },
  ],
  scan: [{ at: 0, frequency: 330, duration: .14, volume: .022 }],
  keep: [{ at: 0, frequency: 392, end: 330, duration: .19, volume: .025 }],
  hint: [
    { at: 0, frequency: 392, duration: .22, volume: .027 },
    { at: .13, frequency: 523.25, duration: .34, volume: .025 },
  ],
  retry: [
    { at: 0, frequency: 330, end: 294, duration: .21, volume: .028, wave: "triangle" },
    { at: .16, frequency: 262, duration: .25, volume: .023 },
  ],
  correct: [
    { at: 0, frequency: 392, duration: .2, volume: .03 },
    { at: .11, frequency: 523.25, duration: .29, volume: .028 },
  ],
  finish: [262, 330, 392, 523.25].map((frequency, index) => ({
    at: index * .14, frequency, duration: index === 3 ? .65 : .3, volume: .032,
  })),
};

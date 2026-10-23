import { bubbleSounds } from "./bubbleSounds";

/** Small, original synthesized game sounds. No downloads or audio assets required. */
export type SoundCue =
  | "tap"
  | "bubble-hover"
  | "bubble-pick"
  | "topic-next"
  | "topic-prev"
  | "island-select"
  | "locked"
  | "step-left"
  | "step-right"
  | "arrive"
  | "ui-open"
  | "ui-close"
  | "sound-on"
  | "drop"
  | "enter"
  | "pivot"
  | "scan"
  | "keep"
  | "small"
  | "bubble-swap"
  | "swap"
  | "pivot-move"
  | "split"
  | "finish"
  | "correct"
  | "retry"
  | "hint"
  | "stack-push"
  | "stack-pop"
  | "stack-peek"
  | "stack-error"
  | "stack-clear";
export type Tone = {
  at: number;
  frequency: number;
  end?: number;
  duration: number;
  volume: number;
  pan?: number;
  wave?: OscillatorType;
};
const melodies: Record<SoundCue, Tone[]> = {
  "bubble-hover": bubbleSounds["bubble-hover"]!,
  "bubble-pick": bubbleSounds["bubble-pick"]!,
  "stack-push": [
    {at:0,frequency:640,end:260,duration:.12,volume:.065,wave:"triangle"},
    {at:.09,frequency:180,end:120,duration:.09,volume:.07,wave:"triangle"},
  ],
  "stack-pop": [
    {at:0,frequency:320,end:820,duration:.14,volume:.07,wave:"triangle"},
    {at:.07,frequency:980,duration:.1,volume:.035},
  ],
  "stack-peek": [
    {at:0,frequency:880,duration:.1,volume:.045},
    {at:.08,frequency:1320,duration:.14,volume:.04},
  ],
  "stack-error": [
    {at:0,frequency:230,end:155,duration:.14,volume:.065,wave:"triangle"},
    {at:.13,frequency:175,end:120,duration:.12,volume:.05,wave:"triangle"},
  ],
  "stack-clear": [523.25,659.25,880].map((frequency,index)=>({at:index*.075,frequency,duration:.17,volume:.055})),
  tap: [
    { at: 0, frequency: 620, end: 430, duration: 0.055, volume: 0.04 },
    { at: 0.025, frequency: 930, duration: 0.065, volume: 0.015 },
  ],
  "topic-next": [
    { at: 0, frequency: 330, end: 660, duration: 0.18, volume: 0.025, pan: -0.5 },
    { at: 0.09, frequency: 880, duration: 0.13, volume: 0.025, pan: 0.5 },
  ],
  "topic-prev": [
    { at: 0, frequency: 660, end: 330, duration: 0.18, volume: 0.025, pan: 0.5 },
    { at: 0.09, frequency: 440, duration: 0.13, volume: 0.025, pan: -0.5 },
  ],
  "island-select": [
    { at: 0, frequency: 587.33, end: 493.88, duration: 0.09, volume: 0.04, wave: "triangle" },
    { at: 0.06, frequency: 739.99, duration: 0.14, volume: 0.035 },
  ],
  locked: [{ at: 0, frequency: 220, end: 174.61, duration: 0.13, volume: 0.035, wave: "triangle" }],
  "step-left": [
    { at: 0, frequency: 155, end: 85, duration: 0.065, volume: 0.05, wave: "triangle", pan: -0.18 },
    { at: 0.015, frequency: 720, end: 420, duration: 0.035, volume: 0.016, pan: -0.18 },
  ],
  "step-right": [
    { at: 0, frequency: 175, end: 95, duration: 0.065, volume: 0.05, wave: "triangle", pan: 0.18 },
    { at: 0.015, frequency: 810, end: 480, duration: 0.035, volume: 0.016, pan: 0.18 },
  ],
  arrive: [587.33, 739.99, 880].map((frequency, index) => ({ at: index * 0.065, frequency, duration: 0.18, volume: 0.045 })),
  "ui-open": [
    { at: 0, frequency: 440, end: 587.33, duration: 0.09, volume: 0.03 },
    { at: 0.05, frequency: 739.99, duration: 0.12, volume: 0.025 },
  ],
  "ui-close": [{ at: 0, frequency: 587.33, end: 392, duration: 0.1, volume: 0.035 }],
  "sound-on": [523.25, 783.99].map((frequency, index) => ({ at: index * 0.07, frequency, duration: 0.13, volume: 0.04 })),
  drop: [
    { at: 0, frequency: 440, end: 310, duration: 0.09, volume: 0.055 },
    { at: 0.06, frequency: 660, duration: 0.1, volume: 0.04 },
  ],
  enter: [
    { at: 0, frequency: 392, duration: 0.12, volume: 0.07 },
    { at: 0.09, frequency: 523.25, duration: 0.19, volume: 0.07 },
  ],
  pivot: [
    { at: 0, frequency: 523.25, duration: 0.19, volume: 0.09 },
    { at: 0.13, frequency: 783.99, duration: 0.25, volume: 0.07 },
  ],
  scan: [{ at: 0, frequency: 440, end: 510, duration: 0.085, volume: 0.045 }],
  keep: [{ at: 0, frequency: 310, end: 235, duration: 0.13, volume: 0.075 }],
  small: [
    { at: 0, frequency: 523.25, duration: 0.14, volume: 0.075 },
    { at: 0.09, frequency: 659.25, duration: 0.19, volume: 0.075 },
  ],
  "bubble-swap": [
    { at: 0, frequency: 350, end: 790, duration: 0.3, volume: 0.045 },
    { at: 0.42, frequency: 659.25, duration: 0.12, volume: 0.055 },
  ],
  swap: [
    { at: 0, frequency: 250, end: 650, duration: 0.35, volume: 0.045 },
    { at: 1.35, frequency: 370, end: 270, duration: 0.11, volume: 0.09 },
    { at: 1.42, frequency: 554, duration: 0.12, volume: 0.055 },
  ],
  "pivot-move": [
    { at: 0, frequency: 280, end: 720, duration: 0.35, volume: 0.04 },
    { at: 1.35, frequency: 523.25, duration: 0.19, volume: 0.085 },
    { at: 1.47, frequency: 783.99, duration: 0.25, volume: 0.075 },
  ],
  split: [
    { at: 0, frequency: 659.25, duration: 0.17, volume: 0.065, pan: -0.45 },
    { at: 0.14, frequency: 523.25, duration: 0.2, volume: 0.065, pan: 0.45 },
  ],
  finish: [523.25, 659.25, 783.99, 1046.5].map((frequency, index) => ({
    at: index * 0.14,
    frequency,
    duration: index === 3 ? 0.5 : 0.22,
    volume: 0.08,
  })),
  correct: [
    { at: 0, frequency: 659.25, duration: 0.14, volume: 0.08 },
    { at: 0.09, frequency: 880, duration: 0.2, volume: 0.07 },
  ],
  retry: [
    { at: 0, frequency: 293.66, end: 261.63, duration: 0.16, volume: 0.06 },
    { at: 0.13, frequency: 220, duration: 0.17, volume: 0.05 },
  ],
  hint: [
    { at: 0, frequency: 880, duration: 0.19, volume: 0.055 },
    { at: 0.12, frequency: 1174.66, duration: 0.25, volume: 0.045 },
  ],
};

/** Also accepts OfflineAudioContext, so the actual waveform can be verified. */
export function renderCue(
  context: BaseAudioContext,
  output: AudioNode,
  cue: SoundCue,
  start = context.currentTime,
  profile: "default" | "bubble" = "default",
): AudioScheduledSourceNode[] {
  const sources: AudioScheduledSourceNode[] = [];
  for (const tone of (profile === "bubble" ? bubbleSounds[cue] : undefined) ?? melodies[cue]) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const pan = context.createStereoPanner();
    const at = start + tone.at;
    oscillator.type = tone.wave ?? "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, at);
    if (tone.end)
      oscillator.frequency.exponentialRampToValueAtTime(
        tone.end,
        at + tone.duration,
      );
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(tone.volume, at + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + tone.duration);
    pan.pan.value = tone.pan ?? 0;
    oscillator.connect(envelope);
    envelope.connect(pan);
    pan.connect(output);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      pan.disconnect();
    };
    oscillator.start(at);
    oscillator.stop(at + tone.duration + 0.01);
    sources.push(oscillator);
  }
  const navigation = cue === "topic-next" || cue === "topic-prev";
  if (profile !== "bubble" && (cue === "swap" || cue === "pivot-move" || navigation)) {
    const noise = context.createBufferSource();
    const buffer = context.createBuffer(
      1,
      Math.floor(context.sampleRate * 0.28),
      context.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    // Deterministic white noise makes offline checks reproducible.
    let seed = 17;
    for (let i = 0; i < samples.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      samples[i] = (seed / 4294967296) * 2 - 1;
    }
    noise.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1100;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(navigation ? 0.025 : 0.07, start + 0.09);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.27);
    noise.connect(filter);
    filter.connect(envelope);
    envelope.connect(output);
    noise.onended = () => {
      noise.disconnect();
      filter.disconnect();
      envelope.disconnect();
    };
    noise.start(start);
    noise.stop(start + 0.28);
    sources.push(noise);
  }
  return sources;
}

export function readSoundPreference(): boolean {
  try {
    return localStorage.getItem("piggy-sound") !== "off";
  } catch {
    return true;
  }
}

class GameAudio {
  private profile: "default" | "bubble" = "default";
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private sources = new Map<AudioScheduledSourceNode, SoundCue>();
  private enabled = readSoundPreference();
  private resuming = false;
  private pending: SoundCue | null = null;
  private requests = 0;
  private lastInterface = -Infinity;
  get requestVersion() { return this.requests; }

  setProfile(profile: "default" | "bubble") {
    this.stop();
    this.profile = profile;
  }

  /** A fallback button click must not double an action's own sound. */
  playInterface(cue: SoundCue = "tap") {
    if (performance.now() - this.lastInterface < 45) return false;
    this.lastInterface = performance.now();
    this.unlock();
    return this.play(cue);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
    try {
      localStorage.setItem("piggy-sound", enabled ? "on" : "off");
    } catch {
      /* Optional device preference. */
    }
  }

  /** Called inside a real click/tap, respecting browser audio restrictions. */
  unlock() {
    if (!this.enabled) return;
    try {
      if (!this.context || this.context.state === "closed") {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 1.3;
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -18;
        limiter.knee.value = 24;
        limiter.ratio.value = 3;
        limiter.attack.value = 0.008;
        limiter.release.value = 0.16;
        this.master.connect(limiter);
        limiter.connect(this.context.destination);
      }
      if (this.context.state === "suspended" && !this.resuming) {
        this.resuming = true;
        void this.context.resume().then(() => {
          this.resuming = false;
          const pending = this.pending;
          this.pending = null;
          if (pending) this.play(pending);
        }).catch(() => { this.resuming = false; this.pending = null; });
      }
    } catch {
      /* The game also works when the device has no audio output. */
    }
  }

  play(cue: SoundCue): boolean {
    this.requests++;
    if (this.enabled && typeof document !== "undefined" && !document.hidden && this.resuming && this.context?.state === "suspended") {
      // Keep only the latest gesture while the browser opens its audio output.
      this.pending = cue;
      return false;
    }
    if (
      !this.enabled ||
      typeof document === "undefined" ||
      document.hidden ||
      this.context?.state !== "running" ||
      !this.master
    )
      return false;
    try {
      const sources = renderCue(this.context, this.master, cue, this.context.currentTime, this.profile);
      for (const source of sources) {
        this.sources.set(source, cue);
        const cleanup = source.onended;
        source.onended = (event) => {
          cleanup?.call(source, event);
          this.sources.delete(source);
        };
      }
      return true;
    } catch {
      return false;
    }
  }

  stop(cues?: readonly SoundCue[]) {
    if (!cues || (this.pending && cues.includes(this.pending))) this.pending = null;
    for (const [source, cue] of this.sources) {
      if (cues && !cues.includes(cue)) continue;
      try {
        source.stop();
      } catch {
        /* Already ended. */
      }
      this.sources.delete(source);
    }
  }
}

export const gameAudio = new GameAudio();

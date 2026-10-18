/** Small, original synthesized game sounds. No downloads or audio assets required. */
export type SoundCue =
  | "tap"
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
  | "hint";
type Tone = {
  at: number;
  frequency: number;
  end?: number;
  duration: number;
  volume: number;
  pan?: number;
};
const melodies: Record<SoundCue, Tone[]> = {
  tap: [{ at: 0, frequency: 540, end: 400, duration: 0.055, volume: 0.045 }],
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
): AudioScheduledSourceNode[] {
  const sources: AudioScheduledSourceNode[] = [];
  for (const tone of melodies[cue]) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const pan = context.createStereoPanner();
    const at = start + tone.at;
    oscillator.type = "sine";
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
  if (cue === "swap" || cue === "pivot-move") {
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
    envelope.gain.linearRampToValueAtTime(0.07, start + 0.09);
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
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private sources = new Set<AudioScheduledSourceNode>();
  private enabled = readSoundPreference();

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
        this.master.gain.value = 0.7;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === "suspended")
        void this.context.resume().catch(() => {});
    } catch {
      /* The game also works when the device has no audio output. */
    }
  }

  play(cue: SoundCue): boolean {
    if (
      !this.enabled ||
      typeof document === "undefined" ||
      document.hidden ||
      this.context?.state !== "running" ||
      !this.master
    )
      return false;
    try {
      const sources = renderCue(this.context, this.master, cue);
      for (const source of sources) {
        this.sources.add(source);
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

  stop() {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        /* Already ended. */
      }
    }
    this.sources.clear();
  }
}

export const gameAudio = new GameAudio();

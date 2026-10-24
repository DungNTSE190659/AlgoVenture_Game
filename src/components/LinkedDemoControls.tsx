import { useEffect, useRef, useState } from "react";
import { ArrowRight, Pause, Play, RotateCcw, SkipBack, SkipForward } from "./LinkedAssetIcons";
import Fox from "./Fox";
import { gameAudio } from "../audio/gameAudio";

type Props = {
  step: number;
  count: number;
  narration: string;
  onStep: (step: number) => void;
  onSpeedChange?: (speed: number) => void;
  onPlay: () => void;
  suspended?: boolean;
  onPauseChange?: (paused: boolean) => void;
};

export default function LinkedDemoControls({ step, count, narration, onStep, onSpeedChange, onPlay, suspended = false, onPauseChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const done = step === count - 1;
  const wasDone = useRef(false);
  const pauseCallback = useRef(onPauseChange);
  pauseCallback.current = onPauseChange;
  useEffect(() => {
    const blur = () => { setPlaying(false); pauseCallback.current?.(true); };
    const interrupt = () => {
      if (document.hidden) { setPlaying(false); pauseCallback.current?.(true); }
    };
    document.addEventListener("visibilitychange", interrupt);
    window.addEventListener("blur", blur);
    return () => { document.removeEventListener("visibilitychange", interrupt); window.removeEventListener("blur", blur); };
  }, []);
  useEffect(() => {
    if (suspended) { setPlaying(false); pauseCallback.current?.(true); }
  }, [suspended]);
  useEffect(() => {
    if (done && !wasDone.current) gameAudio.play("finish");
    wasDone.current = done;
  }, [done]);

  useEffect(() => {
    if (!playing || done || suspended || document.hidden) return;
    const timer = window.setTimeout(() => onStep(step + 1), 2600 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, speed, step, count, done, onStep, suspended]);

  return <div className="linked-demo-player">
    <div className="linked-demo-dialogue">
      <Fox mood={done ? "celebrate" : "explaining"} />
      <div className="linked-speech"><span className="linked-speaker">Cáo đồng hành</span><p aria-live="polite">{narration}</p></div>
    </div>
    <footer className="linked-demo-controls">
      <div className="linked-demo-playback">
        <button className="round-button" aria-label="Bước trước" disabled={step === 0} onClick={() => { gameAudio.unlock(); setPlaying(false); onPauseChange?.(false); onStep(step - 1); }}><SkipBack size={22} /></button>
        <button className={`chunky-button ${done ? "button-green" : "button-purple"}`} onClick={() => {
          gameAudio.unlock();
          if (done) onPlay();
          else { onPauseChange?.(playing); setPlaying(value => !value); }
        }}>
          {playing && !done ? <Pause size={23} /> : <Play size={23} />}
          {done ? "Tự mình thử" : playing ? "Tạm dừng" : step === 0 ? "Bắt đầu" : "Tiếp tục"}
        </button>
        <button className="round-button" aria-label={done ? "Xem lại từ đầu" : "Bước tiếp"} onClick={() => { gameAudio.unlock(); setPlaying(false); onPauseChange?.(false); onStep(done ? 0 : step + 1); }}>{done ? <RotateCcw size={22} /> : <SkipForward size={22} />}</button>
      </div>
      <div className="linked-demo-step-status">
        <span>{step + 1} / {count}</span>
        <progress value={step} max={count - 1} aria-label="Tiến trình demo" />
        <button className="lesson-speed-button" aria-label={`Tốc độ demo: ${speed}x. Bấm để đổi tốc độ`} onClick={() => { const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1; setSpeed(next); onSpeedChange?.(next); }}>{speed}x</button>
      </div>
      {!done && <button className="linked-demo-try" onClick={onPlay}>Tự mình thử <ArrowRight size={16} /></button>}
    </footer>
  </div>;
}

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import Pig from "./Pig";

type Props = {
  step: number;
  count: number;
  narration: string;
  onStep: (step: number) => void;
  onSpeedChange?: (speed: number) => void;
  onPlay: () => void;
};

export default function LinkedDemoControls({ step, count, narration, onStep, onSpeedChange, onPlay }: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const done = step === count - 1;

  useEffect(() => {
    if (!playing || done) return;
    const timer = window.setTimeout(() => onStep(step + 1), 2600 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, speed, step, count, done, onStep]);

  return <div className="linked-demo-player">
    <div className="linked-demo-dialogue">
      <Pig mood="explaining" />
      <p aria-live="polite">{narration}</p>
    </div>
    <footer className="linked-demo-controls">
      <div className="linked-demo-playback">
        <button className="round-button" aria-label="Bước trước" disabled={step === 0} onClick={() => { setPlaying(false); onStep(step - 1); }}><SkipBack size={22} /></button>
        <button className={`chunky-button ${done ? "button-green" : "button-purple"}`} onClick={() => {
          if (done) onPlay();
          else setPlaying(value => !value);
        }}>
          {playing && !done ? <Pause size={23} /> : <Play size={23} />}
          {done ? "Tự mình thử" : playing ? "Tạm dừng" : step === 0 ? "Bắt đầu" : "Tiếp tục"}
        </button>
        <button className="round-button" aria-label={done ? "Xem lại từ đầu" : "Bước tiếp"} onClick={() => { setPlaying(false); onStep(done ? 0 : step + 1); }}>{done ? <RotateCcw size={22} /> : <SkipForward size={22} />}</button>
      </div>
      <div className="linked-demo-step-status">
        <span>{step + 1} / {count}</span>
        <progress value={step} max={count - 1} aria-label="Tiến trình demo" />
        <button className="lesson-speed-button" aria-label={`Tốc độ demo: ${speed}x. Bấm để đổi tốc độ`} onClick={() => { const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1; setSpeed(next); onSpeedChange?.(next); }}>{speed}x</button>
      </div>
    </footer>
  </div>;
}

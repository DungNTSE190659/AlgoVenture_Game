import { useEffect, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

export default function LinkedDemoControls({ step, count, onStep, onPlay }: { step: number; count: number; onStep: (step: number) => void; onPlay: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  useEffect(() => {
    if (!playing || step >= count - 1) { setPlaying(false); return; }
    const timer = window.setTimeout(() => onStep(step + 1), 2600 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, speed, step, count, onStep]);
  return <div className="linked-demo-player"><div className="linked-demo-player-buttons"><button className="round-button" aria-label="Bước trước" disabled={step === 0} onClick={() => { setPlaying(false); onStep(step - 1); }}><SkipBack size={19} /></button><button className="chunky-button button-purple" onClick={() => { if (step === count - 1) onStep(0); setPlaying(!playing); }}>{playing ? <Pause size={18} /> : <Play size={18} />}{playing ? "Tạm dừng" : "Phát demo"}</button><button className="round-button" aria-label="Bước tiếp" disabled={step === count - 1} onClick={() => { setPlaying(false); onStep(step + 1); }}><SkipForward size={19} /></button></div><button className="linked-reset" onClick={() => setSpeed(value => value === 2 ? 1 : value + .5)}>Tốc độ {speed}x</button><span>Bước {step + 1}/{count}</span>{step === count - 1 && <button className="chunky-button button-green" onClick={onPlay}>Tự mình thử</button>}</div>;
}

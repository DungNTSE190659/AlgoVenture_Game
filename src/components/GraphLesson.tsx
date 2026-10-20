import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, Settings, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { createGraphLesson, type GraphLessonFrame, type GraphDifficulty } from "../engine/graphLesson";
import GraphBoard from "./GraphBoard";
import Pig from "./Pig";
import { gameAudio } from "../audio/gameAudio";

type Props = {
  difficulty: GraphDifficulty;
  onBack: () => void;
  onPlay: () => void;
  onChange: (difficulty: GraphDifficulty) => void;
  sound: boolean;
  onSoundChange: (enabled: boolean) => void;
};

export default function GraphLesson({
  difficulty,
  onBack,
  onPlay,
  onChange,
  sound,
  onSoundChange,
}: Props) {
  const frames = useState(() => createGraphLesson(difficulty))[0];
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [settings, setSettings] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const frame = frames[cursor];
  const done = frame.kind === "DONE";

  useEffect(() => {
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);

  useEffect(() => {
    if (settings || !visible || !sound) {
      gameAudio.stop();
      return;
    }
    if (cursor === 0) return;
    gameAudio.play("tap");
  }, [cursor, settings, visible, sound]);

  useEffect(() => {
    if (!playing || settings || !visible || done) return;
    const timeout = setTimeout(() => setCursor((v) => Math.min(v + 1, frames.length - 1)), frame.duration);
    return () => clearTimeout(timeout);
  }, [playing, settings, visible, done, cursor, frame.duration, frames.length]);

  useEffect(() => {
    if (done) setPlaying(false);
  }, [done]);

  function move(delta: number) {
    gameAudio.stop();
    gameAudio.unlock();
    setPlaying(false);
    setCursor((v) => Math.max(0, Math.min(frames.length - 1, v + delta)));
  }

  function toggle() {
    gameAudio.unlock();
    if (playing) gameAudio.stop();
    if (done) {
      setCursor(0);
      setPlaying(true);
      return;
    }
    if (cursor === 0 && !playing) setCursor(1);
    setPlaying(!playing);
  }

  function toggleSound() {
    const next = !sound;
    gameAudio.setEnabled(next);
    if (next) {
      gameAudio.unlock();
      gameAudio.play("tap");
    }
    onSoundChange(next);
  }

  return (
    <main className={`lesson-world lesson-state-${frame.kind.toLowerCase()}`}>
      <header className="lesson-header">
        <button className="round-button" onClick={() => { gameAudio.stop(); onBack(); }} aria-label="Về bản đồ">
          <ArrowLeft size={24} />
        </button>
        <h1>BFS</h1>
        <button className="round-button" onClick={() => { gameAudio.stop(); setSettings(true); }} aria-label="Tùy chọn">
          <Settings size={23} />
        </button>
      </header>
      <section className="lesson-stage" aria-label="Bài học BFS">
        <h2 className="lesson-title">{frame.title}</h2>
        <GraphBoard
          state={frame.state}
          highlightedVertices={frame.highlightedNeighbors}
          selectedVertex={frame.highlightedVertex}
          paused={settings || !visible || !playing}
        />
        <div className="lesson-explanation">
          <p>{frame.narration}</p>
        </div>
      </section>
      <div className="lesson-narrator">
        <div className="lesson-pig-stage">
          <Pig mood={frame.mood} />
        </div>
        <div className="lesson-narration" aria-live="polite">
          <p>{frame.narration}</p>
        </div>
      </div>
      <footer className="lesson-controls">
        <div className="lesson-control-buttons">
          <button className="round-button" onClick={() => move(-1)} disabled={cursor === 0} aria-label="Bước trước">
            <SkipBack size={23} fill="currentColor" />
          </button>
          {done ? (
            <button className="chunky-button button-green" onClick={() => { gameAudio.stop(); onPlay(); }}>
              Tự mình thử <ArrowRight size={22} />
            </button>
          ) : (
            <button className="chunky-button button-purple" onClick={toggle} aria-label={playing ? "Tạm dừng demo" : "Phát demo"}>
              {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
              {playing ? "Tạm dừng" : cursor === 0 ? "Bắt đầu" : "Tiếp tục"}
            </button>
          )}
          <button className="round-button" onClick={done ? () => { gameAudio.stop(); setCursor(0); setPlaying(false); } : () => move(1)} aria-label={done ? "Xem lại từ đầu" : "Bước tiếp"}>
            {done ? <RotateCcw size={23} /> : <SkipForward size={23} fill="currentColor" />}
          </button>
        </div>
        <div className="lesson-playback-status">
          <div className="lesson-progress step-indicator" aria-label={`Bước ${cursor + 1} trên ${frames.length}`}>
            <span>{cursor + 1} / {frames.length}</span>
            <div><i style={{ width: `${(cursor / (frames.length - 1)) * 100}%` }} /></div>
          </div>
        </div>
      </footer>
      {settings && (
        <GraphSettings onClose={() => setSettings(false)} sound={sound} onSoundChange={toggleSound} difficulty={difficulty} onChange={onChange} />
      )}
    </main>
  );
}

function GraphSettings({
  onClose,
  sound,
  onSoundChange,
  difficulty,
  onChange,
}: {
  onClose: () => void;
  sound: boolean;
  onSoundChange: (enabled: boolean) => void;
  difficulty: GraphDifficulty;
  onChange: (diff: GraphDifficulty) => void;
}) {
  const difficulties: { id: GraphDifficulty; label: string }[] = [
    { id: "tutorial", label: "Hướng dẫn" },
    { id: "cycle", label: "Có cycle" },
    { id: "complex", label: "Phức tạp" },
  ];

  return (
    <dialog className="modal lesson-settings" open onClose={onClose} aria-label="Tùy chọn bài học BFS">
      <div className="modal-header">
        <h2>Nhịp học của bạn</h2>
        <button className="round-button" onClick={onClose} aria-label="Đóng">
          <X size={21} />
        </button>
      </div>
      <button className="lesson-sound-toggle" onClick={() => onSoundChange(!sound)} aria-pressed={sound}>
        {sound ? <Volume2 size={21} /> : <VolumeX size={21} />}
        <span>Hiệu ứng âm thanh</span>
        <b>{sound ? "Bật" : "Tắt"}</b>
      </button>
      <label className="setting-label">Độ khó</label>
      <select className="setting-select" value={difficulty} onChange={(e) => onChange(e.target.value as GraphDifficulty)}>
        {difficulties.map((diff) => (
          <option key={diff.id} value={diff.id}>{diff.label}</option>
        ))}
      </select>
      <button className="chunky-button button-green modal-primary" onClick={onClose}>
        Tiếp tục xem <Play size={18} fill="currentColor" />
      </button>
    </dialog>
  );
}

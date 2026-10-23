import { useDemoPlayback, useDemoMotionSpeed } from "./useDemoPlayback";
import { GameHeader, GameStats, GameLayout, GameFooter, GameHintButton } from "./GameHud";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { createInsertion, createInsertionLesson, insertionInstruction, insertionMove, needsShift, type InsertionAction } from "../engine/insertionSort";
import InsertionCardTable from "./InsertionCardTable";
import { createArray, type Difficulty } from "../engine/quicksort";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import HapticsToggle from "./HapticsToggle";
import Pig from "./Pig";
import World from "./World";
import VictoryCelebration from "./VictoryCelebration";

type Props = {
  mode: "demo" | "play"; input: number[]; difficulty: Difficulty; sound: boolean; speed: number;
  onBack: () => void; onPlay: () => void; onChooseMap: () => void; onComplete: () => void;
  onChange: (values: number[], level: Difficulty) => void;
  onSoundChange: (enabled: boolean) => void; onSpeedChange: (speed: number) => void;
};
const INSERTION_LEVELS = { easy: { label: "Dễ", count: 5 }, medium: { label: "Vừa", count: 6 }, hard: { label: "Khó", count: 6 } };
function createInsertionArray(level: Difficulty) {
  const values = createArray(level).slice(0, INSERTION_LEVELS[level].count);
  if (level === "hard") { values[0] = -values[0]; values[2] = values[values.length - 1]; }
  return values;
}
export default function InsertionGame({ mode, input: originalInput, difficulty, sound, speed, onBack, onPlay, onChooseMap, onComplete, onChange, onSoundChange, onSpeedChange }: Props) {
  const input = useMemo(() => originalInput.slice(0, 6), [originalInput]);
  const demo = mode === "demo";
  const frames = useMemo(() => createInsertionLesson(input), [input]);
  const [state, setState] = useState(() => createInsertion(input));
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [settings, setSettings] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [moves, setMoves] = useState(0);
  const [draft, setDraft] = useState(input.join(", "));
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const awarded = useRef(false);
  const lastCue = useRef(-1);
  const frame = frames[cursor];
  const shown = demo ? frame.state : state;
  const done = demo ? cursor === frames.length - 1 : state.phase === "done" && !busy;
  const paused = settings || !visible;
  const guided = demo || hint || difficulty === "easy";
  const nextAction = shown.phase === "pick" ? "pick" : needsShift(shown) ? "shift" : "insert";
  const score = Math.max(0, moves * 100 - mistakes * 25);

  useEffect(() => {
    const change = () => { setVisible(!document.hidden); if (document.hidden) { gameAudio.stop(); stopHaptics(); } };
    document.addEventListener("visibilitychange", change);
    return () => { document.removeEventListener("visibilitychange", change); gameAudio.stop(); stopHaptics(); };
  }, []);
  useEffect(() => { if (paused || motionPaused || !sound) gameAudio.stop(); if (paused) stopHaptics(); }, [paused, motionPaused, sound]);
  useEffect(() => {
    if (!settings) return;
    const previous = document.activeElement as HTMLElement;
    const panel = dialog.current;
    panel?.showModal();
    return () => { panel?.close(); previous?.focus(); };
  }, [settings]);
  useDemoPlayback(cursor, Math.max(2000, frame.narration.split(/\s+/).length * 160), speed, demo && playing && !paused && !done, () => setCursor(value => Math.min(value + 1, frames.length - 1)));
  const motionRoot = useDemoMotionSpeed(demo ? speed : 1);
  useEffect(() => {
    if (!demo || paused || cursor === 0 || lastCue.current === cursor) return;
    gameAudio.play(frame.cue);
    lastCue.current = cursor;
  }, [demo, paused, cursor, frame]);
  useEffect(() => {
    if (!busy || paused) return;
    const timer = setTimeout(() => { setBusy(false); lock.current = false; }, 420);
    return () => clearTimeout(timer);
  }, [busy, paused]);
  useEffect(() => {
    if (demo || !done || awarded.current) return;
    awarded.current = true;
    playFeedback("finish");
    onComplete();
  }, [demo, done, onComplete]);

  function act(action: InsertionAction, itemId?: number) {
    if (demo || paused || lock.current || done) return;
    gameAudio.unlock();
    const expected = action === "pick" ? state.items[state.cursor]?.id
      : action === "shift" ? state.items[state.hole - 1]?.id : state.key?.id;
    const next = (itemId === undefined || itemId === expected) ? insertionMove(state, action) : null;
    setHint(false);
    if (!next) {
      setMistakes(value => value + 1);
      const equal = action === "shift" && state.key && state.items[state.hole - 1]?.value === state.key.value;
      setFeedback(equal ? "Hai thẻ cùng số: giữ nguyên thứ tự ký hiệu. Hãy chèn thẻ đang cầm sau thẻ bằng nó." : "Chưa đúng. Thử lại nhé, hoặc gọi Buta nếu cần gợi ý.");
      playFeedback("retry");
      return;
    }
    lock.current = true;
    setBusy(true);
    setMoves(value => value + 1);
    setState(next);
    setFeedback("");
    playFeedback(action === "pick" ? "pivot" : action === "shift" ? "bubble-swap" : "correct");
  }
  function step(delta: number) {
    gameAudio.unlock(); gameAudio.stop(); setPlaying(false); setMotionPaused(false);
    setCursor(value => Math.max(0, Math.min(frames.length - 1, value + delta)));
  }
  function reset() {
    gameAudio.stop(); stopHaptics(); lock.current = false; awarded.current = false; lastCue.current = -1;
    setState(createInsertion(input)); setCursor(0); setPlaying(false); setMotionPaused(false); setBusy(false);
    setHint(false); setFeedback(""); setMoves(0); setMistakes(0); setSettings(false);
  }
  function applyInput(event: React.FormEvent) {
    event.preventDefault();
    const tokens = draft.trim().replaceAll("−", "-").split(/[,;\s]+/).filter(Boolean);
    const values = tokens.map(Number);
    if (tokens.length < 2 || tokens.length > 6 || tokens.some(token => !/^[-+]?\d+$/.test(token)) || values.some(value => !Number.isInteger(value) || value < -99 || value > 99)) {
      setError("Nhập từ 2 đến 6 số nguyên từ −99 đến 99."); return;
    }
    onChange(values, difficulty);
  }
  const title = demo ? frame.title : done ? "Bạn đã làm được!" : "Xếp thẻ cùng Buta";
  const instruction = done ? "Bộ thẻ đã có thứ tự!" : shown.phase === "pick" ? "Rút một thẻ để bắt đầu." : "Dịch thẻ hoặc chèn vào ô trống.";
  return <GameLayout ref={motionRoot} play={!demo} className={`insertion-world ${demo ? "insertion-demo" : "insertion-play"}`} data-busy={busy}>
    {!demo && <World />}
    <GameHeader title="Insertion Sort" className="insertion-header" play={!demo} onBack={onBack} onSettings={() => { gameAudio.unlock(); setSettings(true); }} />
    <GameStats className="insertion-stats" scoreClassName="insertion-score" score={demo ? undefined : score}>
      <span>{Math.min(shown.cursor, input.length)}/{input.length} thẻ đã xếp</span><span>{shown.shifts} lần dịch</span>
    </GameStats>
    <section className="insertion-content">
      <h2>{title}</h2>
      <p className="insertion-task">{demo ? "Chỉ dịch số lớn hơn thẻ đang cầm." : instruction}</p>
      {demo && <div className="insertion-steps" aria-label="Các bước xếp thẻ">
        <span className={!done && guided && nextAction === "pick" ? "is-current" : ""}><b>1</b> Rút thẻ</span>
        <span className={!done && guided && nextAction === "shift" ? "is-current" : ""}><b>2</b> Nhường chỗ</span>
        <span className={!done && guided && nextAction === "insert" ? "is-current" : ""}><b>3</b> Chèn thẻ</span>
      </div>}
      {difficulty === "hard" && <p className="insertion-stability-note">Trùng số: giữ thứ tự.</p>}
      <InsertionCardTable state={shown} guided={guided} enabled={!demo && !paused && !busy && !done} paused={paused || motionPaused} onAction={act} />
      {!demo && !done && <p className="insertion-feedback" role="status">{feedback}</p>}
      {!demo && done && <VictoryCelebration className="insertion-victory" stars={mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1} difficulty={difficulty} onReplay={reset} onHarder={level => onChange(createInsertionArray(level), level)} onMap={onChooseMap}>
        <strong>{score.toLocaleString("vi-VN")} điểm</strong><p>{state.shifts} lần dịch · {mistakes} lần thử lại</p>
      </VictoryCelebration>}
    </section>
    {!demo && !done && <GameFooter>
        <GameHintButton className="bubble-hint-button" aria-expanded={hint} disabled={busy || paused} onClick={() => { gameAudio.unlock(); playFeedback("hint"); setHint(value => !value); }} />
        {hint && <div className="insertion-dialogue insertion-hint"><Pig mood="thinking" /><p>{insertionInstruction(shown)}</p><button className="round-button" aria-label="Đóng gợi ý" onClick={() => setHint(false)}><X size={18} /></button></div>}
    </GameFooter>}
    {demo && <footer className="insertion-controls">
      <div className="insertion-dialogue"><Pig mood={done ? "celebrate" : frame.cue === "pivot" ? "thinking" : "explaining"} /><p aria-live="polite">{frame.narration}</p></div>
      <div className="insertion-playback">
        <button className="round-button" aria-label="Bước trước" disabled={cursor === 0} onClick={() => step(-1)}><SkipBack size={22} /></button>
        <button className="chunky-button button-purple" onClick={() => { gameAudio.unlock(); if (done) onPlay(); else { setMotionPaused(playing); setPlaying(value => !value); } }}>{playing && !done ? <Pause size={22} /> : <Play size={22} />}{done ? "Tự mình thử" : playing ? "Tạm dừng" : cursor === 0 ? "Bắt đầu" : "Tiếp tục"}</button>
        <button className="round-button" aria-label={done ? "Xem lại từ đầu" : "Bước tiếp"} onClick={() => done ? reset() : step(1)}>{done ? <RotateCcw size={22} /> : <SkipForward size={22} />}</button>
      </div>
      <div className="insertion-demo-progress"><span>{cursor + 1}/{frames.length}</span><progress value={cursor} max={frames.length - 1} aria-label="Tiến trình demo" /><button className="lesson-speed-button" aria-label={`Tốc độ demo: ${speed}x. Bấm để đổi tốc độ`} onClick={() => onSpeedChange(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)}>{speed}x</button></div>
    </footer>}
    {settings && <dialog className="modal lesson-settings" ref={dialog} aria-label="Tùy chọn Insertion Sort" onCancel={event => { event.preventDefault(); setSettings(false); }}>
      <div className="modal-header"><h2>Chuyến đi của bạn</h2><button className="round-button" aria-label="Đóng" onClick={() => setSettings(false)}><X size={21} /></button></div>
      <button className="lesson-sound-toggle" aria-pressed={sound} onClick={() => { onSoundChange(!sound); }} >{sound ? <Volume2 size={21} /> : <VolumeX size={21} />}<span>Hiệu ứng âm thanh</span><b>{sound ? "Bật" : "Tắt"}</b></button>
      <HapticsToggle />
      <label className="setting-label" htmlFor="insertion-level">Mảng mẫu</label>
      <select id="insertion-level" className="setting-select" value={difficulty} onChange={event => { const level = event.target.value as Difficulty; onChange(createInsertionArray(level), level); }}>{Object.entries(INSERTION_LEVELS).map(([id, level]) => <option key={id} value={id}>{level.label} · {level.count} số</option>)}</select>
      <form onSubmit={applyInput}>
        <label className="setting-label" htmlFor="insertion-array">Mảng của bạn</label>
        <input id="insertion-array" className="custom-input" value={draft} onChange={event => { setDraft(event.target.value); setError(""); }} aria-invalid={!!error} />
        <p className="lesson-input-help">Từ 2 đến 6 số nguyên từ −99 đến 99, cách nhau bằng dấu phẩy hoặc khoảng trắng.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="lesson-setting-actions"><button type="submit">Dùng mảng này</button><button type="button" onClick={reset}>Chơi lại từ đầu</button></div>
      </form>
      <button className="chunky-button button-green modal-primary" onClick={() => setSettings(false)}>Tiếp tục</button>
    </dialog>}
  </GameLayout>;
}

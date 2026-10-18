import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Hand, Lightbulb, Pause, Play, RotateCcw, Settings, SkipBack, SkipForward, Star, Volume2, VolumeX, X } from "lucide-react";
import { createInsertion, createInsertionLesson, insertionInstruction, insertionMove, type InsertionAction, type InsertionState } from "../engine/insertionSort";
import { createArray, type Difficulty, type Item } from "../engine/quicksort";
import { LEVELS } from "../engine/gameConfig";
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
export default function InsertionGame({ mode, input, difficulty, sound, speed, onBack, onPlay, onChooseMap, onComplete, onChange, onSoundChange, onSpeedChange }: Props) {
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
  const [outcome, setOutcome] = useState<"correct" | "retry" | "">("");
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
  useEffect(() => {
    if (!demo || !playing || paused || done) return;
    const timer = setTimeout(() => setCursor(value => value + 1), Math.max(2000, frame.narration.split(/\s+/).length * 160) / speed);
    return () => clearTimeout(timer);
  }, [demo, playing, paused, done, cursor, frame, speed]);
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

  function act(action: InsertionAction) {
    if (demo || paused || lock.current || done) return;
    gameAudio.unlock();
    const next = insertionMove(state, action);
    setHint(false);
    if (!next) {
      setMistakes(value => value + 1);
      setOutcome("retry");
      setFeedback(`Chưa đúng. ${insertionInstruction(state)}`);
      playFeedback("retry");
      return;
    }
    lock.current = true;
    setBusy(true);
    setMoves(value => value + 1);
    setState(next);
    setOutcome("correct");
    setFeedback(action === "pick" ? "Đã nhấc số. Tìm chỗ cho số này nhé!" : action === "shift" ? "Đúng rồi! Ô trống đã dịch sang trái." : "Chèn đúng chỗ! Phần có thứ tự đã dài hơn.");
    playFeedback(action === "pick" ? "pivot" : action === "shift" ? "bubble-swap" : "correct");
  }
  function step(delta: number) {
    gameAudio.unlock(); gameAudio.stop(); setPlaying(false); setMotionPaused(false);
    setCursor(value => Math.max(0, Math.min(frames.length - 1, value + delta)));
  }
  function reset() {
    gameAudio.stop(); stopHaptics(); lock.current = false; awarded.current = false; lastCue.current = -1;
    setState(createInsertion(input)); setCursor(0); setPlaying(false); setMotionPaused(false); setBusy(false);
    setHint(false); setFeedback(""); setOutcome(""); setMoves(0); setMistakes(0); setSettings(false);
  }
  function applyInput(event: React.FormEvent) {
    event.preventDefault();
    const tokens = draft.trim().replaceAll("−", "-").split(/[,;\s]+/).filter(Boolean);
    const values = tokens.map(Number);
    if (tokens.length < 2 || tokens.length > 8 || tokens.some(token => !/^[-+]?\d+$/.test(token)) || values.some(value => !Number.isInteger(value) || value < -99 || value > 99)) {
      setError("Nhập từ 2 đến 8 số nguyên từ −99 đến 99."); return;
    }
    onChange(values, difficulty);
  }
  const title = demo ? frame.title : done ? "Bạn đã làm được!" : shown.phase === "pick" ? "Nhấc một số, tìm đúng chỗ" : "Dịch sang phải hay chèn vào?";
  return <main className={`insertion-world ${demo ? "insertion-demo" : "insertion-play"}`} data-busy={busy}>
    {!demo && <World />}
    <header className="lesson-header insertion-header">
      <button className="round-button" aria-label="Về bản đồ" onClick={onBack}><ArrowLeft size={25} /></button>
      <h1>Insertion Sort</h1>
      <button className="round-button" aria-label="Tùy chọn" onClick={() => { gameAudio.unlock(); setSettings(true); }}><Settings size={25} /></button>
    </header>
    <div className="insertion-stats">
      {!demo && <span><Star size={18} fill="currentColor" /> <strong>{score.toLocaleString("vi-VN")} điểm</strong></span>}
      <span>{Math.min(shown.cursor, input.length)}/{input.length} số trong lượt</span><span>{shown.shifts} lần dịch</span>
    </div>
    <section className="insertion-content">
      <h2>{title}</h2>
      <p className="insertion-task">{demo ? "Sắp xếp từ bé đến lớn · Chỉ dịch số lớn hơn số đang cầm" : insertionInstruction(shown)}</p>
      <InsertionBoard state={shown} enabled={!demo && !paused && !busy && !done} paused={paused || motionPaused} onAction={act} />
      <div className="insertion-legend"><span><i /> Phần có thứ tự</span><span><i /> Số đang chèn</span><span>Chỉ số bắt đầu từ 0</span></div>
      {!demo && !done && <>
        <div className="insertion-actions">
          {shown.phase === "pick" ? <button className="chunky-button button-green" disabled={busy || paused} onClick={() => act("pick")}><Hand size={21} /> Nhấc số {shown.items[shown.cursor]!.value}</button> : <>
            <button className="chunky-button button-purple" disabled={busy || paused} onClick={() => act("shift")}>Dịch sang phải <ArrowRight size={21} /></button>
            <button className="chunky-button button-green" disabled={busy || paused} onClick={() => act("insert")}><Check size={21} /> Chèn vào ô trống</button>
          </>}
        </div>
        <p key={`${moves}:${mistakes}`} className={`insertion-feedback feedback-${outcome}`} role="status">{feedback || "Chạm số để thao tác. Có thể kéo số đang cầm vào ô trống hoặc dùng các nút bên trên."}</p>
        <button className="bubble-hint-button" aria-expanded={hint} disabled={busy || paused} onClick={() => { gameAudio.unlock(); playFeedback("hint"); setHint(value => !value); }}><Lightbulb size={21} /> Buta gợi ý</button>
        {hint && <div className="insertion-dialogue"><Pig mood="thinking" /><p>{insertionInstruction(shown)}</p></div>}
      </>}
      {!demo && done && <VictoryCelebration className="insertion-victory" stars={mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1} difficulty={difficulty} onReplay={reset} onHarder={level => onChange(createArray(level), level)} onMap={onChooseMap}>
        <strong>{score.toLocaleString("vi-VN")} điểm</strong><p>{state.shifts} lần dịch · {mistakes} lần thử lại</p>
      </VictoryCelebration>}
    </section>
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
      <select id="insertion-level" className="setting-select" value={difficulty} onChange={event => { const level = event.target.value as Difficulty; onChange(createArray(level), level); }}>{Object.entries(LEVELS).map(([id, level]) => <option key={id} value={id}>{level.label} · {level.count} số</option>)}</select>
      <form onSubmit={applyInput}>
        <label className="setting-label" htmlFor="insertion-array">Mảng của bạn</label>
        <input id="insertion-array" className="custom-input" value={draft} onChange={event => { setDraft(event.target.value); setError(""); }} aria-invalid={!!error} />
        <p className="lesson-input-help">Từ 2 đến 8 số nguyên từ −99 đến 99, cách nhau bằng dấu phẩy hoặc khoảng trắng.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="lesson-setting-actions"><button type="submit">Dùng mảng này</button><button type="button" onClick={reset}>Chơi lại từ đầu</button></div>
      </form>
      <button className="chunky-button button-green modal-primary" onClick={() => setSettings(false)}>Tiếp tục</button>
    </dialog>}
  </main>;
}

function InsertionBoard({ state, enabled, paused, onAction }: { state: InsertionState; enabled: boolean; paused: boolean; onAction: (action: InsertionAction) => void }) {
  const scroll = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [over, setOver] = useState(false);
  const drag = useRef<{ pointer: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressedClick = useRef(false);
  const items = [...state.items.filter((item): item is Item => item !== null), ...(state.key ? [state.key] : [])].sort((a, b) => a.id - b.id);
  useLayoutEffect(() => {
    const area = scroll.current, board = area?.querySelector<HTMLElement>(".insertion-board");
    if (!area || !board) return;
    const step = parseFloat(getComputedStyle(board).getPropertyValue("--step"));
    const index = Math.min(state.phase === "compare" ? state.hole : state.cursor, state.items.length - 1);
    const left = Math.max(0, index * step + step / 2 + 24 - area.clientWidth / 2);
    area.scrollTo({ left, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [state.cursor, state.hole, state.phase, state.items.length]);
  useEffect(() => { if (!enabled) { drag.current = null; setGhost(null); setOver(false); } }, [enabled]);
  function move(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointer !== event.pointerId) return;
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 6) gesture.moved = true;
    if (!gesture.moved) return;
    setGhost({ x: event.clientX, y: event.clientY });
    setOver(!!document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-insertion-hole]"));
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointer !== event.pointerId) return;
    drag.current = null; setGhost(null); setOver(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (gesture.moved) {
      suppressedClick.current = true;
      if (document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-insertion-hole]")) onAction("insert");
    }
  }
  return <div className="insertion-board-scroll" ref={scroll}>
    <div className="insertion-board" aria-label="Mảng Insertion Sort" style={{ "--count": state.items.length } as CSSProperties} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { drag.current = null; setGhost(null); setOver(false); }}>
      {state.key && <span className="insertion-key-label">ĐANG CẦM: {state.key.value}</span>}
      {state.items.map((item, index) => <button key={index} className={`insertion-slot ${!item ? "slot-empty" : ""} ${!item && over ? "slot-over" : ""}`} style={{ left: `calc(var(--step) * ${index})` }} data-insertion-hole={!item ? index : undefined} aria-label={`Ô ${index}${!item ? ", chèn số đang cầm" : ""}`} disabled={!!item || !enabled} onClick={() => onAction("insert")}><span>{!item && <ArrowRight size={22} />}</span><small>{index}</small></button>)}
      {items.map(item => {
        const index = state.items.findIndex(value => value?.id === item.id);
        const held = state.key?.id === item.id;
        const actionable = state.phase === "pick" ? index === state.cursor : held || index === state.hole - 1;
        return <InsertionTile key={item.id} item={item} index={held ? state.hole : index} held={held} settled={!held && (state.phase === "done" || index < (state.phase === "pick" ? state.cursor : state.hole))} disabled={!enabled || !actionable} paused={paused} onClick={() => {
          if (suppressedClick.current) { suppressedClick.current = false; return; }
          onAction(state.phase === "pick" ? "pick" : held ? "insert" : "shift");
        }} onPointerDown={event => {
          suppressedClick.current = false;
          if (!held || !enabled || event.button !== 0) return;
          gameAudio.unlock();
          drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
          event.currentTarget.parentElement!.setPointerCapture(event.pointerId);
        }} />;
      })}
    </div>
    {ghost && <div className="insertion-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">{state.key?.value}</div>}
  </div>;
}

function InsertionTile({ item, index, held, settled, disabled, paused, onClick, onPointerDown }: { item: Item; index: number; held: boolean; settled: boolean; disabled: boolean; paused: boolean; onClick: () => void; onPointerDown: React.PointerEventHandler<HTMLButtonElement> }) {
  const ref = useRef<HTMLButtonElement>(null);
  const previous = useRef({ index, held });
  const animation = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = { index, held };
    const node = ref.current;
    if (!node || (old.index === index && old.held === held) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const step = parseFloat(getComputedStyle(node.parentElement!).getPropertyValue("--step"));
    animation.current?.cancel();
    animation.current = node.animate([{ transform: `translate(${(old.index - index) * step}px, ${(old.held ? -100 : 0) - (held ? -100 : 0)}px)` }, { transform: "translate(0,0)" }], { duration: 400, easing: "cubic-bezier(.2,.65,.35,1)" });
  }, [index, held]);
  useEffect(() => {
    if (paused) animation.current?.pause();
    else if (animation.current?.playState === "paused") animation.current.play();
  }, [paused, index, held]);
  useEffect(() => () => animation.current?.cancel(), []);
  return <button ref={ref} className={`insertion-tile ${held ? "tile-held" : ""} ${settled ? "tile-sorted" : ""}`} style={{ left: `calc(var(--step) * ${index})`, top: held ? 0 : 100 }} disabled={disabled} aria-label={held ? `Số đang cầm ${item.value}, chèn vào ô trống` : `Số ${item.value}, ô ${index}`} data-item-id={item.id} data-value={item.value} data-index={held ? "held" : index} onClick={onClick} onPointerDown={onPointerDown}><strong>{item.value}</strong>{settled && <Check size={14} />}</button>;
}

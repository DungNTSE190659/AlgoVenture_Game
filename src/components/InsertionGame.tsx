import { useDemoPlayback, useDemoMotionSpeed } from "./useDemoPlayback";
import { GameHeader, GameStats, GameLayout, GameFooter, GameHintButton } from "./GameHud";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Check, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
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
      setFeedback("Chưa đúng. Thử lại nhé, hoặc gọi Buta nếu cần gợi ý.");
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
    if (tokens.length < 2 || tokens.length > 8 || tokens.some(token => !/^[-+]?\d+$/.test(token)) || values.some(value => !Number.isInteger(value) || value < -99 || value > 99)) {
      setError("Nhập từ 2 đến 8 số nguyên từ −99 đến 99."); return;
    }
    onChange(values, difficulty);
  }
  const title = demo ? frame.title : done ? "Bạn đã làm được!" : "Sắp xếp từ bé đến lớn";
  const instruction = done ? "Mảng đã được sắp xếp!" : "Kéo thả để sắp xếp dãy số.";
  return <GameLayout ref={motionRoot} play={!demo} className={`insertion-world ${demo ? "insertion-demo algorithm-demo" : "insertion-play"}`} data-busy={busy}>
    {!demo && <World />}
    <GameHeader title="Insertion Sort" className="insertion-header" play={!demo} onBack={onBack} onSettings={() => { gameAudio.unlock(); setSettings(true); }} />
    <GameStats className="insertion-stats" scoreClassName="insertion-score" score={demo ? undefined : score}>
      <span>{Math.min(shown.cursor, input.length)}/{input.length} số trong lượt</span><span>{shown.shifts} lần dịch</span>
    </GameStats>
    <section className="insertion-content">
      <h2>{title}</h2>
      <p className="insertion-task">{demo ? "Sắp xếp từ bé đến lớn · Chỉ dịch số lớn hơn số đang cầm" : instruction}</p>
      <InsertionBoard state={shown} interactive={!demo} showHint={hint} enabled={!demo && !paused && !busy && !done} paused={paused || motionPaused} onAction={act} />
      {!demo && !done && <p className="insertion-feedback" role="status">{feedback}</p>}
      {!demo && done && <VictoryCelebration className="insertion-victory" stars={mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1} difficulty={difficulty} onReplay={reset} onHarder={level => onChange(createArray(level), level)} onMap={onChooseMap}>
        <strong>{score.toLocaleString("vi-VN")} điểm</strong><p>{state.shifts} lần dịch · {mistakes} lần thử lại</p>
      </VictoryCelebration>}
    </section>
    {!demo && !done && <GameFooter>
        <GameHintButton className="bubble-hint-button" aria-expanded={hint} disabled={busy || paused} onClick={() => { gameAudio.unlock(); playFeedback("hint"); setHint(value => !value); }} />
        {hint && <div className="insertion-dialogue insertion-hint"><Pig mood="thinking" /><p>{insertionInstruction(shown)}</p><button className="round-button" aria-label="Đóng gợi ý" onClick={() => setHint(false)}><X size={18} /></button></div>}
    </GameFooter>}
    {demo && <footer className="insertion-controls demo-panel">
      <div className="insertion-dialogue"><Pig mood={done ? "celebrate" : frame.cue === "pivot" ? "thinking" : "explaining"} /><p aria-live="polite">{frame.narration}</p></div>
      <div className="insertion-playback">
        <button className="round-button" aria-label="Bước trước" disabled={cursor === 0} onClick={() => step(-1)}><SkipBack size={22} /></button>
        <button className={`chunky-button ${done ? "button-green" : "button-purple"}`} onClick={() => { gameAudio.unlock(); if (done) onPlay(); else { setMotionPaused(playing); setPlaying(value => !value); } }}>{playing && !done ? <Pause size={22} /> : <Play size={22} />}{done ? "Tự mình thử" : playing ? "Tạm dừng" : cursor === 0 ? "Bắt đầu" : "Tiếp tục"}</button>
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
  </GameLayout>;
}

function InsertionBoard({ state, interactive, showHint, enabled, paused, onAction }: { state: InsertionState; interactive: boolean; showHint: boolean; enabled: boolean; paused: boolean; onAction: (action: InsertionAction, itemId?: number) => void }) {
  const scroll = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; id: number; value: number } | null>(null);
  const [over, setOver] = useState(false);
  const drag = useRef<{ pointer: number; x: number; y: number; moved: boolean; action: InsertionAction; item: Item } | null>(null);
  const suppressedClick = useRef(false);
  const items = [...state.items.filter((item): item is Item => item !== null), ...(state.key ? [state.key] : [])].sort((a, b) => a.id - b.id);
  useLayoutEffect(() => {
    const area = scroll.current, board = boardRef.current;
    if (!area || !board) return;
    const step = parseFloat(getComputedStyle(board).getPropertyValue("--step"));
    const index = Math.min(state.phase === "compare" ? state.hole : state.cursor, state.items.length - 1);
    const left = Math.max(0, index * step + step / 2 + 24 - area.clientWidth / 2);
    area.scrollTo({ left, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [state.cursor, state.hole, state.phase, state.items.length]);
  function cancel() {
    const gesture = drag.current;
    drag.current = null; setGhost(null); setOver(false);
    if (gesture && boardRef.current?.hasPointerCapture(gesture.pointer)) boardRef.current.releasePointerCapture(gesture.pointer);
  }
  useEffect(() => { if (!enabled) cancel(); }, [enabled]);
  function targetAt(x: number, y: number, action: InsertionAction) {
    const target = document.elementFromPoint(x, y)?.closest(action === "pick" ? "[data-insertion-lift]" : "[data-insertion-hole]");
    return !!target && !!boardRef.current?.contains(target);
  }
  useEffect(() => {
    if (!ghost) return;
    const timer = setInterval(() => {
      const area = scroll.current, gesture = drag.current;
      if (!area || !gesture) return;
      const box = area.getBoundingClientRect();
      if (ghost.y < box.top || ghost.y > box.bottom) return;
      const direction = ghost.x < box.left + 32 ? -1 : ghost.x > box.right - 32 ? 1 : 0;
      if (direction) {
        area.scrollBy({ left: direction * 10 });
        setOver(targetAt(ghost.x, ghost.y, gesture.action));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [ghost]);
  function move(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointer !== event.pointerId || !enabled) return;
    if (!gesture.moved && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) <= 6) return;
    if (!gesture.moved) {
      gesture.moved = true; suppressedClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setGhost({ x: event.clientX, y: event.clientY, id: gesture.item.id, value: gesture.item.value });
    setOver(targetAt(event.clientX, event.clientY, gesture.action));
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointer !== event.pointerId) return;
    const accepted = enabled && gesture.moved && targetAt(event.clientX, event.clientY, gesture.action);
    cancel();
    if (accepted) onAction(gesture.action, gesture.item.id);
  }
  return <div className="insertion-board-scroll" ref={scroll}>
    <div className="insertion-board" ref={boardRef} aria-label="Mảng Insertion Sort" style={{ "--count": state.items.length } as CSSProperties} onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={event => {
      // Touch implicitly captures the tile first. Transferring capture to the
      // board also emits a bubbled lost event from that tile; the drag continues.
      if (event.target === event.currentTarget) cancel();
    }}>
      {interactive && state.phase === "pick" && <div className="insertion-lift-zone" data-insertion-lift aria-hidden="true">
        {showHint && <div className={`insertion-lift-slot ${over ? "slot-over" : ""}`} style={{ left: "calc(50% - var(--tile) / 2)" }} />}
      </div>}
      {state.items.map((item, index) => <button key={index} className={`insertion-slot ${!item ? "slot-empty" : ""} ${!item && showHint ? "slot-hinted" : ""} ${!item && over && showHint ? "slot-over" : ""}`} style={{ left: `calc(var(--step) * ${index})` }} data-insertion-hole={!item ? index : undefined} aria-label={`Ô ${index}${!item ? ", chèn số đang cầm" : ""}`} disabled={!!item || !enabled} onClick={() => onAction("insert")}><small>{index}</small></button>)}
      {items.map(item => {
        const index = state.items.findIndex(value => value?.id === item.id);
        const held = state.key?.id === item.id;
        const action: InsertionAction = state.phase === "pick" ? "pick" : held ? "insert" : "shift";
        return <InsertionTile key={item.id} item={item} index={held ? interactive ? (state.items.length - 1) / 2 : state.hole : index} held={held} dragging={ghost?.id === item.id} settled={!held && (state.phase === "done" || index < (state.phase === "pick" ? state.cursor : state.hole))} disabled={!enabled} paused={paused} onClick={() => {
          if (suppressedClick.current) { suppressedClick.current = false; return; }
          onAction(action, item.id);
        }} onPointerDown={event => {
          suppressedClick.current = false;
          if (!enabled || event.button !== 0) return;
          gameAudio.unlock();
          drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false, action, item };
        }} />;
      })}
    </div>
    {ghost && <div className="insertion-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">{ghost.value}</div>}
  </div>;
}

function InsertionTile({ item, index, held, dragging, settled, disabled, paused, onClick, onPointerDown }: { item: Item; index: number; held: boolean; dragging: boolean; settled: boolean; disabled: boolean; paused: boolean; onClick: () => void; onPointerDown: React.PointerEventHandler<HTMLButtonElement> }) {
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
  return <button ref={ref} className={`insertion-tile ${held ? "tile-held" : ""} ${dragging ? "tile-dragging" : ""} ${settled ? "tile-sorted" : ""}`} style={{ left: `calc(var(--step) * ${index})`, top: held ? 0 : 100 }} disabled={disabled} aria-label={held ? `Số đang cầm ${item.value}, chèn vào ô trống` : `Số ${item.value}, ô ${index}`} data-item-id={item.id} data-value={item.value} data-index={held ? "held" : index} onClick={onClick} onPointerDown={onPointerDown}><strong>{item.value}</strong>{settled && <Check size={14} />}</button>;
}

import { useDemoPlayback, useDemoMotionSpeed } from "./useDemoPlayback";
import { GameHeader, GameStats, GameLayout, GameFooter, GameHintButton } from "./GameHud";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Check, Crown, Pause, Play, RotateCcw, Search, SkipBack, SkipForward, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { chooseSelection, createSelection, createSelectionLesson, placeSelection, selectionHint, selectionMinimum, type SelectionState } from "../engine/selectionSort";
import { createArray, type Difficulty, type Item } from "../engine/quicksort";
import { LEVELS } from "../engine/gameConfig";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import HapticsToggle from "./HapticsToggle";
import Pig from "./Pig";
import World from "./World";
import VictoryCelebration from "./VictoryCelebration";
import { activateTouchButton } from "./touchActivation";

type Props = {
  mode: "demo" | "play"; input: number[]; difficulty: Difficulty; sound: boolean; speed: number;
  onBack: () => void; onPlay: () => void; onChooseMap: () => void; onComplete: () => void;
  onChange: (values: number[], level: Difficulty) => void;
  onSoundChange: (enabled: boolean) => void; onSpeedChange: (speed: number) => void;
};

export default function SelectionGame({ mode, input, difficulty, sound, speed, onBack, onPlay, onChooseMap, onComplete, onChange, onSoundChange, onSpeedChange }: Props) {
  const demo = mode === "demo";
  const frames = useMemo(() => createSelectionLesson(input), [input]);
  const [state, setState] = useState(() => createSelection(input));
  const current = useRef(state);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [settings, setSettings] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [busy, setBusy] = useState(false);
  const [landing, setLanding] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [outcome, setOutcome] = useState<"correct" | "retry" | "">("");
  const [wrong, setWrong] = useState<number | null>(null);
  const lock = useRef(false), awarded = useRef(false), lastCue = useRef(-1);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const frame = frames[cursor];
  const shown = demo ? frame.state : state;
  const paused = settings || !visible;
  const done = demo ? frame.kind === "done" : state.phase === "done" && !busy;
  const target = demo ? frame.target : landing ?? state.start;
  const chosen = shown.items.find(item => item.id === shown.chosen);

  useEffect(() => {
    const change = () => { setVisible(!document.hidden); if (document.hidden) { gameAudio.stop(); stopHaptics(); } };
    document.addEventListener("visibilitychange", change);
    return () => { document.removeEventListener("visibilitychange", change); gameAudio.stop(); stopHaptics(); };
  }, []);
  useEffect(() => {
    if (paused || motionPaused || !sound) gameAudio.stop();
    if (paused) stopHaptics();
  }, [paused, motionPaused, sound]);
  useDemoPlayback(cursor, Math.max(1800, frame.narration.split(/\s+/).length * 145 + 500), speed, demo && playing && !paused && !done, () => setCursor(value => Math.min(value + 1, frames.length - 1)));
  const motionRoot = useDemoMotionSpeed(demo ? speed : 1);
  useEffect(() => {
    if (!demo || paused || motionPaused || cursor === 0 || lastCue.current === cursor) return;
    gameAudio.play(frame.cue);
    lastCue.current = cursor;
  }, [demo, paused, motionPaused, cursor, frame]);
  useEffect(() => {
    if (!busy || paused) return;
    const timer = setTimeout(() => { setBusy(false); setLanding(null); lock.current = false; }, 550);
    return () => clearTimeout(timer);
  }, [busy, paused]);
  useEffect(() => {
    if (demo || !done || awarded.current) return;
    awarded.current = true;
    playFeedback("finish");
    onComplete();
  }, [demo, done, onComplete]);

  function fail(message: string, id: number | null = null) {
    setMistakes(value => value + 1); setStreak(0); setWrong(id);
    setScore(value => Math.max(0, value - 25)); setOutcome("retry"); setFeedback(message);
    playFeedback("retry");
  }
  function pick(id: number) {
    const before = current.current;
    if (demo || paused || lock.current || before.phase !== "choose") return false;
    gameAudio.unlock();
    const next = chooseSelection(before, id);
    if (!next) {
      const value = before.items.find(item => item.id === id)?.value;
      fail(`Còn số ${selectionMinimum(before)!.value} nhỏ hơn ${value}. Chỉ tìm trong các ô chưa xanh nhé!`, id);
      return false;
    }
    current.current = next; setState(next); setHint(false); setWrong(null);
    setScore(value => value + 100); setOutcome("correct");
    setFeedback(next.items[next.start].id === id ? "Đúng rồi! Số nhỏ nhất đã ở ô đầu. Cố định số này nhé." : "Tìm đúng số nhỏ nhất rồi! Đưa số vàng vào ô sáng nhé.");
    playFeedback("pivot");
    return true;
  }
  function place(index: number) {
    const before = current.current;
    if (demo || paused || lock.current || before.phase !== "place") return;
    gameAudio.unlock();
    const next = placeSelection(before, index);
    if (!next) { fail(`Đưa số đã chọn về ô ${before.start}, ô đang có khung vàng nhé.`); return; }
    const swapping = before.items[before.start].id !== before.chosen;
    const combo = streak + 1;
    const bonus = combo % 3 === 0 ? 50 : 0;
    lock.current = true; setBusy(true); setLanding(before.start);
    current.current = next; setState(next); setWrong(null); setHint(false);
    setScore(value => value + 150 + bonus); setStreak(combo); setOutcome("correct");
    setFeedback(bonus ? "Ba lượt liền đúng! Thêm 50 điểm thưởng." : swapping ? "Đổi đúng chỗ! Bỏ qua ô xanh, tìm tiếp số nhỏ nhất nhé." : "Đã đúng chỗ, không cần đổi! Tiếp tục với phần còn lại nhé.");
    playFeedback(swapping ? "bubble-swap" : "correct");
  }
  function reset() {
    gameAudio.stop(); stopHaptics();
    const fresh = createSelection(input); current.current = fresh; setState(fresh);
    lock.current = false; awarded.current = false; lastCue.current = -1;
    setCursor(0); setPlaying(false); setMotionPaused(false); setSettings(false); setBusy(false); setLanding(null);
    setScore(0); setMistakes(0); setStreak(0); setHint(false); setFeedback(""); setOutcome(""); setWrong(null);
  }
  function step(delta: number) {
    gameAudio.unlock(); gameAudio.stop(); lastCue.current = -1;
    setPlaying(false); setMotionPaused(false);
    setCursor(value => Math.max(0, Math.min(frames.length - 1, value + delta)));
  }
  const title = demo ? frame.title : done ? "Vườn số đã vào đúng chỗ!" : shown.phase === "choose" ? "Số nào bé nhất?" : "Đưa số vàng về ô sáng!";
  const instruction = demo ? "Xét hết phần chưa xếp, rồi mới đổi chỗ."
    : shown.phase === "choose" ? "Chạm số nhỏ nhất trong phần chưa xanh. Có thể kéo thẳng số đó về ô sáng."
    : chosen?.id === shown.items[shown.start]?.id ? "Số nhỏ nhất đã ở đúng ô. Bấm Giữ nguyên vị trí để đi tiếp."
    : `Kéo ${chosen?.value} về ô ${shown.start}, hoặc chạm vào ô đó để đổi chỗ.`;

  return <GameLayout ref={motionRoot} play={!demo} className={`selection-world selection-${mode} ${demo ? "algorithm-demo" : ""}`} data-busy={busy} data-phase={shown.phase} data-motion-paused={paused || motionPaused}
    onPointerDownCapture={event => { touchStart.current = { x: event.clientX, y: event.clientY }; }}
    onPointerUpCapture={event => {
      const start = touchStart.current;
      if (event.pointerType !== "touch" || !start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) return;
      const button = (event.target as Element).closest<HTMLButtonElement>("button");
      if (!button || button.disabled) return;
      const box = button.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) return;
      event.preventDefault();
      activateTouchButton(button);
    }}>
    {!demo && <World />}
    <GameHeader title="Selection Sort" className="selection-header" play={!demo} onBack={onBack} onSettings={() => { gameAudio.unlock(); setSettings(true); }} />
    <GameStats className="selection-stats" scoreClassName="selection-score" score={demo ? undefined : score}>
      <span>Lượt {Math.min(shown.rounds + 1, input.length - 1)} / {input.length - 1}</span>
      <span>{shown.swaps} lần đổi chỗ</span>
      {!demo && streak >= 2 && <span className="selection-combo"><Sparkles size={15} /> Chuỗi {streak}</span>}
    </GameStats>
    <section className="selection-content">
      <h2>{title}</h2>
      <p className="selection-task">{done ? "Mỗi lượt cố định một số nhỏ nhất. Bạn đã làm được!" : instruction}</p>
      <SelectionBoard state={shown} target={target} candidate={demo ? frame.candidate : shown.chosen} scan={demo ? frame.scan : null} wrong={wrong} enabled={!demo && !paused && !busy && !done} paused={paused || motionPaused} onPick={pick} onPlace={place} onMiss={() => {
        setOutcome(""); setFeedback("Thả số vào khung vàng, hoặc bấm nút Đưa về ô bên dưới nhé.");
      }} />
      {!demo && !done && <>
        <div className="selection-action">
          {shown.phase === "place" && <button className="chunky-button button-green" disabled={busy || paused} onClick={() => place(shown.start)}><Check size={21} /> {chosen?.id === shown.items[shown.start]?.id ? "Giữ nguyên vị trí" : `Đưa về ô ${shown.start}`}</button>}
        </div>
        <p key={`${score}:${mistakes}`} className={`selection-feedback outcome-${outcome}`} role="status">{feedback}</p>

      </>}
      {!demo && done && <VictoryCelebration className="selection-victory" stars={mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1} difficulty={difficulty} onReplay={reset} onHarder={level => onChange(createArray(level), level)} onMap={onChooseMap}>
        <strong>{score.toLocaleString("vi-VN")} điểm</strong><p>{state.rounds} lượt · {state.swaps} lần đổi chỗ · {mistakes} lần thử lại</p>
      </VictoryCelebration>}
    </section>
    {!demo && !done && <GameFooter>
        <GameHintButton className="bubble-hint-button" disabled={busy || paused} aria-expanded={hint} onClick={() => { gameAudio.unlock(); playFeedback("hint"); setHint(value => !value); }} />
        {hint && <div className="selection-dialogue selection-hint"><Pig mood="thinking" /><p>{selectionHint(shown)}</p><button className="round-button" aria-label="Đóng gợi ý" onClick={() => setHint(false)}><X size={17} /></button></div>}
    </GameFooter>}
    {demo && <footer className="selection-controls demo-panel">
      <div className="selection-dialogue"><Pig mood={done ? "celebrate" : frame.kind === "scan" ? "thinking" : frame.kind === "place" ? "proud" : "explaining"} /><p aria-live="polite">{frame.narration}</p></div>
      <div className="selection-playback">
        <button className="round-button" aria-label="Bước trước" disabled={cursor === 0} onClick={() => step(-1)}><SkipBack size={21} /></button>
        <button className={`chunky-button ${done ? "button-green" : "button-purple"}`} onClick={() => { gameAudio.unlock(); if (done) onPlay(); else { setMotionPaused(playing); setPlaying(value => !value); } }}>{playing && !done ? <Pause size={22} /> : <Play size={22} />}{done ? "Tự mình thử" : playing ? "Tạm dừng" : cursor === 0 ? "Bắt đầu" : "Tiếp tục"}</button>
        <button className="round-button" aria-label={done ? "Xem lại từ đầu" : "Bước tiếp"} onClick={() => done ? reset() : step(1)}>{done ? <RotateCcw size={21} /> : <SkipForward size={21} />}</button>
      </div>
      <div className="selection-demo-progress"><span>{cursor + 1}/{frames.length}</span><progress value={cursor} max={frames.length - 1} aria-label="Tiến trình demo" /><button className="lesson-speed-button" aria-label={`Tốc độ demo: ${speed}x. Bấm để đổi tốc độ`} onClick={() => onSpeedChange(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)}>{speed}x</button></div>
    </footer>}
    {settings && <SelectionSettings {...{ input, difficulty, sound, onChange, onSoundChange }} onClose={() => setSettings(false)} onReset={reset} />}
  </GameLayout>;
}

function SelectionBoard({ state, target, candidate, scan, wrong, enabled, paused, onPick, onPlace, onMiss }: {
  state: SelectionState; target: number; candidate: number | null; scan: number | null; wrong: number | null;
  enabled: boolean; paused: boolean; onPick: (id: number) => boolean; onPlace: (index: number) => void; onMiss: () => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; pointer: number; x: number; y: number; moved: boolean; accepted: boolean } | null>(null);
  const suppressed = useRef(false);
  const [ghost, setGhost] = useState<{ x: number; y: number; value: number } | null>(null);
  const [over, setOver] = useState(false);
  const latest = useRef({ state, enabled, onPick, onPlace, onMiss }); latest.current = { state, enabled, onPick, onPlace, onMiss };
  const focusIndex = scan ?? (!enabled && candidate !== null ? state.items.findIndex(item => item.id === candidate) : target);
  useEffect(() => { if (!enabled) { gesture.current = null; setGhost(null); setOver(false); } }, [enabled]);
  useLayoutEffect(() => {
    const area = scroll.current;
    const tile = area?.querySelector<HTMLElement>(`[data-selection-index="${Math.min(focusIndex, state.items.length - 1)}"]`);
    if (!area || !tile) return;
    const box = tile.getBoundingClientRect(), view = area.getBoundingClientRect();
    if (box.left < view.left + 20 || box.right > view.right - 20) area.scrollBy({ left: box.left - view.left - view.width / 2 + box.width / 2, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [focusIndex, state.items.length]);
  useEffect(() => {
    if (!ghost) return;
    const timer = setInterval(() => {
      const area = scroll.current;
      if (!area || !gesture.current?.accepted) return;
      const box = area.getBoundingClientRect();
      if (ghost.y < box.top || ghost.y > box.bottom) return;
      const direction = ghost.x < box.left + 32 ? -1 : ghost.x > box.right - 32 ? 1 : 0;
      if (direction) {
        area.scrollBy({ left: direction * 10 });
        setOver(!!document.elementFromPoint(ghost.x, ghost.y)?.closest("[data-selection-target]"));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [ghost]);
  function begin(event: PointerEvent<HTMLButtonElement>, id: number) {
    if (!enabled || event.button !== 0) return;
    suppressed.current = false;
    gesture.current = { id, pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false, accepted: false };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current, { state: active, enabled: allowed, onPick: pick } = latest.current;
    if (!drag || drag.pointer !== event.pointerId || !allowed) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 7) return;
    if (!drag.moved) {
      drag.moved = true; suppressed.current = true;
      drag.accepted = active.phase === "place" ? active.chosen === drag.id : pick(drag.id);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!drag.accepted) return;
    setGhost({ x: event.clientX, y: event.clientY, value: active.items.find(item => item.id === drag.id)!.value });
    setOver(!!document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-selection-target]"));
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    gesture.current = null; setGhost(null); setOver(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!drag.moved || !drag.accepted) return;
    const goal = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-selection-target]");
    if (goal) latest.current.onPlace(Number(goal.dataset.selectionTarget));
    else latest.current.onMiss();
  }
  return <div className="selection-board-scroll" ref={scroll}>
    <div className="selection-board" style={{ "--count": state.items.length } as CSSProperties} aria-label="Mảng Selection Sort" onPointerMove={move} onPointerUp={end} onPointerCancel={() => { gesture.current = null; setGhost(null); setOver(false); }}>
      {target < state.items.length && <div className={`selection-goal ${over ? "goal-over" : ""}`} style={{ left: `calc(var(--step) * ${target} - 5px)` }} aria-hidden="true"><span>VỀ Ô {target}</span></div>}
      {state.items.map((item, index) => <SelectionTile key={item.id} item={item} index={index} settled={index < state.start} candidate={candidate === item.id} scanning={scan === index} wrong={wrong === item.id} held={ghost !== null && gesture.current?.id === item.id} target={index === target} paused={paused} enabled={enabled && index >= state.start && (state.phase === "choose" || state.chosen === item.id || index === state.start)} onPointerDown={event => begin(event, item.id)} onClick={() => {
        if (suppressed.current) { suppressed.current = false; return; }
        if (state.phase === "choose") onPick(item.id);
        else if (index === state.start) onPlace(index);
      }} />)}
    </div>
    {ghost && <div className="selection-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true"><Crown size={20} />{ghost.value}</div>}
  </div>;
}

function SelectionTile({ item, index, settled, candidate, scanning, wrong, held, target, paused, enabled, onClick, onPointerDown }: {
  item: Item; index: number; settled: boolean; candidate: boolean; scanning: boolean; wrong: boolean; held: boolean; target: boolean; paused: boolean; enabled: boolean;
  onClick: () => void; onPointerDown: React.PointerEventHandler<HTMLButtonElement>;
}) {
  const ref = useRef<HTMLButtonElement>(null), previous = useRef(index), animation = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const old = previous.current; previous.current = index;
    const node = ref.current;
    if (!node || old === index || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dx = (old - index) * (node.getBoundingClientRect().width + 10);
    animation.current?.cancel();
    animation.current = node.animate([{ transform: `translate(${dx}px, 0)` }, { transform: `translate(${dx * .5}px, ${old > index ? -46 : 40}px) scale(1.06)`, offset: .5 }, { transform: "translate(0,0)" }], { duration: 500, easing: "cubic-bezier(.2,.65,.35,1)" });
  }, [index]);
  useEffect(() => { if (paused) animation.current?.pause(); else if (animation.current?.playState === "paused") animation.current.play(); }, [paused, index]);
  useEffect(() => () => animation.current?.cancel(), []);
  return <button ref={ref} className={`selection-tile ${settled ? "tile-fixed" : ""} ${candidate ? "tile-candidate" : ""} ${scanning ? "tile-scan" : ""} ${wrong ? "tile-wrong" : ""} ${held ? "tile-held" : ""}`} style={{ left: `calc(var(--step) * ${index})` }} disabled={!enabled} data-selection-id={item.id} data-selection-index={index} data-value={item.value} data-selection-target={target ? index : undefined} aria-label={`Số ${item.value}, ô ${index}${settled ? ", đã xếp xong" : ""}`} aria-pressed={candidate} onClick={onClick} onPointerDown={onPointerDown}>
    {candidate && <span className="selection-crown"><Crown size={19} /></span>}{scanning && <Search size={17} className="selection-scan-icon" />}<strong>{item.value}</strong>{settled && <Check className="selection-fixed-check" size={16} />}<small>{index}</small>
  </button>;
}

function SelectionSettings({ input, difficulty, sound, onChange, onSoundChange, onClose, onReset }: Pick<Props, "input" | "difficulty" | "sound" | "onChange" | "onSoundChange"> & { onClose: () => void; onReset: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(input.join(", ")), [error, setError] = useState("");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement, panel = ref.current;
    panel?.showModal();
    return () => { panel?.close(); previous?.focus(); };
  }, []);
  return <dialog className="modal lesson-settings" ref={ref} aria-label="Tùy chọn Selection Sort" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="modal-header"><h2>Chuyến đi của bạn</h2><button className="round-button" aria-label="Đóng" onClick={onClose}><X size={21} /></button></div>
    <button className="lesson-sound-toggle" aria-pressed={sound} onClick={() => onSoundChange(!sound)}>{sound ? <Volume2 size={21} /> : <VolumeX size={21} />}<span>Hiệu ứng âm thanh</span><b>{sound ? "Bật" : "Tắt"}</b></button><HapticsToggle />
    <label className="setting-label" htmlFor="selection-level">Mảng mẫu</label>
    <select id="selection-level" className="setting-select" value={difficulty} onChange={event => { const level = event.target.value as Difficulty; onChange(createArray(level), level); }}>{Object.entries(LEVELS).map(([id, level]) => <option key={id} value={id}>{level.label} · {level.count} số</option>)}</select>
    <form onSubmit={event => {
      event.preventDefault();
      const tokens = draft.trim().replaceAll("−", "-").split(/[,;\s]+/).filter(Boolean), values = tokens.map(Number);
      if (tokens.length < 2 || tokens.length > 8 || tokens.some(token => !/^[-+]?\d+$/.test(token)) || values.some(value => !Number.isInteger(value) || value < -99 || value > 99)) { setError("Nhập từ 2 đến 8 số nguyên từ −99 đến 99."); return; }
      onChange(values, difficulty);
    }}>
      <label className="setting-label" htmlFor="selection-array">Mảng của bạn</label><input id="selection-array" className="custom-input" value={draft} onChange={event => { setDraft(event.target.value); setError(""); }} aria-invalid={!!error} />
      <p className="lesson-input-help">Từ 2 đến 8 số nguyên từ −99 đến 99, cách nhau bằng dấu phẩy hoặc khoảng trắng.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="lesson-setting-actions"><button type="submit">Dùng mảng này</button><button type="button" onClick={onReset}>Chơi lại từ đầu</button></div>
    </form>
    <button className="chunky-button button-green modal-primary" onClick={onClose}>Tiếp tục</button>
  </dialog>;
}

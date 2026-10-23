import { useDemoPlayback, useDemoMotionSpeed } from "./useDemoPlayback";
import { GameHeader, GameStats, GameLayout } from "./GameHud";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pause, Play, RotateCcw, SkipBack, SkipForward, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { chooseSelection, createSelection, createSelectionLesson, placeSelection, selectionMinimum } from "../engine/selectionSort";
import { createArray, type Difficulty } from "../engine/quicksort";
import { LEVELS } from "../engine/gameConfig";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import HapticsToggle from "./HapticsToggle";
import Fox from "./Fox";
import SelectionPackBoard from "./SelectionPackBoard";
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
    if (demo || paused || lock.current || before.phase === "done") return false;
    gameAudio.unlock();
    const next={...before,chosen:id,phase:"place" as const};
    current.current=next;setState(next);setWrong(null);setOutcome("");setFeedback("");
    playFeedback("tap");
    return true;
  }
  function place(index: number) {
    const before = current.current;
    if (demo || paused || lock.current || before.phase !== "place") return;
    gameAudio.unlock();
    const checked=chooseSelection({...before,phase:"choose",chosen:null},before.chosen!);
    if(!checked){const item=before.items.find(i=>i.id===before.chosen)!;const at=before.items.findIndex(i=>i.id===before.chosen);fail(at<before.start?"−25 điểm. Thẻ này đã được cố định. Chỉ xử lý phần chưa xếp nhé.":`−25 điểm. Thẻ ${item.value} chưa phải nhỏ nhất: phần chưa xếp còn số ${selectionMinimum(before)?.value}. Hãy tìm số nhỏ nhất trước khi đổi chỗ.`,item.id);current.current={...before,phase:"choose",chosen:null};setState(current.current);return;}
    const next = placeSelection(checked, index);
    if (!next) { fail(`−25 điểm. Bạn chọn ô ${index+1}, nhưng lượt này phải đưa số nhỏ nhất về ô có cờ ${before.start + 1}.`); return; }
    const swapping = before.items[before.start].id !== before.chosen;
    const combo = streak + 1;
    const bonus = combo % 3 === 0 ? 50 : 0;
    lock.current = true; setBusy(true); setLanding(before.start);
    current.current = next; setState(next); setWrong(null);
    setScore(value => value + 250 + bonus); setStreak(combo); setOutcome("correct");
    setFeedback("");
    playFeedback(swapping ? "bubble-swap" : "correct");
  }
  function keepPosition() {
    const before = current.current;
    if (demo || paused || lock.current || before.phase === "done") return;
    gameAudio.unlock();
    const atFlag = before.items[before.start];
    const kept = chooseSelection({ ...before, phase: "choose", chosen: null }, atFlag.id);
    if (!kept) {
      fail(`−25 điểm. Ô cờ đang có ${atFlag.value}, nhưng phần chưa xếp còn số nhỏ hơn là ${selectionMinimum(before)?.value}. Không thể giữ nguyên lúc này.`, atFlag.id);
      return;
    }
    // Score only the committed round, including a direct keep.

    current.current = kept; setState(kept);
    place(before.start);
  }
  function reset() {
    gameAudio.stop(); stopHaptics();
    const fresh = createSelection(input); current.current = fresh; setState(fresh);
    lock.current = false; awarded.current = false; lastCue.current = -1;
    setCursor(0); setPlaying(false); setMotionPaused(false); setSettings(false); setBusy(false); setLanding(null);
    setScore(0); setMistakes(0); setStreak(0);  setFeedback(""); setOutcome(""); setWrong(null);
  }
  function step(delta: number) {
    gameAudio.unlock(); gameAudio.stop(); lastCue.current = -1;
    setPlaying(false); setMotionPaused(false);
    setCursor(value => Math.max(0, Math.min(frames.length - 1, value + delta)));
  }
  const title = demo ? frame.title : "";
  function drop(id:number,index:number){if(demo||paused||lock.current)return;const staged={...current.current,chosen:id,phase:"place" as const};current.current=staged;setState(staged);place(index);}
  return <GameLayout ref={motionRoot} play={!demo} className={`selection-world selection-${mode} selection-studio`} data-busy={busy} data-phase={shown.phase} data-motion-paused={paused || motionPaused}
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
    <GameHeader title="Selection Sort" className="selection-header" play={!demo} onBack={onBack} onSettings={() => { gameAudio.unlock(); setSettings(true); }} />
    <div className="ss-workspace"><div className="ss-main">
    {!demo&&<GameStats className="selection-stats" scoreClassName="selection-score" score={demo ? undefined : score}>
      <span>Lượt {Math.min(shown.rounds + 1, input.length - 1)} / {input.length - 1}</span>
      <span>{shown.swaps} lần đổi chỗ</span>
      {!demo && streak >= 2 && <span className="selection-combo"><Sparkles size={15} /> Chuỗi {streak}</span>}
    </GameStats>}
    <section className="selection-content">
      {demo&&<h2>{title}</h2>}
      <SelectionPackBoard state={shown} target={target} candidate={demo ? frame.candidate : shown.chosen} scan={demo ? frame.scan : null} wrong={wrong} enabled={!demo && !paused && !busy && !done} paused={paused || motionPaused} onPick={pick} onPlace={place} onDrop={drop} onMiss={() => {
        setOutcome(""); setFeedback("");
      }} />
      {!demo && !done && <>
        <div className="selection-action">
          {shown.phase === "place" && <button className="chunky-button" disabled={busy||paused} onClick={()=>{const next={...current.current,chosen:null,phase:"choose" as const};current.current=next;setState(next);setFeedback("");setWrong(null);setOutcome("");}}>Bỏ chọn</button>}
          <button className="chunky-button button-green" disabled={busy || paused} onClick={keepPosition}><Check size={18} /> Giữ nguyên vị trí</button>

          {shown.phase === "place" && chosen?.id !== shown.items[shown.start]?.id && <button className="chunky-button button-green" disabled={busy || paused} onClick={() => place(shown.start)}>{`Đưa về ô ${shown.start + 1}`}</button>}
        </div>


      </>}
      {!demo && done && <VictoryCelebration companion={<Fox mood="celebrate"/>} companionName="Cáo" className="selection-victory" stars={mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1} difficulty={difficulty} onReplay={reset} onHarder={level => onChange(createArray(level), level)} onMap={onChooseMap}>
        <strong>{score.toLocaleString("vi-VN")} điểm</strong><p>{state.rounds} lượt · {state.swaps} lần đổi chỗ · {mistakes} lần thử lại</p>
      </VictoryCelebration>}
    </section>
    </div><aside className="ss-sidebar">
    {!demo&&!done&&<div className="selection-dialogue"><Fox mood={outcome==="retry"?"oops":"happy"}/><div className="ss-chat"><strong>Cáo đồng hành</strong><p role="status">{feedback || (shown.phase==="choose"?"Đưa số nhỏ nhất của phần chưa xếp về ô có cờ.":"Chọn ô để đặt thẻ, hoặc kéo thẻ vào ô đó.")}</p></div></div>}
    {demo && <footer className="selection-controls">
      <div className="selection-dialogue"><Fox mood={done ? "celebrate" : frame.kind === "scan" ? "thinking" : frame.kind === "place" ? "proud" : "happy"} /><div className="ss-chat"><strong>Cáo hướng dẫn</strong><p aria-live="polite">{frame.narration}</p></div></div>
      <div className="selection-playback">
        <button className="round-button" aria-label="Bước trước" disabled={cursor === 0} onClick={() => step(-1)}><SkipBack size={21} /></button>
        <button className="chunky-button button-purple" onClick={() => { gameAudio.unlock(); if (done) onPlay(); else { setMotionPaused(playing); setPlaying(value => !value); } }}>{playing && !done ? <Pause size={22} /> : <Play size={22} />}{done ? "Tự mình thử" : playing ? "Tạm dừng" : cursor === 0 ? "Phát demo" : "Tiếp tục"}</button>
        <button className="round-button" aria-label={done ? "Xem lại từ đầu" : "Bước tiếp"} onClick={() => done ? reset() : step(1)}>{done ? <RotateCcw size={21} /> : <SkipForward size={21} />}</button>
      </div>
      <div className="selection-demo-progress"><span>{cursor + 1}/{frames.length}</span><progress value={cursor} max={frames.length - 1} aria-label="Tiến trình demo" /><button className="lesson-speed-button" aria-label={`Tốc độ demo: ${speed}x. Bấm để đổi tốc độ`} onClick={() => onSpeedChange(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)}>{speed}x</button></div>
    </footer>}
    </aside></div>
    {settings && <SelectionSettings {...{ input, difficulty, sound, onChange, onSoundChange }} onClose={() => setSettings(false)} onReset={reset} />}
  </GameLayout>;
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

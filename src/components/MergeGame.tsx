import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { createMergeLesson } from "../engine/mergeSort";
import { createMergeStream, nextStreamGroup, selectStreamGroup, splitStreamGroup, streamHint, takeStreamLeaf, type MergeStream } from "../engine/mergeStream";
import { createArray, type Difficulty } from "../engine/quicksort";
import { LEVELS, type Mode } from "../engine/gameConfig";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import { GameFooter, GameHeader, GameHintButton, GameLayout, GameStats } from "./GameHud";
import { useDemoMotionSpeed, useDemoPlayback } from "./useDemoPlayback";
import HapticsToggle from "./HapticsToggle";
import Pig from "./Pig";
import VictoryCelebration from "./VictoryCelebration";
import MergeStreamBoard, { MergeStreamMap } from "./MergeStreamBoard";

type Props = { mode: Mode; input: number[]; difficulty: Difficulty; sound: boolean; speed: number; onBack: () => void; onPlay: () => void; onChooseMap: () => void; onComplete: () => void; onChange: (values: number[], level: Difficulty) => void; onSoundChange: (enabled: boolean) => void; onSpeedChange: (speed: number) => void };
function streamArray(level: Difficulty) {
  const values = createArray(level);
  if (level === "hard") values[0] = -values[0];
  return values;
}

export default function MergeGame({ mode, input, difficulty, sound, speed, onBack, onPlay, onChooseMap, onComplete, onChange, onSoundChange, onSpeedChange }: Props) {
  const demo = mode === "demo";
  const frames = useMemo(() => createMergeLesson(input), [input]);
  const [run, setRun] = useState(() => createMergeStream(input));
  const [cursor, setCursor] = useState(0), [playing, setPlaying] = useState(false), [motionPaused, setMotionPaused] = useState(false);
  const [settings, setSettings] = useState(false), [visible, setVisible] = useState(!document.hidden), [hint, setHint] = useState(false), [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(input.join(", ")), [error, setError] = useState("");
  const awarded = useRef(false), lock = useRef(false), dialog = useRef<HTMLDialogElement>(null);
  const frame = frames[cursor], shown = demo ? frame.state : run.sorting;
  const groups = demo ? frame.groups : run.phase === "split" ? run.groups : undefined;
  const selected = demo ? groups?.find(group => group.left)?.id ?? groups?.[0]?.id : run.selected;
  const paused = settings || !visible;
  const done = demo ? frame.kind === "done" : run.phase === "done";
  const enabled = !demo && !paused && !hint && !busy && !done;
  const motionRoot = useDemoMotionSpeed(demo ? speed : 1);
  const title = demo ? frame.title : run.phase === "split" ? "Chia dòng suối" : "Suối Hợp Nhất";
  useEffect(() => {
    const change = () => { setVisible(!document.hidden); if (document.hidden) { gameAudio.stop(); stopHaptics(); } };
    document.addEventListener("visibilitychange", change);
    return () => { document.removeEventListener("visibilitychange", change); gameAudio.stop(); stopHaptics(); };
  }, []);
  useEffect(() => { if (paused || motionPaused || !sound) gameAudio.stop(); if (paused) stopHaptics(); }, [paused, motionPaused, sound]);
  useEffect(() => {
    if (!settings) return;
    const previous = document.activeElement as HTMLElement, panel = dialog.current;
    panel?.showModal();
    return () => { panel?.close(); previous?.focus(); };
  }, [settings]);
  useEffect(() => {
    if (!busy || paused) return;
    const timer = setTimeout(() => { setBusy(false); lock.current = false; }, 450);
    return () => clearTimeout(timer);
  }, [busy, paused]);
  useEffect(() => {
    if (demo || !done || awarded.current) return;
    awarded.current = true; playFeedback("finish"); onComplete();
  }, [demo, done, onComplete]);
  useDemoPlayback(cursor, Math.max(2200, frame.narration.split(/\s+/).length * 155), speed, demo && playing && !paused && !done, () => setCursor(value => Math.min(value + 1, frames.length - 1)));
  useEffect(() => {
    if (demo && cursor > 0 && !paused && !motionPaused) gameAudio.play(frame.kind === "split" ? "split" : frame.kind === "place" ? "drop" : frame.kind === "done" ? "finish" : "tap");
  }, [cursor, demo, frame.kind, paused, motionPaused]);
  function commit(next: MergeStream) {
    if (!enabled || lock.current || next === run) return;
    gameAudio.unlock(); setRun(next);
    if (next.mistakes > run.mistakes) { playFeedback("retry"); return; }
    setHint(false); lock.current = true; setBusy(true);
    playFeedback(next.splits > run.splits ? "split" : next.sorting.moves > run.sorting.moves ? "drop" : "enter");
  }
  function reset() {
    gameAudio.stop(); stopHaptics(); awarded.current = false; lock.current = false;
    setRun(createMergeStream(input)); setCursor(0); setPlaying(false); setMotionPaused(false); setSettings(false); setHint(false); setBusy(false);
    setDraft(input.join(", ")); setError("");
  }
  function step(delta: number) { gameAudio.unlock(); gameAudio.stop(); setPlaying(false); setMotionPaused(false); setCursor(value => Math.max(0, Math.min(frames.length - 1, value + delta))); }
  function applyInput(event: React.FormEvent) {
    event.preventDefault();
    const tokens = draft.trim().replaceAll("−", "-").split(/[,;\s]+/).filter(Boolean), values = tokens.map(Number);
    if (tokens.length < 2 || tokens.length > 8 || tokens.some(token => !/^[-+]?\d+$/.test(token)) || values.some(value => !Number.isInteger(value) || value < -99 || value > 99)) { setError("Nhập từ 2 đến 8 số nguyên từ −99 đến 99."); return; }
    onChange(values, difficulty);
  }
  return <GameLayout ref={motionRoot} play={!demo} className={`merge-world merge-${mode} merge-stream-world`} data-phase={groups ? "split" : demo ? shown.phase : run.phase} data-moves={shown.moves} data-splits={run.splits} data-busy={busy} data-motion-paused={paused || motionPaused || hint}>
    <div className="stream-scenery" aria-hidden="true"><span className="stream-scenery-reed reed-left" /><span className="stream-scenery-reed reed-right" /><i /><i /></div>
    <GameHeader title="Merge Sort" play={!demo} onBack={onBack} onSettings={() => { gameAudio.unlock(); setSettings(true); }} />
    {!demo && <GameStats className="merge-stats" scoreClassName="merge-score" score={run.score}><span>{shown.completed}/{shown.tasks.length} nhóm đã ghép</span><span>{LEVELS[difficulty].label} · Không giới hạn giờ</span></GameStats>}
    <section className="merge-content">
      <h2>{title}</h2>
      <p className="merge-task">{groups ? "Chia đôi từng nhóm, giữ nguyên thứ tự lá." : done ? "Chia nhỏ rồi ghép lại · Giữ thứ tự các bông hoa." : demo ? "So sánh hai lá đầu nhánh · Lấy số nhỏ hơn trước." : "Kéo hoặc chạm lá đầu nhỏ hơn để đưa xuống hồ."}</p>
      <MergeStreamMap state={shown} groups={groups} selected={selected} enabled={enabled} onSelect={id => { if (enabled && !lock.current) setRun(selectStreamGroup(run, id)); }} />
      <MergeStreamBoard state={shown} groups={groups} selected={selected} guided={demo} enabled={enabled} paused={paused || motionPaused || hint}
        onSplit={() => commit(splitStreamGroup(run))} onLeaf={(lane, id) => commit(takeStreamLeaf(run, lane, id))} onNext={() => commit(nextStreamGroup(run))} />
      {!demo && !done && <p className={`merge-feedback ${run.feedback && run.mistakes ? "is-error" : ""}`} role="status">{run.feedback}</p>}
    </section>
    {!demo && !done && <GameFooter className="merge-footer"><GameHintButton disabled={busy || paused} aria-expanded={hint} onClick={() => { gameAudio.unlock(); playFeedback("hint"); setHint(value => !value); }} />
      {hint && <div className="merge-dialogue merge-hint"><Pig mood="thinking" /><p>{streamHint(run)}</p><button className="round-button" aria-label="Đóng gợi ý" onClick={() => setHint(false)}><X size={18} /></button></div>}
    </GameFooter>}
    {demo && <footer className="merge-controls"><div className="merge-dialogue"><Pig mood={done ? "celebrate" : "explaining"} /><p aria-live="polite">{frame.narration}</p></div>
      <div className="merge-playback"><button className="round-button" aria-label="Bước trước" disabled={cursor === 0} onClick={() => step(-1)}><SkipBack size={21} /></button>
        <button className="chunky-button button-purple" onClick={() => { gameAudio.unlock(); if (done) onPlay(); else { setMotionPaused(playing); setPlaying(value => !value); } }}>{playing && !done ? <Pause size={21} /> : <Play size={21} />} {done ? "Tự mình thử" : playing ? "Tạm dừng" : cursor === 0 ? "Bắt đầu" : "Tiếp tục"}</button>
        <button className="round-button" aria-label={done ? "Xem lại từ đầu" : "Bước tiếp"} onClick={() => done ? reset() : step(1)}>{done ? <RotateCcw size={21} /> : <SkipForward size={21} />}</button></div>
      <div className="merge-demo-progress"><span>{cursor + 1}/{frames.length}</span><progress value={cursor} max={frames.length - 1} aria-label="Tiến trình demo" /><button className="lesson-speed-button" aria-label={`Tốc độ demo: ${speed}x. Bấm để đổi tốc độ`} onClick={() => onSpeedChange(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)}>{speed}x</button></div>
    </footer>}
    {!demo && done && <VictoryCelebration title="Dòng suối đã có thứ tự!" className="merge-victory" stars={run.mistakes === 0 ? 3 : run.mistakes <= 3 ? 2 : 1} difficulty={difficulty} onReplay={reset} onHarder={value => onChange(streamArray(value), value)} onMap={onChooseMap}><strong>{run.score.toLocaleString("vi-VN")} điểm</strong><p>{shown.moves} lá đã ghép · {run.mistakes} lần thử lại</p></VictoryCelebration>}
    {settings && <dialog className="modal lesson-settings" ref={dialog} aria-label="Tùy chọn Merge Sort" onCancel={event => { event.preventDefault(); setSettings(false); }}><div className="modal-header"><h2>Chuyến đi của bạn</h2><button className="round-button" aria-label="Đóng" onClick={() => setSettings(false)}><X size={21} /></button></div>
      <button className="lesson-sound-toggle" aria-pressed={sound} onClick={() => onSoundChange(!sound)}>{sound ? <Volume2 size={21} /> : <VolumeX size={21} />}<span>Hiệu ứng âm thanh</span><b>{sound ? "Bật" : "Tắt"}</b></button><HapticsToggle />
      <p className="stream-settings-help">Tự so sánh hai lá đầu nhánh ở mọi mức. Khó có số âm, số trùng; bằng nhau lấy nhánh trái trước. Mọi mức đều không giới hạn thời gian.</p>
      <label className="setting-label" htmlFor="merge-level">Mảng mẫu</label><select id="merge-level" className="setting-select" value={difficulty} onChange={event => { const value = event.target.value as Difficulty; onChange(streamArray(value), value); }}>{Object.entries(LEVELS).map(([id, value]) => <option key={id} value={id}>{value.label} · {value.count} lá</option>)}</select>
      <form onSubmit={applyInput}><label className="setting-label" htmlFor="merge-array">Mảng của bạn</label><input id="merge-array" className="custom-input" value={draft} onChange={event => { setDraft(event.target.value); setError(""); }} aria-invalid={!!error} aria-describedby="merge-input-help" /><p id="merge-input-help" className="lesson-input-help">Từ 2 đến 8 số nguyên từ −99 đến 99, cách nhau bằng dấu phẩy hoặc khoảng trắng.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="lesson-setting-actions"><button type="submit">Dùng mảng này</button><button type="button" onClick={reset}>Chơi lại từ đầu</button></div></form><button className="chunky-button button-green modal-primary" onClick={() => setSettings(false)}>Tiếp tục</button>
    </dialog>}
  </GameLayout>;
}

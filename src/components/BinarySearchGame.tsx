import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowRight, Check, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { BINARY_LEVELS, BINARY_RECORD_KEY, binaryGuess, binaryMiddle, binaryRoundPoints, createBinaryLesson, createBinarySearch, type BinaryState } from "../engine/binarySearch";
import { GameFooter, GameHeader, GameHintButton, GameLayout, GameStats } from "./GameHud";
import { useDemoMotionSpeed, useDemoPlayback } from "./useDemoPlayback";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import HapticsToggle from "./HapticsToggle";
import Pig from "./Pig";
import World from "./World";
import VictoryCelebration from "./VictoryCelebration";

type Props = { mode: "demo" | "play"; sound: boolean; speed: number; onBack: () => void; onPlay: () => void; onChooseMap: () => void; onComplete: () => void; onSoundChange: (sound: boolean) => void; onSpeedChange: (speed: number) => void };
function readRecord() { try { const n = Number(localStorage.getItem(BINARY_RECORD_KEY)); return Number.isFinite(n) && n > 0 ? n : 0; } catch { return 0; } }
export default function BinarySearchGame({ mode, sound, speed, onBack, onPlay, onChooseMap, onComplete, onSoundChange, onSpeedChange }: Props) {
  const demo = mode === "demo";
  const frames = useMemo(createBinaryLesson, []);
  const [round, setRound] = useState(0);
  const [state, setState] = useState(() => createBinarySearch(10));
  const current = useRef(state);
  const [score, setScore] = useState(0);
  const [failures, setFailures] = useState(0);
  const [record, setRecord] = useState(readRecord);
  const [cursor, setCursor] = useState(0);
  const frame = frames[cursor];
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [settings, setSettings] = useState(false);
  const [hint, setHint] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<number | null>(null);
  const awarded = useRef(false);
  const shown = demo ? frames[cursor].state : state;
  const done = demo ? cursor === frames.length - 1 : state.phase === "won";
  const lost = !demo && state.phase === "lost";
  const victory = !demo && done && round === BINARY_LEVELS.length - 1;
  const paused = settings || !visible;
  const root = useDemoMotionSpeed(demo ? speed : 1);
  const focusedCell = useRef<HTMLButtonElement>(null);
  useDemoPlayback(cursor, frame.duration, speed, demo && playing && !paused && !done, () => setCursor(n => Math.min(n + 1, frames.length - 1)));
  useEffect(() => {
    const handle = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handle);
    return () => { document.removeEventListener("visibilitychange", handle); gameAudio.stop(); stopHaptics(); };
  }, []);
  useEffect(() => { if (paused || !sound) gameAudio.stop(); if (paused) stopHaptics(); }, [paused, sound]);
  useEffect(() => { if (demo && cursor > 0 && !paused) gameAudio.play(done ? "finish" : "scan"); }, [demo, cursor, paused, done]);
  useEffect(() => {
    if (demo) focusedCell.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }, [demo, cursor]);
  useEffect(() => {
    if (!settings) return;
    const previous = document.activeElement as HTMLElement;
    const panel = dialog.current;
    panel?.showModal();
    return () => { panel?.close(); previous?.focus(); };
  }, [settings]);
  useEffect(() => {
    if (!victory || awarded.current) return;
    awarded.current = true; onComplete(); playFeedback("finish");
  }, [victory, onComplete]);
  useEffect(() => {
    if (!victory || score <= record) return;
    setRecord(score);
    try { localStorage.setItem(BINARY_RECORD_KEY, String(score)); } catch { /* Play without storage. */ }
  }, [victory, score, record]);
  useEffect(() => {
    if (pendingFocus.current === null) return;
    const buttons = Array.from(grid.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
    const value = pendingFocus.current;
    buttons.sort((a, b) => Math.abs(Number(a.dataset.value) - value) - Math.abs(Number(b.dataset.value) - value));
    buttons[0]?.focus(); pendingFocus.current = null;
  }, [state]);

  function reset() {
    const next = createBinarySearch(10);
    current.current = next; setState(next); setRound(0); setScore(0); setFailures(0); setCursor(0); setPlaying(false); setHint(false); awarded.current = false; gameAudio.stop();
  }
  function guess(value: number, keyboard: boolean) {
    if (demo || paused) return;
    gameAudio.unlock();
    const next = binaryGuess(current.current, value);
    if (!next) return;
    if (keyboard) pendingFocus.current = value;
    current.current = next; setState(next); setHint(false);
    if (next.phase === "won") { setScore(n => n + binaryRoundPoints(next)); playFeedback("correct"); }
    else if (next.phase === "lost") { setFailures(n => n + 1); playFeedback("retry"); }
    else playFeedback("keep");
  }
  function nextRound() {
    if (!done || victory) return;
    const next = createBinarySearch(BINARY_LEVELS[round + 1]);
    current.current = next; setState(next); setRound(n => n + 1); setHint(false); gameAudio.play("enter");
    grid.current?.parentElement?.scrollTo({ top: 0, behavior: "instant" });
  }
  function retry() {
    const next = createBinarySearch(BINARY_LEVELS[round]);
    current.current = next; setState(next); setHint(false);
  }
  function step(delta: number) { setPlaying(false); setCursor(n => Math.max(0, Math.min(frames.length - 1, n + delta))); }
  function navigateGrid(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(grid.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    if (index === -1) return;
    event.preventDefault();
    const columns = getComputedStyle(grid.current!).gridTemplateColumns.split(" ").filter(track => parseFloat(track) > 0).length;
    const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    let next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : index + direction * (event.key === "ArrowUp" || event.key === "ArrowDown" ? columns : 1);
    const advance = event.key === "End" ? -1 : event.key === "Home" ? 1 : direction;
    while (next >= 0 && next < buttons.length && buttons[next].disabled) next += advance;
    buttons[next]?.focus();
  }
  const title = demo ? frames[cursor].title : lost ? `Hết lượt! Số bí mật là ${state.secret}` : done ? `Đúng rồi, số ${state.secret}!` : state.direction === "higher" ? `Số bí mật lớn hơn ${state.last}` : state.direction === "lower" ? `Số bí mật nhỏ hơn ${state.last}` : "Số bí mật nằm ở đâu?";
  const remaining = shown.high - shown.low + 1;
  const hintText = `Dãy số đã sắp từ nhỏ đến lớn và được đọc từ trái sang phải, rồi đến hàng tiếp theo. Hãy chọn số giữa khoảng ${shown.low}–${shown.high}, chẳng hạn ${binaryMiddle(shown)}. Nếu số bí mật lớn hơn số vừa đoán, bỏ toàn bộ các số bên trái; nếu nhỏ hơn thì bỏ bên phải. Xuống hàng không làm thay đổi thứ tự.`;

  return <GameLayout ref={root} play className={`binary-world binary-${mode}`} data-phase={shown.phase} data-kind={demo ? frame.kind : undefined} data-frame={demo ? cursor : undefined}>
    {!demo && <World />}
    <GameHeader title="Binary Search" onBack={onBack} onSettings={() => setSettings(true)} />
    <GameStats className="binary-stats" score={demo ? undefined : score}>
      {!demo && <span>Chặng {round + 1} / {BINARY_LEVELS.length}</span>}<span>{shown.count} ô</span><span>{demo ? `${shown.guesses.length} lần so sánh` : `${shown.limit - shown.guesses.length} lượt còn lại`}</span>
    </GameStats>
    <section className="binary-content">
      <h2 role="status" aria-live="polite">{title}</h2>
      <p className="binary-range">{demo ? done ? `Kết quả: chỉ số ${frame.resultIndex}` : `Tìm số ${shown.secret} · Chỉ số ${shown.low - 1}–${shown.high - 1}` : done ? `${shown.guesses.length} lần đoán · +${binaryRoundPoints(shown)} điểm` : lost ? "Chọn giữa khoảng còn lại để tiết kiệm lượt nhé." : `Khoảng còn lại: ${shown.low}–${shown.high} · ${remaining} ô`}</p>
      <div className="binary-board-scroll" tabIndex={0} aria-label="Bảng số tăng dần, có thể cuộn dọc">
        <div className="binary-grid" ref={grid} style={{ "--count": shown.count } as CSSProperties} aria-label={`Dãy số đã sắp xếp từ 1 đến ${shown.count}`} onKeyDown={navigateGrid}>
          {Array.from({ length: shown.count }, (_, i) => i + 1).map(value => {
            const eliminated = value < shown.low || value > shown.high;
            const guessed = shown.guesses.includes(value);
            const found = shown.phase === "won" && value === shown.secret;
            const reveal = lost && value === shown.secret;
            const focused = demo && !done && value === frame.focus;
            return <button ref={focused ? focusedCell : undefined} key={value} className={`binary-tile ${eliminated ? "is-eliminated" : ""} ${guessed ? "is-guessed" : ""} ${found || reveal ? "is-found" : ""} ${focused ? "is-middle" : ""}`} data-value={value} aria-label={`Số ${value}${demo ? `, chỉ số ${value - 1}` : ""}${found ? ", tìm thấy" : eliminated ? ", đã loại" : ""}`} disabled={demo || paused || shown.phase !== "playing" || eliminated} onClick={event => guess(value, event.detail === 0)}><strong>{value}</strong>{demo && <small className="binary-index" aria-hidden="true">{value - 1}</small>}{focused && <span className="binary-focus-pointer" aria-hidden="true" />}{found && <Check size={16} aria-hidden="true" />}</button>;
          })}
        </div>
      </div>
      {demo && <div className="binary-step-explanation">{frame.kind === "compare" && <div className="binary-step-math" aria-label={`${shown.secret} ${frame.relation === ">" ? "lớn hơn" : frame.relation === "<" ? "nhỏ hơn" : "bằng"} ${frame.focus}`}><strong>{shown.secret}</strong><span>{frame.relation}</span><strong>{frame.focus}</strong></div>}</div>}
      {!demo && <div className="binary-round-actions">{lost ? <button className="chunky-button button-purple" onClick={retry}><RotateCcw size={20} /> Thử lại</button> : done && !victory ? <button className="chunky-button button-green" onClick={nextRound}>Chặng tiếp theo · {BINARY_LEVELS[round + 1]} ô <ArrowRight size={20} /></button> : null}</div>}
    </section>
    {demo ? <><div className="lesson-narrator binary-dialogue"><div className="lesson-pig-stage"><Pig mood={frame.mood} /></div><div className="lesson-narration"><p aria-live="polite">{frame.narration}</p></div></div>
      <footer className="lesson-controls binary-controls"><div className="lesson-control-buttons"><button className="round-button" aria-label="Bước trước" disabled={cursor === 0} onClick={() => step(-1)}><SkipBack size={23} fill="currentColor" /></button>
        {done ? <button className="chunky-button button-green" onClick={onPlay}>Tự mình thử <ArrowRight size={22} /></button> : <button className="chunky-button button-purple" onClick={() => { gameAudio.unlock(); setPlaying(v => !v); }}>{playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}{playing ? "Tạm dừng" : cursor === 0 ? "Bắt đầu" : "Tiếp tục"}</button>}
        <button className="round-button" aria-label={done ? "Xem lại từ đầu" : "Bước tiếp"} onClick={() => done ? (setCursor(0), setPlaying(false)) : step(1)}>{done ? <RotateCcw size={23} /> : <SkipForward size={23} fill="currentColor" />}</button>
      </div><div className="binary-demo-progress"><span>{cursor + 1} / {frames.length}</span><progress value={cursor} max={frames.length - 1} aria-label="Tiến trình demo" /><button className="lesson-speed-button" aria-label={`Tốc độ demo: ${speed}x`} onClick={() => onSpeedChange(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)}>{speed}x</button></div></footer></>
      : !victory && <GameFooter className="binary-footer">{hint && <div className="binary-hint"><Pig mood="thinking" /><p>{hintText}</p><button className="round-button" aria-label="Đóng gợi ý" onClick={() => setHint(false)}><X size={18} /></button></div>}<GameHintButton aria-expanded={hint} onClick={() => { setHint(v => !v); playFeedback("hint"); }} /></GameFooter>}
    {victory && <VictoryCelebration title="Hoàn thành Binary Search!" className="binary-victory" stars={failures === 0 ? 3 : failures <= 2 ? 2 : 1} difficulty="hard" onReplay={reset} onHarder={() => {}} onMap={onChooseMap}><strong>{score.toLocaleString("vi-VN")} điểm</strong><p>Từ 10 đến 100 ô, bạn đã biết thu hẹp từng nửa!</p><p>Kỷ lục {Math.max(record, score).toLocaleString("vi-VN")} điểm</p></VictoryCelebration>}
    {settings && <dialog ref={dialog} className="binary-settings" aria-labelledby="binary-settings-title" onCancel={event => { event.preventDefault(); setSettings(false); }}><div className="binary-settings-heading"><h2 id="binary-settings-title">Chuyến đi của bạn</h2><button className="round-button" aria-label="Đóng tùy chọn" onClick={() => setSettings(false)}><X size={20} /></button></div><button className="lesson-sound-toggle" aria-pressed={sound} onClick={() => onSoundChange(!sound)}>{sound ? <Volume2 size={20} /> : <VolumeX size={20} />} Hiệu ứng âm thanh <b>{sound ? "Bật" : "Tắt"}</b></button><HapticsToggle /><button className="chunky-button button-purple" onClick={() => { reset(); setSettings(false); }}><RotateCcw size={19} /> Chơi lại từ 10 ô</button></dialog>}
  </GameLayout>;
}

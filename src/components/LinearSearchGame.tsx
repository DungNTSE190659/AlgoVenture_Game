import { useDemoPlayback, useDemoMotionSpeed } from "./useDemoPlayback";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check, Pause, Play, RotateCcw, Search, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { createLinearSearch, createLinearSearchLesson, linearSearchMove, type LinearAction, type LinearState } from "../engine/linearSearch";
import { GameFooter, GameHeader, GameHintButton, GameLayout, GameStats } from "./GameHud";
import Pig from "./Pig";
import World from "./World";
import HapticsToggle from "./HapticsToggle";
import VictoryCelebration from "./VictoryCelebration";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";

const challenges = [
  { values: [8, 3, 6, 2, 5], target: 6, title: "Theo dấu con số", description: "Cùng Buta tìm số 6. Bắt đầu ở chỉ số 0, xét từng ô từ trái sang phải." },
  { values: [4, 7, 4, 9, 2], target: 4, title: "Gặp đúng số là dừng", description: "Có hai số 4. Hãy tìm vị trí xuất hiện đầu tiên, rồi dừng lại nhé!" },
  { values: [5, 2, 8, 1, 6], target: 7, title: "Nếu không tìm thấy?", description: "Tìm số 7. Chỉ kết luận không có sau khi đã xét hết các ô." },
];
type Challenge = typeof challenges[number];
type Props = {
  mode: "demo" | "play"; sound: boolean; speed: number;
  onBack: () => void; onPlay: () => void; onChooseMap: () => void; onComplete: () => void;
  onSoundChange: (enabled: boolean) => void; onSpeedChange: (speed: number) => void;
};
function ready(challenge: Challenge) {
  const initial = createLinearSearch(challenge.values, challenge.target);
  return linearSearchMove(initial, "inspect") ?? initial;
}

export default function LinearSearchGame({ mode, sound, speed, onBack, onPlay, onChooseMap, onComplete, onSoundChange, onSpeedChange }: Props) {
  const demo = mode === "demo";
  const [round, setRound] = useState(0);
  const [custom, setCustom] = useState<Challenge | null>(null);
  const challenge = custom ?? challenges[round];
  const [state, setState] = useState<LinearState>(() => ready(challenges[0]));
  const frames = useMemo(() => createLinearSearchLesson(challenge.values, challenge.target), [challenge]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [settings, setSettings] = useState(false);
  const [hint, setHint] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [wrong, setWrong] = useState(false);
  const [draft, setDraft] = useState(challenge.values.join(", "));
  const [targetDraft, setTargetDraft] = useState(String(challenge.target));
  const [error, setError] = useState("");
  const finished = useRef(false);
  const settingsDialog = useRef<HTMLDialogElement>(null);
  const currentTile = useRef<HTMLButtonElement>(null);
  const shown = demo ? frames[cursor].state : state;
  const done = demo ? cursor === frames.length - 1 : shown.phase === "done";
  const victory = !demo && done && (custom !== null || round === challenges.length - 1);
  const paused = settings || !visible;
  const value = shown.items[shown.cursor]?.value;
  const last = shown.cursor === shown.items.length - 1;
  const score = Math.max(0, (total + state.comparisons) * 100 - mistakes * 25);

  useEffect(() => {
    const handle = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handle);
    return () => { document.removeEventListener("visibilitychange", handle); gameAudio.stop(); stopHaptics(); };
  }, []);
  useEffect(() => {
    if (paused || !sound) gameAudio.stop();
    if (paused) stopHaptics();
  }, [paused, sound]);
  useDemoPlayback(cursor, 1800, speed, demo && playing && !paused && !done, () => setCursor(value => Math.min(value + 1, frames.length - 1)));
  const motionRoot = useDemoMotionSpeed(demo ? speed : 1);
  useEffect(() => { if (demo && cursor > 0 && !paused) gameAudio.play(frames[cursor].cue); }, [demo, cursor, frames, paused]);
  useEffect(() => {
    if (!victory || finished.current) return;
    finished.current = true;
    playFeedback("finish");
    onComplete();
  }, [victory, onComplete]);
  useEffect(() => {
    currentTile.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }, [shown.cursor]);
  useEffect(() => {
    if (!settings) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = settingsDialog.current;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, [settings]);

  function restart(next = challenges[0], nextRound = 0, isCustom = false) {
    gameAudio.stop(); stopHaptics();
    setCustom(isCustom ? next : null); setRound(nextRound); setState(ready(next));
    setCursor(0); setPlaying(false); setFeedback(""); setWrong(false); setHint(false);
    setMistakes(0); setTotal(0); finished.current = false;
  }
  function reject(text: string) {
    setWrong(true); setFeedback(text); setMistakes(n => n + 1); playFeedback("retry");
  }
  function answer(action: LinearAction) {
    if (demo || done || paused) return;
    gameAudio.unlock(); setHint(false);
    const next = linearSearchMove(state, action);
    if (!next) {
      reject(value === challenge.target
        ? `${value} bằng số cần tìm ${challenge.target}. Chọn Đã tìm thấy và dừng ở đây nhé!`
        : action === "found" ? `${value} khác ${challenge.target}. Mình cần xét tiếp từ trái sang phải.`
        : "Chưa xét hết mảng. Hãy kiểm tra từng ô trước khi kết luận nhé.");
      return;
    }
    setState(next.phase === "inspect" ? linearSearchMove(next, "inspect") ?? next : next);
    setWrong(false);
    setFeedback(next.phase === "done" ? next.result === -1 ? "Đã xét hết mảng: không có số cần tìm. Kết quả là −1." : `Tìm thấy ${challenge.target} ở chỉ số ${next.result}. Dừng ngay, không cần xét các ô còn lại!` : `${value} khác ${challenge.target}. Buta tiến đúng một ô sang phải.`);
    playFeedback(next.phase === "done" ? "correct" : "keep");
  }
  function nextRound() {
    const next = round + 1;
    setTotal(n => n + state.comparisons); setRound(next); setState(ready(challenges[next]));
    setFeedback(""); setWrong(false); setHint(false); playFeedback("enter");
  }
  function moveFrame(delta: number) { setPlaying(false); setCursor(c => Math.max(0, Math.min(frames.length - 1, c + delta))); }
  const narration = demo ? frames[cursor].narration : done ? feedback : hint
    ? `Ô chỉ số ${shown.cursor} chứa ${value}. ${value === challenge.target ? "Hai số bằng nhau: đã tìm thấy, dừng tại đây." : last ? "Đây là ô cuối và hai số khác nhau. Có thể kết luận không có trong mảng." : "Hai số khác nhau: chọn Xét ô tiếp, không bỏ qua ô nào."}`
    : "Buta đi từ trái sang phải, so sánh từng ô với số cần tìm. Chỉ số của ô đầu tiên là 0.";

  return <GameLayout ref={motionRoot} play={!demo} className={`linear-world ${demo ? "linear-demo algorithm-demo" : "linear-play"}`}>
    {!demo && <World />}
    <GameHeader title="Linear Search" play={!demo} onBack={onBack} onSettings={() => { setDraft(challenge.values.join(", ")); setTargetDraft(String(challenge.target)); setError(""); setSettings(true); }} />
    <GameStats className="linear-stats" score={demo ? undefined : score}>
      {!demo && <span>{custom ? "Mảng của bạn" : `Chặng ${round + 1} / 3`}</span>}
      <span>{shown.comparisons} lần so sánh</span>
    </GameStats>
    <section className="linear-content">
      {(demo || done) && <h2>{demo ? frames[cursor].title : shown.result === -1 ? "Không tìm thấy" : "Đã tìm thấy!"}</h2>}
      <div className="linear-target"><Search size={24} /><span>Tìm số</span><strong>{challenge.target}</strong></div>
      <div className="linear-board-scroll"><div className="linear-board" style={{ "--count": shown.items.length } as CSSProperties} aria-label="Mảng tìm kiếm">{shown.items.map((item, index) => {
        const active = index === shown.cursor && !done;
        const found = done && shown.result === index;
        const visited = shown.inspected.includes(index) && !active && !found;
        return <div className="linear-slot" key={item.id}>
          <button ref={active ? currentTile : undefined} className={`linear-tile ${active ? "is-current" : ""} ${found ? "is-found" : ""} ${visited ? "is-visited" : ""}`} aria-current={active ? "step" : undefined} aria-label={`Ô chỉ số ${index}, giá trị ${item.value}`} disabled={demo || done || paused} onClick={() => {
            if (index !== state.cursor) reject(`Buta đang xét chỉ số ${state.cursor}. Linear Search phải đi lần lượt, không nhảy qua ô nhé.`);
            else { setWrong(false); setFeedback(`So sánh ${item.value} với ${challenge.target}, rồi chọn kết luận bên dưới.`); gameAudio.play("scan"); }
          }}><strong>{item.value}</strong>{active && <span className="linear-pointer" aria-hidden="true" />}{found && <Check size={18} />}</button>
          <small>{index}</small>
        </div>;
      })}</div></div>
      {!demo && !done && <div className="linear-actions">
        <button className="chunky-button button-green" disabled={paused} onClick={() => answer("found")}><Check size={19} /> Đã tìm thấy</button>
        <button className="chunky-button button-purple" disabled={paused} onClick={() => answer(last ? "absent" : "continue")}>{last ? "Không có trong mảng" : "Xét ô tiếp"}<ArrowRight size={19} /></button>
      </div>}
      {!demo && <p className={`linear-feedback ${wrong ? "is-error" : ""}`} role="status">{feedback}</p>}
      {done && <div className="linear-result">Kết quả: <b>{shown.result}</b> · {shown.comparisons} lần so sánh{shown.result !== -1 && <span> · ô thứ {(shown.result ?? 0) + 1}</span>}</div>}
      {!demo && done && !victory && <button className="chunky-button button-green" onClick={nextRound}>Chặng tiếp theo <ArrowRight size={20} /></button>}
    </section>
    {demo ? <div className="demo-panel"><div className="lesson-narrator linear-dialogue"><div className="lesson-pig-stage"><Pig mood={done ? "celebrate" : "explaining"} /></div><div className="lesson-narration"><p aria-live="polite">{narration}</p></div></div>
      <footer className="lesson-controls linear-controls">
        <div className="lesson-control-buttons linear-playback">
          <button className="round-button" aria-label="Bước trước" disabled={cursor === 0} onClick={() => moveFrame(-1)}><SkipBack size={21} /></button>
          {done ? <button className="chunky-button button-green" onClick={() => { gameAudio.stop(); onPlay(); }}>Tự mình thử <ArrowRight size={22} /></button> : <button className="chunky-button button-purple" onClick={() => { gameAudio.unlock(); setPlaying(v => !v); }}>{playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}{playing ? "Tạm dừng" : cursor === 0 ? "Bắt đầu" : "Tiếp tục"}</button>}
          <button className="round-button" aria-label={done ? "Xem lại từ đầu" : "Bước tiếp"} onClick={() => done ? restart(challenge, round, !!custom) : moveFrame(1)}>{done ? <RotateCcw size={23} /> : <SkipForward size={23} fill="currentColor" />}</button>
        </div>
        <div className="linear-demo-progress"><span>{cursor + 1} / {frames.length}</span><progress value={cursor} max={frames.length - 1} aria-label="Tiến trình demo" /><button className="lesson-speed-button" aria-label={`Tốc độ demo: ${speed}x`} onClick={() => onSpeedChange(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)}>{speed}x</button></div>
      </footer></div> : !victory && <GameFooter className="linear-footer">
        {hint && <div className="linear-hint"><Pig mood="thinking" /><p>{narration}</p><button className="round-button" aria-label="Đóng gợi ý" onClick={() => setHint(false)}><X size={18} /></button></div>}
        <GameHintButton aria-expanded={hint} onClick={() => { setHint(v => !v); playFeedback("hint"); }} />
      </GameFooter>}
    {victory && <VictoryCelebration title="Hoàn thành Linear Search!" className="linear-victory" stars={mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1} difficulty="hard" onReplay={() => custom ? restart(custom, 0, true) : restart()} onHarder={() => {}} onMap={onChooseMap}>
      <strong>{score.toLocaleString("vi-VN")} điểm</strong><p>{custom ? "Bạn đã tìm kiếm trên mảng của mình!" : "Đã vượt qua 3 chặng: tìm thấy, dừng sớm và không tìm thấy."}</p><p>Linear Search hoàn thành · Binary Search đã mở khóa.</p>
    </VictoryCelebration>}
    {settings && <dialog className="linear-settings" ref={settingsDialog} aria-labelledby="linear-settings-title" onCancel={event => { event.preventDefault(); setSettings(false); }}>
      <div className="linear-settings-head"><h2 id="linear-settings-title">Chuyến đi của bạn</h2><button className="round-button" aria-label="Đóng tùy chọn" onClick={() => setSettings(false)}><X size={20} /></button></div>
      <button className="lesson-sound-toggle" aria-pressed={sound} onClick={() => onSoundChange(!sound)}>{sound ? <Volume2 size={20} /> : <VolumeX size={20} />} Hiệu ứng âm thanh <b>{sound ? "Bật" : "Tắt"}</b></button><HapticsToggle />
      <form onSubmit={event => {
        event.preventDefault();
        const tokens = draft.trim().split(/[,\s]+/);
        const values = tokens.map(Number); const target = Number(targetDraft);
        if (!draft.trim() || values.length < 2 || values.length > 9 || tokens.some(token => !/^-?\d+$/.test(token)) || values.some(n => !Number.isInteger(n) || Math.abs(n) > 99) || !/^-?\d+$/.test(targetDraft.trim()) || Math.abs(target) > 99) { setError("Nhập 2–9 số nguyên và giá trị cần tìm từ −99 đến 99."); return; }
        restart({ values, target, title: "Con đường của bạn", description: "Tìm lần xuất hiện đầu tiên. Nếu không có, hãy xét hết mảng." }, 0, true); setSettings(false);
      }}>
        <div className="linear-settings-grid"><label htmlFor="linear-array">Mảng của bạn</label><input id="linear-array" className="custom-input" value={draft} onChange={event => setDraft(event.target.value)} aria-invalid={!!error} /><label htmlFor="linear-target">Giá trị cần tìm</label><input id="linear-target" className="custom-input" inputMode="numeric" value={targetDraft} onChange={event => setTargetDraft(event.target.value)} aria-invalid={!!error} /></div>
        <p>2–9 số nguyên từ −99 đến 99, cách nhau bằng dấu phẩy hoặc khoảng trắng. Có thể dùng số trùng nhau.</p>
        {error && <p className="linear-settings-error" role="alert">{error}</p>}
        <button className="chunky-button button-green" type="submit">Dùng mảng này</button>
      </form>
      <button className="linear-restart" onClick={() => { restart(); setSettings(false); }}><RotateCcw size={17} /> Chơi lại từ đầu</button>
    </dialog>}
  </GameLayout>;
}

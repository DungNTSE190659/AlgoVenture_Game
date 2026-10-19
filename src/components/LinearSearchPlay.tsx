import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check, Heart, Play, RotateCcw, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { claimSearchRun, createSearchOrders, createSearchRun, RUN_RECORD_KEY, scanSearchRun, searchReward, startSearchRun, type SearchOrder, type SearchRun } from "../engine/linearRun";
import { GameFooter, GameHeader, GameHintButton, GameLayout, GameStats } from "./GameHud";
import { useDemoPlayback } from "./useDemoPlayback";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import Pig from "./Pig";
import World from "./World";
import HapticsToggle from "./HapticsToggle";
import VictoryCelebration from "./VictoryCelebration";

type Props = { sound: boolean; onBack: () => void; onChooseMap: () => void; onComplete: () => void; onSoundChange: (value: boolean) => void };
function readRecord() {
  try { const value = Number(localStorage.getItem(RUN_RECORD_KEY)); return Number.isFinite(value) && value > 0 ? value : 0; } catch { return 0; }
}

export default function LinearSearchPlay({ sound, onBack, onChooseMap, onComplete, onSoundChange }: Props) {
  const [orders, setOrders] = useState(() => createSearchOrders());
  const [custom, setCustom] = useState(false);
  const [round, setRound] = useState(0);
  const [run, setRun] = useState(() => createSearchRun(orders[0]));
  const current = useRef(run);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [record, setRecord] = useState(readRecord);
  const [hint, setHint] = useState(false);
  const [settings, setSettings] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [draft, setDraft] = useState("");
  const [targetDraft, setTargetDraft] = useState("");
  const [error, setError] = useState("");
  const settingsDialog = useRef<HTMLDialogElement>(null);
  const defeatDialog = useRef<HTMLDialogElement>(null);
  const completed = useRef(false);
  const revealedAt = useRef(performance.now());
  const activeTile = useRef<HTMLButtonElement>(null);
  const boardViewport = useRef<HTMLDivElement>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const paused = settings || hint || !visible || !assetsReady;
  const won = run.phase === "won";
  const failed = run.phase === "missed";
  const defeated = lives === 0;
  const finished = won && round === orders.length - 1;
  const scanning = run.phase === "scanning";

  function commit(next: SearchRun) {
    const old = current.current;
    if (old === next) return;
    current.current = next; setRun(next);
    if (next.cursor !== old.cursor) { revealedAt.current = performance.now(); setComparisons(n => n + 1); gameAudio.play("scan"); }
    if (next.phase === "missed") {
      setLives(n => n - 1); setStreak(0); playFeedback("retry");
      setFeedback(old.cursor >= 0 && old.order.values[old.cursor] === old.order.target
        ? `Đã đi qua số ${old.order.target} đầu tiên ở ô ${old.cursor}. Lần sau chốt ngay tại đó nhé!`
        : next.order.values.indexOf(next.order.target) === -1 && old.phase === "end"
          ? "Không có số cần tìm. Chọn Không có trong mảng sau khi dò hết nhé."
          : "Chốt chưa đúng. Cần gặp đúng số đầu tiên, hoặc dò hết rồi mới kết luận không có.");
    } else if (next.phase === "won") {
      const reward = searchReward(streak, next.result === -1 ? next.order.interval : performance.now() - revealedAt.current, next.order.interval);
      setScore(n => n + reward.points); setStreak(n => n + 1); playFeedback("correct");
      setFeedback(`${next.result === -1 ? "Đúng! Không có trong mảng." : `Chốt đúng ô ${next.result}!`}${reward.quick ? " Nhanh tay!" : ""} +${reward.points} điểm`);
    }
  }
  useDemoPlayback(round * 10000 + attempt * 100 + run.cursor, run.order.interval, 1, scanning && !paused && !defeated, () => commit(scanSearchRun(current.current)));
  useEffect(() => {
    let mounted = true;
    Promise.all(["/assets/cards/sage-back.webp", "/assets/cards/ivory-front.webp"].map(src => new Promise<void>(resolve => {
      const image = new Image(); image.onload = () => resolve(); image.onerror = () => resolve(); image.src = src;
    }))).then(() => { if (mounted) setAssetsReady(true); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    const handle = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handle);
    return () => { document.removeEventListener("visibilitychange", handle); gameAudio.stop(); stopHaptics(); };
  }, []);
  useEffect(() => {
    if (paused || !sound) gameAudio.stop();
    if (paused) stopHaptics();
  }, [paused, sound]);
  useEffect(() => {
    if (!paused) return;
    const started = performance.now();
    return () => { revealedAt.current += performance.now() - started; };
  }, [paused]);
  useEffect(() => { activeTile.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" }); }, [run.cursor]);
  useEffect(() => {
    const area = boardViewport.current;
    if (!area) return;
    let width = area.clientWidth;
    const observer = new ResizeObserver(() => {
      if (area.clientWidth === width) return;
      width = area.clientWidth;
      activeTile.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!settings) return;
    const previous = document.activeElement as HTMLElement;
    const panel = settingsDialog.current;
    panel?.showModal();
    return () => { panel?.close(); previous?.focus(); };
  }, [settings]);
  useEffect(() => {
    if (!defeated) return;
    const panel = defeatDialog.current;
    panel?.showModal();
    panel?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => panel?.close();
  }, [defeated]);
  useEffect(() => {
    if (!finished || completed.current) return;
    completed.current = true; onComplete(); playFeedback("finish");
  }, [finished, onComplete]);
  useEffect(() => {
    if ((!finished && !defeated) || score <= record) return;
    setRecord(score);
    try { localStorage.setItem(RUN_RECORD_KEY, String(score)); } catch { /* Play without storage. */ }
  }, [finished, defeated, score, record]);

  function reset(nextOrders = createSearchOrders(), isCustom = false) {
    const next = createSearchRun(nextOrders[0]);
    current.current = next; setRun(next); setOrders(nextOrders); setCustom(isCustom); setRound(0);
    setLives(3); setScore(0); setStreak(0); setComparisons(0); setAttempt(n => n + 1);
    setFeedback(""); setHint(false); completed.current = false; gameAudio.stop(); stopHaptics();
  }
  function retry() {
    const next = createSearchRun(run.order);
    current.current = next; setRun(next); setAttempt(n => n + 1); setFeedback("");
  }
  function start() {
    if (paused || defeated || current.current.phase !== "ready") return;
    gameAudio.unlock(); setFeedback(""); commit(scanSearchRun(startSearchRun(current.current)));
  }
  function claim(absent = false) {
    if (paused || defeated) return;
    gameAudio.unlock(); commit(claimSearchRun(current.current, absent));
  }
  function nextRound() {
    if (!won || finished) return;
    const next = createSearchRun(orders[round + 1]);
    current.current = next; setRun(next); setRound(n => n + 1); setFeedback(""); setHint(false); playFeedback("enter");
  }
  const hintText = "Bấm Bắt đầu dò. Bài lật từ trái sang phải rồi xuống hàng; lá đã xem sẽ úp lại. Gặp số cần tìm đầu tiên, bấm Chốt lá này hoặc chạm lá đang mở trước khi nó úp. Dò hết không gặp thì chọn Không có trong bài. Chốt sai hoặc bỏ lỡ mất 1 tim. Chặng sau nhiều lá hơn và mở ngắn hơn.";

  return <GameLayout play className="linear-world linear-play linear-arcade linear-card-game" data-phase={run.phase} data-paused={paused}>
    <World />
    <GameHeader title="Linear Search" onBack={onBack} onSettings={() => { setDraft(run.order.values.join(", ")); setTargetDraft(String(run.order.target)); setError(""); setSettings(true); }} />
    <GameStats score={score} className="linear-stats">
      <span>{custom ? "Tự luyện" : `Chặng ${round + 1} / ${orders.length}`}</span>
      <span className="linear-hearts" role="img" aria-label={`${lives} tim còn lại`}>{[0, 1, 2].map(i => <Heart key={i} size={19} fill={i < lives ? "currentColor" : "none"} className={i >= lives ? "heart-empty" : ""} />)}</span>
      {streak >= 2 && <span className="linear-combo" role="status">Combo ×{Math.min(4, 1 + Math.floor(streak / 2))}</span>}
    </GameStats>
    <section className="linear-content">
      <div className="linear-target"><span className="linear-target-suit" aria-hidden="true">♠</span><span>Tìm lá</span><strong>{run.order.target}</strong></div>
      <div className="linear-board-scroll" ref={boardViewport}><div className="linear-board" style={{ "--count": run.order.values.length, "--scan-time": `${run.order.interval}ms` } as CSSProperties} aria-label="Mảng tìm kiếm">{run.order.values.map((value, index) => {
        const visited = index <= run.cursor;
        const active = index === run.cursor && scanning;
        const found = won && run.result === index;
        const revealed = active || found || (failed && index === run.cursor);
        return <div className="linear-slot" key={`${round}:${attempt}:${index}`}>
          <button ref={active ? activeTile : undefined} className={`linear-tile linear-card ${revealed ? "is-open" : "is-covered"} ${active ? "is-current" : ""} ${visited && !active && !found ? "is-visited" : ""} ${found ? "is-found" : ""}`} aria-current={active ? "step" : undefined} aria-label={revealed ? `Lá chỉ số ${index}, giá trị ${value}` : `Lá chỉ số ${index}, ${visited ? "đã xem" : "chưa mở"}`} disabled={!active || paused} onClick={() => claim()}>
            <span className="linear-card-inner" aria-hidden="true"><span className="linear-card-back" /><span className="linear-card-front">{revealed && <><span className="card-corner card-corner-top"><b>{value}</b><i>♠</i></span><span className="card-center"><span>♠</span><strong className="card-value">{value}</strong><span>♠</span></span><span className="card-corner card-corner-bottom"><b>{value}</b><i>♠</i></span></>}</span></span>
            {active && <><span className="linear-pointer" aria-hidden="true" /><span key={`${attempt}:${index}`} className="linear-scan-meter" aria-hidden="true" /></>}{found && <span className="linear-card-result" aria-hidden="true">✓</span>}{visited && !active && !found && <span className="linear-card-result is-miss" aria-hidden="true">×</span>}
          </button><small>{index}</small>
        </div>;
      })}
      </div></div>
      <div className="linear-actions">
        {run.phase === "ready" ? <button className="chunky-button button-purple" onClick={start} disabled={paused}><Play size={21} fill="currentColor" /> Bắt đầu dò</button>
          : failed ? <button className="chunky-button button-purple" onClick={retry} disabled={defeated}><RotateCcw size={20} /> Thử lại chặng này</button>
          : won ? !finished && <button className="chunky-button button-green" onClick={nextRound}>Chặng tiếp theo <ArrowRight size={20} /></button>
          : <><button className="chunky-button button-green" disabled={paused || !scanning} onClick={() => claim()}><Check size={20} /> Chốt lá này</button><button className="linear-absent" disabled={paused} onClick={() => claim(true)}>Không có trong bài</button></>}
      </div>
      <p className={`linear-feedback ${failed ? "is-error" : won ? "is-success" : ""}`} role="status">{feedback || (run.phase === "ready" && round === 0 ? "Gặp đúng lá đầu tiên, chốt ngay!" : run.phase === "end" ? "Đã xem hết bài. Có số cần tìm không?" : "")}</p>
      {won && <div className="linear-result">Kết quả: <b>{run.result}</b> · {run.comparisons} lần so sánh</div>}
    </section>
    {!finished && <GameFooter className="linear-footer">
      {hint && <div className="linear-hint"><Pig mood="thinking" /><p>{hintText}</p><button className="round-button" aria-label="Đóng gợi ý" onClick={() => setHint(false)}><X size={18} /></button></div>}
      <GameHintButton aria-expanded={hint} onClick={() => { setHint(v => !v); playFeedback("hint"); }} />
    </GameFooter>}
    {finished && <VictoryCelebration title="Hoàn thành Linear Search!" className="linear-victory" stars={lives} difficulty="hard" onReplay={() => reset(custom ? orders : createSearchOrders(), custom)} onHarder={() => {}} onMap={onChooseMap}>
      <strong>{score.toLocaleString("vi-VN")} điểm</strong><p>{custom ? "Đã hoàn thành mảng của bạn!" : "Vượt qua 6 chặng dò số!"} · {comparisons} lần so sánh</p><p><Trophy size={17} /> Kỷ lục {Math.max(record, score).toLocaleString("vi-VN")} điểm</p>
    </VictoryCelebration>}
    {defeated && <dialog ref={defeatDialog} className="linear-defeat" aria-labelledby="linear-defeat-title" onCancel={event => event.preventDefault()}>
      <Pig mood="oops" /><h2 id="linear-defeat-title">Hết tim rồi!</h2><p>{score.toLocaleString("vi-VN")} điểm · Chặng {round + 1}/{orders.length}</p><p>Kỷ lục: {Math.max(record, score).toLocaleString("vi-VN")} điểm</p><button className="chunky-button button-purple" onClick={() => reset(custom ? orders : createSearchOrders(), custom)}><RotateCcw size={19} /> Chơi lại</button><button className="linear-absent" onClick={onBack}>Về bản đồ</button>
    </dialog>}
    {settings && <dialog ref={settingsDialog} className="linear-settings" aria-labelledby="linear-settings-title" onCancel={event => { event.preventDefault(); setSettings(false); }}>
      <div className="linear-settings-head"><h2 id="linear-settings-title">Chuyến đi của bạn</h2><button className="round-button" aria-label="Đóng tùy chọn" onClick={() => setSettings(false)}><X size={20} /></button></div>
      <button className="lesson-sound-toggle" aria-pressed={sound} onClick={() => onSoundChange(!sound)}>{sound ? <Volume2 size={20} /> : <VolumeX size={20} />} Hiệu ứng âm thanh <b>{sound ? "Bật" : "Tắt"}</b></button><HapticsToggle />
      <form onSubmit={event => {
        event.preventDefault(); const tokens = draft.trim().split(/[,\s]+/); const values = tokens.map(Number); const target = Number(targetDraft);
        if (!draft.trim() || values.length < 2 || values.length > 24 || tokens.some(token => !/^-?\d+$/.test(token)) || values.some(n => Math.abs(n) > 99) || !/^-?\d+$/.test(targetDraft.trim()) || Math.abs(target) > 99) { setError("Nhập 2–24 số nguyên và giá trị cần tìm từ −99 đến 99."); return; }
        reset([{ values, target, interval: 1150 }], true); setSettings(false);
      }}>
        <div className="linear-settings-grid"><label htmlFor="linear-array">Mảng của bạn</label><input id="linear-array" value={draft} onChange={event => setDraft(event.target.value)} aria-invalid={!!error} /><label htmlFor="linear-target">Giá trị cần tìm</label><input id="linear-target" value={targetDraft} onChange={event => setTargetDraft(event.target.value)} inputMode="numeric" aria-invalid={!!error} /></div>
        <p>Tự luyện với 2–24 số nguyên từ −99 đến 99, cách nhau bằng dấu phẩy hoặc khoảng trắng.</p>{error && <p className="linear-settings-error" role="alert">{error}</p>}<button className="chunky-button button-green" type="submit">Dùng mảng này</button>
      </form><button className="linear-restart" onClick={() => { reset(); setSettings(false); }}><RotateCcw size={17} /> Chơi lượt mới</button>
    </dialog>}
  </GameLayout>;
}

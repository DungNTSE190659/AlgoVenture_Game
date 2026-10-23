import { useDemoPlayback, useDemoMotionSpeed } from "./useDemoPlayback";
import { GameHeader, GameLayout } from "./GameHud";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  Lightbulb,
  Star,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  bubbleResults,
  bubbleChallengeMove,
  skipOrderedBubblePairs,
  createBubble,
  createBubbleLesson,
  type BubbleState,
} from "../engine/bubbleSort";
import { createArray, type Difficulty } from "../engine/quicksort";
import { LEVELS } from "../engine/gameConfig";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import HapticsToggle from "./HapticsToggle";
import Pig from "./Pig";
import BubbleRunBoard from "./BubbleRunBoard";
import VictoryCelebration from "./VictoryCelebration";
import { activateTouchButton } from "./touchActivation";

type Props = {
  mode: "demo" | "play";
  input: number[];
  difficulty: Difficulty;
  sound: boolean;
  speed: number;
  onBack: () => void;
  onChooseMap: () => void;
  onPlay: () => void;
  onDemo: () => void;
  onComplete: () => void;
  onChange: (values: number[], level: Difficulty) => void;
  onSoundChange: (sound: boolean) => void;
  onSpeedChange: (speed: number) => void;
};
function createBubbleArray(level: Difficulty) {
  const values = createArray(level);
  if (level === "hard") values[0] = -values[0];
  return values;
}
export default function BubbleGame({
  mode,
  input,
  difficulty,
  sound,
  speed,
  onBack,
  onChooseMap,
  onPlay,
  onDemo,
  onComplete,
  onChange,
  onSoundChange,
  onSpeedChange,
}: Props) {
  const demo = mode === "demo";
  const frames = useMemo(() => createBubbleLesson(input), [input]);
  const [cursor, setCursor] = useState(0);
  const [state, setState] = useState(() => skipOrderedBubblePairs(createBubble(input)));
  const [playing, setPlaying] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [cameraMoving, setCameraMoving] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [settings, setSettings] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [hint, setHint] = useState(false);
  const [lastStep, setLastStep] = useState("");
  const [recapMode, setRecapMode] = useState<"auto" | null>(null);
  const [recapReplay, setRecapReplay] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const lost = !demo && mistakes >= 5;
  const results = bubbleResults(state, mistakes, true);
  const actionLock = useRef(false);
  const [feedback, setFeedback] = useState("");
  const [outcome, setOutcome] = useState<"correct" | "retry" | "">("");
  const [draft, setDraft] = useState(input.join(", "));
  const [error, setError] = useState("");
  const frame = frames[cursor];
  const shown = demo ? frame.state : state;
  const done = demo ? frame.kind === "done" : submitted;
  const comparing = demo
    ? frame.kind === "compare" ||
      frame.kind === "reason" ||
      frame.kind === "move"
    : shown.phase === "compare";
  const paused = settings || !visible || (demo && motionPaused);
  useEffect(() => {
    if (recapMode !== "auto" || paused || done || lost) return;
    const timer = window.setTimeout(() => setRecapMode(null), 3000);
    return () => window.clearTimeout(timer);
  }, [recapMode, lastStep, recapReplay, paused, done, lost]);
  const finished = useRef(false);
  const lastCue = useRef(-1);
  useLayoutEffect(() => {
    const moved = camera.current.pair !== shown.pair || camera.current.pass !== shown.pass;
    camera.current = { pair: shown.pair, pass: shown.pass };
    if (!demo && moved) {
      lock.current = true; setCameraMoving(true);
      setFeedback(""); setOutcome("");
    }
  }, [demo, shown.pair, shown.pass]);
  useEffect(() => {
    if (!cameraMoving || paused) return;
    const timer = setTimeout(() => { setCameraMoving(false); lock.current = false; }, 470);
    return () => clearTimeout(timer);
  }, [cameraMoving, paused]);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => {
      document.removeEventListener("visibilitychange", handler);
      gameAudio.stop();
      stopHaptics();
    };
  }, []);
  useEffect(() => {
    if (paused || !sound) gameAudio.stop();
    if (paused) stopHaptics();
  }, [paused, sound]);
  useDemoPlayback(cursor, frame.duration, speed, demo && playing && !paused && !done, () => setCursor(value => Math.min(value + 1, frames.length - 1)));
  const motionRoot = useDemoMotionSpeed(demo ? speed : 1);
  useEffect(() => {
    if (!demo || paused || cursor === 0 || lastCue.current === cursor) return;
    gameAudio.play(
      frame.kind === "move"
        ? frame.title.startsWith("Đổi")
          ? "swap"
          : "keep"
        : frame.kind === "done"
          ? "finish"
          : frame.kind === "pass"
            ? "correct"
            : "scan",
    );
    lastCue.current = cursor;
  }, [demo, cursor, paused, frame.kind, frame.title]);
  useEffect(() => {
    if (demo || !done || finished.current) return;
    finished.current = true;
    playFeedback("finish");
    onComplete();
  }, [demo, done, onComplete]);
  const a = shown.items[shown.pair]?.value,
    b = shown.items[shown.pair + 1]?.value;
  function rejectStep() {
    setRecapMode(null);
    actionLock.current = true;
    setHint(false);
    setMistakes(value => value + 1);
    setOutcome("retry");
    setFeedback("Chưa đúng bước. Hãy thử tiếp nhé!");
    playFeedback("retry");
  }
  function acceptStep(next: BubbleState) {
    const swapped = next.swaps > state.swaps;
    setLastStep(swapped
      ? `Bạn đã đổi ${a} và ${b} thành ${b}, ${a}. Cặp này đúng rồi!`
      : `Bạn đã giữ nguyên ${a} và ${b}. Cặp này đúng rồi!`);
    setRecapMode("auto");
    setState(skipOrderedBubblePairs(next));
    setHint(false);
    setFeedback("");
    setOutcome("");
    // Guard against duplicate clicks before React commits the next step.
    actionLock.current = true;
  }
  useEffect(() => {
    if (!lost) actionLock.current = false;
  }, [state, mistakes, lost]);
  function moveBubble(id: number, target: number) {
    if (demo || paused || done || lost || actionLock.current) return;
    const from = state.items.findIndex(item => item.id === id);
    if (from === target || target < 0 || target >= state.items.length) return;
    gameAudio.unlock();
    const next = bubbleChallengeMove(state, id, target);
    if (!next) { rejectStep(); return; }
    acceptStep(next);
    playFeedback("bubble-swap");
  }
  function checkArrangement() {
    if (demo || paused || done || lost || actionLock.current) return;
    gameAudio.unlock();
    if (state.phase === "done") {
      actionLock.current = true;
      setSubmitted(true);
    } else rejectStep();
  }
  function moveFrame(delta: number) {
    gameAudio.unlock();
    gameAudio.stop();
    setPlaying(false);
    setMotionPaused(false);
    setCursor((v) => Math.max(0, Math.min(frames.length - 1, v + delta)));
  }
  function reset() {
    gameAudio.stop();
    finished.current = false;
    actionLock.current = false;
    setSubmitted(false);
    setLastStep("");
    setRecapMode(null);
    setMistakes(0);
    setState(skipOrderedBubblePairs(createBubble(input)));
    setCursor(0);
    setPlaying(false);
    setMotionPaused(false);
    setHint(false);
    setFeedback("");
    setOutcome("");
    setSettings(false);
  }
  const title = demo ? frame.title : "";
  const hintText = state.phase === "done"
    ? "Bạn đã xét xong các cặp theo Bubble Sort. Bấm Kết thúc thuật toán để nộp bài nhé!"
    : `Lượt ${state.pass}, xét ô ${state.pair + 1} và ${state.pair + 2}: ${a} và ${b}. ` + (a > b
      ? `${a} lớn hơn ${b}. Đưa ${b} sang trái và ${a} sang phải bằng cách đổi chỗ hai số cạnh nhau này.`
      : `${a === b ? "Hai số bằng nhau" : `${a} nhỏ hơn ${b}`}, nên không đổi chỗ. Cặp này được tự động bỏ qua.`);
  return (
    <GameLayout ref={motionRoot} play={!demo}
      className={`bubble-world ${demo ? "bubble-demo" : "bubble-play"}`}
      data-busy={false}
      onPointerDownCapture={(event) => {
        touchStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUpCapture={(event) => {
        if (
          event.pointerType !== "touch" ||
          !touchStart.current ||
          Math.hypot(
            event.clientX - touchStart.current.x,
            event.clientY - touchStart.current.y,
          ) > 8
        )
          return;
        const button = (event.target as Element).closest<HTMLButtonElement>(
          "button",
        );
        if (!button || button.disabled) return;
        const box = button.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          return;
        // Captured drags can suppress the next native touch click in Chromium.
        event.preventDefault();
        activateTouchButton(button);
      }}
    >
      {!demo && <World />}
      <GameHeader title="Bubble Sort" className="bubble-header" play={!demo} onBack={onBack} onSettings={() => { gameAudio.unlock(); setSettings(true); }}
        beforeSettings={!demo && !done && !lost ? <button className="round-button bubble-header-hint" aria-label="Buta gợi ý" title="Buta gợi ý" aria-expanded={hint}
          onClick={() => {
            gameAudio.unlock();
            playFeedback("hint");
            setRecapMode(null);
            setHint(!hint);
            setFeedback("");
            setOutcome("");
          }}><Lightbulb size={22} /></button> : undefined} />
      <section className="bubble-content">
        {demo && (
          <div className="bubble-topline">
            <span className="bubble-pass">Lượt {shown.pass}</span>
            <span>{shown.comparisons} lần so sánh</span>
            <span>{shown.swaps} lần đổi chỗ</span>
          </div>
        )}
        {title && (demo || !done) && <h2 aria-live="polite">{title}</h2>}
        <p className="bubble-task">
          {demo ? "Sắp xếp từ bé đến lớn" : done
            ? "Tất cả bong bóng đã xếp từ bé đến lớn."
            : "Kéo đổi chỗ từng cặp từ trái sang phải. Cặp đã đúng thứ tự được tự động bỏ qua."}
        </p>
        {demo ? (
          <BubbleBoard state={shown} comparing={comparing} paused={paused} />
        ) : (
          <BubbleRunBoard
            state={shown}
            interactive={!paused && !done && !lost}
            paused={paused}
            onMove={moveBubble}
          />
        )}
        {demo && frame.kind === "reason" && (
          <div className="bubble-equation">
            <b>{a}</b>
            <span>{a > b ? ">" : a === b ? "=" : "<"}</span>
            <b>{b}</b>
            <strong>{a > b ? "Đổi chỗ" : "Giữ nguyên"}</strong>
          </div>
        )}
        {demo && frame.kind === "intro" && (
          <p className="bubble-rule">
            So sánh cặp cạnh nhau · Đổi khi trái lớn hơn phải
          </p>
        )}
        {!demo && !done && !lost && (
          <div className="bubble-action-area">
            <div className="bubble-step-actions">
              <button className="bubble-finish-button" disabled={paused} onClick={checkArrangement}>
                <Check size={18} /> Kết thúc thuật toán
              </button>
            </div>
            <p className={`bubble-feedback ${outcome === "retry" ? "is-error" : ""}`} role="status">{feedback}</p>
          </div>
        )}
        {!demo && !done && !lost && <div className="bubble-companion">
          <button className="bubble-buta-character" aria-label="Buta: nghe lại lời khen" aria-expanded={!!recapMode}
            onClick={() => {
              if (!lastStep) return;
              gameAudio.unlock();
              playFeedback("tap");
              setHint(false);
              setRecapMode("auto");
              setRecapReplay(value => value + 1);
            }}>
            <Pig mood={hint ? "thinking" : recapMode ? "proud" : "happy"} />
          </button>
          {hint ? <div className="bubble-hint">
            <p>{hintText}</p>
            <button className="round-button" aria-label="Đóng gợi ý" onClick={() => setHint(false)}><X size={18} /></button>
          </div> : recapMode && <div className="bubble-recap" role="status"><p>{lastStep}</p></div>}
        </div>}
        {!demo && done && (
          <VictoryCelebration
            className="bubble-victory"
            stars={results.stars}
            difficulty={difficulty}
            onReplay={reset}
            onHarder={(level) => onChange(createBubbleArray(level), level)}
            onMap={onChooseMap}
          >
            <BubbleResultSummary results={results} />
            <p>Bạn đã hoàn thành từng bước Bubble Sort!</p>
          </VictoryCelebration>
        )}
      </section>
      {demo ? (
        <>
          <div className="bubble-dialogue">
            <Pig mood={frame.mood} />
            <p aria-live="polite">{frame.narration}</p>
          </div>
          <footer className="bubble-controls">
            <div className="bubble-playback">
              <button
                className="round-button"
                disabled={cursor === 0}
                onClick={() => moveFrame(-1)}
                aria-label="Bước trước"
              >
                <SkipBack size={22} />
              </button>
              <button
                className="chunky-button button-purple"
                onClick={() => {
                  gameAudio.unlock();
                  if (done) onPlay();
                  else {
                    setMotionPaused(playing);
                    setPlaying((v) => !v);
                  }
                }}
              >
                {done ? (
                  <Play size={23} />
                ) : playing ? (
                  <Pause size={23} />
                ) : (
                  <Play size={23} />
                )}{" "}
                {done
                  ? "Tự mình thử"
                  : playing
                    ? "Tạm dừng"
                    : cursor === 0
                      ? "Bắt đầu"
                      : "Tiếp tục"}
              </button>
              <button
                className="round-button"
                onClick={() => (done ? reset() : moveFrame(1))}
                aria-label={done ? "Xem lại từ đầu" : "Bước tiếp"}
              >
                {done ? <RotateCcw size={22} /> : <SkipForward size={22} />}
              </button>
            </div>
            <div className="bubble-step-status">
              <span>
                {cursor + 1} / {frames.length}
              </span>
              <progress
                value={cursor}
                max={frames.length - 1}
                aria-label="Tiến trình demo"
              />
              <button
                className="lesson-speed-button"
                aria-label={`Tốc độ demo: ${speed}x. Bấm để đổi tốc độ`}
                onClick={() =>
                  onSpeedChange(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)
                }
              >
                {speed}x
              </button>
            </div>
          </footer>
        </>
      ) : null}
      {lost && <BubbleFailure results={results} onReplay={reset} onDemo={onDemo} onBack={onBack} />}
      {settings && (
        <BubbleSettings onClose={() => setSettings(false)}>
          <button
            className="lesson-sound-toggle"
            aria-pressed={sound}
            onClick={() => {
              gameAudio.unlock();
              onSoundChange(!sound);
            }}
          >
            {sound ? <Volume2 size={21} /> : <VolumeX size={21} />}
            <span>Hiệu ứng âm thanh</span>
            <b>{sound ? "Bật" : "Tắt"}</b>
          </button>
          <HapticsToggle />
          <label className="setting-label" htmlFor="bubble-level">
            Mảng mẫu
          </label>
          <select
            id="bubble-level"
            className="setting-select"
            value={difficulty}
            onChange={(event) => {
              const level = event.target.value as Difficulty;
              onChange(createBubbleArray(level), level);
            }}
          >
            {Object.entries(LEVELS).map(([key, level]) => (
              <option key={key} value={key}>
                {level.label} · {level.count} số
              </option>
            ))}
          </select>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const tokens = draft
                .trim()
                .replaceAll("−", "-")
                .split(/[,;\s]+/)
                .filter(Boolean);
              const values = tokens.map(Number);
              if (
                tokens.length < 2 ||
                tokens.length > 8 ||
                tokens.some((token) => !/^[-+]?\d+$/.test(token)) ||
                values.some((v) => !Number.isInteger(v) || v < -99 || v > 99)
              ) {
                setError("Nhập từ 2 đến 8 số nguyên từ −99 đến 99.");
                return;
              }
              onChange(values, difficulty);
            }}
          >
            <label className="setting-label" htmlFor="bubble-array">
              Mảng của bạn
            </label>
            <input
              id="bubble-array"
              className="custom-input"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setError("");
              }}
              aria-invalid={!!error}
            />
            <p className="lesson-input-help">
              Từ 2 đến 8 số nguyên từ −99 đến 99, cách nhau bằng dấu phẩy hoặc
              khoảng trắng.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="lesson-setting-actions">
              <button type="submit">Dùng mảng này</button>
              <button type="button" onClick={reset}>
                Chơi lại từ đầu
              </button>
            </div>
          </form>
          <button
            className="chunky-button button-green modal-primary"
            onClick={() => setSettings(false)}
          >
            Tiếp tục
          </button>
        </BubbleSettings>
      )}
    </GameLayout>
  );
}

function BubbleSettings({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      className="modal lesson-settings"
      ref={ref}
      aria-label="Tùy chọn Bubble Sort"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-header">
        <h2>Chuyến đi của bạn</h2>
        <button className="round-button" onClick={onClose} aria-label="Đóng">
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function BubbleBoard({
  state,
  comparing,
  paused,
}: {
  state: BubbleState;
  comparing: boolean;
  paused: boolean;
}) {
  const activeIds = state.items
    .slice(state.pair, state.pair + 2)
    .map((item) => item.id);
  return (
    <div className="bubble-board-area">
      <div
        className="bubble-board"
        style={{ "--count": state.items.length } as CSSProperties}
        aria-label="Mảng Bubble Sort"
      >
        {comparing && (
          <div
            className="bubble-pair-window"
            style={{ left: `calc(var(--step) * ${state.pair} - 8px)` }}
            aria-hidden="true"
          >
            <span>Đang so sánh</span>
          </div>
        )}
        {state.items.map((item, index) => (
          <BubbleTile
            key={item.id}
            item={item}
            index={index}
            settled={index > state.end}
            active={comparing && activeIds.includes(item.id)}
            paused={paused}
          />
        ))}
      </div>
      <div className="bubble-legend">
        <span className="bubble-legend-current" /> Cặp đang xét{" "}
        <span className="bubble-legend-fixed" /> Đã đúng chỗ
      </div>
    </div>
  );
}

type TileProps = {
  item: Item;
  index: number;
  settled: boolean;
  active: boolean;
  paused: boolean;
};
function BubbleTile({ item, index, settled, active, paused }: TileProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const previous = useRef(index);
  const animation = useRef<Animation | null>(null);
  const pausedByUi = useRef(false);
  useLayoutEffect(() => {
    const node = ref.current,
      old = previous.current;
    previous.current = index;
    if (
      !node ||
      old === index ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const parent = node.parentElement!;
    const width = node.getBoundingClientRect().width;
    const stride =
      (parent.getBoundingClientRect().width - width) /
      (parent.querySelectorAll(".bubble-tile").length - 1);
    const dx = (old - index) * stride;
    animation.current?.cancel();
    pausedByUi.current = paused;
    animation.current = node.animate(
      [
        { transform: `translate(${dx}px,0)` },
        {
          transform: `translate(${dx * 0.5}px,${old < index ? -64 : 52}px) scale(1.07)`,
          offset: 0.5,
        },
        { transform: "translate(0,0)" },
      ],
      { duration: 1350, easing: "cubic-bezier(.35,0,.2,1)" },
    );
    if (paused) animation.current.pause();
  }, [index, paused]);
  useEffect(() => {
    if (paused && animation.current?.playState === "running") {
      animation.current.pause();
      pausedByUi.current = true;
    } else if (!paused && pausedByUi.current) {
      animation.current?.play();
      pausedByUi.current = false;
    }
  }, [paused]);
  useEffect(() => () => animation.current?.cancel(), []);
  return (
    <button
      ref={ref}
      className={`bubble-tile ${active ? "is-active" : ""} ${settled ? "is-settled" : ""}`}
      style={{ left: `calc(var(--step) * ${index})` }}
      disabled
      aria-label={`Khối ${item.value}, vị trí ${index + 1}`}
      data-bubble-id={item.id}
      data-value={item.value}
      data-index={index}
      data-active={active}
    >
      <span className="bubble-tile-shine" />
      <strong>{item.value}</strong>
      <small>{index + 1}</small>
      {settled && <Check size={19} className="bubble-fixed-check" />}
    </button>
  );
}

function BubbleFailure({ results, onReplay, onDemo, onBack }: { results: ReturnType<typeof bubbleResults>; onReplay: () => void; onDemo: () => void; onBack: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    title.current?.focus();
    gameAudio.stop();
    stopHaptics();
    return () => dialog.current?.close();
  }, []);
  return <dialog ref={dialog} className="victory-screen bubble-failure" aria-labelledby="bubble-failure-title" onCancel={event => event.preventDefault()}>
    <div className="bubble-failure-content">
      <h2 ref={title} tabIndex={-1} id="bubble-failure-title">Hết lượt thử rồi!</h2>
      <Pig mood="oops" />
      <div className="bubble-failure-stars" role="img" aria-label={`${results.stars} trên 3 sao`}>{[0, 1, 2].map(index => <Star key={index} fill={index < results.stars ? "currentColor" : "none"} aria-hidden="true" />)}</div>
      <strong>{results.stars} sao</strong>
      <BubbleResultSummary results={results} />
      <p>Bạn đã sai 5 lần. Hãy xem lại Demo để học lại quy luật Bubble Sort, rồi chơi lại nhé!</p>
      <button className="chunky-button button-purple" onClick={onDemo}><Play size={20} /> Xem lại Demo</button>
      <button className="chunky-button button-green" onClick={onReplay}><RotateCcw size={20} /> Chơi lại</button>
      <button className="bubble-finish-button" onClick={onBack}>Về bản đồ</button>
    </div>
  </dialog>;
}

function BubbleResultSummary({ results }: { results: ReturnType<typeof bubbleResults> }) {
  const percentage = (results.accuracy * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  return <div className="bubble-result-summary">
    <strong>Độ chính xác: {percentage}%</strong>
    <dl>
      <div><dt>Bước đã thực hiện</dt><dd>{results.steps}</dd></div>
      <div><dt>Bước đúng / sai</dt><dd>{results.correct} / {results.mistakes}</dd></div>
      <div><dt>Cặp đã so sánh</dt><dd>{results.comparisons}</dd></div>
      <div><dt>Lượt so sánh</dt><dd>{results.passes}</dd></div>
    </dl>
  </div>;
}

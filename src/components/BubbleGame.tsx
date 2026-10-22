import { useDemoPlayback, useDemoMotionSpeed } from "./useDemoPlayback";
import { GameHeader, GameStats, GameLayout, GameFooter, GameHintButton } from "./GameHud";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Check,
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
  bubbleMove,
  createBubble,
  createBubbleLesson,
  nextBubblePass,
  type BubbleState,
} from "../engine/bubbleSort";
import { createArray, type Difficulty, type Item } from "../engine/quicksort";
import { LEVELS } from "../engine/gameConfig";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import HapticsToggle from "./HapticsToggle";
import Pig from "./Pig";
import BubbleRunBoard from "./BubbleRunBoard";
import World from "./World";
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
  onComplete: () => void;
  onChange: (values: number[], level: Difficulty) => void;
  onSoundChange: (sound: boolean) => void;
  onSpeedChange: (speed: number) => void;
};
export default function BubbleGame({
  mode,
  input,
  difficulty,
  sound,
  speed,
  onBack,
  onChooseMap,
  onPlay,
  onComplete,
  onChange,
  onSoundChange,
  onSpeedChange,
}: Props) {
  const demo = mode === "demo";
  const frames = useMemo(() => createBubbleLesson(input), [input]);
  const [cursor, setCursor] = useState(0);
  const [state, setState] = useState(() => createBubble(input));
  const [playing, setPlaying] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [settings, setSettings] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [hint, setHint] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [outcome, setOutcome] = useState<"correct" | "retry" | "">("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [busy, setBusy] = useState<{
    pair: number;
    end: number;
    swap: boolean;
  } | null>(null);
  const [draft, setDraft] = useState(input.join(", "));
  const [error, setError] = useState("");
  const frame = frames[cursor];
  const shown = demo
    ? frame.state
    : busy
      ? { ...state, pair: busy.pair, end: busy.end, phase: "compare" as const }
      : state;
  const done = demo ? frame.kind === "done" : state.phase === "done" && !busy;
  const comparing = demo
    ? frame.kind === "compare" ||
      frame.kind === "reason" ||
      frame.kind === "move"
    : shown.phase === "compare";
  const paused = settings || !visible || (demo && motionPaused);
  const finished = useRef(false);
  const lock = useRef(false);
  const lastCue = useRef(-1);
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
    if (!busy || paused) return;
    const timer = setTimeout(
      () => {
        setBusy(null);
        lock.current = false;
      },
      busy.swap ? 500 : 280,
    );
    return () => clearTimeout(timer);
  }, [busy, paused]);
  useEffect(() => {
    if (demo || !done || finished.current) return;
    finished.current = true;
    playFeedback("finish");
    onComplete();
  }, [demo, done, onComplete]);
  const a = shown.items[shown.pair]?.value,
    b = shown.items[shown.pair + 1]?.value;
  function answer(swap: boolean) {
    if (demo || paused || lock.current || state.phase !== "compare")
      return false;
    setHasInteracted(true);
    gameAudio.unlock();
    const next = bubbleMove(state, swap);
    setHint(false);
    if (!next) {
      setOutcome("retry");
      setMistakes((v) => v + 1);
      setFeedback(
        swap
          ? a === b
            ? `Hai số đều bằng ${a}. Bấm Giữ nguyên để xét cặp tiếp theo nhé.`
            : `${a} nhỏ hơn ${b}, nên cặp này đã đúng thứ tự. Bấm Giữ nguyên để đi tiếp nhé.`
          : "Bong bóng bên trái lớn hơn. Kéo một trong hai bong bóng sang bong bóng còn lại để đổi chỗ nhé.",
      );
      playFeedback("retry");
      return false;
    }
    setOutcome("correct");
    setFeedback(swap ? "Đúng rồi! Bong bóng lớn hơn đã tiến sang phải." : "Đúng rồi! Hai số đã có thứ tự, mình giữ nguyên.");
    lock.current = true;
    setBusy({ pair: state.pair, end: state.end, swap });
    setState(next);
    playFeedback(swap ? "bubble-swap" : "keep");
    return true;
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
    lock.current = false;
    finished.current = false;
    setState(createBubble(input));
    setHasInteracted(false);
    setCursor(0);
    setPlaying(false);
    setMotionPaused(false);
    setBusy(null);
    setMistakes(0);
    setHint(false);
    setFeedback("");
    setOutcome("");
    setSettings(false);
  }
  const title = demo
    ? frame.title
    : done
      ? "Bạn đã làm được!"
      : busy
        ? busy.swap
          ? ""
          : "Giữ nguyên thứ tự"
        : state.phase === "pass"
          ? `${state.items[state.end + 1].value} đã về đúng chỗ`
          : "";
  const hintText =
    state.phase === "pass"
      ? "Sau một lượt đi từ trái sang phải, số lớn nhất của phần vừa xét đã về cuối. Lượt sau mình bỏ qua những ô màu xanh nhé."
      : a > b
        ? `${a} lớn hơn ${b}. Kéo ${a} sang phải qua ${b}, hoặc kéo ${b} sang trái qua ${a} để đổi chỗ. Khi kéo sang phải, bạn có thể giữ tay để đi qua nhiều hàng xóm nhé.`
        : a === b
          ? `Hai số cùng bằng ${a}, nên mình giữ nguyên thứ tự của chúng. Bấm Giữ nguyên để chuyển sang cặp tiếp theo nhé.`
          : `${a} nhỏ hơn ${b}, nên hai số đã đúng thứ tự từ bé đến lớn. Bấm Giữ nguyên để xét cặp tiếp theo, không cần đổi chỗ nhé.`;
  return (
    <GameLayout ref={motionRoot} play={!demo}
      className={`bubble-world ${demo ? "bubble-demo" : "bubble-play"}`}
      data-busy={!!busy}
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
      <GameHeader title="Bubble Sort" className="bubble-header" play={!demo} onBack={onBack} onSettings={() => { gameAudio.unlock(); setSettings(true); }} />
      {!demo && <GameStats className="bubble-topline" scoreClassName="bubble-score" score={Math.max(0, state.comparisons * 100 - mistakes * 25)}>
        <span>Lượt {shown.pass}</span>
        <span>{shown.comparisons} lần so sánh</span>
        <span>{shown.swaps} lần đổi chỗ</span>
      </GameStats>}
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
          {demo
            ? "Sắp xếp từ bé đến lớn"
            : done
              ? "Tất cả bong bóng đã xếp từ bé đến lớn."
              : busy
                ? ""
                : state.phase === "pass"
                  ? "Phần màu xanh đã xong. Lượt tiếp theo sẽ ngắn hơn."
                  : !hasInteracted
                    ? "Kéo để đổi chỗ, hoặc chọn Giữ nguyên nếu cặp đã đúng thứ tự."
                    : ""}
        </p>
        {demo ? (
          <BubbleBoard state={shown} comparing={comparing} paused={paused} />
        ) : (
          <BubbleRunBoard
            onInteract={() => setHasInteracted(true)}
            state={shown}
            interactive={!busy && !paused && !done && state.phase === "compare"}
            paused={paused}
            onPush={(id) => {
              const left = state.items[state.pair],
                right = state.items[state.pair + 1];
              if (id !== left?.id && id !== right?.id) return false;
              // Either bubble can request a swap; only the keep button requests no swap.
              return answer(true);
            }}
            onHandoff={() => { setOutcome("");
              setFeedback(
                "Cặp này đã đúng thứ tự. Thả tay rồi bấm Giữ nguyên để đi tiếp nhé.",
              ); }
            }
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
        {!demo && !done && shown.phase === "compare" && (
          <div className="bubble-action-area">
            <button
              className="bubble-keep-button"
              disabled={!!busy || paused}
              onClick={() => answer(false)}
            >
              <Check size={23} /> Giữ nguyên
            </button>
            <p
              key={`${state.comparisons}:${mistakes}`}
              className={`bubble-feedback ${outcome === "retry" ? "is-error" : outcome === "correct" ? "is-success" : ""}`}
              role="status"
            >
              {feedback}
            </p>
          </div>
        )}
        {!demo && state.phase === "pass" && !busy && (
          <button
            className="chunky-button button-green bubble-next-pass"
            onClick={() => {
              gameAudio.unlock();
              playFeedback("tap");
              setState(nextBubblePass(state));
              setFeedback("");
              setHint(false);
            }}
          >
            Lượt tiếp theo <Play size={20} />
          </button>
        )}
        {!demo && done && (
          <VictoryCelebration
            className="bubble-victory"
            stars={mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1}
            difficulty={difficulty}
            onReplay={reset}
            onHarder={(level) => onChange(createArray(level), level)}
            onMap={onChooseMap}
          >
            <strong>
              {Math.max(
                0,
                state.comparisons * 100 - mistakes * 25,
              ).toLocaleString("vi-VN")}{" "}
              điểm
            </strong>
            <p>
              {state.early
                ? "Một lượt không đổi chỗ: bạn đã biết dừng sớm!"
                : "Từng cặp nhỏ, cả mảng đã vào đúng chỗ!"}
            </p>
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
      ) : (
        !done && (
          <GameFooter className="bubble-play-footer">
            {hint && (
              <div className="bubble-hint">
                <Pig mood="thinking" />
                <p>{hintText}</p>
                <button
                  className="round-button"
                  aria-label="Đóng gợi ý"
                  onClick={() => setHint(false)}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <GameHintButton
              className="bubble-hint-button"
              disabled={!!busy}
              aria-expanded={hint}
              onClick={() => {
                gameAudio.unlock();
                playFeedback("hint");
                setHint((v) => !v);
              }}
            />
          </GameFooter>
        )
      )}
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
              onChange(createArray(level), level);
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

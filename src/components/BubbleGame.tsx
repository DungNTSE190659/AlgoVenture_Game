import { useDemoPlayback, useDemoMotionSpeed } from "./useDemoPlayback";
import { GameHeader, GameStats, GameLayout, GameFooter, GameHintButton } from "./GameHud";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
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
  const [cameraMoving, setCameraMoving] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [settings, setSettings] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [hint, setHint] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [outcome, setOutcome] = useState<"correct" | "retry" | "">("");
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
  const camera = useRef({ pair: shown.pair, pass: shown.pass });
  const finished = useRef(false);
  const lock = useRef(false);
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
          : "Số bên trái lớn hơn. Kéo một trong hai bạn sang bạn còn lại để đổi chỗ nhé.",
      );
      playFeedback("retry");
      return false;
    }
    setOutcome("correct");
    setFeedback(swap ? "Đúng rồi! Bạn mang số lớn hơn đã tiến sang phải." : "Đúng rồi! Hai số đã có thứ tự, mình giữ nguyên.");
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
  const title = demo ? frame.title : done ? "Bạn đã làm được!" : !busy && state.phase === "pass" ? `${state.items[state.end + 1].value} đã vào trại cuối cầu` : "Buta dọn đường";
  const hintText =
    state.phase === "pass"
      ? "Sau một lượt đi từ trái sang phải, số lớn nhất của phần vừa xét đã về cuối. Lượt sau mình bỏ qua các bạn đã vào trại nhé."
      : a > b
        ? `${a} lớn hơn ${b}. Kéo ${a} sang phải qua ${b}, hoặc kéo ${b} sang trái qua ${a} để đổi chỗ. Mỗi lần kéo xử lý một cặp; thả tay rồi tiếp tục với cặp mới nhé.`
        : a === b
          ? `Hai số cùng bằng ${a}, nên mình giữ nguyên thứ tự của chúng. Bấm Giữ nguyên để chuyển sang cặp tiếp theo nhé.`
          : `${a} nhỏ hơn ${b}, nên hai số đã đúng thứ tự từ bé đến lớn. Bấm Giữ nguyên để xét cặp tiếp theo, không cần đổi chỗ nhé.`;
  return (
    <GameLayout ref={motionRoot} play={!demo}
      className={`bubble-world ${demo ? "bubble-demo" : "bubble-play"}`}
      data-busy={!!busy || cameraMoving}
      data-phase={shown.phase}
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
        <p className="bubble-task">{demo ? "Sắp xếp từ bé đến lớn" : done ? "Cả đoàn đã xếp hàng ngay ngắn." : !busy && state.phase === "pass" ? "Các bạn đã vào trại sẽ nghỉ ở lượt sau." : "Kéo hai bạn để đổi chỗ, hoặc giữ nguyên và đi tiếp."}</p>
        <BubbleRunBoard
          onInteract={() => gameAudio.unlock()}
          state={shown}
          comparing={comparing}
          interactive={!demo && !busy && !cameraMoving && !paused && !hint && !done && state.phase === "compare"}
          paused={paused}
          onPush={id => {
            const left = state.items[state.pair], right = state.items[state.pair + 1];
            if (id !== left?.id && id !== right?.id) return false;
            return answer(true);
          }}
        />
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
              aria-label="Giữ nguyên"
              disabled={!!busy || cameraMoving || paused || hint}
              onClick={() => answer(false)}
            >
              <Check size={23} /> Giữ nguyên <small>· Đi tiếp</small>
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
            onHarder={(level) => onChange(createBubbleArray(level), level)}
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
              disabled={!!busy || cameraMoving}
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

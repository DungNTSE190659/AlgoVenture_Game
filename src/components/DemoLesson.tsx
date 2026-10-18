import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Pause,
  Play,
  RotateCcw,
  Settings,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { createLesson } from "../engine/lesson";
import { createArray, type Difficulty } from "../engine/quicksort";
import { LEVELS } from "../engine/gameConfig";
import LessonBoard from "./LessonBoard";
import Pig from "./Pig";
import { gameAudio } from "../audio/gameAudio";
import { lessonSound } from "../audio/lessonSound";

type Props = {
  input: number[];
  difficulty: Difficulty;
  onBack: () => void;
  onPlay: () => void;
  onChange: (array: number[], difficulty: Difficulty) => void;
  sound: boolean;
  onSoundChange: (enabled: boolean) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
};
export default function DemoLesson({
  input,
  difficulty,
  onBack,
  onPlay,
  onChange,
  sound,
  onSoundChange,
  speed,
  onSpeedChange,
}: Props) {
  const frames = useMemo(() => createLesson(input), [input]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [settings, setSettings] = useState(false);
  const [draft, setDraft] = useState(input.join(", "));
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(!document.hidden);
  const lastSoundFrame = useRef<number | null>(null);
  const frame = frames[cursor];
  const done = frame.kind === "DONE";
  useEffect(() => {
    if (settings || !visible || motionPaused || !sound) {
      gameAudio.stop();
      return;
    }
    if (cursor === 0 || lastSoundFrame.current === cursor) return;
    const cue = lessonSound(frame);
    if (cue && gameAudio.play(cue)) lastSoundFrame.current = cursor;
  }, [cursor, frame, settings, visible, motionPaused, sound]);
  useEffect(() => () => gameAudio.stop(), []);
  useEffect(() => {
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  useEffect(() => {
    if (!playing || settings || !visible || done) return;
    const timeout = setTimeout(
      () => setCursor((value) => Math.min(value + 1, frames.length - 1)),
      frame.duration / speed,
    );
    return () => clearTimeout(timeout);
  }, [
    playing,
    settings,
    visible,
    done,
    cursor,
    frame.duration,
    speed,
    frames.length,
  ]);
  useEffect(() => {
    if (done) setPlaying(false);
  }, [done]);
  function move(delta: number) {
    gameAudio.stop();
    gameAudio.unlock();
    setPlaying(false);
    setMotionPaused(false);
    setCursor((value) =>
      Math.max(0, Math.min(frames.length - 1, value + delta)),
    );
  }
  function toggle() {
    gameAudio.unlock();
    if (playing) gameAudio.stop();
    if (done) {
      setCursor(0);
      setPlaying(true);
      setMotionPaused(false);
      return;
    }
    if (cursor === 0 && !playing) setCursor(1);
    setPlaying(!playing);
    setMotionPaused(playing);
  }
  function toggleSound() {
    const next = !sound;
    gameAudio.setEnabled(next);
    if (next) {
      gameAudio.unlock();
      gameAudio.play("tap");
    }
    onSoundChange(next);
  }
  function applyArray() {
    const parts = draft
      .replaceAll("−", "-")
      .trim()
      .split(/[,;\s]+/)
      .filter(Boolean);
    const values = parts.map(Number);
    if (values.length < 2 || values.length > 8) {
      setError("Nhập từ 2 đến 8 số để mình làm mẫu nhé.");
      return;
    }
    if (
      values.some(
        (value) => !Number.isInteger(value) || value < -99 || value > 99,
      )
    ) {
      setError("Mỗi phần tử cần là số nguyên từ −99 đến 99 nhé.");
      return;
    }
    onChange(values, difficulty);
    gameAudio.stop();
    setSettings(false);
    setCursor(0);
    setPlaying(false);
    setMotionPaused(false);
    lastSoundFrame.current = null;
    setError("");
  }
  const equation =
    frame.equation ??
    (frame.kind === "SCAN" && frame.scanIndex !== null
      ? {
          a: frame.items[frame.scanIndex].value,
          b: frame.items[frame.pivotIndex].value,
          operator: "?" as const,
          result: "Nhỏ hơn hoặc bằng chốt?",
        }
      : null);
  return (
    <main
      className={`lesson-world lesson-state-${frame.kind.toLowerCase()}`}
      data-frame={cursor}
      data-kind={frame.kind}
      data-motion-paused={motionPaused || settings || !visible}
    >
      <header className="lesson-header">
        <button
          className="round-button"
          onClick={() => {
            gameAudio.stop();
            onBack();
          }}
          aria-label="Về bản đồ"
        >
          <ArrowLeft size={24} />
        </button>
        <h1>Quick Sort</h1>
        <button
          className="round-button"
          onClick={() => {
            gameAudio.stop();
            setSettings(true);
          }}
          aria-label="Tùy chọn"
        >
          <Settings size={23} />
        </button>
      </header>
      <section className="lesson-stage" aria-label="Bài học Quick Sort">
        <h2 className="lesson-title" key={`${cursor}-title`}>
          {frame.title}
        </h2>
        <LessonBoard
          frame={frame}
          motionPaused={motionPaused || settings || !visible}
        />
        <div className="lesson-explanation" key={`${cursor}-explanation`}>
          {equation ? (
            <div
              className={`lesson-comparison ${equation.operator === ">" ? "comparison-greater" : "comparison-less"}`}
              aria-label={`${equation.a} ${equation.operator} ${equation.b}`}
            >
              <div className="comparison-math">
                <span>{equation.a}</span>
                <strong>{equation.operator}</strong>
                <span className="comparison-pivot">{equation.b}</span>
              </div>
              <div className="lesson-decision-copy">
                <p>{equation.result}</p>
                {frame.nextSlot !== null && (
                  <span className="lesson-target-readout">
                    {frame.decision === "keep-small"
                      ? "Ô nhận số này"
                      : "Ô nhỏ tiếp theo"}
                    : <b>{frame.nextSlot}</b>
                  </span>
                )}
              </div>
            </div>
          ) : frame.split ? (
            <div
              className="lesson-split"
              aria-label="Hai mảng con sau phân hoạch"
            >
              <div className="split-branch split-left">
                <span>
                  {frame.split.left.length > 1
                    ? "Làm tiếp bên trái"
                    : frame.split.left.length === 1
                      ? "Chỉ một số, đã xong"
                      : "Không có số"}
                </span>
                <div>
                  {frame.split.left.map((value, index) => (
                    <i key={index}>{value}</i>
                  ))}
                </div>
              </div>
              <div className="split-pivot">
                <Check size={20} />
                <b>{frame.split.pivot}</b>
                <span>Đã đúng chỗ</span>
              </div>
              <div className="split-branch split-right">
                <span>
                  {frame.split.right.length > 1
                    ? "Làm tiếp bên phải"
                    : frame.split.right.length === 1
                      ? "Chỉ một số, đã xong"
                      : "Không có số"}
                </span>
                <div>
                  {frame.split.right.map((value, index) => (
                    <i key={index}>{value}</i>
                  ))}
                </div>
              </div>
            </div>
          ) : frame.kind === "INTRO" || frame.kind === "PIVOT" ? (
            <div className="lesson-principle">
              <span>Nhỏ hơn hoặc bằng</span>
              <ArrowLeft size={25} />
              <b>
                {frame.kind === "PIVOT"
                  ? frame.items[frame.pivotIndex].value
                  : "Chốt"}
              </b>
              <ArrowRight size={25} />
              <span>Lớn hơn</span>
            </div>
          ) : frame.kind === "FIXED" || done ? (
            <div className="lesson-fixed-message">
              <Check size={25} />
              <span>
                {done
                  ? "Không còn mảng con cần sắp xếp"
                  : "Chốt này sẽ không di chuyển nữa"}
              </span>
            </div>
          ) : frame.kind === "SWAP" && frame.nextSlot !== null ? (
            <div className="lesson-position-reason">
              <strong>
                Ô {frame.scanIndex ?? frame.pivotIndex}{" "}
                <span>
                  {(frame.scanIndex ?? frame.pivotIndex) === frame.nextSlot
                    ? "="
                    : "≠"}
                </span>{" "}
                ô {frame.nextSlot}
              </strong>
              <p>
                {frame.decision === "keep-pivot"
                  ? "Cùng ô nên giữ nguyên chốt"
                  : "Hai ô khác nhau nên đổi chỗ"}
              </p>
            </div>
          ) : (
            <div className="lesson-action-cue">
              {frame.kind === "FOCUS"
                ? "Lặp lại đúng cách vừa làm"
                : `Ô nhỏ tiếp theo: ${frame.nextSlot ?? frame.boundary + 1}`}
            </div>
          )}
        </div>
      </section>
      <div className="lesson-narrator">
        <div className="lesson-pig-stage">
          <Pig key={`${cursor}-${frame.mood}`} mood={frame.mood} />
        </div>
        <div className="lesson-narration" aria-live="polite">
          <p key={cursor}>{frame.narration}</p>
        </div>
      </div>
      <footer className="lesson-controls">
        <div className="lesson-control-buttons">
          <button
            className="round-button"
            onClick={() => move(-1)}
            disabled={cursor === 0}
            aria-label="Bước trước"
          >
            <SkipBack size={23} fill="currentColor" />
          </button>
          {done ? (
            <button
              className="chunky-button button-green"
              onClick={() => {
                gameAudio.stop();
                onPlay();
              }}
            >
              Tự mình thử <ArrowRight size={22} />
            </button>
          ) : (
            <button
              className="chunky-button button-purple"
              onClick={toggle}
              aria-label={playing ? "Tạm dừng demo" : "Phát demo"}
            >
              {playing ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} fill="currentColor" />
              )}
              {playing ? "Tạm dừng" : cursor === 0 ? "Bắt đầu" : "Tiếp tục"}
            </button>
          )}
          <button
            className="round-button"
            onClick={
              done
                ? () => {
                    gameAudio.stop();
                    setCursor(0);
                    setPlaying(false);
                    setMotionPaused(false);
                  }
                : () => move(1)
            }
            aria-label={done ? "Xem lại từ đầu" : "Bước tiếp"}
          >
            {done ? (
              <RotateCcw size={23} />
            ) : (
              <SkipForward size={23} fill="currentColor" />
            )}
          </button>
        </div>
        <div className="lesson-playback-status">
          <div
            className="lesson-progress step-indicator"
            aria-label={`Bước ${cursor + 1} trên ${frames.length}`}
          >
            <span>
              {cursor + 1} / {frames.length}
            </span>
            <div>
              <i
                style={{ width: `${(cursor / (frames.length - 1)) * 100}%` }}
              />
            </div>
          </div>
          <button
            className="lesson-speed-button"
            aria-label={`Tốc độ demo: ${speed}x. Bấm để đổi tốc độ`}
            title="Đổi tốc độ: 1x, 1.5x, 2x"
            onClick={() => {
              gameAudio.unlock();
              gameAudio.play("tap");
              onSpeedChange(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1);
            }}
          >
            {speed}x
          </button>
        </div>
      </footer>
      {settings && (
        <LessonSettings onClose={() => setSettings(false)}>
          <button
            className="lesson-sound-toggle"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {sound ? <Volume2 size={21} /> : <VolumeX size={21} />}
            <span>Hiệu ứng âm thanh</span>
            <b>{sound ? "Bật" : "Tắt"}</b>
          </button>
          <label className="setting-label" htmlFor="lesson-level">
            Mảng mẫu
          </label>
          <select
            id="lesson-level"
            className="setting-select"
            value={difficulty}
            aria-label="Cấp độ"
            onChange={(event) => {
              const level = event.target.value as Difficulty;
              onChange(createArray(level), level);
            }}
          >
            {Object.entries(LEVELS).map(([value, level]) => (
              <option key={value} value={value}>
                {level.label} · {level.count} số
              </option>
            ))}
          </select>
          <form
            className="lesson-custom-array"
            onSubmit={(event) => {
              event.preventDefault();
              applyArray();
            }}
          >
            <label className="setting-label" htmlFor="lesson-input">
              Hoặc dùng mảng của bạn
            </label>
            <input
              id="lesson-input"
              className="custom-input"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setError("");
              }}
              aria-label="Các phần tử của mảng"
              aria-describedby={
                error
                  ? "lesson-input-help lesson-input-error"
                  : "lesson-input-help"
              }
              aria-invalid={Boolean(error)}
            />
            <p id="lesson-input-help" className="lesson-input-help">
              Từ 2 đến 8 số nguyên trong khoảng từ −99 đến 99, cách nhau bằng
              dấu phẩy hoặc khoảng trắng.
            </p>
            {error && (
              <p id="lesson-input-error" className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="lesson-setting-actions">
              <button type="submit">Dùng mảng này</button>
              <button
                type="button"
                onClick={() => {
                  gameAudio.stop();
                  setCursor(0);
                  setPlaying(false);
                  setMotionPaused(false);
                  setSettings(false);
                }}
              >
                Xem lại từ đầu
              </button>
            </div>
          </form>
          <button
            className="chunky-button button-green modal-primary"
            onClick={() => setSettings(false)}
          >
            Tiếp tục xem <Play size={18} fill="currentColor" />
          </button>
        </LessonSettings>
      )}
    </main>
  );
}

function LessonSettings({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      className="modal lesson-settings"
      ref={ref}
      aria-label="Tùy chọn bài học"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-header">
        <h2>Nhịp học của bạn</h2>
        <button className="round-button" onClick={onClose} aria-label="Đóng">
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

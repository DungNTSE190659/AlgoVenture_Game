import { GameHeader, GameStats, GameLayout, GameFooter, GameHintButton } from "./GameHud";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Check,
  Compass,
  Flag,
  RotateCcw,
  Star,
  Undo2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  createExpedition,
  emptyArrangement,
  finishIsland,
  moveCargo,
  type Arrangement,
  type Island,
} from "../engine/expedition";
import { createArray, type Difficulty } from "../engine/quicksort";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import HapticsToggle from "./HapticsToggle";
import Pig from "./Pig";
import World from "./World";
import VictoryCelebration from "./VictoryCelebration";

type Destination = "pool" | "pivot" | "small" | "large";
type Props = {
  input: number[];
  difficulty: Difficulty;
  sound: boolean;
  onBack: () => void;
  onChooseMap: () => void;
  onComplete: () => void;
  onChange: (values: number[], level: Difficulty) => void;
  onSoundChange: (value: boolean) => void;
};
const levelNames = { easy: "Dễ", medium: "Vừa", hard: "Khó" };
const timeText = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
function readBest(level: Difficulty) {
  try {
    return Number(localStorage.getItem(`algoventure-expedition-${level}`)) || 0;
  } catch {
    return 0;
  }
}

export default function ExpeditionPlay({
  input,
  difficulty,
  sound,
  onBack,
  onChooseMap,
  onComplete,
  onChange,
  onSoundChange,
}: Props) {
  const [journey, setJourney] = useState(() => createExpedition(input));
  const [activeId, setActiveId] = useState<string | null>(() =>
    input.length > 1 ? "root" : null,
  );
  const [arrangement, setArrangement] = useState<Arrangement>(emptyArrangement);
  const [undo, setUndo] = useState<Arrangement[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [ghost, setGhost] = useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const [score, setScore] = useState(1000);
  const [streak, setStreak] = useState(0);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [hintedIslands, setHintedIslands] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [celebration, setCelebration] = useState<number | null>(null);
  const [settings, setSettings] = useState(false);
  const [draft, setDraft] = useState(input.join(", "));
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(60);
  const [visible, setVisible] = useState(!document.hidden);
  const [best, setBest] = useState(() => readBest(difficulty));
  const awarded = useRef(false);
  const drag = useRef<{
    id: number;
    pointerId: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const hintClose = useRef<HTMLButtonElement>(null);
  const hintTrigger = useRef<HTMLButtonElement>(null);
  // A touch release may also generate a compatibility click; check only once.
  const checkedByTouch = useRef(false);
  const world = useRef<HTMLElement>(null);
  const island = journey.islands.find((item) => item.id === activeId);
  const done = journey.islands.length === 0;
  const byId = (id: number) => journey.cargo.find((item) => item.id === id)!;
  const pivot = arrangement.pivot === null ? null : byId(arrangement.pivot);
  const pool =
    island?.cargo.filter(
      (id) =>
        id !== arrangement.pivot &&
        !arrangement.small.includes(id) &&
        !arrangement.large.includes(id),
    ) ?? [];
  const ready = pivot !== null && pool.length === 0;
  const blocked = settings || hint !== null || celebration !== null || done;

  useEffect(() => {
    const change = () => {
      setVisible(!document.hidden);
      if (document.hidden) { gameAudio.stop(); stopHaptics(); }
    };
    document.addEventListener("visibilitychange", change);
    return () => {
      document.removeEventListener("visibilitychange", change);
      gameAudio.stop();
      stopHaptics();
    };
  }, []);
  useEffect(() => {
    if (settings) { gameAudio.stop(); stopHaptics(); dialog.current?.showModal(); }
    else dialog.current?.close();
  }, [settings]);
  useEffect(() => {
    if (hint) hintClose.current?.focus();
  }, [hint]);
  useEffect(() => {
    if (!ghost) return;
    const scroll = setInterval(() => {
      const area = world.current;
      if (!area) return;
      const edge =
        ghost.y < 45 ? -12 : ghost.y > window.innerHeight - 45 ? 12 : 0;
      if (edge) area.scrollBy({ top: edge });
    }, 16);
    return () => clearInterval(scroll);
  }, [ghost]);
  useEffect(() => {
    if (celebration === null) return;
    const timer = setTimeout(() => {
      setCelebration(null);
      if (journey.islands.length === 1) activate(journey.islands[0]);
    }, 1100);
    return () => clearTimeout(timer);
  }, [celebration, journey.islands]);
  useEffect(() => {
    setRemaining(60);
  }, [activeId]);
  useEffect(() => {
    if (!island || blocked || !visible) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(),
        delta = (now - previous) / 1000;
      previous = now;
      setElapsed((value) => value + delta);
      if (difficulty === "hard")
        setRemaining((value) => Math.max(0, value - delta));
    }, 200);
    return () => clearInterval(timer);
  }, [activeId, blocked, visible, difficulty]);
  useEffect(() => {
    if (remaining > 0 || difficulty !== "hard" || done) return;
    setScore((value) => Math.max(0, value - 50));
    setMistakes((value) => value + 1);
    setStreak(0);
    setRemaining(60);
    setToast("Hết 60 giây. Trừ 50 điểm, bạn tiếp tục chia nhóm nhé.");
    playFeedback("retry");
  }, [remaining, difficulty, done]);
  useEffect(() => {
    if (!done || awarded.current) return;
    awarded.current = true;
    const record = Math.max(readBest(difficulty), score);
    setBest(record);
    try {
      localStorage.setItem(
        `algoventure-expedition-${difficulty}`,
        String(record),
      );
    } catch {
      /* Optional storage. */
    }
    playFeedback("finish");
    onComplete();
  }, [done, score, difficulty, onComplete]);

  function cue(name: Parameters<typeof gameAudio.play>[0]) {
    gameAudio.unlock();
    playFeedback(name);
  }
  function activate(next: Island) {
    setActiveId(next.id);
    setArrangement(emptyArrangement());
    setUndo([]);
    setSelected(null);
    setWrong([]);
    setToast("");
    setHint(null);
  }
  function closeHint() {
    setHint(null);
    hintTrigger.current?.focus();
  }
  function showHint() {
    if (!island || celebration !== null) return;
    cue("hint");
    if (!hintedIslands.includes(island.id)) {
      setHintedIslands((ids) => [...ids, island.id]);
      setHints((value) => value + 1);
      setScore((value) => Math.max(0, value - 50));
    }
    if (!pivot)
      setHint(
        "Trong Play, bạn có thể chọn bất kỳ khối nào làm chốt. Kéo khối đó vào bệ vàng. Thử chọn số nằm gần giữa về giá trị để hai nhóm bớt lệch nhau nhé.",
      );
    else {
      const id = wrong[0] ?? pool[0];
      if (id === undefined)
        setHint(
          `Bạn đã chia hết các khối rồi. Kiểm tra nhóm nhỏ chỉ có số nhỏ hơn hoặc bằng ${pivot.value}, nhóm lớn chỉ có số lớn hơn ${pivot.value}. Sau đó bấm Kiểm tra nhé.`,
        );
      else {
        const value = byId(id).value;
        setHint(
          `${value} ${value === pivot.value ? "bằng" : value < pivot.value ? "nhỏ hơn" : "lớn hơn"} chốt ${pivot.value}, nên khối này thuộc ${value <= pivot.value ? "nhóm nhỏ" : "nhóm lớn"}. Bạn có thể kéo lại khối đã đặt nhé.`,
        );
      }
    }
  }
  function commit() {
    if (!island || blocked || !ready) return;
    const result = finishIsland(journey, island.id, arrangement);
    if (!result.ok) {
      if (result.reason === "missing") {
        setToast(`Còn ${pool.length} khối chưa được chia nhóm.`);
        return;
      }
      setWrong(result.wrong);
      setMistakes((value) => value + 1);
      setStreak(0);
      setScore((value) => Math.max(0, value - 50));
      setToast(
        `Có ${result.wrong.length} khối chưa đúng nhóm. Kéo lại rồi kiểm tra nhé. Trừ 50 điểm.`,
      );
      cue("retry");
      return;
    }
    const gained =
      (result.expedition.fixed.length - journey.fixed.length) * 100 +
      (result.balanced ? 50 : 0);
    setScore((value) => value + gained);
    setStreak((value) => value + 1);
    setJourney(result.expedition);
    setActiveId(null);
    setArrangement(emptyArrangement());
    setUndo([]);
    setWrong([]);
    setSelected(null);
    setCelebration(gained);
    setToast(
      result.balanced
        ? "Hai nhóm cân bằng! Thêm 50 điểm thưởng."
        : "Chốt đã đúng chỗ. Đảo mới đã mở!",
    );
    cue("split");
  }
  function place(id: number, destination: Destination) {
    if (!island || blocked || !island.cargo.includes(id)) return;
    if (!pivot && destination !== "pivot" && destination !== "pool") {
      setToast("Đặt một khối vào bệ chốt trước nhé.");
      return;
    }
    if (
      id === arrangement.pivot &&
      destination !== "pool" &&
      destination !== "pivot"
    ) {
      setToast("Chốt nằm trên bệ cho đến khi bạn chia hết các khối nhé.");
      return;
    }
    const next = moveCargo(arrangement, id, destination);
    if (next === arrangement) return;
    setUndo((history) => [...history, arrangement]);
    setArrangement(next);
    setSelected(null);
    setWrong([]);
    setToast("");
    setMoves((value) => value + 1);
    cue(destination === "pivot" ? "pivot" : "drop");
  }
  function targetAt(x: number, y: number): Destination | null {
    const element = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>("[data-drop]");
    return (element?.dataset.drop as Destination | undefined) ?? null;
  }
  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, id: number) {
    if (blocked || event.button !== 0 || drag.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    cue("tap");
  }
  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointerId) return;
    if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > 6)
      current.moved = true;
    if (current.moved) {
      setGhost({ id: current.id, x: event.clientX, y: event.clientY });
      setOver(targetAt(event.clientX, event.clientY));
    }
  }
  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointerId) return;
    drag.current = null;
    setGhost(null);
    setOver(null);
    if (!current) return;
    if (current.moved) {
      const target = targetAt(event.clientX, event.clientY);
      if (target) place(current.id, target);
    } else setSelected((value) => (value === current.id ? null : current.id));
  }
  function targetClick(destination: Destination) {
    if (selected !== null) place(selected, destination);
  }
  function crate(id: number) {
    const item = byId(id);
    return (
      <button
        key={id}
        className={`cargo-crate ${selected === id ? "cargo-selected" : ""} ${wrong.includes(id) ? "cargo-wrong" : ""} ${ghost?.id === id ? "cargo-lifted" : ""}`}
        data-cargo={id}
        aria-label={`Khối ${item.value}, thẻ ${id + 1}`}
        aria-pressed={selected === id}
        onPointerDown={(event) => startDrag(event, id)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={() => {
          drag.current = null;
          setGhost(null);
          setOver(null);
        }}
        onClick={(event) => {
          if (event.detail === 0 && !blocked)
            setSelected((value) => (value === id ? null : id));
        }}
        disabled={blocked}
      >
        <span>{item.value}</span>
        <i aria-hidden="true" />
        <i aria-hidden="true" />
      </button>
    );
  }
  function group(kind: "small" | "large") {
    return (
      <section
        className={`cargo-zone zone-${kind} ${over === kind ? "drop-hover" : ""}`}
        data-drop={kind}
        aria-label={kind === "small" ? "Vùng nhóm nhỏ" : "Vùng nhóm lớn"}
      >
        <button
          className="cargo-zone-label"
          onClick={() => targetClick(kind)}
          disabled={!pivot || blocked}
          aria-label={
            kind === "small" ? "Đưa khối vào nhóm nhỏ" : "Đưa khối vào nhóm lớn"
          }
        >
          <Flag size={19} />
          <span>
            {kind === "small" ? "Nhóm nhỏ" : "Nhóm lớn"}
            <small>
              {kind === "small" ? "Nhỏ hơn hoặc bằng chốt" : "Lớn hơn chốt"}
            </small>
          </span>
          <b>{arrangement[kind].length}</b>
        </button>
        <div className="cargo-zone-content">
          {arrangement[kind].map(crate)}
          {!arrangement[kind].length && (
            <span className="cargo-empty">Kéo khối vào đây</span>
          )}
        </div>
      </section>
    );
  }
  function applyArray() {
    const values = draft
      .replaceAll("−", "-")
      .trim()
      .split(/[,;\s]+/)
      .filter(Boolean)
      .map(Number);
    if (
      values.length < 2 ||
      values.length > 8 ||
      values.some(
        (value) => !Number.isInteger(value) || value < -99 || value > 99,
      )
    ) {
      setError("Nhập từ 2 đến 8 số nguyên trong khoảng từ −99 đến 99 nhé.");
      return;
    }
    gameAudio.stop();
    onChange(values, difficulty);
  }
  const heading = done
    ? "Mảng đã được sắp xếp!"
    : celebration !== null
      ? "Mở được đường mới rồi!"
      : !island
        ? "Bạn muốn khám phá đảo nào?"
        : !pivot
          ? "Chọn chốt theo cách của bạn"
          : ready
            ? "Kiểm tra hai nhóm để mở đường"
            : `Chia nhóm theo chốt ${pivot.value}`;
  return (
    <GameLayout
      ref={world}
      className={`expedition-world ${done ? "expedition-complete" : ""} ${celebration !== null ? "expedition-celebrating" : ""}`}
    >
      <World />
      <GameHeader title="Quick Sort" className="expedition-header" onBack={() => { gameAudio.stop(); onBack(); }} onSettings={() => { gameAudio.stop(); setSettings(true); }} />
      <GameStats className="expedition-stats" scoreClassName="expedition-score" score={score}>
        <span>
          {difficulty === "hard"
            ? `${Math.ceil(remaining)} giây`
            : timeText(elapsed)}
        </span>
        <span>{moves} lượt kéo</span>
        {streak > 1 && <b className="expedition-streak">Chuỗi {streak}</b>}
      </GameStats>
      <div className="expedition-trail" aria-label="Tiến độ sắp xếp">
        <span>
          <Compass size={17} />
          {journey.fixed.length} trên {input.length} khối đã đúng chỗ
        </span>
        <div className="expedition-trail-blocks">
          {journey.cargo.map((item) => (
            <span
              key={item.id}
              className={`${journey.fixed.includes(item.id) ? "trail-fixed" : ""} ${island?.cargo.includes(item.id) ? "trail-active" : ""}`}
              data-trail-id={item.id}
            >
              {item.value}
              {journey.fixed.includes(item.id) && <Check size={10} />}
            </span>
          ))}
        </div>
      </div>
      <section className="expedition-stage" aria-label="Bàn kéo thả Quick Sort">
        {!done && <h2>{heading}</h2>}
        {island ? (
          <>
            <section
              className={`cargo-pool ${pool.length === 0 ? "pool-empty" : ""} ${over === "pool" ? "drop-hover" : ""}`}
              data-drop="pool"
              aria-label="Kho khối chưa chia"
            >
              <button
                className="cargo-pool-label"
                onClick={() => targetClick("pool")}
                disabled={blocked}
              >
                Chưa chia <b>{pool.length}</b>
                <small>Kéo lại đây để đổi ý</small>
              </button>
              <div className="cargo-pool-content">
                {pool.map(crate)}
                {pool.length === 0 && (
                  <span className="cargo-pool-empty">
                    <Check size={20} /> Đã chia hết các khối
                  </span>
                )}
              </div>
            </section>
            <div className="expedition-partition">
              {group("small")}
              <section
                className={`cargo-pivot ${over === "pivot" ? "drop-hover" : ""}`}
                data-drop="pivot"
                aria-label="Bệ chốt"
              >
                <button
                  className="cargo-pivot-label"
                  onClick={() => targetClick("pivot")}
                  disabled={blocked}
                  aria-label="Đặt khối làm chốt"
                >
                  <Flag size={17} /> Chốt
                </button>
                <div className="cargo-pivot-pedestal">
                  {pivot ? (
                    crate(pivot.id)
                  ) : (
                    <span className="pivot-placeholder">?</span>
                  )}
                </div>
                <span>{pivot ? "Giữ chốt ở đây" : "Kéo một khối vào"}</span>
              </section>
              {group("large")}
            </div>
            <button
              className={`cargo-commit ${ready ? "commit-ready" : ""}`}
              onPointerDown={() => {
                checkedByTouch.current = false;
              }}
              onPointerUp={(event) => {
                if (event.pointerType === "touch") {
                  event.preventDefault();
                  checkedByTouch.current = true;
                  const bounds = event.currentTarget.getBoundingClientRect();
                  if (
                    event.clientX >= bounds.left &&
                    event.clientX <= bounds.right &&
                    event.clientY >= bounds.top &&
                    event.clientY <= bounds.bottom
                  )
                    commit();
                }
              }}
              onClick={(event) => {
                if (checkedByTouch.current && event.detail !== 0) {
                  checkedByTouch.current = false;
                  return;
                }
                checkedByTouch.current = false;
                commit();
              }}
              aria-label="Kiểm tra"
              disabled={!ready || blocked}
            >
              <Check size={22} />
              <span>
                Kiểm tra
                <small>
                  {ready
                    ? "Kiểm tra cách chia nhóm và mở đảo tiếp theo"
                    : "Chia hết các khối để kiểm tra"}
                </small>
              </span>
            </button>
          </>
        ) : done ? (
          <VictoryCelebration
            className="expedition-victory"
            stars={mistakes + hints === 0 ? 3 : mistakes + hints < 4 ? 2 : 1}
            difficulty={difficulty}
            onReplay={() => onChange([...input], difficulty)}
            onHarder={(level) => onChange(createArray(level), level)}
            onMap={onChooseMap}
          >
            <strong>{score.toLocaleString("vi-VN")} điểm</strong>
            <p>
              {journey.partitions} lần chia nhóm · {moves} lượt kéo · {mistakes}{" "}
              lần sửa nhóm
            </p>
            <small>Kỷ lục {best.toLocaleString("vi-VN")} điểm</small>
          </VictoryCelebration>
        ) : (
          <div className="expedition-branches">
            {celebration !== null && (
              <div className="partition-reward">
                <Star fill="currentColor" /> Cộng {celebration} điểm
              </div>
            )}
            {journey.islands.map((next) => (
              <button
                key={next.id}
                className="expedition-island"
                disabled={celebration !== null}
                onClick={() => {
                  activate(next);
                  cue("enter");
                }}
                aria-label={`Khám phá đảo ${next.cargo.map((id) => byId(id).value).join(", ")}`}
              >
                <span className="branch-flag">
                  <Flag size={28} fill="currentColor" />
                </span>
                <div>
                  {next.cargo.map((id) => (
                    <i key={id}>{byId(id).value}</i>
                  ))}
                </div>
                <span>
                  {next.cargo.length} khối · Đảo tầng {next.depth + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
      <div className="expedition-message" role="status">
        {toast ||
          (selected !== null
            ? `Đã nhấc khối ${byId(selected).value}. Chọn nơi muốn đặt.`
            : "")}
      </div>
      <GameFooter className="expedition-controls">
        <button
          className="round-button expedition-undo"
          aria-label="Hoàn tác lượt kéo"
          disabled={!undo.length || blocked}
          onClick={() => {
            setArrangement(undo.at(-1)!);
            setUndo((history) => history.slice(0, -1));
            setWrong([]);
            setSelected(null);
            setToast("");
            cue("tap");
          }}
        >
          <Undo2 size={22} />
        </button>
        {!done && (
          <GameHintButton
            className="expedition-hint-button"
            ref={hintTrigger}
            onClick={showHint}
            disabled={!island || celebration !== null}
          >
            <small>50 điểm</small>
          </GameHintButton>
        )}
      </GameFooter>
      {ghost && (
        <div
          className="cargo-ghost cargo-crate"
          style={{ left: ghost.x, top: ghost.y }}
          aria-hidden="true"
        >
          <span>{byId(ghost.id).value}</span>
          <i />
          <i />
        </div>
      )}
      {hint && (
        <div
          className="expedition-hint"
          role="region"
          aria-label="Gợi ý của Buta"
        >
          <Pig mood="pointing" />
          <div>
            <strong>Buta gợi ý</strong>
            <p>{hint}</p>
          </div>
          <button
            ref={hintClose}
            className="round-button"
            onClick={closeHint}
            aria-label="Đóng gợi ý"
          >
            <X size={19} />
          </button>
        </div>
      )}
      <dialog
        className="modal expedition-settings"
        ref={dialog}
        aria-label="Tùy chọn sân chơi"
        onCancel={(event) => {
          event.preventDefault();
          setSettings(false);
        }}
      >
        <div className="modal-header">
          <h2>Chuyến phiêu lưu</h2>
          <button
            className="round-button"
            aria-label="Đóng"
            onClick={() => setSettings(false)}
          >
            <X size={21} />
          </button>
        </div>
        <p className="expedition-howto">
          Kéo một khối bất kỳ vào bệ chốt. Tự chia các khối còn lại vào hai
          nhóm, rồi bấm Kiểm tra. Bạn chọn đảo tiếp theo và làm đến khi mọi khối
          đều đúng chỗ.
        </p>
        <p className="expedition-method-note">
          Demo dùng số cuối theo cách Lomuto. Trong Play, bạn có thể thử các
          cách chọn chốt khác nhau.
        </p>
        <label className="setting-label" htmlFor="expedition-level">
          Thử thách
        </label>
        <select
          className="setting-select"
          id="expedition-level"
          aria-label="Cấp độ"
          value={difficulty}
          onChange={(event) => {
            const level = event.target.value as Difficulty;
            onChange(createArray(level), level);
          }}
        >
          <option value="easy">Dễ · 5 khối · Không giới hạn giờ</option>
          <option value="medium">Vừa · 7 khối · Không giới hạn giờ</option>
          <option value="hard">Khó · 8 khối · 60 giây mỗi đảo</option>
        </select>
        <button
          className="lesson-sound-toggle"
          aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"}
          aria-pressed={sound}
          onClick={() => {
            gameAudio.setEnabled(!sound);
            onSoundChange(!sound);
          }}
        >
          {sound ? <Volume2 size={20} /> : <VolumeX size={20} />} Hiệu ứng âm
          thanh <b>{sound ? "Bật" : "Tắt"}</b>
        </button>
        <HapticsToggle />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            applyArray();
          }}
        >
          <label className="setting-label" htmlFor="expedition-input">
            Mảng của bạn · từ 2 đến 8 số
          </label>
          <input
            id="expedition-input"
            className="custom-input"
            aria-label="Các phần tử của mảng"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError("");
            }}
            aria-invalid={Boolean(error)}
          />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="lesson-setting-actions">
            <button type="submit">Dùng mảng này</button>
            <button
              type="button"
              onClick={() => onChange([...input], difficulty)}
            >
              <RotateCcw size={15} /> Chơi lại
            </button>
          </div>
        </form>
        <button
          className="chunky-button button-green modal-primary"
          onClick={() => setSettings(false)}
        >
          Tiếp tục chơi
        </button>
      </dialog>
    </GameLayout>
  );
}

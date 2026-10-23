import { useEffect, useRef, useState } from "react";
import { Undo2, Volume2, VolumeX, X } from "lucide-react";
import { GameHeader, GameStats, GameLayout, GameFooter, GameHintButton } from "./GameHud";
import {
  createGraph,
  createBFSTimeline,
  validateBFSAction,
  type GraphState,
  type BFSStep,
  type GraphDifficulty,
} from "../engine/graph";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import HapticsToggle from "./HapticsToggle";
import Pig from "./Pig";
import World from "./World";
import VictoryCelebration from "./VictoryCelebration";
import GraphBoard from "./GraphBoard";

type Props = {
  difficulty: GraphDifficulty;
  sound: boolean;
  onBack: () => void;
  onChooseMap: () => void;
  onComplete: () => void;
  onChange: (difficulty: GraphDifficulty) => void;
  onSoundChange: (value: boolean) => void;
};

type MoveSnapshot = {
  graph: GraphState;
  timelineIndex: number;
  parents: Map<number, number>;
  score: number;
};

const isPlayerAction = (action: BFSStep["action"]) =>
  action === "DEQUEUE" || action === "ENQUEUE" || action === "FOUND" || action === "DONE";

function cloneGraph(graph: GraphState): GraphState {
  return {
    ...graph,
    vertices: graph.vertices.map((vertex) => ({ ...vertex })),
    edges: graph.edges.map((edge) => ({ ...edge })),
    queue: [...graph.queue],
    visited: new Set(graph.visited),
    path: [...graph.path],
    layer: new Map(graph.layer),
  };
}

function firstPlayerAction(timeline: BFSStep[], fromIndex = 0): number {
  for (let index = fromIndex; index < timeline.length; index += 1) {
    if (isPlayerAction(timeline[index].action)) return index;
  }
  return timeline.length - 1;
}

function shortestPath(start: number, goal: number, parents: Map<number, number>): number[] {
  const path = [goal];
  let vertex = goal;
  while (vertex !== start) {
    const parent = parents.get(vertex);
    if (parent === undefined) return [];
    path.unshift(parent);
    vertex = parent;
  }
  return path;
}

export default function GraphGame({
  difficulty,
  sound,
  onBack,
  onChooseMap,
  onComplete,
  onChange,
  onSoundChange,
}: Props) {
  const [graph, setGraph] = useState(() => createGraph(difficulty));
  const [timeline, setTimeline] = useState(() => createBFSTimeline(graph));
  const [timelineIndex, setTimelineIndex] = useState(() => firstPlayerAction(timeline));
  const [parents, setParents] = useState(() => new Map<number, number>());
  const [score, setScore] = useState(1000);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [outcome, setOutcome] = useState<"correct" | "retry" | "">("");
  const [settings, setSettings] = useState(false);
  const [hint, setHint] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [history, setHistory] = useState<MoveSnapshot[]>([]);
  const [poppedVertices, setPoppedVertices] = useState<Set<number>>(new Set());
  const completionSent = useRef(false);
  // Pig walker: tracks the SVG-to-screen mapping so we can place Pig over a vertex
  const [boardRect, setBoardRect] = useState<DOMRect | null>(null);
  const [svgRenderedWidth, setSvgRenderedWidth] = useState(0);
  const [pigVertex, setPigVertex] = useState<number | null>(null);
  const [pigArriving, setPigArriving] = useState(false);

  const currentStep = timeline[timelineIndex];
  const done = currentStep?.action === "DONE";
  const blocked = settings || hint || done || !visible;
  const playerSteps = timeline.filter((step) => step.action !== "START" && step.action !== "VISIT" && step.action !== "DONE");
  const currentMove = done
    ? playerSteps.length
    : Math.max(1, playerSteps.findIndex((step) => step.step === currentStep?.step) + 1);

  useEffect(() => {
    const change = () => {
      setVisible(!document.hidden);
      if (document.hidden) {
        gameAudio.stop();
        stopHaptics();
      }
    };
    document.addEventListener("visibilitychange", change);
    return () => {
      document.removeEventListener("visibilitychange", change);
      gameAudio.stop();
      stopHaptics();
    };
  }, []);

  useEffect(() => {
    if (!done || completionSent.current) return;
    completionSent.current = true;
    playFeedback("finish");
    onComplete();
  }, [done, onComplete]);

  function handleVertexClick(vertexId: number) {
    if (blocked || !currentStep) return;
    gameAudio.unlock();
    gameAudio.play("tap");

    if (currentStep.action === "DONE") return;
    const action = currentStep.action;
    const result = action === "FOUND"
      ? { valid: vertexId === currentStep.expectedVertex, message: "Đã tìm thấy đích!" }
      : validateBFSAction(currentStep, action, vertexId);

    if (!result.valid) {
      const message = action === "DEQUEUE"
        ? "Hãy chọn đỉnh đang ở đầu queue."
        : action === "ENQUEUE"
          ? "Đỉnh này không phải neighbor tiếp theo cần thêm."
          : "Hãy chọn đỉnh đích đang ở đầu queue.";
      setOutcome("retry");
      setFeedback(message);
      setMistakes((previous) => previous + 1);
      setScore((previous) => Math.max(0, previous - 50));
      playFeedback("retry");
      return;
    }

    setHistory((previous) => [...previous, {
      graph: cloneGraph(graph),
      timelineIndex,
      parents: new Map(parents),
      score,
    }]);

    // Trigger pop animation on the correctly-clicked vertex
    setPoppedVertices(new Set([vertexId]));
    setTimeout(() => setPoppedVertices(new Set()), 350);

    const nextGraph = cloneGraph(graph);
    const nextParents = new Map(parents);
    if (action === "DEQUEUE") {
      nextGraph.queue.shift();
      nextGraph.current = vertexId;
    } else if (action === "ENQUEUE") {
      nextGraph.visited.add(vertexId);
      nextGraph.queue.push(vertexId);
      nextGraph.layer.set(vertexId, (nextGraph.layer.get(nextGraph.current ?? nextGraph.start) ?? 0) + 1);
      if (nextGraph.current !== null) nextParents.set(vertexId, nextGraph.current);
    } else if (action === "FOUND") {
      nextGraph.queue.shift();
      nextGraph.current = vertexId;
      nextGraph.path = shortestPath(nextGraph.start, vertexId, nextParents);
    }

    const nextIndex = firstPlayerAction(timeline, timelineIndex + 1);
    setGraph(nextGraph);
    setParents(nextParents);
    setTimelineIndex(nextIndex);
    setScore((previous) => previous + 100);
    setOutcome("correct");
    setFeedback(action === "FOUND" ? "Tuyệt vời! Bạn đã tìm thấy đích." : "Chính xác! Tiếp tục nhé.");
  }

  function undo() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setGraph(cloneGraph(previous.graph));
    setTimelineIndex(previous.timelineIndex);
    setParents(new Map(previous.parents));
    setScore(previous.score);
    setHistory((items) => items.slice(0, -1));
    setFeedback("Đã hoàn tác một thao tác.");
    setOutcome("");
    setHint(false);
  }

  function reset() {
    const nextGraph = createGraph(difficulty);
    const nextTimeline = createBFSTimeline(nextGraph);
    completionSent.current = false;
    setGraph(nextGraph);
    setTimeline(nextTimeline);
    setTimelineIndex(firstPlayerAction(nextTimeline));
    setParents(new Map());
    setScore(1000);
    setMistakes(0);
    setFeedback("");
    setOutcome("");
    setHistory([]);
    setHint(false);
  }

  function showHint() {
    if (blocked || !currentStep) return;
    setHint(true);
    setScore((previous) => Math.max(0, previous - 50));
    playFeedback("hint");
  }

  function getHintText(): string {
    if (currentStep?.action === "DEQUEUE") {
      const v = graph.vertices[currentStep.expectedVertex!];
      return `${v.label}${v.place ? ` (${v.place})` : ""} đang ở đầu hàng chờ. Hãy chọn đỉnh này để lấy ra xét.`;
    }
    if (currentStep?.action === "ENQUEUE") {
      const v = graph.vertices[currentStep.expectedVertex!];
      return `Từ đỉnh đang xét, địa điểm tiếp theo cần khám phá là ${v.label}${v.place ? ` (${v.place})` : ""}. Hãy chọn đỉnh này.`;
    }
    return `${goalPlace} đang ở đầu hàng chờ. Hãy chọn để hoàn tất hành trình!`;
  }

  function handleGeometry(w: number, _h: number, rect: DOMRect) {
    setSvgRenderedWidth(w);
    setBoardRect(rect);
  }

  /** Convert SVG vertex coords → CSS position (% relative to board element) */
  function pigPosition(vertexId: number | null): { left: string; top: string } | null {
    if (vertexId === null || !boardRect || svgRenderedWidth === 0) return null;
    const vertex = graph.vertices[vertexId];
    if (!vertex) return null;
    const scale = svgRenderedWidth / 600;
    const renderedHeight = svgRenderedWidth * (400 / 600);
    return {
      left: `${(vertex.x * scale / boardRect.width) * 100}%`,
      top:  `${(vertex.y * scale / renderedHeight) * 100}%`,
    };
  }

  // Move Pig to the vertex being examined whenever currentStep changes
  useEffect(() => {
    const target = graph.current ?? (currentStep?.action === "DEQUEUE" ? currentStep.expectedVertex ?? null : null);
    if (target === pigVertex) return;
    setPigArriving(false);
    const id = window.setTimeout(() => {
      setPigVertex(target);
      setPigArriving(true);
      const off = window.setTimeout(() => setPigArriving(false), 900);
      return () => clearTimeout(off);
    }, 60);
    return () => clearTimeout(id);
  }, [graph.current, currentStep?.step]);

  const pigPos = pigPosition(pigVertex);

  const goalVertex = graph.vertices[graph.goal];
  const goalPlace  = goalVertex.place ?? goalVertex.label;
  const startVertex = graph.vertices[graph.start];
  const startPlace  = startVertex.place ?? startVertex.label;

  const taskText = currentStep?.action === "DEQUEUE"
    ? (() => {
        const v = graph.vertices[currentStep.expectedVertex!];
        return `Lấy ${v.label}${v.place ? ` (${v.place})` : ""} ra — đầu hàng chờ.`;
      })()
    : currentStep?.action === "ENQUEUE"
      ? (() => {
          const v = graph.vertices[currentStep.expectedVertex!];
          return `Khám phá ${v.label}${v.place ? ` (${v.place})` : ""} — thêm vào hàng chờ.`;
        })()
      : currentStep?.action === "FOUND"
        ? `🎉 Tìm thấy ${goalPlace}! Chọn đỉnh đích.`
        : "Buta đã hoàn thành hành trình!";

  return (
    <GameLayout className="graph-world">
      <World />
      <GameHeader
        title="BFS · Tìm đường"
        onBack={onBack}
        onSettings={() => { gameAudio.unlock(); setSettings(true); }}
      />
      <GameStats score={score} className="graph-stats">
        <span>Lượt {Math.min(currentMove, playerSteps.length)}/{playerSteps.length}</span>
        <span>{mistakes} lỗi</span>
      </GameStats>
      <section className="graph-content">
        {/* Goal badge — always visible, gives player instant context */}
        <div className="graph-goal-badge" aria-label={`Mục tiêu: tìm đường từ ${startPlace} đến ${goalPlace}`}>
          <span className="graph-goal-icon">🗺️</span>
          <span>Từ <strong>{startPlace}</strong> → tìm đường đến <strong>{goalPlace}</strong></span>
        </div>
        <GraphBoard
          state={graph}
          onVertexClick={handleVertexClick}
          highlightedVertices={currentStep?.action === "ENQUEUE" ? [currentStep.expectedVertex!] : []}
          paused={blocked}
          poppedVertices={poppedVertices}
          onGeometry={handleGeometry}
          activeVertex={pigVertex}
        />
        {/* Pig walker overlay — positioned absolutely over the board */}
        {pigPos && (
          <div
            className={`graph-pig-walker ${pigArriving ? "pig-arriving" : ""}`}
            style={{
              position: "absolute",
              left: pigPos.left,
              top: pigPos.top,
              transform: "translate(-50%, -110%)",
              pointerEvents: "none",
            }}
            aria-hidden="true"
          >
            <Pig mood={pigArriving ? "happy" : "pointing"} />
          </div>
        )}
        <div className="graph-hud-row">
          <div
            className="graph-queue-inline"
            aria-label={`Hàng chờ: ${graph.queue.map((id) => graph.vertices[id].label).join(", ") || "rỗng"}`}
          >
            <span className="graph-queue-label">Hàng chờ</span>
            <ol>
              {graph.queue.length > 0
                ? graph.queue.map((id, index) => (
                    <li key={id} className={index === 0 ? "is-front" : ""}>
                      {graph.vertices[id].label}
                    </li>
                  ))
                : <li className="queue-empty">–</li>}
            </ol>
          </div>
          {feedback && (
            <p
              className={`graph-feedback ${outcome === "retry" ? "is-error" : outcome === "correct" ? "is-success" : ""}`}
              role="status"
            >
              {feedback}
            </p>
          )}
        </div>
        <p className="graph-task" aria-live="polite">{taskText}</p>
        {done && (
          <VictoryCelebration
            className="graph-victory"
            stars={mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1}
            difficulty={difficulty === "tutorial" ? "easy" : difficulty === "cycle" ? "medium" : "hard"}
            onReplay={reset}
            onHarder={(nextDiff) => onChange(nextDiff === "easy" ? "tutorial" : nextDiff === "medium" ? "cycle" : "complex")}
            onMap={onChooseMap}
          >
            <strong>{score.toLocaleString("vi-VN")} điểm</strong>
            <p>Buta đã tìm được đường đến {goalPlace}!</p>
            {graph.path.length > 0 && (
              <p className="graph-result-path">
                Đường đi: {graph.path.map((id) => {
                  const v = graph.vertices[id];
                  return v.place ? `${v.label}(${v.place})` : v.label;
                }).join(" → ")}
              </p>
            )}
          </VictoryCelebration>
        )}
      </section>
      {!done && (
        <GameFooter className="graph-play-footer">
          {hint && (
            <div className="graph-hint">
              <Pig mood="thinking" />
              <p>{getHintText()}</p>
              <button className="round-button" aria-label="Đóng gợi ý" onClick={() => setHint(false)}>
                <X size={18} />
              </button>
            </div>
          )}
          <div className="graph-controls">
            <button className="round-button" onClick={undo} disabled={history.length === 0} aria-label="Hoàn tác">
              <Undo2 size={22} />
            </button>
            <GameHintButton disabled={blocked} aria-expanded={hint} onClick={showHint} />
          </div>
        </GameFooter>
      )}
      {settings && (
        <GraphSettings
          onClose={() => setSettings(false)}
          onBack={onBack}
          sound={sound}
          onSoundChange={onSoundChange}
          difficulty={difficulty}
          onChangeDifficulty={onChange}
          onReset={reset}
        />
      )}
    </GameLayout>
  );
}

function GraphSettings({
  onClose,
  onBack,
  sound,
  onSoundChange,
  difficulty,
  onChangeDifficulty,
  onReset,
}: {
  onClose: () => void;
  onBack: () => void;
  sound: boolean;
  onSoundChange: (value: boolean) => void;
  difficulty: GraphDifficulty;
  onChangeDifficulty: (diff: GraphDifficulty) => void;
  onReset: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);

  const difficulties: { id: GraphDifficulty; label: string }[] = [
    { id: "tutorial", label: "Hướng dẫn" },
    { id: "cycle", label: "Có cycle" },
    { id: "complex", label: "Phức tạp" },
  ];

  return (
    <dialog
      ref={dialogRef}
      className="modal lesson-settings"
      onClose={onClose}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-label="Tùy chọn BFS"
    >
      <div className="modal-header">
        <h2>Tùy chọn BFS</h2>
        <button className="round-button" onClick={onClose} aria-label="Đóng">
          <X size={21} />
        </button>
      </div>
      <button className="lesson-sound-toggle" onClick={() => onSoundChange(!sound)} aria-pressed={sound}>
        {sound ? <Volume2 size={21} /> : <VolumeX size={21} />}
        <span>Hiệu ứng âm thanh</span>
        <b>{sound ? "Bật" : "Tắt"}</b>
      </button>
      <HapticsToggle />
      <label className="setting-label" htmlFor="graph-difficulty">Độ khó</label>
      <select id="graph-difficulty" className="setting-select" value={difficulty} onChange={(event) => onChangeDifficulty(event.target.value as GraphDifficulty)}>
        {difficulties.map((diff) => <option key={diff.id} value={diff.id}>{diff.label}</option>)}
      </select>
      <div className="lesson-setting-actions">
        <button onClick={() => { onClose(); onReset(); }}>Chơi lại từ đầu</button>
        <button className="chunky-button button-green modal-primary" onClick={onClose}>Tiếp tục</button>
      </div>
      <button
        className="graph-settings-map-btn"
        onClick={() => { onClose(); onBack(); }}
      >
        Về bản đồ
      </button>
    </dialog>
  );
}

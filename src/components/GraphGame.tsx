import { useEffect, useRef, useState } from "react";
import { RotateCcw, Undo2, Volume2, VolumeX, X } from "lucide-react";
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
  const completionSent = useRef(false);

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
      const label = graph.vertices[currentStep.expectedVertex!].label;
      return `Đỉnh ${label} đang ở đầu queue. Hãy chọn đỉnh này để lấy ra xét.`;
    }
    if (currentStep?.action === "ENQUEUE") {
      const label = graph.vertices[currentStep.expectedVertex!].label;
      return `Từ đỉnh đang xét, neighbor chưa thăm tiếp theo là ${label}. Hãy chọn đỉnh này.`;
    }
    return "Đỉnh đích đang ở đầu queue. Hãy chọn nó để hoàn tất đường đi ngắn nhất.";
  }

  const taskText = currentStep?.action === "DEQUEUE"
    ? `Chọn ${graph.vertices[currentStep.expectedVertex!].label} ở đầu queue để lấy ra.`
    : currentStep?.action === "ENQUEUE"
      ? `Chọn neighbor ${graph.vertices[currentStep.expectedVertex!].label} để thêm vào queue.`
      : currentStep?.action === "FOUND"
        ? `Đích ${graph.vertices[graph.goal].label} đã đến lượt. Chọn đỉnh đích để hoàn tất.`
        : "Bạn đã hoàn thành lượt BFS.";

  return (
    <GameLayout className="graph-world">
      <World />
      <GameHeader
        title="BFS · Tìm đường"
        onBack={onBack}
        onSettings={() => setSettings(true)}
      />
      <GameStats score={score} className="graph-stats">
        <span>Lượt {Math.min(currentMove, playerSteps.length)}/{playerSteps.length}</span>
        <span>{mistakes} lỗi</span>
      </GameStats>
      <section className="graph-content">
        <div className="graph-intro">
          <span className="graph-kicker">BREADTH-FIRST SEARCH</span>
          <h2>{currentStep?.message ?? "Bắt đầu tìm đường"}</h2>
          <p className="graph-task">{taskText}</p>
        </div>
        <div className="graph-queue-panel" aria-label={`Queue hiện tại: ${graph.queue.map((id) => graph.vertices[id].label).join(", ") || "rỗng"}`}>
          <div>
            <strong>QUEUE</strong>
            <span>Vào sau, ra trước · FIFO</span>
          </div>
          <ol>
            {graph.queue.length > 0
              ? graph.queue.map((id, index) => <li key={id} className={index === 0 ? "is-front" : ""}>{graph.vertices[id].label}</li>)
              : <li className="queue-empty">Rỗng</li>}
          </ol>
        </div>
        <GraphBoard
          state={graph}
          onVertexClick={handleVertexClick}
          highlightedVertices={currentStep?.action === "ENQUEUE" ? [currentStep.expectedVertex!] : []}
          paused={blocked}
        />
        <div className="graph-legend" aria-label="Chú giải">
          <span><i className="legend-start" />Bắt đầu</span>
          <span><i className="legend-queue" />Trong queue</span>
          <span><i className="legend-visited" />Đã thăm</span>
          <span><i className="legend-goal" />Đích</span>
        </div>
        {feedback && (
          <p
            className={`graph-feedback ${outcome === "retry" ? "is-error" : outcome === "correct" ? "is-success" : ""}`}
            role="status"
          >
            {feedback}
          </p>
        )}
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
            <p>Bạn đã tìm được đường ngắn nhất bằng BFS!</p>
            {graph.path.length > 0 && (
              <p className="graph-result-path">
                Đường đi: {graph.path.map((id) => graph.vertices[id].label).join(" → ")}
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
            <button className="round-button" onClick={reset} aria-label="Chơi lại">
              <RotateCcw size={20} />
            </button>
            <GameHintButton disabled={blocked} aria-expanded={hint} onClick={showHint} />
          </div>
        </GameFooter>
      )}
      {settings && (
        <GraphSettings
          onClose={() => setSettings(false)}
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
  sound,
  onSoundChange,
  difficulty,
  onChangeDifficulty,
  onReset,
}: {
  onClose: () => void;
  sound: boolean;
  onSoundChange: (value: boolean) => void;
  difficulty: GraphDifficulty;
  onChangeDifficulty: (diff: GraphDifficulty) => void;
  onReset: () => void;
}) {
  const difficulties: { id: GraphDifficulty; label: string }[] = [
    { id: "tutorial", label: "Hướng dẫn" },
    { id: "cycle", label: "Có cycle" },
    { id: "complex", label: "Phức tạp" },
  ];

  return (
    <dialog className="modal lesson-settings" open onClose={onClose} aria-label="Tùy chọn BFS">
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
        <button onClick={onReset}>Chơi lại từ đầu</button>
        <button className="chunky-button button-green modal-primary" onClick={onClose}>Tiếp tục</button>
      </div>
    </dialog>
  );
}

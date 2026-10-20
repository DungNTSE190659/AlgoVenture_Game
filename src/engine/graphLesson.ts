import { createBFSTimeline, type BFSStep, type GraphState, type GraphDifficulty } from "./graph";
import { type PigMood } from "./lesson";

export type { GraphDifficulty };

export type GraphLessonFrame = {
  id: number;
  kind: "INTRO" | "DEQUEUE" | "VISIT" | "ENQUEUE" | "FOUND" | "DONE";
  state: GraphState;
  title: string;
  narration: string;
  mood: PigMood;
  duration: number;
  highlightedVertex?: number;
  highlightedNeighbors?: number[];
};

/** Create pedagogical timeline for BFS demo */
export function createGraphLesson(difficulty: GraphDifficulty): GraphLessonFrame[] {
  const graph = (() => {
    switch (difficulty) {
      case "tutorial":
        return {
          vertices: [
            { id: 0, label: "A", x: 100, y: 100 },
            { id: 1, label: "B", x: 200, y: 50 },
            { id: 2, label: "C", x: 200, y: 150 },
            { id: 3, label: "D", x: 300, y: 50 },
            { id: 4, label: "E", x: 300, y: 150 },
          ],
          edges: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
            { from: 1, to: 3 },
            { from: 2, to: 4 },
          ],
          queue: [0],
          visited: new Set([0]),
          current: null,
          start: 0,
          goal: 4,
          path: [],
          layer: new Map([[0, 0]]),
        };
      case "cycle":
        return {
          vertices: [
            { id: 0, label: "A", x: 100, y: 100 },
            { id: 1, label: "B", x: 200, y: 50 },
            { id: 2, label: "C", x: 200, y: 150 },
            { id: 3, label: "D", x: 300, y: 100 },
            { id: 4, label: "E", x: 400, y: 50 },
            { id: 5, label: "F", x: 400, y: 150 },
          ],
          edges: [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
            { from: 2, to: 3 },
            { from: 3, to: 4 },
            { from: 4, to: 5 },
            { from: 0, to: 2 },
          ],
          queue: [0],
          visited: new Set([0]),
          current: null,
          start: 0,
          goal: 5,
          path: [],
          layer: new Map([[0, 0]]),
        };
      case "complex":
        return {
          vertices: [
            { id: 0, label: "A", x: 100, y: 100 },
            { id: 1, label: "B", x: 200, y: 50 },
            { id: 2, label: "C", x: 200, y: 150 },
            { id: 3, label: "D", x: 300, y: 50 },
            { id: 4, label: "E", x: 300, y: 150 },
            { id: 5, label: "F", x: 400, y: 50 },
            { id: 6, label: "G", x: 400, y: 150 },
            { id: 7, label: "H", x: 500, y: 100 },
          ],
          edges: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
            { from: 1, to: 3 },
            { from: 1, to: 4 },
            { from: 2, to: 5 },
            { from: 2, to: 6 },
            { from: 3, to: 7 },
            { from: 5, to: 7 },
          ],
          queue: [0],
          visited: new Set([0]),
          current: null,
          start: 0,
          goal: 7,
          path: [],
          layer: new Map([[0, 0]]),
        };
      default:
        return {
          vertices: [],
          edges: [],
          queue: [],
          visited: new Set<number>(),
          current: null,
          start: 0,
          goal: 0,
          path: [],
          layer: new Map<number, number>(),
        };
    }
  })();

  const timeline = createBFSTimeline(graph);
  const frames: GraphLessonFrame[] = [];

  // INTRO
  frames.push({
    id: 0,
    kind: "INTRO",
    state: timeline[0].state,
    title: "BFS - Tìm đường ngắn nhất",
    narration: "Chào bạn! Mình là Buta. Hãy cùng mình tìm đường ngắn nhất trên đồ thị bằng BFS. BFS mở rộng từng lớp từ điểm bắt đầu, nên chắc chắn tìm được đường ngắn nhất.",
    mood: "happy",
    duration: 5000,
  });

  // Process each step
  for (let i = 0; i < timeline.length; i++) {
    const step = timeline[i];
    
    if (step.action === "START") {
      frames.push({
        id: frames.length,
        kind: "INTRO",
        state: step.state,
        title: "Bắt đầu từ đỉnh start",
        narration: `Mình đang ở đỉnh ${graph.vertices[step.state.start].label}. Đây là điểm bắt đầu. Hãy lấy đỉnh này ra khỏi queue để bắt đầu.`,
        mood: "pointing",
        duration: 4000,
        highlightedVertex: step.state.start,
      });
    } else if (step.action === "DEQUEUE") {
      frames.push({
        id: frames.length,
        kind: "DEQUEUE",
        state: step.state,
        title: `Lấy ${graph.vertices[step.expectedVertex!].label} ra khỏi queue`,
        narration: `${graph.vertices[step.expectedVertex!].label} đang ở đầu queue. Hãy lấy nó ra để xét các neighbor của nó.`,
        mood: "explaining",
        duration: 4000,
        highlightedVertex: step.expectedVertex,
      });
    } else if (step.action === "VISIT") {
      frames.push({
        id: frames.length,
        kind: "VISIT",
        state: step.state,
        title: "Xét các neighbor",
        narration: `Đỉnh này có ${step.expectedNeighbors?.length || 0} neighbor chưa thăm. Hãy thêm chúng vào queue để xét sau.`,
        mood: "thinking",
        duration: 4500,
        highlightedVertex: step.expectedVertex,
        highlightedNeighbors: step.expectedNeighbors,
      });
    } else if (step.action === "ENQUEUE") {
      frames.push({
        id: frames.length,
        kind: "ENQUEUE",
        state: step.state,
        title: `Thêm ${graph.vertices[step.expectedVertex!].label} vào queue`,
        narration: `${graph.vertices[step.expectedVertex!].label} là neighbor chưa thăm. Thêm vào queue và đánh dấu visited để tránh lặp.`,
        mood: "proud",
        duration: 3500,
        highlightedVertex: step.expectedVertex,
      });
    } else if (step.action === "FOUND") {
      frames.push({
        id: frames.length,
        kind: "FOUND",
        state: step.state,
        title: "Đã tìm thấy đích!",
        narration: `Tuyệt vời! Đã tìm được đỉnh đích ${graph.vertices[step.expectedVertex!].label}. BFS đã tìm đường ngắn nhất!`,
        mood: "celebrate",
        duration: 5000,
        highlightedVertex: step.expectedVertex,
      });
    } else if (step.action === "DONE") {
      frames.push({
        id: frames.length,
        kind: "DONE",
        state: step.state,
        title: "Hoàn thành!",
        narration: "Xong rồi! Bạn đã học cách BFS hoạt động: dequeue → examine neighbors → enqueue, lặp lại cho đến khi tìm thấy đích.",
        mood: "happy",
        duration: 4000,
      });
    }
  }

  return frames;
}

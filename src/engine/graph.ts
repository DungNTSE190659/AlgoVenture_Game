/** Pure, UI-independent BFS engine for graph traversal.
 * Every snapshot is the state BEFORE its action.
 */

export type Vertex = {
  id: number;
  label: string;
  x: number;
  y: number;
};

export type Edge = {
  from: number;
  to: number;
};

export type ActionType =
  | "START"
  | "DEQUEUE"
  | "ENQUEUE"
  | "VISIT"
  | "FOUND"
  | "DONE";

export type GraphState = {
  vertices: Vertex[];
  edges: Edge[];
  queue: number[]; // IDs of vertices in queue
  visited: Set<number>; // IDs of visited vertices
  current: number | null; // ID of vertex being examined
  start: number; // ID of start vertex
  goal: number; // ID of goal vertex
  path: number[]; // Current path found
  layer: Map<number, number>; // Vertex ID -> layer number (distance from start)
};

export type BFSStep = {
  state: GraphState;
  action: ActionType;
  message: string;
  detail: string;
  expectedVertex?: number; // Vertex that should be acted on
  expectedNeighbors?: number[]; // Neighbors that should be enqueued
  step: number;
};

/** Create a simple graph for tutorial purposes */
export function createTutorialGraph(): GraphState {
  const vertices: Vertex[] = [
    { id: 0, label: "A", x: 100, y: 100 },
    { id: 1, label: "B", x: 200, y: 50 },
    { id: 2, label: "C", x: 200, y: 150 },
    { id: 3, label: "D", x: 300, y: 50 },
    { id: 4, label: "E", x: 300, y: 150 },
  ];
  const edges: Edge[] = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 1, to: 3 },
    { from: 2, to: 4 },
  ];
  return {
    vertices,
    edges,
    queue: [0],
    visited: new Set([0]),
    current: null,
    start: 0,
    goal: 4,
    path: [],
    layer: new Map([[0, 0]]),
  };
}

/** Create a graph with a cycle for intermediate difficulty */
export function createCycleGraph(): GraphState {
  const vertices: Vertex[] = [
    { id: 0, label: "A", x: 100, y: 100 },
    { id: 1, label: "B", x: 200, y: 50 },
    { id: 2, label: "C", x: 200, y: 150 },
    { id: 3, label: "D", x: 300, y: 100 },
    { id: 4, label: "E", x: 400, y: 50 },
    { id: 5, label: "F", x: 400, y: 150 },
  ];
  const edges: Edge[] = [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 5 },
    { from: 0, to: 2 }, // Creates cycle A-B-C-A
  ];
  return {
    vertices,
    edges,
    queue: [0],
    visited: new Set([0]),
    current: null,
    start: 0,
    goal: 5,
    path: [],
    layer: new Map([[0, 0]]),
  };
}

/** Create a complex graph for advanced difficulty */
export function createComplexGraph(): GraphState {
  const vertices: Vertex[] = [
    { id: 0, label: "A", x: 100, y: 100 },
    { id: 1, label: "B", x: 200, y: 50 },
    { id: 2, label: "C", x: 200, y: 150 },
    { id: 3, label: "D", x: 300, y: 50 },
    { id: 4, label: "E", x: 300, y: 150 },
    { id: 5, label: "F", x: 400, y: 50 },
    { id: 6, label: "G", x: 400, y: 150 },
    { id: 7, label: "H", x: 500, y: 100 },
  ];
  const edges: Edge[] = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 1, to: 3 },
    { from: 1, to: 4 },
    { from: 2, to: 5 },
    { from: 2, to: 6 },
    { from: 3, to: 7 },
    { from: 5, to: 7 },
  ];
  return {
    vertices,
    edges,
    queue: [0],
    visited: new Set([0]),
    current: null,
    start: 0,
    goal: 7,
    path: [],
    layer: new Map([[0, 0]]),
  };
}

/** Get neighbors of a vertex (undirected graph) */
function getNeighbors(vertexId: number, edges: Edge[]): number[] {
  const neighbors: number[] = [];
  for (const edge of edges) {
    if (edge.from === vertexId) neighbors.push(edge.to);
    if (edge.to === vertexId) neighbors.push(edge.from);
  }
  return neighbors;
}

/** Pure BFS algorithm that generates timeline steps */
export function createBFSTimeline(initialState: GraphState): BFSStep[] {
  const steps: BFSStep[] = [];
  const state = JSON.parse(JSON.stringify(initialState)) as GraphState;
  state.visited = new Set(initialState.visited);
  state.layer = new Map(initialState.layer);
  
  let stepCount = 0;
  
  // Initial state
  steps.push({
    state: cloneState(state),
    action: "START",
    message: `Bắt đầu từ đỉnh ${state.vertices[state.start].label}`,
    detail: `Mình đang ở ${state.vertices[state.start].label}. Hãy lấy đỉnh này ra khỏi queue để bắt đầu.`,
    expectedVertex: state.start,
    step: stepCount++,
  });
  
  let found = false;
  
  while (state.queue.length > 0 && !found) {
    const currentId = state.queue.shift()!;
    state.current = currentId;
    const currentVertex = state.vertices[currentId];
    const currentLayer = state.layer.get(currentId) ?? 0;
    
    // Check if we found the goal
    if (currentId === state.goal) {
      found = true;
      steps.push({
        state: cloneState(state),
        action: "FOUND",
        message: `Đã tìm thấy đỉnh đích ${currentVertex.label}!`,
        detail: `BFS đã tìm được đường đến ${currentVertex.label}. Đây là đường ngắn nhất với ${currentLayer} bước.`,
        expectedVertex: currentId,
        step: stepCount++,
      });
      break;
    }
    
    // Dequeue step
    steps.push({
      state: cloneState(state),
      action: "DEQUEUE",
      message: `Lấy ${currentVertex.label} ra khỏi queue`,
      detail: `${currentVertex.label} đang ở đầu queue. Hãy lấy nó ra để xét các neighbor.`,
      expectedVertex: currentId,
      step: stepCount++,
    });
    
    // Get neighbors
    const neighbors = getNeighbors(currentId, state.edges);
    const unvisitedNeighbors = neighbors.filter(n => !state.visited.has(n));
    
    // Visit step
    steps.push({
      state: cloneState(state),
      action: "VISIT",
      message: `Xét các neighbor của ${currentVertex.label}`,
      detail: `${currentVertex.label} có ${neighbors.length} neighbor: ${neighbors.map(n => state.vertices[n].label).join(", ")}.`,
      expectedVertex: currentId,
      expectedNeighbors: unvisitedNeighbors,
      step: stepCount++,
    });
    
    // Enqueue unvisited neighbors
    for (const neighborId of unvisitedNeighbors) {
      state.visited.add(neighborId);
      state.queue.push(neighborId);
      state.layer.set(neighborId, currentLayer + 1);
      
      steps.push({
        state: cloneState(state),
        action: "ENQUEUE",
        message: `Thêm ${state.vertices[neighborId].label} vào queue`,
        detail: `${state.vertices[neighborId].label} là neighbor chưa thăm. Thêm vào queue để xét sau.`,
        expectedVertex: neighborId,
        expectedNeighbors: [neighborId],
        step: stepCount++,
      });
    }
  }
  
  // Done step
  steps.push({
    state: cloneState(state),
    action: "DONE",
    message: "Hoàn thành!",
    detail: found ? "Đã tìm được đường đến đích." : "Không tìm được đường đến đích.",
    step: stepCount++,
  });
  
  return steps;
}

/** Clone state for snapshot */
function cloneState(state: GraphState): GraphState {
  return {
    vertices: state.vertices.map(v => ({ ...v })),
    edges: state.edges.map(e => ({ ...e })),
    queue: [...state.queue],
    visited: new Set(state.visited),
    current: state.current,
    start: state.start,
    goal: state.goal,
    path: [...state.path],
    layer: new Map(state.layer),
  };
}

/** Validate user action against expected step */
export function validateBFSAction(
  currentStep: BFSStep,
  action: ActionType,
  vertexId: number | null,
): { valid: boolean; message: string } {
  if (currentStep.action === "DEQUEUE") {
    if (action !== "DEQUEUE") {
      return { valid: false, message: "Hãy lấy đỉnh đầu queue ra." };
    }
    if (vertexId !== currentStep.expectedVertex) {
      return { valid: false, message: "Đỉnh này chưa đến lượt. Hãy lấy đỉnh đầu queue." };
    }
    return { valid: true, message: "Đúng rồi!" };
  }
  
  if (currentStep.action === "ENQUEUE") {
    if (action !== "ENQUEUE") {
      return { valid: false, message: "Hãy thêm neighbor vào queue." };
    }
    if (vertexId === null) {
      return { valid: false, message: "Hãy chọn một đỉnh." };
    }
    // Check if the vertex matches the expected vertex OR is in expected neighbors
    if (currentStep.expectedVertex !== vertexId && !currentStep.expectedNeighbors?.includes(vertexId)) {
      return { valid: false, message: "Đỉnh này không phải neighbor của đỉnh đang xét." };
    }
    return { valid: true, message: "Đúng rồi!" };
  }
  
  return { valid: false, message: "Hành động không hợp lệ." };
}

/** Create graph based on difficulty */
export type GraphDifficulty = "tutorial" | "cycle" | "complex";

export function createGraph(difficulty: GraphDifficulty): GraphState {
  switch (difficulty) {
    case "tutorial":
      return createTutorialGraph();
    case "cycle":
      return createCycleGraph();
    case "complex":
      return createComplexGraph();
    default:
      return createTutorialGraph();
  }
}

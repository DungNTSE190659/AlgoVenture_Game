import type { GraphState, Vertex, Edge } from "../engine/graph";

type Props = {
  state: GraphState;
  onVertexClick?: (vertexId: number) => void;
  selectedVertex?: number | null;
  highlightedVertices?: number[];
  paused?: boolean;
};

export default function GraphBoard({
  state,
  onVertexClick,
  selectedVertex,
  highlightedVertices = [],
  paused = false,
}: Props) {
  const width = 600;
  const height = 400;
  const vertexRadius = 25;

  const getVertexColor = (vertex: Vertex): string => {
    const id = vertex.id;
    
    // Currently being examined
    if (id === state.current) return "#9b59b6";
    
    if (state.path.includes(id)) return "#25a875";

    // Start vertex
    if (id === state.start) return "#f39c12";

    // Goal vertex
    if (id === state.goal) return "#e87565";

    // Visited
    if (state.visited.has(id)) return "#2ecc71";
    
    // In queue
    if (state.queue.includes(id)) return "#3498db";
    
    // Unvisited
    return "#95a5a6";
  };

  const getVertexStyle = (vertex: Vertex): React.CSSProperties => {
    const isSelected = selectedVertex === vertex.id;
    const isHighlighted = highlightedVertices.includes(vertex.id);
    
    return {
      cursor: onVertexClick ? "pointer" : "default",
      transition: "all 0.3s ease",
      filter: isSelected ? "brightness(1.2)" : isHighlighted ? "brightness(1.1)" : "none",
    };
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="graph-board"
      style={{ width: "100%", height: "auto", maxWidth: "600px" }}
    >
      {/* Edges */}
      {state.edges.map((edge, index) => {
        const from = state.vertices[edge.from];
        const to = state.vertices[edge.to];
        const isPathEdge = state.path.some((id, pathIndex) =>
          pathIndex < state.path.length - 1 &&
          ((id === edge.from && state.path[pathIndex + 1] === edge.to) ||
            (id === edge.to && state.path[pathIndex + 1] === edge.from)),
        );
        return (
          <line
            key={`edge-${index}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isPathEdge ? "#20a875" : "#bdc3c7"}
            strokeWidth={isPathEdge ? "6" : "3"}
            strokeLinecap="round"
          />
        );
      })}

      {/* Vertices */}
      {state.vertices.map((vertex) => (
        <g
          key={vertex.id}
          onClick={() => onVertexClick?.(vertex.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onVertexClick?.(vertex.id);
            }
          }}
          role={onVertexClick ? "button" : undefined}
          tabIndex={onVertexClick && !paused ? 0 : undefined}
          aria-label={`${vertex.label}${vertex.id === state.start ? ", điểm bắt đầu" : ""}${vertex.id === state.goal ? ", đích" : ""}${state.queue[0] === vertex.id ? ", đầu queue" : ""}`}
          aria-disabled={paused || undefined}
          style={getVertexStyle(vertex)}
        >
          {/* Vertex circle */}
          <circle
            cx={vertex.x}
            cy={vertex.y}
            r={vertexRadius}
            fill={getVertexColor(vertex)}
            stroke="#2c3e50"
            strokeWidth="3"
            strokeDasharray={selectedVertex === vertex.id ? "5 3" : undefined}
          />

          {/* Vertex label */}
          <text
            x={vertex.x}
            y={vertex.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="16"
            fontWeight="bold"
            style={{ pointerEvents: "none" }}
          >
            {vertex.label}
          </text>

          {/* Layer number if visited */}
          {state.layer.has(vertex.id) && (
            <text
              x={vertex.x}
              y={vertex.y + vertexRadius + 15}
              textAnchor="middle"
              fill="#7f8c8d"
              fontSize="12"
              fontWeight="bold"
              style={{ pointerEvents: "none" }}
            >
              L{state.layer.get(vertex.id)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

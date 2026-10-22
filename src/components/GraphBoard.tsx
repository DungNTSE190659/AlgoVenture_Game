import { useEffect, useRef, useState } from "react";
import type { GraphState, Vertex } from "../engine/graph";

type Props = {
  state: GraphState;
  onVertexClick?: (vertexId: number) => void;
  selectedVertex?: number | null;
  highlightedVertices?: number[];
  paused?: boolean;
  /** Called once the board SVG has a known pixel size — used by Pig walker */
  onGeometry?: (svgWidth: number, svgHeight: number, boardRect: DOMRect) => void;
  /** Vertex id currently being examined (for Pig walker highlight) */
  activeVertex?: number | null;
  /** Set of vertex ids that were just correctly actioned — triggers pop animation */
  poppedVertices?: Set<number>;
};

const SVG_WIDTH = 600;
const SVG_HEIGHT = 400;
/** Minimum rendered radius that guarantees ≥44px tap target on mobile.
 *  44px / (renderedSVGwidth / 600) → threshold in SVG units. */
const MIN_TAP_PX = 44;

export default function GraphBoard({
  state,
  onVertexClick,
  selectedVertex,
  highlightedVertices = [],
  paused = false,
  onGeometry,
  activeVertex,
  poppedVertices,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [vertexRadius, setVertexRadius] = useState(28);

  // Compute radius so rendered tap area is ≥ MIN_TAP_PX regardless of viewport
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function update() {
      const rect = svg!.getBoundingClientRect();
      if (rect.width === 0) return;
      const scale = rect.width / SVG_WIDTH;
      // Minimum SVG-unit radius to produce MIN_TAP_PX rendered diameter
      const minR = Math.ceil((MIN_TAP_PX / 2) / scale);
      setVertexRadius(Math.max(28, Math.min(38, minR)));
      onGeometry?.(rect.width, rect.height, rect);
    }

    update();
    const observer = new ResizeObserver(update);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [onGeometry]);

  const getVertexColor = (vertex: Vertex): string => {
    const id = vertex.id;
    if (id === activeVertex)      return "#9b59b6";   // being walked to by Pig
    if (id === state.current)     return "#9b59b6";   // currently examined
    if (state.path.includes(id))  return "#25a875";   // on shortest path
    if (id === state.start)       return "#f39c12";   // start
    if (id === state.goal)        return "#e87565";   // goal
    if (state.visited.has(id))    return "#2ecc71";   // visited
    if (state.queue.includes(id)) return "#3498db";   // in queue
    return "#95a5a6";                                 // unvisited
  };

  const getStrokeDash = (vertex: Vertex) =>
    selectedVertex === vertex.id ? "5 3" : undefined;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="graph-board"
      style={{ width: "100%", height: "auto" }}
      aria-label="Đồ thị BFS"
    >
      {/* ── Edges ── */}
      {state.edges.map((edge, index) => {
        const from = state.vertices[edge.from];
        const to   = state.vertices[edge.to];
        const isPath = state.path.some(
          (id, pi) =>
            pi < state.path.length - 1 &&
            ((id === edge.from && state.path[pi + 1] === edge.to) ||
             (id === edge.to   && state.path[pi + 1] === edge.from)),
        );
        return (
          <line
            key={`e${index}`}
            x1={from.x} y1={from.y}
            x2={to.x}   y2={to.y}
            stroke={isPath ? "#20a875" : "#bdc3c7"}
            strokeWidth={isPath ? 7 : 3}
            strokeLinecap="round"
          />
        );
      })}

      {/* ── Vertices ── */}
      {state.vertices.map((vertex) => {
        const isPopped = poppedVertices?.has(vertex.id);
        return (
          <g
            key={vertex.id}
            className={isPopped ? "vertex-pop" : undefined}
            onClick={() => onVertexClick?.(vertex.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onVertexClick?.(vertex.id);
              }
            }}
            role={onVertexClick ? "button" : undefined}
            tabIndex={onVertexClick && !paused ? 0 : undefined}
            aria-label={`${vertex.label}${vertex.id === state.start ? ", điểm bắt đầu" : ""}${vertex.id === state.goal ? ", đích" : ""}${state.queue[0] === vertex.id ? ", đầu hàng chờ" : ""}`}
            aria-disabled={paused || undefined}
            style={{
              cursor: onVertexClick ? "pointer" : "default",
              filter:
                selectedVertex === vertex.id
                  ? "brightness(1.2)"
                  : highlightedVertices.includes(vertex.id)
                  ? "brightness(1.12)"
                  : "none",
            }}
          >
            {/* Tap-target circle (invisible, large) */}
            <circle
              cx={vertex.x}
              cy={vertex.y}
              r={vertexRadius + 6}
              fill="transparent"
              stroke="none"
              aria-hidden="true"
            />
            {/* Visible vertex */}
            <circle
              cx={vertex.x}
              cy={vertex.y}
              r={vertexRadius}
              fill={getVertexColor(vertex)}
              stroke="#2c3e50"
              strokeWidth="2.5"
              strokeDasharray={getStrokeDash(vertex)}
            />
            {/* Letter label */}
            <text
              x={vertex.x}
              y={vertex.y - 4}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={vertexRadius < 32 ? "16" : "18"}
              fontWeight="bold"
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {vertex.label}
            </text>
            {/* Place name sub-label (added in task 8 via vertex.place) */}
            {"place" in vertex && (vertex as Vertex & { place: string }).place && (
              <text
                x={vertex.x}
                y={vertex.y + 12}
                textAnchor="middle"
                dominantBaseline="central"
                fill="rgba(255,255,255,0.85)"
                fontSize="10"
                fontWeight="600"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {(vertex as Vertex & { place: string }).place}
              </text>
            )}
            {/* Layer badge */}
            {state.layer.has(vertex.id) && (
              <text
                x={vertex.x}
                y={vertex.y + vertexRadius + 14}
                textAnchor="middle"
                fill="#7f8c8d"
                fontSize="12"
                fontWeight="bold"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                L{state.layer.get(vertex.id)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

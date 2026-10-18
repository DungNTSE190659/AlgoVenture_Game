import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Check, Flag } from "lucide-react";
import type { Item } from "../engine/quicksort";
import type { LessonFrame } from "../engine/lesson";

export function groupFor(frame: LessonFrame, index: number): string {
  if (frame.settled.includes(index)) return "fixed";
  if (index < frame.range[0] || index > frame.range[1]) return "inactive";
  if (index === frame.pivotIndex) return "pivot";
  if (frame.kind === "INTRO" || frame.kind === "FOCUS") return "neutral";
  if (index <= frame.boundary) return "small";
  if (index <= frame.processedEnd) return "large";
  return "pending";
}

function Block({
  item,
  index,
  frame,
  motionPaused,
  animations,
}: {
  item: Item;
  index: number;
  frame: LessonFrame;
  motionPaused: boolean;
  animations: React.RefObject<Set<Animation>>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef(index);
  const activeAnimation = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    activeAnimation.current?.cancel();
    const element = ref.current;
    if (
      element &&
      previous.current !== index &&
      frame.swapIds?.includes(item.id) &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const row = element.parentElement!;
      const stride =
        element.offsetWidth + parseFloat(getComputedStyle(row).columnGap);
      const dx = (previous.current - index) * stride;
      const arc = frame.swapIds?.[0] === item.id ? -58 : 58;
      const animation = element.animate(
        [
          { transform: `translate(${dx}px, 0) rotate(0deg)`, offset: 0 },
          {
            transform: `translate(${dx * 0.55}px, ${arc}px) rotate(${dx > 0 ? -7 : 7}deg)`,
            offset: 0.48,
          },
          { transform: "translate(0, 0) rotate(0deg)", offset: 1 },
        ],
        { duration: 1350, easing: "cubic-bezier(.45,0,.2,1)" },
      );
      animations.current.add(animation);
      activeAnimation.current = animation;
      if (motionPaused) animation.pause();
      void animation.finished
        .catch(() => {})
        .finally(() => animations.current.delete(animation));
    }
    previous.current = index;
  }, [index, frame.id]);
  const group = groupFor(frame, index);
  const scan = frame.scanIndex === index;
  const swapping = frame.swapIds?.includes(item.id);
  return (
    <div
      ref={ref}
      className={`lesson-cell cell-${group} ${scan ? "cell-scan" : ""} ${swapping ? "cell-swapping" : ""}`}
      data-item-id={item.id}
      data-index={index}
      data-group={group}
    >
      <div className="lesson-number">
        {item.value}
        {group === "fixed" && (
          <Check className="lesson-fixed-check" size={18} strokeWidth={3} />
        )}
      </div>
    </div>
  );
}

export default function LessonBoard({
  frame,
  motionPaused,
}: {
  frame: LessonFrame;
  motionPaused: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const animations = useRef(new Set<Animation>());
  const [geometry, setGeometry] = useState({
    tile: 104,
    gap: 16,
    padding: 24,
    width: 800,
  });
  const marker = useId().replaceAll(":", "");
  useLayoutEffect(() => {
    const measure = () => {
      const element = row.current;
      const tile = element?.querySelector<HTMLElement>(".lesson-cell");
      if (element && tile) {
        const css = getComputedStyle(element);
        const next = {
          tile: tile.offsetWidth,
          gap: parseFloat(css.columnGap),
          padding: parseFloat(css.paddingLeft),
          width: element.offsetWidth,
        };
        setGeometry((old) =>
          JSON.stringify(old) === JSON.stringify(next) ? old : next,
        );
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (row.current) observer.observe(row.current);
    return () => observer.disconnect();
  }, [frame.items.length]);
  useEffect(() => {
    for (const animation of animations.current)
      motionPaused ? animation.pause() : animation.play();
  }, [motionPaused]);
  useEffect(
    () => () => {
      for (const animation of animations.current) animation.cancel();
      animations.current.clear();
    },
    [],
  );
  useEffect(() => {
    const index = frame.scanIndex ?? frame.nextSlot ?? frame.pivotIndex;
    if (index < 0 || !viewport.current) return;
    const target =
      geometry.padding +
      index * (geometry.tile + geometry.gap) +
      geometry.tile / 2;
    viewport.current.scrollTo({
      left: target - viewport.current.clientWidth / 2,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [frame.id, geometry]);
  const x = (index: number) =>
    geometry.padding + index * (geometry.tile + geometry.gap);
  const width = (count: number) =>
    count * geometry.tile + Math.max(0, count - 1) * geometry.gap;
  const pivot = frame.items[frame.pivotIndex]?.value;
  const segments: { from: number; to: number; group: string }[] = [];
  frame.items.forEach((_, index) => {
    const group = groupFor(frame, index);
    const last = segments.at(-1);
    if (last?.group === group) last.to = index;
    else segments.push({ from: index, to: index, group });
  });
  const swapIndices = frame.swapIds?.map((id) =>
    frame.items.findIndex((item) => item.id === id),
  );
  return (
    <div className="lesson-board" aria-label="Mảng đang được minh họa">
      <div className="lesson-array-viewport" ref={viewport}>
        <div className="lesson-array-content" style={{ width: geometry.width }}>
          <div
            className="lesson-pointers"
            style={{ height: 44 }}
            aria-hidden="true"
          >
            {frame.pivotIndex >= 0 && (
              <span
                className="lesson-pivot-pointer"
                style={{ left: x(frame.pivotIndex) + geometry.tile / 2 }}
              >
                <Flag size={15} fill="currentColor" />
                {frame.kind === "FIXED" || frame.kind === "SPLIT"
                  ? "Đúng vị trí"
                  : "Chốt"}
              </span>
            )}
            {frame.scanIndex !== null && (
              <span
                className="lesson-scan-pointer"
                style={{ left: x(frame.scanIndex) + geometry.tile / 2 }}
              >
                Đang xét
                <ArrowDown size={19} />
              </span>
            )}
            {frame.targetRole !== null &&
              frame.nextSlot !== null &&
              frame.nextSlot !== frame.pivotIndex &&
              frame.nextSlot !== frame.scanIndex && (
                <span
                  className="lesson-target-pointer"
                  style={{ left: x(frame.nextSlot) + geometry.tile / 2 }}
                >
                  {frame.targetRole === "pivot" ? "Ô đặt chốt" : "Ô nhỏ tiếp"}
                  <ArrowDown size={18} />
                </span>
              )}
          </div>
          <div className="lesson-array-row" ref={row}>
            {frame.nextSlot !== null && frame.targetRole && (
              <div
                className={`lesson-goal-slot goal-${frame.targetRole}`}
                style={{
                  left: x(frame.nextSlot) - 5,
                  width: geometry.tile + 10,
                }}
                role="img"
                aria-label={`${frame.targetRole === "small" ? (frame.decision === "keep-small" ? "Ô nhận số nhỏ này" : "Ô nhận số nhỏ tiếp theo") : "Ô đặt chốt"}: ${frame.nextSlot}`}
                data-target-index={frame.nextSlot}
              >
                <span />
              </div>
            )}
            {frame.range[1] >= frame.range[0] &&
              frame.kind !== "INTRO" &&
              frame.kind !== "DONE" && (
                <div
                  className="lesson-active-range"
                  style={{
                    left: x(frame.range[0]) - 9,
                    width: width(frame.range[1] - frame.range[0] + 1) + 18,
                  }}
                />
              )}
            {frame.items.map((item, index) => (
              <Block
                key={item.id}
                item={item}
                index={index}
                frame={frame}
                motionPaused={motionPaused}
                animations={animations}
              />
            ))}
          </div>
          {swapIndices && swapIndices[0] !== swapIndices[1] && (
            <svg
              className={`lesson-swap-arcs ${frame.kind === "MOVED" || frame.kind === "FIXED" ? "arcs-moved" : ""}`}
              viewBox={`0 0 ${geometry.width} 200`}
              preserveAspectRatio="none"
              aria-label="Đường di chuyển của hai phần tử"
            >
              <defs>
                <marker
                  id={marker}
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path
                    d="M0 0L6 3L0 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </marker>
              </defs>
              <path
                d={`M${x(swapIndices[0]) + geometry.tile / 2} 68 Q${(x(swapIndices[0]) + x(swapIndices[1])) / 2 + geometry.tile / 2} -14 ${x(swapIndices[1]) + geometry.tile / 2} 68`}
                markerEnd={`url(#${marker})`}
              />
              <path
                d={`M${x(swapIndices[1]) + geometry.tile / 2} 137 Q${(x(swapIndices[0]) + x(swapIndices[1])) / 2 + geometry.tile / 2} 215 ${x(swapIndices[0]) + geometry.tile / 2} 137`}
                markerEnd={`url(#${marker})`}
              />
            </svg>
          )}
          <div className="lesson-index-row" aria-label="Chỉ số các phần tử">
            {frame.items.map((_, index) => (
              <span
                key={index}
                style={{ left: x(index), width: geometry.tile }}
              >
                {index}
              </span>
            ))}
          </div>
          <div className="lesson-group-bars">
            {segments.map((segment) => {
              const label =
                segment.group === "small"
                  ? `≤ ${pivot}`
                  : segment.group === "large"
                    ? `> ${pivot}`
                    : segment.group === "pending"
                      ? "Chưa xét"
                      : segment.group === "fixed"
                        ? "✓"
                        : "";
              return label ? (
                <span
                  key={`${segment.from}-${segment.group}`}
                  className={`group-bar group-bar-${segment.group}`}
                  style={{
                    left: x(segment.from),
                    width: width(segment.to - segment.from + 1),
                  }}
                >
                  {label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>
      {frame.items.length > 5 && (
        <span className="lesson-scroll-note">↔ Vuốt để xem toàn bộ mảng</span>
      )}
    </div>
  );
}

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { BubbleState } from "../engine/bubbleSort";
import type { Item } from "../engine/quicksort";

type Props = {
  state: BubbleState;
  interactive: boolean;
  paused: boolean;
  onMove: (id: number, target: number) => void;
};
type Drag = { id: number; pointer: number; startX: number; startY: number; x: number; y: number; moved: boolean };

export default function BubbleRunBoard({ state, interactive, paused, onMove }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [ghost, setGhost] = useState<Drag | null>(null);
  useEffect(() => {
    if (!interactive || paused) {
      drag.current = null;
      setGhost(null);
    }
  }, [interactive, paused]);
  function begin(event: PointerEvent<HTMLButtonElement>, id: number) {
    if (!interactive || paused || event.button !== 0) return;
    drag.current = { id, pointer: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, moved: false };
    ref.current?.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointer !== event.pointerId) return;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    gesture.moved ||= Math.hypot(gesture.x - gesture.startX, gesture.y - gesture.startY) > 7;
    if (gesture.moved) setGhost({ ...gesture });
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointer !== event.pointerId) return;
    drag.current = null;
    setGhost(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!gesture.moved || !interactive || paused) return;
    const board = ref.current;
    if (!board) return;
    const bounds = board.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top - 60 || event.clientY > bounds.bottom + 60) return;
    const tiles = Array.from(board.querySelectorAll<HTMLElement>(".bubble-tile"));
    const target = tiles.reduce((best, tile, index) => {
      const box = tile.getBoundingClientRect();
      const distance = Math.abs(event.clientX - box.left - box.width / 2);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Infinity }).index;
    onMove(gesture.id, target);
  }
  return (
    <div className="bubble-board-area bubble-run-area">
      <div className="bubble-board bubble-run-track" ref={ref}
        style={{ "--count": state.items.length } as CSSProperties} aria-label="Mảng Bubble Sort"
        onPointerMove={move} onPointerUp={end}
        onPointerCancel={() => { drag.current = null; setGhost(null); }}>
        <div className="bubble-river" aria-hidden="true" />
        {state.items.map((item, index) => (
          <RunBubble key={item.id} item={item} index={index} enabled={interactive && !paused}
            held={ghost?.id === item.id} paused={paused}
            onPointerDown={event => begin(event, item.id)} onClick={() => {}}
            onKeyDown={event => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                onMove(item.id, index + (event.key === "ArrowLeft" ? -1 : 1));
              }
            }} />
        ))}
      </div>
      {ghost && <div className="bubble-drag-ghost bubble-run-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
        {state.items.find(item => item.id === ghost.id)?.value}<small>GIỮ VÀ KÉO</small>
      </div>}
    </div>
  );
}

function RunBubble({
  item,
  index,
  enabled,
  held,
  paused,
  onPointerDown,
  onClick,
  onKeyDown,
}: {
  item: Item;
  index: number;
  enabled: boolean;
  held: boolean;
  paused: boolean;
  onPointerDown: React.PointerEventHandler<HTMLButtonElement>;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLButtonElement>;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const previous = useRef(index),
    animation = useRef<Animation | null>(null),
    pausedByUi = useRef(false);
  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = index;
    const node = ref.current;
    if (
      !node ||
      old === index ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const width = node.getBoundingClientRect().width,
      parent = node.parentElement!;
    const stride =
      (parent.getBoundingClientRect().width - width) /
      (parent.querySelectorAll(".bubble-tile").length - 1);
    const dx = (old - index) * stride;
    animation.current?.cancel();
    pausedByUi.current = paused;
    animation.current = node.animate(
      [
        { transform: `translate(${dx}px,0)` },
        {
          transform: `translate(${dx * 0.5}px,${old < index ? -42 : 35}px) scale(1.08)`,
          offset: 0.5,
        },
        { transform: "translate(0,0)" },
      ],
      { duration: 450, easing: "cubic-bezier(.2,.65,.35,1)" },
    );
    if (paused) animation.current.pause();
  }, [index, paused]);
  useEffect(() => {
    if (paused && animation.current?.playState === "running") {
      animation.current.pause();
      pausedByUi.current = true;
    } else if (!paused && pausedByUi.current) {
      animation.current?.play();
      pausedByUi.current = false;
    }
  }, [paused]);
  useEffect(() => () => animation.current?.cancel(), []);
  return (
    <button
      ref={ref}
      className={`bubble-tile bubble-run-tile ${held ? "is-dragging" : ""}`}
      style={{ left: `calc(var(--step) * ${index})` }}
      disabled={!enabled}
      aria-label={`Bong bóng ${item.value}, vị trí ${index + 1}. Kéo sang trái hoặc phải, hoặc dùng phím mũi tên`}
      data-bubble-id={item.id}
      data-value={item.value}
      data-index={index}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <span className="bubble-tile-shine" />
      <strong>{item.value}</strong>
      <small>{index + 1}</small>
    </button>
  );
}

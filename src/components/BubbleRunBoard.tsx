import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { BubbleState } from "../engine/bubbleSort";
import type { Item } from "../engine/quicksort";

type Props = {
  state: BubbleState;
  interactive: boolean;
  paused: boolean;
  onMove: (id: number, target: number) => void;
};
type Drag = {
  id: number; pointer: number; startX: number; startY: number; x: number; y: number; moved: boolean;
  width: number; height: number; labelStyle: CSSProperties; paddingBottom: string;
};

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
    const tile = event.currentTarget;
    const bounds = tile.getBoundingClientRect();
    const label = getComputedStyle(tile.querySelector("strong")!);
    drag.current = {
      id, pointer: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: event.clientX, y: event.clientY, moved: false,
      width: bounds.width, height: bounds.height, paddingBottom: getComputedStyle(tile).paddingBottom,
      labelStyle: { fontSize: label.fontSize, fontWeight: label.fontWeight, lineHeight: label.lineHeight,
        WebkitTextStrokeWidth: label.webkitTextStrokeWidth, textShadow: label.textShadow },
    };
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
    <div className="bubble-board-area bubble-run-area" style={{ "--count": state.items.length } as CSSProperties}>
      <div className="bubble-board bubble-run-track" ref={ref}
        style={{ "--count": state.items.length } as CSSProperties} aria-label="Mảng Bubble Sort"
        onPointerMove={move} onPointerUp={end}
        onPointerCancel={() => { drag.current = null; setGhost(null); }}>
        {state.items.map((item, index) => (
          <RunBubble settled={state.phase === "done"} key={item.id} item={item} index={index} enabled={interactive && !paused}
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
      {ghost && <div className="bubble-drag-ghost bubble-run-ghost" style={{ left: ghost.x, top: ghost.y, width: ghost.width, height: ghost.height, paddingBottom: ghost.paddingBottom }} aria-hidden="true">
        <strong style={ghost.labelStyle}>{state.items.find(item => item.id === ghost.id)?.value}</strong>
      </div>}
    </div>
  );
}

function RunBubble({
  item,
  index,
  enabled,
  settled,
  held,
  paused,
  onPointerDown,
  onClick,
  onKeyDown,
}: {
  item: Item;
  index: number;
  enabled: boolean;
  settled: boolean;
  held: boolean;
  paused: boolean;
  onPointerDown: React.PointerEventHandler<HTMLButtonElement>;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLButtonElement>;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const previous = useRef(index);
  const animation = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const node = ref.current, before = previous.current;
    previous.current = index;
    if (!node || before === index || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const parent = node.parentElement!;
    const stride = (parent.getBoundingClientRect().width - node.getBoundingClientRect().width)
      / (parent.querySelectorAll(".bubble-tile").length - 1);
    const dx = (before - index) * stride;
    animation.current?.cancel();
    animation.current = node.animate([
      { translate: `${dx}px 0` },
      { translate: `${dx / 2}px -7px`, offset: .5 },
      { translate: "0px 3px", offset: .88 },
      { translate: "0px 0px" },
    ], { duration: 450, easing: "ease-in-out" });
    if (paused) animation.current.pause();
  }, [index, paused]);
  useEffect(() => {
    if (paused) animation.current?.pause();
    else if (animation.current?.playState === "paused") animation.current.play();
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
      <img className="bubble-tile-art" src={`${import.meta.env.BASE_URL}assets/bubble-ui/tile${settled ? "-settled" : ""}.svg`} alt="" draggable={false} />
      <strong>{item.value}</strong>
      <small>{index + 1}</small>
    </button>
  );
}

/** Identities follow the cards through swaps, including equal values. */
export function FriendArt({ id, resting }: { id: number; resting: boolean }) {
  const kind = id % 4;
  const fur = ["#dca477", "#e5d3b4", "#b7bcb2", "#bd9a7b"][kind];
  const scarf = ["#a8bd94", "#b7a6c8", "#d9b276", "#94b9bf", "#d19e9c", "#a8b8d3", "#c8b997", "#a9c6b1"][id % 8];
  return <svg className="bridge-friend-art" viewBox="0 0 100 116" aria-hidden="true">
    <ellipse cx="50" cy="108" rx="30" ry="5" fill="#685c4230" />
    <g className="friend-body">
      <path d="M28 86l-4 19q6 7 14 1l4-15m16 0 4 15q8 6 14-1l-4-19" fill={fur} stroke="#826f5b" strokeWidth="2" />
      <ellipse cx="50" cy="78" rx="28" ry="25" fill={fur} stroke="#826f5b" strokeWidth="2" />
      {kind === 1 ? <><ellipse cx="33" cy="25" rx="10" ry="23" fill={fur} stroke="#826f5b" strokeWidth="2" /><ellipse cx="67" cy="25" rx="10" ry="23" fill={fur} stroke="#826f5b" strokeWidth="2" /><path d="M33 12v21m34-21v21" stroke="#d3ada1" strokeWidth="6" strokeLinecap="round" /></> : kind === 0 ? <><path d="M20 44L15 9l29 20m12 0L85 9l-5 35" fill={fur} stroke="#826f5b" strokeWidth="2" /><path d="M22 20l3 18 11-8m42-10-3 18-11-8" fill="#efd6ba" /></> : <><circle cx="26" cy="28" r="14" fill={fur} stroke="#826f5b" strokeWidth="2" /><circle cx="74" cy="28" r="14" fill={fur} stroke="#826f5b" strokeWidth="2" /><circle cx="26" cy="28" r="7" fill="#d5b8a2" /><circle cx="74" cy="28" r="7" fill="#d5b8a2" /></>}
      <ellipse cx="50" cy="47" rx="34" ry="28" fill={fur} stroke="#826f5b" strokeWidth="2" />
      {kind === 2 && <path d="M19 41q13-15 25 0l-1 10q-16 8-24-10m62 0q-13-15-25 0l1 10q16 8 24-10" fill="#7f8e86" />}
      <ellipse cx="50" cy="57" rx="20" ry="13" fill="#faf0d9" />
      {resting ? <path d="M31 45q5 5 10 0m18 0q5 5 10 0" fill="none" stroke="#615747" strokeWidth="2.7" strokeLinecap="round" /> : <><ellipse cx="36" cy="44" rx="3" ry="4" fill="#615747" /><ellipse cx="64" cy="44" rx="3" ry="4" fill="#615747" /></>}
      <path d="M46 53q4-4 8 0l-4 4Z" fill="#73614f" /><path d="M50 57v4m-6 0q6 6 12 0" fill="none" stroke="#73614f" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="27" cy="55" rx="5" ry="3" fill="#d794853d" /><ellipse cx="73" cy="55" rx="5" ry="3" fill="#d794853d" />
      <path d="M27 68q23 9 46 0l-3 10q-20 7-40 0Z" fill={scarf} stroke="#826f5b" strokeWidth="1.5" /><path d="M64 74l10 15-13-2-5-12" fill={scarf} stroke="#826f5b" strokeWidth="1.5" />
    </g>
  </svg>;
}

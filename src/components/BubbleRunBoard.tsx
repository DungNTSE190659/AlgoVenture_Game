import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { Check } from "lucide-react";
import type { BubbleState } from "../engine/bubbleSort";
import type { Item } from "../engine/quicksort";

type Props = {
  onInteract: () => void;
  state: BubbleState;
  interactive: boolean;
  paused: boolean;
  onPush: (id: number) => boolean;
  onHandoff: () => void;
};
type Hold = {
  id: number;
  pointer: number;
  startX: number;
  x: number;
  y: number;
  steps: number;
  waiting: boolean;
  blocked: boolean;
};

/** A held bubble can travel through several adjacent comparisons in one gesture. */
export default function BubbleRunBoard({
  onInteract,
  state,
  interactive,
  paused,
  onPush,
  onHandoff,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const hold = useRef<Hold | null>(null);
  const [ghost, setGhost] = useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
  const suppressClick = useRef(false);
  const current = useRef({ state, interactive, paused, onPush, onHandoff });
  current.current = { state, interactive, paused, onPush, onHandoff };

  function advance() {
    const gesture = hold.current,
      {
        state: s,
        interactive: enabled,
        paused: isPaused,
        onPush: push,
        onHandoff: handoff,
      } = current.current;
    if (
      !gesture ||
      gesture.blocked ||
      gesture.waiting ||
      !enabled ||
      isPaused ||
      s.phase !== "compare"
    )
      return;
    const left = s.items[s.pair],
      right = s.items[s.pair + 1];
    if (gesture.id !== left.id && gesture.id !== right.id) {
      hold.current = null;
      setGhost(null);
      return;
    }
    const target = ref.current?.querySelector<HTMLElement>(
      `[data-bubble-id="${right.id}"]`,
    );
    if (!target) return;
    const box = target.getBoundingClientRect();
    const stride = box.width + (window.innerWidth <= 700 ? 8 : 14);
    const goal =
      gesture.id === left.id
        ? box.left + box.width * 0.5
        : Math.min(
            window.innerWidth - 12,
            box.left + box.width * 0.5 + stride * 0.65,
          );
    if (
      gesture.x < goal ||
      gesture.x - gesture.startX < 12 ||
      Math.abs(gesture.y - (box.top + box.height / 2)) > 100
    )
      return;
    // A long drag ends naturally when a larger neighbour takes over the relay.
    if (
      gesture.steps > 0 &&
      gesture.id === left.id &&
      left.value <= right.value
    ) {
      gesture.blocked = true;
      setGhost(null);
      handoff();
      return;
    }
    gesture.waiting = true;
    if (push(gesture.id)) gesture.steps++;
    else {
      gesture.blocked = true;
      setGhost(null);
    }
  }
  useEffect(() => {
    if (paused || state.phase !== "compare") {
      hold.current = null;
      setGhost(null);
      return;
    }
    if (interactive && hold.current) {
      hold.current.waiting = false;
      advance();
    }
  }, [interactive, paused, state]);

  function begin(event: PointerEvent<HTMLButtonElement>, id: number) {
    if (!interactive || event.button !== 0) return;
    onInteract();
    const board = ref.current;
    if (!board) return;
    suppressClick.current = false;
    hold.current = {
      id,
      pointer: event.pointerId,
      startX: event.clientX,
      x: event.clientX,
      y: event.clientY,
      steps: 0,
      waiting: false,
      blocked: false,
    };
    // Capture on the board: the bubble itself becomes temporarily disabled during a swap.
    board.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const gesture = hold.current;
    if (!gesture || gesture.pointer !== event.pointerId) return;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    if (
      Math.hypot(gesture.x - gesture.startX, event.movementY) > 7 &&
      !gesture.blocked
    ) {
      suppressClick.current = true;
      setGhost({ id: gesture.id, x: gesture.x, y: gesture.y });
      advance();
    }
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    if (hold.current?.pointer !== event.pointerId) return;
    advance();
    hold.current = null;
    setGhost(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  const active = state.items
    .slice(state.pair, state.pair + 2)
    .map((item) => item.id);
  return (
    <div className="bubble-board-area bubble-run-area">
      <div
        className="bubble-board bubble-run-track"
        ref={ref}
        style={{ "--count": state.items.length } as CSSProperties}
        aria-label="Mảng Bubble Sort"
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={() => {
          hold.current = null;
          setGhost(null);
        }}
      >
        <div className="bubble-river" aria-hidden="true" />
        {state.phase === "compare" && (
          <div
            className="bubble-pair-window"
            style={{ left: `calc(var(--step) * ${state.pair} - 8px)` }}
            aria-hidden="true"
          ></div>
        )}
        {state.items.map((item, index) => (
          <RunBubble
            key={item.id}
            item={item}
            index={index}
            settled={index > state.end}
            active={state.phase === "compare" && active.includes(item.id)}
            enabled={interactive && active.includes(item.id)}
            held={ghost?.id === item.id}
            paused={paused}
            onPointerDown={(event) => begin(event, item.id)}
            onClick={(event) => {
              if (suppressClick.current && event.detail !== 0) {
                suppressClick.current = false;
                return;
              }
              if (event.detail === 0) current.current.onPush(item.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                current.current.onPush(item.id);
              }
            }}
          />
        ))}
      </div>
      {ghost && (
        <div
          className="bubble-drag-ghost bubble-run-ghost"
          style={{ left: ghost.x, top: ghost.y }}
          aria-hidden="true"
        >
          {state.items.find((item) => item.id === ghost.id)?.value}
          <small>GIỮ VÀ KÉO</small>
        </div>
      )}
    </div>
  );
}

function RunBubble({
  item,
  index,
  settled,
  active,
  enabled,
  held,
  paused,
  onPointerDown,
  onClick,
  onKeyDown,
}: {
  item: Item;
  index: number;
  settled: boolean;
  active: boolean;
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
      className={`bubble-tile bubble-run-tile ${active ? "is-active" : ""} ${settled ? "is-settled" : ""} ${held ? "is-dragging" : ""}`}
      style={{ left: `calc(var(--step) * ${index})` }}
      disabled={!enabled}
      aria-label={`Bong bóng ${item.value}, vị trí ${index + 1}. Kéo sang phải hoặc nhấn phím sang phải`}
      data-bubble-id={item.id}
      data-value={item.value}
      data-index={index}
      data-active={active}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <span className="bubble-tile-shine" />
      <strong>{item.value}</strong>
      <small>{index + 1}</small>
      {settled && <Check size={19} className="bubble-fixed-check" />}
    </button>
  );
}

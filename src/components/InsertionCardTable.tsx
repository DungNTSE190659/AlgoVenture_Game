import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Check, Leaf, Plus } from "lucide-react";
import Pig from "./Pig";
import { needsShift, type InsertionAction, type InsertionState } from "../engine/insertionSort";
import type { Item } from "../engine/quicksort";
import { gameAudio } from "../audio/gameAudio";

const MARKS = ["♣", "◆", "♥", "♠", "✿", "★"];
type Props = {
  state: InsertionState; guided: boolean; enabled: boolean; paused: boolean;
  onAction: (action: InsertionAction, itemId?: number) => void;
};
type Gesture = { pointer: number; x: number; y: number; moved: boolean; action: InsertionAction; item: Item };

export default function InsertionCardTable({ state, guided, enabled, paused, onAction }: Props) {
  const board = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const [ghost, setGhost] = useState<{ item: Item; x: number; y: number } | null>(null);
  const [over, setOver] = useState(false);
  const done = state.phase === "done";
  const handCount = done ? state.items.length : state.cursor + (state.phase === "compare" ? 1 : 0);
  const pending = done ? 0 : state.items.length - state.cursor - (state.key ? 1 : 0);
  const cards = [...state.items.filter((item): item is Item => item !== null), ...(state.key ? [state.key] : [])].sort((a, b) => a.id - b.id);
  const highlighted = guided && !done ? state.phase === "pick" ? state.items[state.cursor]?.id
    : needsShift(state) ? state.items[state.hole - 1]?.id : state.key?.id : undefined;

  function cancel() {
    const drag = gesture.current;
    gesture.current = null; setGhost(null); setOver(false);
    if (drag && board.current?.hasPointerCapture(drag.pointer)) board.current.releasePointerCapture(drag.pointer);
  }
  useEffect(() => { if (!enabled) cancel(); }, [enabled]);
  useEffect(() => {
    window.addEventListener("blur", cancel);
    return () => window.removeEventListener("blur", cancel);
  }, []);
  function targetAt(x: number, y: number, action: InsertionAction) {
    const target = document.elementFromPoint(x, y)?.closest(action === "pick" ? "[data-insertion-lift]" : "[data-insertion-hole]");
    return !!target && !!board.current?.contains(target);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || drag.pointer !== event.pointerId || !enabled) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) <= 6) return;
    if (!drag.moved) {
      drag.moved = true; suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setGhost({ item: drag.item, x: event.clientX, y: event.clientY });
    setOver(targetAt(event.clientX, event.clientY, drag.action));
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    const accepted = enabled && drag.moved && targetAt(event.clientX, event.clientY, drag.action);
    cancel();
    if (accepted) onAction(drag.action, drag.item.id);
  }
  return <div className="insertion-board-scroll">
    <div className="insertion-board insertion-card-table" ref={board} aria-label="Bàn thẻ Insertion Sort"
      style={{ "--hand-count": handCount } as CSSProperties}
      onPointerMove={move} onPointerUp={end} onPointerCancel={cancel}
      onLostPointerCapture={event => { if (event.target === event.currentTarget) cancel(); }}>
      <div className="insertion-deck-label">CHƯA XẾP <span>{pending}</span></div>
      <div className={`insertion-deck-outline ${pending === 0 ? "deck-empty" : ""}`} aria-hidden="true"><Leaf size={26} /></div>
      <div className="insertion-stage-label">{done ? "XẾP XONG!" : "ĐANG CẦM"}</div>
      <div className={`insertion-lift-zone ${guided && state.phase === "pick" ? "is-guided" : ""} ${over && state.phase === "pick" ? "slot-over" : ""}`}
        data-insertion-lift={state.phase === "pick" ? true : undefined}>
        {!state.key && <span>{done ? <Check size={24} /> : <>Thả<br />thẻ</>}</span>}
      </div>
      <div className="insertion-table-buta" aria-hidden="true"><Pig mood={done ? "celebrate" : state.key ? "thinking" : "happy"} /></div>
      <div className="insertion-hand-label" aria-label="Bộ thẻ, xét từ phải sang trái">ĐÃ XẾP</div>
      <div className="insertion-hand-mat" aria-hidden="true" />
      {state.phase === "compare" && <button
        className={`insertion-slot slot-empty ${guided ? "slot-hinted" : ""} ${over ? "slot-over" : ""}`}
        style={handPosition(state.hole, handCount)} data-insertion-hole={state.hole}
        aria-label={`Ô ${state.hole}, chèn thẻ đang cầm`} disabled={!enabled} onClick={() => onAction("insert")}>
        <Plus size={20} /><span>CHÈN</span>
      </button>}
      {cards.map(item => {
        const index = state.items.findIndex(value => value?.id === item.id);
        const held = state.key?.id === item.id;
        const inDeck = !held && !done && index >= state.cursor + (state.key ? 1 : 0);
        const next = inDeck && index === state.cursor && state.phase === "pick";
        const action: InsertionAction = inDeck ? "pick" : held ? "insert" : "shift";
        const deckOffset = inDeck ? Math.min(3, index - state.cursor) * 3 : 0;
        const style: CSSProperties = held ? { left: "calc(50% - var(--card) / 2)", top: "var(--stage-y)", zIndex: 20 }
          : inDeck ? { left: `calc(var(--deck-x) + ${deckOffset}px)`, top: `calc(var(--stage-y) - ${deckOffset}px)`, zIndex: 10 - index }
          : handPosition(index, handCount);
        return <PlayingCard key={item.id} item={item} index={index} style={style} held={held} inDeck={inDeck} next={next}
          guided={highlighted === item.id} dragging={ghost?.item.id === item.id} paused={paused}
          disabled={!enabled || (inDeck && !next) || (!held && !inDeck && state.phase !== "compare")}
          onClick={() => {
            if (suppressClick.current) { suppressClick.current = false; return; }
            onAction(action, item.id);
          }}
          onPointerDown={event => {
            suppressClick.current = false;
            if (!enabled || event.button !== 0) return;
            gameAudio.unlock();
            gesture.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false, action, item };
          }} />;
      })}
    </div>
    {ghost && <div className="insertion-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true"><strong>{ghost.item.value}</strong><span>{MARKS[ghost.item.id % MARKS.length]}</span></div>}
  </div>;
}

function handPosition(index: number, count: number): CSSProperties {
  const offset = index - (count - 1) / 2;
  return {
    left: `calc(50% - var(--hand-width) / 2 + var(--step) * ${index})`,
    top: `calc(var(--hand-y) + ${Math.abs(offset) * 3}px)`,
    rotate: `${offset * 3}deg`, zIndex: 5 + index,
  };
}

function PlayingCard({ item, index, style, held, inDeck, next, guided, dragging, paused, disabled, onClick, onPointerDown }: {
  item: Item; index: number; style: CSSProperties; held: boolean; inDeck: boolean; next: boolean; guided: boolean;
  dragging: boolean; paused: boolean; disabled: boolean; onClick: () => void; onPointerDown: React.PointerEventHandler<HTMLButtonElement>;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const previous = useRef<{ x: number; y: number } | null>(null);
  const animation = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const position = { x: node.offsetLeft, y: node.offsetTop }, old = previous.current;
    previous.current = position;
    if (!old || (old.x === position.x && old.y === position.y) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animation.current?.cancel();
    animation.current = node.animate([{ translate: `${old.x - position.x}px ${old.y - position.y}px` }, { translate: "0px 0px" }], { duration: 400, easing: "cubic-bezier(.2,.65,.35,1)" });
    if (paused) animation.current.pause();
  });
  useEffect(() => { if (paused) animation.current?.pause(); else if (animation.current?.playState === "paused") animation.current.play(); }, [paused]);
  useEffect(() => () => animation.current?.cancel(), []);
  return <button ref={ref} className={`insertion-tile ${inDeck ? "tile-deck" : held ? "tile-held" : "tile-sorted"} ${next ? "tile-next" : ""} ${guided ? "tile-guided" : ""} ${dragging ? "tile-dragging" : ""}`}
    style={{ ...style, "--digits": String(item.value).length, "--suit-color": ["#537f68", "#b27a38", "#b96d7e", "#7275ad", "#a25e9e", "#498c9c"][item.id % 6] } as CSSProperties}
    disabled={disabled} aria-label={held ? `Số đang cầm ${item.value}, chèn vào ô trống` : `Số ${item.value}, ô ${index}`}
    data-item-id={item.id} data-value={item.value} data-index={held ? "held" : index} data-next={next} data-zone={inDeck ? "deck" : held ? "held" : "hand"}
    onClick={onClick} onPointerDown={onPointerDown}>
    {inDeck ? <><Leaf size={26} /><span className="insertion-card-back-label">{next ? "RÚT THẺ" : "BUTA"}</span></>
      : <><span className="insertion-card-corner">{item.value}<small>{MARKS[item.id % MARKS.length]}</small></span><strong>{item.value}</strong><span className="insertion-card-suit">{MARKS[item.id % MARKS.length]}</span></>}
  </button>;
}

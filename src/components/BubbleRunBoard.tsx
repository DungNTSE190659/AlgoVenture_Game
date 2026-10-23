import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Flag, Footprints, TentTree } from "lucide-react";
import type { BubbleState } from "../engine/bubbleSort";
import type { Item } from "../engine/quicksort";
import Pig from "./Pig";

type Props = {
  state: BubbleState; comparing: boolean; interactive: boolean; paused: boolean;
  onInteract: () => void; onPush: (id: number) => boolean;
};
type Hold = { id: number; pointer: number; x: number; y: number; moved: boolean };

/** The whole party stays on the bridge. Only the current adjacent pair can move. */
export default function BubbleRunBoard({ state, comparing, interactive, paused, onInteract, onPush }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const hold = useRef<Hold | null>(null);
  const suppress = useRef(false);
  const [ghost, setGhost] = useState<{ id: number; x: number; y: number } | null>(null);
  const pair = Math.min(state.pair, state.items.length - 2);
  const focused = state.items.slice(pair, pair + 2);
  const count = state.items.length;
  // Both current friends get equal room, independent of their numbers.
  const weights = state.items.map((_, index) => index === pair || index === pair + 1 ? 1.5 : 1);
  const positions = weights.map((weight, index) => (weights.slice(0, index).reduce((sum, n) => sum + n, 0) + weight / 2) / (count + 1) * 100);
  const guidePosition = (positions[pair] + positions[pair + 1]) / 2;
  const settledCount = state.items.filter((_, index) => index > state.end).length;
  function cancel() {
    const held = hold.current; hold.current = null; setGhost(null);
    if (held && root.current?.hasPointerCapture(held.pointer)) root.current.releasePointerCapture(held.pointer);
  }
  useEffect(() => { if (!interactive || paused) cancel(); }, [interactive, paused]);
  useEffect(() => { window.addEventListener("blur", cancel); return () => window.removeEventListener("blur", cancel); }, []);
  function begin(event: PointerEvent<HTMLButtonElement>, id: number) {
    if (!interactive || paused || event.button !== 0) return;
    onInteract(); suppress.current = false;
    hold.current = { id, pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const held = hold.current;
    if (!held || held.pointer !== event.pointerId || !interactive) return;
    if (!held.moved && Math.hypot(event.clientX - held.x, event.clientY - held.y) <= 7) return;
    if (!held.moved) { held.moved = true; suppress.current = true; event.currentTarget.setPointerCapture(event.pointerId); }
    setGhost({ id: held.id, x: event.clientX, y: event.clientY });
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const held = hold.current;
    if (!held || held.pointer !== event.pointerId) return;
    const other = focused.find(item => item.id !== held.id);
    const box = root.current?.querySelector<HTMLElement>(`.bubble-tile[data-bubble-id="${other?.id}"]`)?.getBoundingClientRect();
    const accepted = interactive && !paused && held.moved && box && Math.abs(event.clientX - held.x) >= 12 && event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
    cancel();
    if (accepted) onPush(held.id);
  }
  return <div className="bubble-board-area bubble-bridge-board" ref={root} data-focus-pair={pair} data-paused={paused}
    onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={event => { if (event.target === event.currentTarget) cancel(); }}>
    <div className="bridge-route-heading"><span><Footprints size={13} /> Cầu gỗ</span><small><TentTree size={14} /> {settledCount}/{count} vào trại</small></div>
    <div className="bubble-board bridge-scene" style={{ "--crew-count": count } as CSSProperties} aria-label="Cả đoàn trên cầu gỗ">
      <img className="array-bridge-art" src="/assets/hybrid-casual-ui/array/game/illustrations/bubble-bridge.png" alt="" aria-hidden="true" draggable={false} />
      <svg className="bridge-forest" viewBox="0 0 900 300" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 120Q130 30 270 115T580 90T900 90V300H0Z" fill="#dfe8cd" />
        <path d="M0 180Q140 90 340 160T620 140T900 170V300H0Z" fill="#cbdcba" />
        {[32, 113, 760, 854].map((x, i) => <g key={x} opacity={i % 2 ? .65 : 1}><path d={`M${x} 45v160`} stroke="#b0c2a1" strokeWidth="10" strokeLinecap="round" /><path d={`M${x} 12l-36 74h18l-28 49h92l-28-49h18Z`} fill={i % 2 ? "#c6d7b4" : "#b8d0ab"} /></g>)}
        <path d="M0 247Q160 220 330 246T660 245T900 240V300H0Z" fill="#b8d9cf" />
      </svg>
      <div className="bridge-bank" aria-hidden="true" />
      <div className="bridge-path" aria-hidden="true" />
      <div className="bridge-camp" aria-hidden="true"><TentTree /><span>TRẠI</span></div>
      <div className="bridge-rope bridge-rope-back" aria-hidden="true" />
      <div key={state.swaps} className={`bridge-deck ${state.swaps ? "has-steps" : ""}`} aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="bridge-party" style={{ maxWidth: `${count * 106 + 24}px` }}>
        <div className={`bubble-pair-window ${comparing ? "is-comparing" : ""}`} aria-hidden="true" style={{ left: `${guidePosition}%`, width: `${positions[pair + 1] - positions[pair]}%` }} />
        {state.items.map((item, index) => {
          const current = index === pair || index === pair + 1;
          return <ForestFriend key={item.id} item={item} index={index} active={comparing && current} prominent={current} settled={index > state.end} paused={paused}
            style={{ left: `${positions[index]}%`, "--friend-scale": current ? 1.45 : 1 } as CSSProperties} enabled={interactive && current}
            onPointerDown={event => begin(event, item.id)}
            onClick={event => {
              if (suppress.current && event.detail !== 0) { suppress.current = false; return; }
              if (event.detail === 0 && interactive && current) onPush(item.id);
            }}
            onKeyDown={event => { if (interactive && current && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); onPush(item.id); } }} />;
        })}
        <BridgeGuide position={guidePosition} paused={paused} mood={state.phase === "done" ? "celebrate" : state.phase === "pass" ? "proud" : "happy"} />
      </div>
      <div className="bridge-rope bridge-rope-front" aria-hidden="true" />
    </div>
    <p className="bubble-focus-status" aria-live="polite">{state.phase === "pass" ? `Số ${state.items[state.end + 1].value} đã vào trại.` : state.phase === "done" ? "Đã xếp xong!" : `Cặp ${pair + 1}–${pair + 2}`}</p>
    <div className="bridge-step-dots" aria-hidden="true">{state.items.slice(1).map((_, i) => <span key={i} className={i + 1 > state.end ? "is-past" : i === pair ? "is-here" : ""} />)}</div>
    {ghost && <div className="bubble-drag-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true"><strong>{state.items.find(item => item.id === ghost.id)?.value}</strong><Footprints size={16} /></div>}
  </div>;
}

function BridgeGuide({ position, paused, mood }: { position: number; paused: boolean; mood: "happy" | "proud" | "celebrate" }) {
  const ref = useRef<HTMLDivElement>(null), previous = useRef(position), animation = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const node = ref.current, before = previous.current; previous.current = position;
    if (!node || before === position || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animation.current?.cancel();
    const dx = (before - position) / 100 * node.parentElement!.clientWidth;
    animation.current = node.animate([{ translate: `${dx}px 0` }, { translate: `${dx / 2}px -7px`, offset: .5 }, { translate: "0px 0px" }], { duration: 450, easing: "ease-in-out" });
    if (paused) animation.current.pause();
  }, [position, paused]);
  useEffect(() => { if (paused) animation.current?.pause(); else if (animation.current?.playState === "paused") animation.current.play(); }, [paused]);
  useEffect(() => () => animation.current?.cancel(), []);
  return <div ref={ref} className="bridge-buta" style={{ left: `${position}%` }} aria-hidden="true"><Pig mood={mood} /></div>;
}

/** Identities follow the cards through swaps, including equal values. */
export function FriendArt({ id, resting }: { id: number; resting: boolean }) {
  return <svg className="bridge-friend-art" viewBox="0 0 100 116" aria-hidden="true" data-resting={resting}>
    <g className="friend-body">
      <image href={`/assets/hybrid-casual-ui/array/game/characters/friend-${id % 8}.png`} width="100" height="116" preserveAspectRatio="xMidYMax meet" />
    </g>
  </svg>;
}

function ForestFriend({ item, index, active, prominent, settled, paused, style, enabled, onPointerDown, onClick, onKeyDown }: {
  item: Item; index: number; active: boolean; prominent: boolean; settled: boolean; paused: boolean; style: CSSProperties; enabled: boolean;
  onPointerDown: React.PointerEventHandler<HTMLButtonElement>; onClick: React.MouseEventHandler<HTMLButtonElement>; onKeyDown: React.KeyboardEventHandler<HTMLButtonElement>;
}) {
  const ref = useRef<HTMLButtonElement>(null), previous = useRef<{ x: number; y: number } | null>(null), animation = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const position = { x: node.offsetLeft, y: node.offsetTop }, old = previous.current;
    previous.current = position;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (old && (old.x !== position.x || old.y !== position.y)) {
      const dx = old.x - position.x, dy = old.y - position.y;
      animation.current?.cancel();
      animation.current = node.animate([{ translate: `${dx}px ${dy}px` }, { translate: `${dx * .5}px ${dy * .5 + (dx < 0 ? -24 : 14)}px`, rotate: dx < 0 ? "-5deg" : "5deg", offset: .5 }, { translate: "0px 0px", rotate: "0deg" }], { duration: 450, easing: "cubic-bezier(.2,.65,.35,1)" });
    }
    if (paused) animation.current?.pause();
  });
  useEffect(() => { if (paused && animation.current?.playState === "running") animation.current.pause(); else if (!paused && animation.current?.playState === "paused") animation.current.play(); }, [paused]);
  useEffect(() => () => animation.current?.cancel(), []);
  return <button ref={ref} className={`bubble-tile bubble-overview-item bridge-friend ${active ? "is-active" : ""} ${prominent ? "is-prominent" : ""} ${settled ? "is-settled" : ""}`} style={{ ...style, "--digits": String(item.value).length } as CSSProperties} disabled={!enabled}
    data-bubble-id={item.id} data-overview-id={item.id} data-value={item.value} data-index={index} data-active={active}
    aria-label={`Bạn mang số ${item.value}, vị trí ${index + 1}${settled ? ", đã vào trại" : ". Kéo sang bạn bên cạnh hoặc nhấn phím mũi tên để đổi chỗ"}`} onPointerDown={onPointerDown} onClick={onClick} onKeyDown={onKeyDown}>
    <FriendArt id={item.id} resting={settled} /><strong className="friend-number">{item.value}</strong><span className="bubble-position">{index + 1}</span>
    {settled && <Flag size={14} className="bubble-fixed-check" />}
  </button>;
}

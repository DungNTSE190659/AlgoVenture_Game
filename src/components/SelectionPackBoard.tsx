import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Backpack, Binoculars, Check, CookingPot, Flag, Flashlight, Map, Search, Tent } from "lucide-react";
import type { SelectionState } from "../engine/selectionSort";
import type { Item } from "../engine/quicksort";

const equipment = [
  { name: "Ba lô", Icon: Backpack, color: "#afbf98" },
  { name: "Bình nước", Icon: WaterBottle, color: "#a6c5c8" },
  { name: "Đèn pin", Icon: Flashlight, color: "#d9bf88" },
  { name: "La bàn", Icon: FieldCompass, color: "#d0b4a0" },
  { name: "Bản đồ", Icon: Map, color: "#c0c89e" },
  { name: "Lều trại", Icon: Tent, color: "#b6b0c9" },
  { name: "Ống nhòm", Icon: Binoculars, color: "#a5bbb0" },
  { name: "Nồi nhỏ", Icon: CookingPot, color: "#c9b9a3" },
];
function WaterBottle({ className, style }: { className?: string; style?: CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 2h6v4H9zM9 6 6 10v10q0 2 2 2h8q2 0 2-2V10l-3-4M6 12h12M6 18h12" /></svg>;
}
function FieldCompass({ className, style }: { className?: string; style?: CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="m16.5 7.5-3 6-6 3 3-6Z" fill="#f8efda" /><path d="m16.5 7.5-3 6-3-3Z" fill="#aa826b" /></svg>;
}

type Props = {
  state: SelectionState; target: number; candidate: number | null; scan: number | null; wrong: number | null;
  enabled: boolean; paused: boolean; onPick: (id: number) => boolean; onPlace: (index: number) => void; onMiss: () => void;
};
export default function SelectionPackBoard({ state, target, candidate, scan, wrong, enabled, paused, onPick, onPlace, onMiss }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; pointer: number; x: number; y: number; moved: boolean; accepted: boolean } | null>(null);
  const suppressed = useRef(false);
  const [ghost, setGhost] = useState<{ x: number; y: number; id: number } | null>(null);
  const [over, setOver] = useState(false);
  const [portrait, setPortrait] = useState(() => matchMedia("(max-width: 700px) and (orientation: portrait)").matches);
  useEffect(() => {
    const media = matchMedia("(max-width: 700px) and (orientation: portrait)");
    const change = () => setPortrait(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const latest = useRef({ state, enabled, onPick, onPlace, onMiss }); latest.current = { state, enabled, onPick, onPlace, onMiss };
  const columns = portrait ? Math.min(state.items.length, state.items.length === 4 ? 2 : 3)
    : state.items.length <= 4 ? state.items.length : Math.ceil(state.items.length / 2);
  const rows = Math.ceil(state.items.length / columns);
  function cancel() {
    const drag = gesture.current; gesture.current = null; setGhost(null); setOver(false);
    if (drag && root.current?.hasPointerCapture(drag.pointer)) root.current.releasePointerCapture(drag.pointer);
  }
  useEffect(() => { if (!enabled || paused) cancel(); }, [enabled, paused]);
  useEffect(() => { window.addEventListener("blur", cancel); return () => window.removeEventListener("blur", cancel); }, []);
  function begin(event: PointerEvent<HTMLButtonElement>, id: number) {
    if (!enabled || event.button !== 0) return;
    suppressed.current = false;
    gesture.current = { id, pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false, accepted: false };
  }
  function goalAt(x: number, y: number) {
    const box = root.current?.querySelector<HTMLElement>("[data-selection-target]")?.getBoundingClientRect();
    return !!box && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current, { state: active, enabled: allowed, onPick: pick } = latest.current;
    if (!drag || drag.pointer !== event.pointerId || !allowed) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 7) return;
    if (!drag.moved) {
      drag.moved = true; suppressed.current = true;
      drag.accepted = active.phase === "place" ? active.chosen === drag.id : pick(drag.id);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!drag.accepted) return;
    setGhost({ x: event.clientX, y: event.clientY, id: drag.id }); setOver(goalAt(event.clientX, event.clientY));
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    const goal = goalAt(event.clientX, event.clientY);
    cancel();
    if (!drag.moved || !drag.accepted || !latest.current.enabled) return;
    if (goal) latest.current.onPlace(latest.current.state.start);
    else latest.current.onMiss();
  }
  return <div className="selection-board-scroll pack-table">
    <div className="pack-heading"><span><Backpack size={15} /> Hành trang</span><small><Check size={13} /> {state.start}/{state.items.length} đã xếp</small></div>
    <div className="selection-board pack-mat" ref={root} style={{ "--columns": columns, "--rows": rows, maxWidth: `${columns * 140 + 36}px` } as CSSProperties}
      aria-label="Thảm hành trang, đọc từ trái sang phải rồi xuống hàng" onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={event => { if (event.target === event.currentTarget) cancel(); }}>
      {state.items.map((_, index) => <div key={index} className={`pack-slot ${index < state.start ? "slot-fixed" : ""}`} style={position(index, columns)} aria-hidden="true"><span>{index + 1}</span></div>)}
      {target < state.items.length && <div className={`selection-goal ${over ? "goal-over" : ""}`} style={position(target, columns)} aria-hidden="true"><Flag size={16} /><span>Ô {target + 1}</span></div>}
      {state.items.map((item, index) => <PackItem key={item.id} item={item} index={index} style={position(index, columns)} settled={index < state.start} candidate={candidate === item.id} scanning={scan === index} wrong={wrong === item.id}
        held={ghost !== null && gesture.current?.id === item.id} target={index === target} paused={paused} enabled={enabled && index >= state.start && (state.phase === "choose" || state.chosen === item.id || index === state.start)}
        onPointerDown={event => begin(event, item.id)} onClick={event => {
          if (suppressed.current && event.detail !== 0) { suppressed.current = false; return; }
          if (state.phase === "choose") onPick(item.id);
          else if (index === state.start) onPlace(index);
        }} />)}
    </div>
    {ghost && <div className="selection-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true"><GearArt id={ghost.id} /><strong>{state.items.find(item => item.id === ghost.id)?.value}</strong></div>}
  </div>;
}
function position(index: number, columns: number): CSSProperties {
  return { left: `calc(var(--pad) + var(--step-x) * ${index % columns})`, top: `calc(var(--pad) + var(--step-y) * ${Math.floor(index / columns)})` };
}
function GearArt({ id }: { id: number }) {
  const { Icon, color } = equipment[id % equipment.length];
  return <Icon className="pack-equipment" style={{ "--gear-color": color } as CSSProperties} aria-hidden="true" />;
}
function PackItem({ item, index, style, settled, candidate, scanning, wrong, held, target, paused, enabled, onClick, onPointerDown }: {
  item: Item; index: number; style: CSSProperties; settled: boolean; candidate: boolean; scanning: boolean; wrong: boolean; held: boolean; target: boolean; paused: boolean; enabled: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>; onPointerDown: React.PointerEventHandler<HTMLButtonElement>;
}) {
  const ref = useRef<HTMLButtonElement>(null), previous = useRef<{ x: number; y: number; index: number } | null>(null), animation = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const before = previous.current, now = { x: node.offsetLeft, y: node.offsetTop, index }; previous.current = now;
    if (!before || before.index === index || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dx = before.x - now.x, dy = before.y - now.y;
    animation.current?.cancel();
    animation.current = node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: `translate(${dx * .5}px, ${dy * .5 + (before.index > index ? -22 : 22)}px) scale(1.04)`, offset: .5 }, { transform: "translate(0,0)" }], { duration: 500, easing: "cubic-bezier(.2,.65,.35,1)" });
    if (paused) animation.current.pause();
  });
  useEffect(() => { if (paused) animation.current?.pause(); else if (animation.current?.playState === "paused") animation.current.play(); }, [paused, index]);
  useEffect(() => () => animation.current?.cancel(), []);
  return <button ref={ref} className={`selection-tile pack-item ${settled ? "tile-fixed" : ""} ${candidate ? "tile-candidate" : ""} ${scanning ? "tile-scan" : ""} ${wrong ? "tile-wrong" : ""} ${held ? "tile-held" : ""}`} style={{ ...style, "--digits": String(item.value).length } as CSSProperties} disabled={!enabled}
    data-selection-id={item.id} data-selection-index={index} data-value={item.value} data-selection-target={target ? index : undefined} aria-label={`Số ${item.value}, ô ${index + 1}${settled ? ", đã xếp xong" : ""}`} aria-pressed={candidate} onClick={onClick} onPointerDown={onPointerDown}>
    <GearArt id={item.id} /><strong>{item.value}</strong>
    {candidate && <Check className="pack-picked" size={13} />}{scanning && <Search size={14} className="selection-scan-icon" />}{settled && <span className="pack-tie"><Check size={13} /></span>}
  </button>;
}

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowDown, Check, Droplets, GitFork } from "lucide-react";
import type { Item } from "../engine/quicksort";
import type { MergeLane, MergeNode, MergeState } from "../engine/mergeSort";
import Pig from "./Pig";
import { activateTouchButton } from "./touchActivation";

type Props = {
  state: MergeState; groups?: MergeNode[]; selected?: string; guided: boolean; enabled: boolean; paused: boolean;
  onSelect: (id: string) => void; onSplit: () => void; onLeaf: (lane: MergeLane, id: number) => void; onNext: () => void;
};
const FLOWERS = ["#d58d9f", "#dbb25b", "#9986bf", "#dc9b6a", "#84a8cc", "#c78dbf", "#73a899", "#be9e6b"];

export function MergeStreamMap({ state, groups, selected, onSelect, enabled }: Pick<Props, "state" | "groups" | "selected" | "onSelect" | "enabled">) {
  const nodes: { node: MergeNode; depth: number; x: number; y: number }[] = [];
  function collect(node: MergeNode, depth: number) {
    if (groups && !groups.some(group => group.id.startsWith(node.id))) return;
    nodes.push({ node, depth, x: 16 + ((node.start + node.end) / 2) / Math.max(1, state.root.items.length) * 308, y: 10 + depth * 20 });
    if (node.left) { collect(node.left, depth + 1); collect(node.right!, depth + 1); }
  }
  collect(state.root, 0);
  const active = groups ? selected : state.phase === "done" ? "root" : state.tasks[state.taskIndex]?.id;
  const completed = new Set(state.tasks.slice(0, state.completed).map(node => node.id));
  return <svg className="merge-stream-map" viewBox="0 0 340 82" role="group" aria-label="Sơ đồ chia và ghép các nhánh suối">
    {nodes.map(({ node, x, y }) => node.left && nodes.some(item => item.node.id === node.left!.id) ? [node.left, node.right!].map(child => {
      const point = nodes.find(item => item.node.id === child.id)!;
      return <path key={`${node.id}-${child.id}`} d={`M${x} ${y + 6} C${x} ${y + 15},${point.x} ${point.y - 10},${point.x} ${point.y}`} fill="none" stroke="#b7d2bd" strokeWidth="2" />;
    }) : null)}
    {nodes.map(({ node, x, y }) => {
      const selectable = enabled && !!groups?.some(group => group.id === node.id && group.left);
      return <g key={node.id} className={`stream-map-node ${active === node.id ? "is-active" : ""} ${completed.has(node.id) || !node.left ? "is-complete" : ""}`}
        role={selectable ? "button" : undefined} tabIndex={selectable ? 0 : undefined}
        aria-label={selectable ? `Chọn nhóm ${node.items.map(item => item.value).join(", ")} để chia` : undefined}
        onClick={() => selectable && onSelect(node.id)} onKeyDown={event => { if (selectable && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(node.id); } }}>
        <rect x={x - 14} y={y - 6} width="28" height="14" rx="7" /><text x={x} y={y + 4}>{node.items.length === 1 ? node.items[0].value : `${node.items.length} lá`}</text>
      </g>;
    })}
  </svg>;
}

export default function MergeStreamBoard({ state, groups, selected, guided, enabled, paused, onSplit, onLeaf, onNext }: Omit<Props, "onSelect">) {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointer: number; x: number; y: number; moved: boolean; lane?: MergeLane; item?: Item } | null>(null);
  const suppress = useRef(false);
  const tapStart = useRef<{ x: number; y: number } | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; item?: Item } | null>(null);
  const [over, setOver] = useState(false);
  const previous = useRef(new Map<number, { x: number; y: number; width: number }>());
  const animations = useRef<Animation[]>([]);
  const group = groups?.find(group => group.id === selected) ?? groups?.find(group => group.left) ?? groups?.[0];
  const allSingle = groups?.every(group => !group.left);
  const task = state.tasks[state.taskIndex];
  const result = state.phase === "done" ? state.assembled : state.output;
  const count = state.phase === "done" ? state.assembled.length : task?.items.length ?? 0;
  const expected = !state.right.length || (state.left[0] && state.left[0].value <= state.right[0].value) ? state.left[0]?.id : state.right[0]?.id;

  function cancel() {
    const held = drag.current; drag.current = null; setGhost(null); setOver(false);
    if (held && root.current?.hasPointerCapture(held.pointer)) root.current.releasePointerCapture(held.pointer);
  }
  useEffect(() => { if (!enabled) cancel(); }, [enabled]);
  useEffect(() => { window.addEventListener("blur", cancel); return () => window.removeEventListener("blur", cancel); }, []);
  useLayoutEffect(() => {
    const positions = new Map<number, { x: number; y: number; width: number }>();
    for (const node of root.current?.querySelectorAll<HTMLElement>("[data-stream-item]") ?? []) {
      const id = Number(node.dataset.streamItem), box = node.getBoundingClientRect(), old = previous.current.get(id);
      const position = { x: box.left + box.width / 2, y: box.top + box.height / 2, width: box.width };
      positions.set(id, position);
      if (old && !matchMedia("(prefers-reduced-motion: reduce)").matches && Math.hypot(old.x - position.x, old.y - position.y) > 1) {
        const motion = node.animate([{ translate: `${old.x - position.x}px ${old.y - position.y}px`, scale: String(old.width / position.width) }, { translate: "0px 0px", scale: "1" }], { duration: 420, easing: "cubic-bezier(.2,.7,.3,1)" });
        if (paused) motion.pause();
        animations.current.push(motion);
      }
    }
    animations.current = animations.current.filter(animation => animation.playState !== "finished");
    previous.current = positions;
  }, [state, groups]);
  useEffect(() => {
    const all = new Set([...animations.current, ...(root.current?.getAnimations({ subtree: true }) ?? [])]);
    for (const animation of all) {
      const target = (animation.effect as KeyframeEffect | null)?.target;
      if (!(target instanceof Element) || !target.matches(".stream-leaf")) continue;
      if (paused) animation.pause(); else if (animation.playState === "paused") animation.play();
    }
  }, [paused]);
  useEffect(() => () => animations.current.forEach(animation => animation.cancel()), []);
  function targetAt(x: number, y: number, split: boolean) {
    const target = document.elementFromPoint(x, y)?.closest(split ? "[data-split-bank]" : "[data-merge-pond]");
    return !!target && !!root.current?.contains(target);
  }
  function begin(event: PointerEvent<HTMLElement>, lane?: MergeLane, item?: Item) {
    if (!enabled || event.button !== 0) return;
    suppress.current = false;
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false, lane, item };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const held = drag.current;
    if (!enabled || !held || held.pointer !== event.pointerId) return;
    if (!held.moved && Math.hypot(event.clientX - held.x, event.clientY - held.y) < 7) return;
    if (!held.moved) { held.moved = true; suppress.current = true; event.currentTarget.setPointerCapture(event.pointerId); }
    setGhost({ x: event.clientX, y: event.clientY, item: held.item });
    setOver(targetAt(event.clientX, event.clientY, !held.item));
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const held = drag.current;
    if (!held || held.pointer !== event.pointerId) return;
    const accepted = enabled && held.moved && targetAt(event.clientX, event.clientY, !held.item);
    cancel();
    if (accepted) { if (held.item && held.lane) onLeaf(held.lane, held.item.id); else onSplit(); }
  }
  function click(action: () => void, detail: number) { if (suppress.current && detail !== 0) { suppress.current = false; return; } action(); }
  return <div className={`merge-stream-board ${groups ? "is-splitting" : "is-merging"}`} ref={root}
    onPointerDownCapture={event => { tapStart.current = { x: event.clientX, y: event.clientY }; }}
    onPointerUpCapture={event => {
      if (event.pointerType !== "touch" || !tapStart.current || Math.hypot(event.clientX - tapStart.current.x, event.clientY - tapStart.current.y) > 8) return;
      const button = (event.target as Element).closest<HTMLButtonElement>("button");
      if (!button || button.disabled) return;
      const box = button.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) return;
      event.preventDefault(); activateTouchButton(button);
    }}
    onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={event => { if (event.target === event.currentTarget) cancel(); }}>
    <svg className="stream-waterways" viewBox="0 0 600 340" preserveAspectRatio="none" aria-hidden="true">
      <path d="M120 -10C70 80 240 120 260 245M480 -10C530 80 360 120 340 245" className="stream-bank" />
      <path d="M120 -10C70 80 240 120 260 245M480 -10C530 80 360 120 340 245" className="stream-water" />
      <path d="M120 -10C70 80 240 120 260 245M480 -10C530 80 360 120 340 245" className="stream-shine" />
      <ellipse cx="300" cy="278" rx="212" ry="55" className="stream-pool" />
      <path d="M25 283q10-35 6-50m0 25q-9-17-16-18m17 28q8-23 16-26M568 286q-5-30 2-54m-2 25q-8-18-14-20" stroke="#8eac79" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="56" cy="305" rx="13" ry="7" fill="#d8d8bf" /><ellipse cx="548" cy="311" rx="18" ry="8" fill="#c7d1bb" />
    </svg>
    {(groups || state.phase === "merge") && <div className="stream-bank-buta" aria-hidden="true"><Pig mood={groups ? "happy" : "thinking"} /></div>}
    {groups ? <div className="stream-split-stage">
      <span className="stream-caption">{allSingle ? "MỖI LÁ LÀ MỘT NHÓM" : "NHÓM LÁ ĐANG CHIA"}</span>
      <div className="stream-group-leaves">{(allSingle ? groups.flatMap(group => group.items) : group?.items ?? []).map(item => <Leaf key={item.id} item={item} small />)}</div>
      {!allSingle && <>
        <button className="stream-split-handle" aria-label="Tách nhánh" disabled={!enabled} onPointerDown={event => begin(event)} onClick={event => click(onSplit, event.detail)}><Droplets size={21} /><span>Tách nhánh</span><GitFork size={16} /></button>
        <div className="stream-split-banks">
          {[group?.left, group?.right].map((child, index) => <button key={index} className={`stream-split-bank ${over ? "is-over" : ""}`} data-split-bank disabled={!enabled} aria-label={`Chia về nhánh ${index === 0 ? "trái" : "phải"}`} onClick={event => click(onSplit, event.detail)}>
            <span>NHÁNH {index === 0 ? "TRÁI" : "PHẢI"}</span><div>{child?.items.map(item => <Leaf key={item.id} item={item} small />)}</div>
          </button>)}
        </div>
      </>}
      {allSingle && <p className="stream-single-note"><Check size={16} /> Sẵn sàng ghép từ hai nhánh nhỏ nhất.</p>}
    </div> : <>
      {state.phase === "merge" && <div className="stream-sources">
        {(["left", "right"] as const).map(lane => <section className={`stream-source source-${lane}`} key={lane} aria-label={`Nhánh ${lane === "left" ? "trái" : "phải"}`}>
          <span className="stream-caption">NHÁNH {lane === "left" ? "TRÁI" : "PHẢI"} <b>{state[lane].length}</b></span>
          <div className="stream-leaf-stack">{state[lane].map((item, index) => <Leaf key={item.id} item={item} lane={lane} head={index === 0} guided={guided && expected === item.id} disabled={!enabled || index !== 0}
            style={{ left: `calc(50% - var(--leaf) / 2 + ${Math.min(index, 3) * 4}px)`, top: -Math.min(index, 3) * 5, zIndex: 20 - index }}
            onPointerDown={event => begin(event, lane, item)} onClick={detail => click(() => onLeaf(lane, item.id), detail)} />)}
            {!state[lane].length && <span className="stream-empty"><Check size={20} /> Hết lá</span>}
          </div>
          <small className="stream-next-leaves">{state[lane].length > 1 ? `Tiếp: ${state[lane].slice(1).map(item => item.value).join(" · ")}` : ""}</small>
        </section>)}
      </div>}
      {state.phase !== "merge" && <div className="stream-group-success"><Pig mood={state.phase === "done" ? "celebrate" : "proud"} /><div><Check size={19} /><strong>{state.phase === "done" ? "Dòng suối đã có thứ tự!" : "Hai nhánh đã thành một!"}</strong><span>{state.phase === "done" ? "Các bông hoa giữ đúng thứ tự ban đầu." : "Giữ nhóm lá này để ghép ở nhánh lớn hơn."}</span></div></div>}
      <section className={`stream-pond ${over ? "is-over" : ""}`} data-merge-pond aria-label="Hồ ghép lá" style={{ "--pond-count": Math.min(4, Math.max(1, count)) } as CSSProperties}>
        <span className="stream-caption">HỒ HỢP NHẤT <span>{result.length}/{count}</span></span>
        <div className="stream-output">{Array.from({ length: count }, (_, index) => result[index] ? <Leaf key={result[index].id} item={result[index]} small output /> : <span key={`empty-${index}`} className={`stream-output-empty ${result.length === index ? "is-next" : ""}`} aria-hidden="true">{result.length === index ? <ArrowDown size={16} /> : "·"}</span>)}</div>
        {state.moves > 0 && <i key={state.moves} className="stream-ripple" aria-hidden="true" />}
      </section>
      {state.phase === "joined" && <button className="chunky-button button-green stream-next-group" disabled={!enabled} onClick={onNext}>{state.completed === state.tasks.length ? "Hoàn tất dòng suối" : "Ghép nhánh tiếp theo"}</button>}
    </>}
    {ghost && <div className="stream-drag-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">{ghost.item ? <Leaf item={ghost.item} /> : <Droplets size={32} />}</div>}
  </div>;
}

function Leaf({ item, small = false, output = false, lane, head, guided, disabled, style, onPointerDown, onClick }: {
  item: Item; small?: boolean; output?: boolean; lane?: MergeLane; head?: boolean; guided?: boolean; disabled?: boolean;
  style?: CSSProperties; onPointerDown?: React.PointerEventHandler<HTMLButtonElement>; onClick?: (detail: number) => void;
}) {
  const face = <><svg viewBox="0 0 100 86" aria-hidden="true"><ellipse cx="50" cy="72" rx="44" ry="9" fill="#679a8440" />
    <path d="M52 44 94 61C82 80 48 85 21 71S-2 33 14 17 66 1 87 18 104 44 96 56Z" fill={lane === "right" ? "#9fcbbd" : "#b2d39a"} stroke="#78a68b" strokeWidth="2" />
    <path d="M17 32 49 43 28 65M48 12 49 43 72 73M81 21 49 43" fill="none" stroke="#e4f2cb" strokeWidth="1.3" opacity=".65" />
    <g fill={FLOWERS[item.id % FLOWERS.length]} stroke="#fff7e4" strokeWidth=".8"><circle cx="29" cy="12" r="5" /><circle cx="36" cy="14" r="5" /><circle cx="33" cy="21" r="5" /><circle cx="25" cy="19" r="5" /><circle cx="29" cy="17" r="2" fill="#ffedaa" /></g>
    </svg><strong>{item.value}</strong><small>{item.id + 1}</small></>;
  const className = `stream-leaf ${small ? "is-small" : ""} ${output ? "is-output" : ""} ${guided ? "is-guided" : ""}`;
  if (!lane) return <span className={className} data-stream-item={output ? item.id : undefined} data-value={item.value} data-item-id={item.id} style={style}>{face}</span>;
  return <button className={className} style={style} disabled={disabled} data-stream-item={item.id} data-value={item.value} data-item-id={item.id} data-lane={lane} data-head={head}
    aria-label={`Lá ${item.value}, nhánh ${lane === "left" ? "trái" : "phải"}, hoa ${item.id + 1}`} onPointerDown={onPointerDown} onClick={event => onClick?.(event.detail)}>{face}</button>;
}

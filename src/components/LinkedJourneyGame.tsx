import useLinkedDemoMotion from "./useLinkedDemoMotion";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowRight, Check, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { GameFooter, GameHeader, GameLayout } from "./GameHud";
import Pig from "./Pig";
import LinkedWorld from "./LinkedWorld";
import LinkedDemoControls from "./LinkedDemoControls";
import VictoryCelebration from "./VictoryCelebration";
import { gameAudio } from "../audio/gameAudio";
import { linkedChallenge } from "../engine/linkedChallenges";
import type { LinkedLevel, LinkedTrackId } from "../engine/linkedCurriculum";

type Algorithm = Exclude<LinkedTrackId, "linked-list">;
type Props = { mode: "demo" | "play"; algorithm: Algorithm; level: LinkedLevel; sound: boolean; onSoundChange: (value: boolean) => void; onPlay: () => void; onBack: () => void; onChooseMap: () => void; onComplete: () => void; onNextLevel: () => void };
type Held = { kind: "node" | "link" | "pig"; value: number };
type State = { slots: (number | null)[]; links: Record<number, number | null>; phase: "reverse" | "build" | "walk" | "insert" | "new-link" | "previous-link" | "delete" | "bypass" | "remove" | "review" | "done"; cursor: number | null; head: number | null; nullDock: number | null; started: boolean; held: Held | null; message: string; messageError: boolean; mistakes: number };
type Action = { kind: "select"; held: Held } | { kind: "slot"; index: number } | { kind: "target"; value: number | null } | { kind: "check" | "bank" | "ready" | "next" | "found" | "edit" };
const labels = { "linked-traversal": "Traversal", "linked-search": "Search", "linked-insertion": "Insertion", "linked-deletion": "Deletion", "linked-reversal": "Reversal" };

export default function LinkedJourneyGame(props: Props) {
  const { algorithm, level, mode } = props;
  const demo = mode === "demo";
  const challenge = linkedChallenge(algorithm, level);
  const values = [...challenge.before];
  const added = challenge.after.find(value => !values.includes(value)) ?? 0;
  const removed = values.find(value => !challenge.after.includes(value)) ?? 0;
  const editIndex = algorithm === "linked-insertion" ? challenge.after.indexOf(added) : values.indexOf(removed);
  const walkGoal = algorithm === "linked-insertion" ? values[Math.max(0, editIndex - 1)] : removed;
  const searchValue = level === 1 ? 6 : level === 2 ? 9 : 5;
  const reversal = algorithm === "linked-reversal";
  const initial = (): State => ({ slots: reversal ? [...values] : values.map(() => null), links: Object.fromEntries(values.map((value, index) => [value, reversal ? values[index + 1] ?? null : null])), phase: reversal ? "reverse" : "build", cursor: null, head: reversal ? values[0] : null, nullDock: reversal ? values[values.length - 1] : null, started: false, held: null, message: "", messageError: false, mistakes: 0 });
  const [state, setState] = useState<State>(initial);
  const [demoStep, setDemoStep] = useState(0);
  const demoMotion = useLinkedDemoMotion(demo, demoStep);
  const [settings, setSettings] = useState(false);
  const [drag, setDrag] = useState<(Held & { x: number; y: number; startX: number; startY: number }) | null>(null);
  const done = useRef(false);
  const chainRef = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState<{ from: number; to: number | null; x: number; y: number; path: string }[]>([]);

  function transition(s: State, action: Action): State {
    const fail = (message: string): State => ({ ...s, message, messageError: true, mistakes: s.mistakes + 1 });
    const ok = (changes: Partial<State>): State => ({ ...s, held: null, message: "", messageError: false, ...changes });
    if (s.phase === "done") return s;
    if (action.kind === "check") {
      const expected = [...challenge.after];
      const assembled = (!reversal || s.nullDock === expected[expected.length - 1]) && s.slots.length === expected.length && expected.every((value, index) => s.slots[index] === value && s.links[value] === (expected[index + 1] ?? null));
      const result = algorithm === "linked-traversal" ? s.started && s.cursor === null
        : algorithm === "linked-search" ? s.started && (s.cursor === searchValue || (!values.includes(searchValue) && s.cursor === null))
        : s.head === expected[0];
      if (s.phase === "build" || !assembled || !result) return { ...fail("Chưa hoàn thành. Kiểm tra vị trí các khối, dây nối và vị trí của heo rồi thử lại nhé."), phase: algorithm === "linked-search" && s.phase === "review" ? "walk" : s.phase };
      return ok({ phase: "done", message: "Kết quả chính xác!" });
    }
    if (action.kind === "select") {
      if (action.held.kind === "link" && ["reverse", "build", "new-link", "previous-link", "bypass", "remove", "review"].includes(s.phase)) {
        const from = action.held.value;
        return { ...s, held: action.held, links: { ...s.links, [from]: null }, nullDock: s.nullDock === from ? null : s.nullDock, phase: s.phase === "remove" ? "bypass" : s.phase === "previous-link" && from === added ? "new-link" : s.phase, messageError: false, message: "Đã rút đinh. Kéo tới lỗ mới hoặc bấm lỗ muốn cắm." };
      }
      return { ...s, held: action.held, message: "", messageError: false };
    }
    const attached = (value: number) => s.links[value] !== null || s.nullDock === value || s.slots.some(other => other !== null && other !== value && s.links[other] === value);
    if (s.phase === "reverse") {
      if (action.kind === "bank" && s.held?.kind === "node") {
        const value = s.held.value;
        if (attached(value)) return ok({ messageError: true, message: "Hãy tháo hết dây nối với khối trước khi đưa về khay." });
        const slots = s.slots.map(slot => slot === value ? null : slot);
        return ok({ slots, head: slots[0] });
      }
      if (action.kind === "slot" && s.held?.kind === "node") {
        if (action.index < 0 || action.index >= s.slots.length) return s;
        const value = s.held.value, displaced = s.slots[action.index], old = s.slots.indexOf(value);
        if (attached(value) || (displaced !== null && displaced !== value && attached(displaced))) return ok({ messageError: true, message: "Tháo dây của các khối cần đổi vị trí trước nhé." });
        const slots = [...s.slots];
        if (old >= 0) slots[old] = displaced;
        slots[action.index] = value;
        return ok({ slots, head: slots[0] });
      }
      if (action.kind === "target" && s.held?.kind === "link") {
        const from = s.held.value, to = action.value;
        if (to === from || (to !== null && !s.slots.includes(to))) return ok({ messageError: true, message: "Nối tới khối khác đã lắp hoặc lỗ NULL." });
        if (to !== null && s.slots.some(value => value !== null && value !== from && s.links[value] === to)) return ok({ messageError: true, message: "Lỗ này đã có đinh. Hãy tháo đinh cũ trước." });
        if (to === null && s.nullDock !== null && s.nullDock !== from) return ok({ messageError: true, message: "Lỗ NULL đã có đinh. Hãy tháo đinh cũ trước." });
        const seen = new Set<number>(); let current = to;
        while (current !== null && !seen.has(current)) {
          if (current === from) return ok({ messageError: true, message: "Liên kết này tạo vòng tròn. Chọn lỗ khác nhé." });
          seen.add(current); current = s.links[current] ?? null;
        }
        return ok({ links: { ...s.links, [from]: to }, nullDock: to === null ? from : s.nullDock });
      }
    }
    const detach = (value: number) => Object.fromEntries(Object.entries(s.links).map(([from, to]) => [from, Number(from) === value || to === value ? null : to]));
    if (action.kind === "bank" && algorithm === "linked-deletion" && ["delete", "bypass", "remove", "review"].includes(s.phase) && s.held?.kind === "node") {
      const value = s.held.value;
      if (!s.slots.includes(value)) return s;
      if (s.links[value] !== null || s.nullDock === value || s.slots.some(other => other !== null && other !== value && s.links[other] === value)) return ok({ messageError: true, message: "Khối vẫn còn dây nối. Hãy tự rút các đinh nối với khối trước khi kéo về khay." });
      return ok({ slots: s.slots.filter(slot => slot !== value), cursor: s.cursor === value ? null : s.cursor, phase: "review" });
    }
    if (action.kind === "bank" && s.phase === "build" && s.held?.kind === "node") {
      const value = s.held.value;
      return ok({ slots: s.slots.map(slot => slot === value ? null : slot), links: detach(value), nullDock: s.nullDock === value ? null : s.nullDock });
    }
    if (action.kind === "slot" && s.phase === "build" && s.held?.kind === "node") {
      if (action.index < 0 || action.index >= s.slots.length) return s;
      const slots = [...s.slots], old = slots.indexOf(s.held.value), displaced = slots[action.index];
      if (old >= 0) slots[old] = displaced;
      slots[action.index] = s.held.value;
      return ok({ slots, links: old < 0 && displaced !== null ? detach(displaced) : s.links });
    }
    if (action.kind === "target") {
      if (["new-link", "previous-link", "bypass", "review"].includes(s.phase) && s.held?.kind === "link") {
        const from = s.held.value;
        if (action.value === from || (action.value !== null && !s.slots.includes(action.value))) return fail("Chọn lỗ của một khối khác hoặc lỗ NULL.");
        const links = { ...s.links, [from]: action.value };
        const nullDock = action.value === null ? from : s.nullDock;
        if (s.phase === "bypass") return ok({ links, nullDock, phase: "remove" });
        return ok({ links, nullDock, phase: s.phase === "review" ? "review" : "previous-link" });
      }
      if (s.phase === "build" && s.held?.kind === "link") {
        if (action.value === s.held.value || (action.value !== null && !s.slots.includes(action.value))) return fail("Chọn lỗ của một khối khác đã lắp.");
        return ok({ links: { ...s.links, [s.held.value]: action.value }, nullDock: action.value === null ? s.held.value : s.nullDock === s.held.value ? null : s.nullDock });
      }
      if (s.phase === "walk" && !s.started && s.held?.kind === "pig") {
        if (action.value !== s.head) return fail("Đặt heo lên HEAD để bắt đầu.");
        return ok({ started: true, cursor: action.value });
      }
      if (s.phase === "new-link") {
        const target = action.value;
        return ok({ links: { ...s.links, [added]: target }, nullDock: target === null ? added : s.nullDock, phase: "previous-link" });
      }
      if (s.phase === "previous-link") {
        const links = editIndex === 0 ? s.links : { ...s.links, [values[editIndex - 1]]: action.value };
        return ok({ links, head: editIndex === 0 ? action.value : s.head, phase: "previous-link" });
      }
      if (s.phase === "bypass") {
        const target = values[editIndex + 1] ?? null;
        if (action.value !== target) return fail("Chọn nút ngay sau nút cần xóa, hoặc NULL nếu xóa nút cuối.");
        return ok({ links: editIndex === 0 ? s.links : { ...s.links, [values[editIndex - 1]]: target }, head: editIndex === 0 ? target : s.head, nullDock: target === null && editIndex > 0 ? values[editIndex - 1] : s.nullDock, phase: "remove" });
      }
    }
    if (action.kind === "ready" && s.phase === "build") {
      if (!values.every((value, index) => s.slots[index] === value && s.links[value] === (values[index + 1] ?? null))) return fail(`Lắp và nối đúng thứ tự ${values.join(" → ")} → NULL trước nhé.`);
      return ok({ phase: "walk", head: values[0] });
    }
    if (action.kind === "next" && s.phase === "walk" && s.started && s.cursor !== null) {
      if (algorithm === "linked-search" && s.cursor === searchValue) return fail("Heo đã tới số cần tìm. Bấm “Đã tìm thấy”.");
      if ((algorithm === "linked-insertion" || algorithm === "linked-deletion") && s.cursor === walkGoal) return fail("Heo đã tới đúng vị trí. Bấm nút chèn hoặc xóa bên dưới.");
      const cursor = s.links[s.cursor];
      return ok({ cursor, phase: algorithm === "linked-traversal" && cursor === null ? "review" : "walk" });
    }
    if (action.kind === "found" && s.phase === "walk" && s.started) {
      return ok({ phase: "review", message: "Đã ghi nhận lựa chọn. Bấm Kiểm tra để xác nhận." });
    }
    if (action.kind === "edit" && s.phase === "walk" && s.started) {
      if (s.cursor !== walkGoal) return fail("Tiếp tục cho heo duyệt tới đúng vị trí trước nhé.");
      return ok({ phase: algorithm === "linked-insertion" ? "insert" : "delete" });
    }
    if (action.kind === "slot" && s.phase === "insert" && s.held?.kind === "node" && s.held.value === added) {
      if (action.index !== editIndex) return fail("Chọn dấu + tại vị trí được yêu cầu.");
      const slots = [...s.slots]; slots.splice(editIndex, 0, added);
      return ok({ slots, links: { ...s.links, [added]: null }, phase: "new-link" });
    }
    if (action.kind === "target" && s.phase === "delete") {
      if (action.value !== removed) return fail("Chọn đúng nút cần xóa.");
      return ok({ phase: "bypass" });
    }
    return s;
  }

  const script: Action[] = [];
  values.forEach((value, index) => script.push({ kind: "select", held: { kind: "node", value } }, { kind: "slot", index }));
  values.slice(0, -1).forEach((value, index) => script.push({ kind: "select", held: { kind: "link", value } }, { kind: "target", value: values[index + 1] }));
  script.push({ kind: "select", held: { kind: "link", value: values[values.length - 1] } }, { kind: "target", value: null });
  script.push({ kind: "ready" }, { kind: "select", held: { kind: "pig", value: 0 } }, { kind: "target", value: values[0] });
  const destination = algorithm === "linked-traversal" || (algorithm === "linked-search" && !values.includes(searchValue)) ? values.length : algorithm === "linked-search" ? values.indexOf(searchValue) : values.indexOf(walkGoal);
  for (let i = 0; i < destination; i++) script.push({ kind: "next" });
  if (algorithm === "linked-search") script.push({ kind: "found" });
  if (algorithm === "linked-insertion") script.push({ kind: "edit" }, { kind: "select", held: { kind: "node", value: added } }, { kind: "slot", index: editIndex }, { kind: "target", value: values[editIndex] ?? null }, { kind: "target", value: added });
  if (algorithm === "linked-deletion") script.push({ kind: "edit" }, { kind: "target", value: removed }, { kind: "target", value: values[editIndex + 1] ?? null }, { kind: "select", held: { kind: "link", value: removed } }, { kind: "select", held: { kind: "node", value: removed } }, { kind: "bank" });
  if (reversal) {
    script.length = 0;
    values.forEach(value => script.push({ kind: "select", held: { kind: "link", value } }));
    values.forEach(value => script.push({ kind: "select", held: { kind: "node", value } }, { kind: "bank" }));
    challenge.after.forEach((value, index) => script.push({ kind: "select", held: { kind: "node", value } }, { kind: "slot", index }));
    challenge.after.forEach((value, index) => script.push({ kind: "select", held: { kind: "link", value } }, { kind: "target", value: challenge.after[index + 1] ?? null }));
  }
  script.push({ kind: "check" });
  const shown = demo ? script.slice(0, demoStep).reduce(transition, initial()) : state;
  const finished = shown.phase === "done";
  const layoutKey = JSON.stringify([shown.slots, shown.links, shown.nullDock]);
  useLayoutEffect(() => {
    const chain = chainRef.current;
    if (!chain) return;
    const measure = () => {
      const rect = chain.getBoundingClientRect();
      const paths: typeof wires = [];
      for (const [from, to] of Object.entries(shown.links)) {
        const source = chain.querySelector<HTMLElement>(`[data-wire-source="${from}"]`);
        const target = to !== null || shown.nullDock === Number(from) ? chain.querySelector<HTMLElement>(`.ll-hole[data-journey-target="${to}"]`) : null;
        if (!source) continue;
        const a = source.getBoundingClientRect(), b = target?.getBoundingClientRect();
        const x1 = a.left + a.width / 2 - rect.left, y1 = a.top + a.height / 2 - rect.top;
        const dragging = drag?.kind === "link" && drag.value === Number(from);
        const x2 = dragging ? drag.x - rect.left : b ? b.left + b.width / 2 - rect.left : x1 + 40;
        const y2 = dragging ? drag.y - rect.top : b ? b.top + b.height / 2 - rect.top : y1;
        paths.push({ from: Number(from), to: to ?? null, x: x2, y: y2, path: `M ${x1} ${y1} L ${x2} ${y2}` });
      }
      setWires(paths);
    };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(chain);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [layoutKey, drag?.kind, drag?.value, drag?.x, drag?.y]);
  useEffect(() => {
    if (!shown.started) return;
    chainRef.current?.querySelector(".journey-pig")?.parentElement?.scrollIntoView({ block: "nearest", inline: "center", behavior: "auto" });
  }, [shown.cursor, shown.started]);
  useEffect(() => { if (!demo && finished && !done.current) { done.current = true; gameAudio.play("finish"); props.onComplete(); } }, [demo, finished, props.onComplete]);
  function dispatch(action: Action) {
    if (demo) return;
    gameAudio.unlock();
    setState(current => { const next = transition(current, action); return next; });
  }
  function begin(held: Held, event: PointerEvent<HTMLElement>) {
    if (demo) return;
    event.preventDefault(); dispatch({ kind: "select", held }); setDrag({ ...held, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
  }
  useEffect(() => {
    if (!drag) return;
    const move = (event: globalThis.PointerEvent) => setDrag(current => current && { ...current, x: event.clientX, y: event.clientY });
    const up = (event: globalThis.PointerEvent) => {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) <= 7) { setDrag(null); return; }
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      if (drag.kind === "node") {
        const slot = hit?.closest<HTMLElement>("[data-journey-slot]");
        if (slot) dispatch({ kind: "slot", index: Number(slot.dataset.journeySlot) });
        else if (hit?.closest("[data-journey-bank]")) dispatch({ kind: "bank" });
      } else {
        const target = hit?.closest<HTMLElement>("[data-journey-target]")?.dataset.journeyTarget;
        if (target !== undefined) dispatch({ kind: "target", value: target === "null" ? null : Number(target) });
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up, { once: true });
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag]);
  const guidance = shown.phase === "reverse" ? "Tự rút các đinh, kéo khối về khay, xếp theo thứ tự đảo ngược rồi nối lại dây. HEAD ở ô đầu, đinh nút cuối cắm vào NULL. Xong thì bấm Kiểm tra." : shown.phase === "build" ? `Lắp các khối ${values.join(" → ")}. Chọn đinh next rồi chọn lỗ nhận để nối dây. Đinh cuối cắm vào lỗ NULL.`
    : shown.phase === "walk" ? !shown.started ? "Cầm heo nhỏ từ khay, đặt lên HEAD để bắt đầu." : shown.cursor === null ? "Heo đã tới NULL. Danh sách kết thúc ở đây." : `Heo đang ở nút ${shown.cursor}. Bấm mũi tên để đi theo next.`
    : shown.phase === "insert" ? `Chọn khối mới ${added}, rồi chọn dấu + ở vị trí cần chèn.`
    : shown.phase === "new-link" ? `Kéo đinh của ${added} vào lỗ nút tiếp theo hoặc NULL. Có thể rút đinh để đổi dây.`
    : shown.phase === "previous-link" ? `${editIndex === 0 ? `Cập nhật HEAD: bấm nút mới ${added}` : `Kéo đinh của ${values[editIndex - 1]} sang lỗ của ${added}`}. Xong thì bấm Kiểm tra.`
    : shown.phase === "delete" ? `Bấm nút ${removed} để chọn xóa.`
    : shown.phase === "bypass" ? `${editIndex === 0 ? "HEAD mới" : `next của ${values[editIndex - 1]}`} cần trỏ tới đâu để bỏ qua ${removed}?`
    : shown.phase === "remove" ? "Tự rút các đinh còn nối với nút cần xóa, kéo khối về khay rồi bấm Kiểm tra." : shown.phase === "review" ? "Bấm Kiểm tra để xác nhận kết quả. Bạn có thể chỉnh lại dây trước khi kiểm tra." : "Hoàn thành!";
  function reset() { setState(initial()); setDemoStep(0); setDrag(null); done.current = false; }
  const card = (value: number, bank = false) => <div data-demo-node={value} className={`linked-node linked-node-${["peach", "mint", "lavender"][Math.max(0, values.indexOf(value)) % 3]} ${shown.held?.value === value && shown.held.kind === "node" ? "node-selected" : ""}`}>
    {!bank && <button className="ll-hole" disabled={demo} data-journey-target={value} aria-label={`Lỗ của khối ${value}`} onClick={() => dispatch({ kind: "target", value })}><span /></button>}
    <button className="linked-node-body" disabled={demo} data-journey-target={value} aria-label={`Khối ${value}${bank ? " ở khay" : " ở hàng lắp"}`} onPointerDown={event => { if (bank || shown.phase === "build" || shown.phase === "reverse" || (algorithm === "linked-deletion" && ["delete", "bypass", "remove", "review"].includes(shown.phase))) begin({ kind: "node", value }, event); }} onClick={event => { event.stopPropagation(); if (bank || shown.phase === "build" || shown.phase === "reverse") dispatch({ kind: "select", held: { kind: "node", value } }); else dispatch({ kind: "target", value }); }}><span className="linked-node-value">{value}</span></button>
    {demo && finished && !bank && <span className="linked-complete-check" role="img" aria-label="Hoàn thành"><Check size={16} /></span>}
    {!bank && <span className="ll-rope-anchor" data-wire-source={value} data-wire-target={shown.links[value] ?? "null"} aria-hidden="true" />}
  </div>;

  return <GameLayout className={`linked-world linked-algorithm-world journey-world ${demo ? "linked-demo" : ""}`} play={!demo}>
    {!demo && <LinkedWorld map />}
    <GameHeader title={`Linked List ${labels[algorithm]}`} onBack={props.onBack} onSettings={() => setSettings(true)} />
    <section className="linked-content">
      <div className="linked-intro"><p>{algorithm === "linked-search" ? `Tìm số ${searchValue}` : challenge.instruction}</p></div>
      <div className="linked-workspace" ref={demoMotion.ref}>
        <div className="linked-panel linked-bank" data-journey-bank="true" onClick={() => dispatch({ kind: "bank" })}><div className="linked-panel-heading"><h3>Khay khối</h3></div><div className="linked-bank-row">
          {[...values].reverse().filter(value => !shown.slots.includes(value)).map(value => <div className="linked-bank-cell" key={value}>{card(value, true)}</div>)}
          {shown.phase === "insert" && <div className="linked-bank-cell">{card(added, true)}</div>}
          {shown.phase === "walk" && !shown.started && <button className="journey-pig-pickup" aria-label="Cầm heo nhỏ" onPointerDown={event => begin({ kind: "pig", value: 0 }, event)} onClick={() => dispatch({ kind: "select", held: { kind: "pig", value: 0 } })}><Pig small /><span>Đặt heo lên HEAD</span></button>}
        </div></div>
        <div className="linked-panel linked-assembly"><div className="linked-panel-heading"><h3>Hàng lắp</h3></div>
          <div className="linked-assembly-scroll"><div className="journey-chain" ref={chainRef}><svg className="journey-wires" aria-hidden="true">{wires.map(wire => <path key={wire.from} data-demo-wire={wire.from} d={wire.path} />)}</svg>
            {wires.map(wire => <button key={wire.from} data-demo-nail={wire.from} className={`linked-nail journey-nail ${shown.held?.kind === "link" && shown.held.value === wire.from ? "journey-nail-selected" : ""}`} style={{ left: wire.x, top: wire.y, pointerEvents: drag?.kind === "link" && drag.value === wire.from ? "none" : undefined }} disabled={demo || !["reverse", "build", "new-link", "previous-link", "bypass", "remove", "review"].includes(shown.phase)} aria-label={`Đinh của khối ${wire.from}`} data-null-docked={wire.to === null && shown.nullDock === wire.from || undefined} data-journey-target={wire.to ?? (shown.nullDock === wire.from ? "null" : undefined)} onPointerDown={event => begin({ kind: "link", value: wire.from }, event)} onClick={event => { if (event.detail === 0) dispatch({ kind: "select", held: { kind: "link", value: wire.from } }); }}><span className="linked-nail-head" /><span className="linked-nail-tip" /></button>)}
            {shown.slots.map((value, index) => <div className="journey-piece" key={value ?? `slot-${index}`}>
              {shown.phase === "insert" && <button className="journey-plus" data-journey-slot={index} aria-label={`Chèn vào vị trí ${index}`} onClick={() => dispatch({ kind: "slot", index })}>+</button>}
              <div className={`linked-slot journey-slot ${shown.cursor === value && shown.started ? "journey-current" : ""}`} data-journey-slot={index} onClick={() => { if (shown.phase === "build" || shown.phase === "reverse") dispatch({ kind: "slot", index }); }}>
                <span className="linked-slot-label">{(shown.phase === "build" || shown.phase === "reverse" ? index === 0 : shown.head !== null && value === shown.head) ? "HEAD" : index === shown.slots.length - 1 ? "TAIL" : `VỊ TRÍ ${index + 1}`}</span>
                {value !== null ? card(value) : <button className="journey-empty" aria-label={`Đặt khối vào ô ${index + 1}`} disabled={demo}>+ Đặt khối</button>}
                {value !== null && shown.cursor === value && shown.started && <div className="journey-pig"><Pig small /></div>}
              </div>
            </div>)}
            {shown.phase === "insert" && <button className="journey-plus" data-journey-slot={shown.slots.length} aria-label={`Chèn vào vị trí ${shown.slots.length}`} onClick={() => dispatch({ kind: "slot", index: shown.slots.length })}>+</button>}
            <div className="journey-null"><button className="ll-hole journey-null-hole" data-journey-target="null" disabled={demo} aria-label="Lỗ NULL" onClick={() => dispatch({ kind: "target", value: null })}><span /></button><button className="linked-null-target" data-journey-target="null" disabled={demo} onClick={() => dispatch({ kind: "target", value: null })}>NULL</button>{shown.started && shown.cursor === null && <div className="journey-pig"><Pig small /></div>}</div>
          </div></div>
        </div>
      </div>
      {!demo && !finished && <div className="journey-controls">
        <button className="chunky-button bubble-keep-button linked-check-button" onClick={() => dispatch({ kind: "check" })}><Check size={23} /> Kiểm tra</button>
        {shown.phase === "build" && <button className="chunky-button button-green" onClick={() => dispatch({ kind: "ready" })}>Lắp xong · Bắt đầu duyệt</button>}
        {shown.phase === "walk" && <>
          <button className="chunky-button button-green" aria-label="Đi theo next" disabled={!shown.started || shown.cursor === null} onClick={() => dispatch({ kind: "next" })}><ArrowRight /> Đi theo next</button>
          {algorithm === "linked-search" && <button className="chunky-button button-purple" disabled={!shown.started} onClick={() => dispatch({ kind: "found" })}>{shown.started && shown.cursor === null ? "Không tìm thấy" : "Đã tìm thấy"}</button>}
          {(algorithm === "linked-insertion" || algorithm === "linked-deletion") && <button className="chunky-button button-purple" disabled={!shown.started} onClick={() => dispatch({ kind: "edit" })}>{algorithm === "linked-insertion" ? "Chèn tại đây" : "Xóa nút này"}</button>}
        </>}
      </div>}
      {!demo && !finished && <p key={`${shown.mistakes}:${shown.message}`} className={`bubble-feedback linked-play-feedback ${shown.messageError ? "is-error" : ""}`} role="status">{shown.message}</p>}
      {!demo && finished && <VictoryCelebration className="linked-victory" title="Hoàn thành!" nextLabel="Màn tiếp theo" stars={shown.mistakes === 0 ? 3 : shown.mistakes < 3 ? 2 : 1} difficulty="hard" onReplay={reset} onHarder={props.onNextLevel} onMap={props.onChooseMap}><strong>{challenge.after.join(" → ")} → NULL</strong><p>{shown.message || (algorithm === "linked-traversal" ? `Heo đã đi qua ${values.length} nút và tới NULL.` : challenge.instruction)}</p></VictoryCelebration>}
    </section>
    {demo && <LinkedDemoControls step={demoStep} count={script.length + 1} narration={guidance} onStep={setDemoStep} onSpeedChange={demoMotion.onSpeedChange} onPlay={props.onPlay} />}
    {!demo && <GameFooter><button className="linked-reset" onClick={reset}><RotateCcw size={17} /> Làm lại</button></GameFooter>}
    {settings && <div className="linked-settings-backdrop" onClick={() => setSettings(false)}><section className="linked-settings" role="dialog" aria-modal="true" aria-label="Tùy chọn" onClick={event => event.stopPropagation()}><button className="round-button" aria-label="Đóng tùy chọn" onClick={() => setSettings(false)}><X /></button><h2>Tùy chọn</h2><button className="chunky-button button-green" onClick={() => props.onSoundChange(!props.sound)}>{props.sound ? <Volume2 /> : <VolumeX />} Âm thanh: {props.sound ? "Bật" : "Tắt"}</button></section></div>}
    {drag && drag.kind !== "link" && <div className="linked-drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">{drag.kind === "pig" ? <Pig small /> : <div className={`linked-node linked-node-${["peach", "mint", "lavender"][Math.max(0, values.indexOf(drag.value)) % 3]}`}><span className="linked-node-body"><span className="linked-node-value">{drag.value}</span></span></div>}</div>}
  </GameLayout>;
}

import LinkedDiscovery from "./LinkedDiscovery";
import LinkedStats, { emptyLinkedCounters } from "./LinkedStats";
import useLinkedDialog from "./useLinkedDialog";
import useLinkedDemoMotion from "./useLinkedDemoMotion";
import LinkedDemoControls from "./LinkedDemoControls";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Check, RotateCcw, Volume2, VolumeX, X } from "./LinkedAssetIcons";
import { GameHeader, GameLayout } from "./GameHud";
import LinkedChallengeGuide from "./LinkedChallengeGuide";
import Fox from "./Fox";
import { LinkedFailure, LinkedResultSummary } from "./LinkedResults";
import VictoryCelebration from "./VictoryCelebration";
import LinkedWorld from "./LinkedWorld";
import LinkedRopeMaterial from "./LinkedRopeMaterial";
import { connectLinkedNode, createLinkedPuzzle, linkedPuzzleComplete, CONSTRUCTION_LEVELS, placeLinkedNode, type LinkedPuzzle } from "../engine/linkedList";
import { gameAudio } from "../audio/gameAudio";
import type { LinkedLevel } from "../engine/linkedCurriculum";

type Props = {
  mode: "demo" | "play";
  sound: boolean;
  onSoundChange: (enabled: boolean) => void;
  onBack: () => void;
  onPlay: () => void;
  onDemo: () => void;
  onChooseMap: () => void;
  onComplete: () => void;
  level: LinkedLevel;
  onNextLevel: () => void;
};
type Point = { x: number; y: number };
type Geometry = { anchors: Record<string, Point>; holes: Record<string, Point>; freeOffset: Point };
type Drag = { kind: "node" | "nail"; id: string; x: number; y: number; startX: number; startY: number; original: string | null };

const FREE_ROPE_OFFSET = { x: 18, y: 42 };

const DEMO_LINES = [
  "Mỗi khối là một nút. Ô lớn chứa dữ liệu; phần bên phải chứa con trỏ next.",
  "Đặt nút 7 vào ô HEAD. Đây là điểm bắt đầu danh sách.",
  "Đặt nút 2 ngay sau 7.",
  "Đặt nút 9 vào ô thứ ba.",
  "Đặt nút 4 vào ô TAIL ở cuối hàng lắp.",
  "Kéo đinh của 7 tới lỗ của 2 để nối 7 → 2.",
  "Nối tiếp đinh của 2 vào lỗ của 9: ta có 7 → 2 → 9.",
  "Nối 9 → 4 để giữ danh sách liền mạch.",
  "Mình cắm đinh của nút cuối 4 vào NULL. Hoàn thành! Danh sách 7 → 2 → 9 → 4 đã nối liền từ HEAD đến TAIL.",
];

function demoPuzzle(step: number): LinkedPuzzle {
  return {
    nodes: createLinkedPuzzle(3).nodes,
    order: [...createLinkedPuzzle(3).order],
    slots: createLinkedPuzzle(3).order.map((id, index) => step >= index + 1 ? id : null),
    links: { a: step >= 5 ? "b" : null, b: step >= 6 ? "c" : null, c: step >= 7 ? "d" : null, d: null },
  };
}

export default function LinkedListGame({ mode, sound, onSoundChange, onBack, onPlay, onChooseMap, onComplete, level, onNextLevel }: Props) {
  const demo = mode === "demo";
  const [discovered, setDiscovered] = useState(level !== 1);
  const [puzzle, setPuzzle] = useState(() => createLinkedPuzzle(level));
  const [demoStep, setDemoStep] = useState(0);
  const demoMotion = useLinkedDemoMotion(demo, demoStep);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nullDock, setNullDock] = useState<string | null>(null);
  const [selectedNail, setSelectedNail] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [geometry, setGeometry] = useState<Geometry>({ anchors: {}, holes: {}, freeOffset: FREE_ROPE_OFFSET });
  const [settings, setSettings] = useState(false);
  useLinkedDialog(settings, () => setSettings(false));
  const activePointer = useRef<number | null>(null);
  const dragDock = useRef<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  function showMessage(text: string, error = false) { setMessage(text); setMessageError(error); }
  const [mistakes, setMistakes] = useState(0);
  const [failedChecks, setFailedChecks] = useState(0);
  const lost = !demo && failedChecks >= 5;
  const [counters, setCounters] = useState(emptyLinkedCounters);
  const boardRef = useRef<HTMLDivElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const finished = !demo && confirmed && linkedPuzzleComplete(puzzle) && nullDock === puzzle.order.at(-1);
  const completedRef = useRef(false);
  const shown = demo ? demoPuzzle(demoStep) : puzzle;
  const shownDock = demo ? demoStep >= 8 ? "d" : null : nullDock;
  const linkTarget = (id: string) => shown.links[id] ?? (shownDock === id ? "null" : null);
  const nodes = shown.nodes;
  const order = shown.order;
  const values = nodes.map(node => node.value);
  const sequence = values.join(" → ");
  const bank = CONSTRUCTION_LEVELS[level].bank.map(id => puzzle.nodes.find(node => node.id === id)!);
  const placed = puzzle.slots.filter(Boolean).length;
  const correctLinks = puzzle.order.slice(0, -1).filter((id, index) => puzzle.links[id] === puzzle.order[index + 1]).length;
  const shownCounters = demo ? { placements: Math.min(demoStep, 4), connections: Math.max(0, demoStep - 4), checks: 0, visits: [] } : counters;
  const correctPositions = shown.slots.filter((id, index) => id === order[index]).length;
  const correctConnections = order.filter((id, index) => shown.slots.includes(id) && (index === order.length - 1 ? shownDock === id : shown.links[id] === order[index + 1])).length;
  const score = Math.max(0, (correctPositions + correctConnections) * 100);

  useEffect(() => {
    if (!finished || completedRef.current) return;
    completedRef.current = true;
    gameAudio.play("finish");
    onComplete();
  }, [finished, onComplete]);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const measure = () => {
      const rect = board.getBoundingClientRect();
      const locate = (selector: string) => {
        const result: Record<string, Point> = {};
        board.querySelectorAll<HTMLElement>(selector).forEach(element => {
          const key = element.dataset.node;
          if (!key) return;
          const box = element.getBoundingClientRect();
          result[key] = { x: box.left - rect.left + box.width / 2, y: box.top - rect.top + box.height / 2 };
        });
        return result;
      };
      setGeometry({ anchors: locate(".ll-rope-anchor"), holes: locate(".ll-hole"), freeOffset: FREE_ROPE_OFFSET });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [shown.slots.join(","), discovered]);

  function playCue(cue: "correct" | "retry" | "hint" | "enter") {
    gameAudio.unlock();
    gameAudio.play(cue);
  }
  function putNode(id: string, slot: number | null) {
    const next = placeLinkedNode(puzzle, id, slot);
    if (slot !== null && next.slots.some((value, index) => value !== puzzle.slots[index])) setCounters(current => ({ ...current, placements: current.placements + 1 }));
    setPuzzle(next);
    setFocusedNode(id);
    setNullDock(current => current && next.slots.includes(current) ? current : null);
    setSelectedNode(null);
    setSelectedNail(null);
    showMessage(slot === null ? "Đã trả nút về khay." : `Đã đặt nút ${valueOf(id)}.`);
    playCue("correct");
  }
  function plugNail(id: string, target: string | null) {
    const next = connectLinkedNode(puzzle, id, target === "null" ? null : target);
    if (next === puzzle && target !== null) {
      setMistakes(value => value + 1);
      showMessage(target === id ? "Nút đang trỏ vào chính nó: đi theo next sẽ quay lại cùng nút mãi. Chọn một nút khác để đường đi tiếp tục." : "Liên kết này tạo vòng lặp: đi theo next sẽ quay về nút đã qua, không tới được NULL. Hãy nối theo hướng tới nút tiếp theo trong mục tiêu.", true);
      playCue("retry");
      return;
    }
    if (target !== null && (target === "null" ? nullDock !== id : puzzle.links[id] !== target)) setCounters(current => ({ ...current, connections: current.connections + 1 }));
    setPuzzle(next);
    setNullDock(current => target === "null" ? id : current === id ? null : current);
    setSelectedNail(null);
    showMessage(target === "null" ? `Đã cắm đinh của ${valueOf(id)} vào NULL.` : target ? `Đã cắm đinh của ${valueOf(id)} vào lỗ của ${valueOf(target)}.` : `Đã rút đinh của ${valueOf(id)}. Chọn một lỗ mới hoặc cắm vào lỗ NULL.`);
    playCue("correct");
  }
  function valueOf(id: string) { return nodes.find(node => node.id === id)?.value; }
  function detachNail(id: string) {
    setNullDock(current => current === id ? null : current);
    setPuzzle(before => connectLinkedNode(before, id, null));
    setSelectedNail(id); setSelectedNode(null);
  }
  function beginDrag(kind: Drag["kind"], id: string, event: PointerEvent<HTMLElement>) {
    if (demo || finished || lost || !event.isPrimary || activePointer.current !== null) return;
    if (kind === "node") setFocusedNode(id);
    if (kind === "node" && selectedNail && puzzle.slots.includes(id)) {
      event.preventDefault(); event.stopPropagation(); plugNail(selectedNail, id); return;
    }
    activePointer.current = event.pointerId;
    dragDock.current = nullDock;
    event.preventDefault();
    event.stopPropagation();
    if (kind === "nail") setNullDock(current => current === id ? null : current);
    setDrag({ kind, id, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, original: kind === "nail" ? puzzle.links[id] : null });
  }
  useEffect(() => {
    if (!drag) return;
    const move = (event: globalThis.PointerEvent) => { if (event.pointerId === activePointer.current) setDrag(current => current && { ...current, x: event.clientX, y: event.clientY }); };
    const end = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== activePointer.current) return;
      activePointer.current = null;
      const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 7;
      const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      if (drag.kind === "node") {
        const slot = element?.closest<HTMLElement>("[data-linked-slot]");
        const bank = element?.closest<HTMLElement>("[data-linked-bank]");
        if (moved && slot) putNode(drag.id, Number(slot.dataset.linkedSlot));
        else if (moved && bank) putNode(drag.id, null);
        else if (!moved) {
          if (puzzle.slots.every(Boolean) && puzzle.slots.includes(drag.id)) {
            detachNail(drag.id); showMessage(`Đã chọn next của ${valueOf(drag.id)}. Chạm nút đích hoặc NULL để nối.`);
          } else { setSelectedNode(drag.id); setSelectedNail(null); showMessage(`Đã chọn khối ${valueOf(drag.id)}. Chạm ô trống ở hàng lắp để đặt khối.`); }
        }
      } else {
        const hole = element?.closest<HTMLElement>(".ll-hole[data-node]");
        if (moved && hole) plugNail(drag.id, hole.dataset.node ?? null);
        else if (moved) plugNail(drag.id, null);
        else {
          detachNail(drag.id);
          showMessage(`Đã rút đinh của ${valueOf(drag.id)}. Chạm lỗ muốn cắm, hoặc kéo đinh đến lỗ đó.`);
          playCue("enter");
        }
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    const cancel = () => { activePointer.current = null; setDrag(null); setNullDock(dragDock.current); };
    const pointerCancel = (event: globalThis.PointerEvent) => { if (event.pointerId === activePointer.current) cancel(); };
    const hidden = () => { if (document.hidden) cancel(); };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", pointerCancel); window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", hidden);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", pointerCancel); window.removeEventListener("blur", cancel); document.removeEventListener("visibilitychange", hidden); };
  }, [drag, puzzle]);

  function checkPuzzle() {
    if (lost || finished) return;
    setCounters(current => ({ ...current, checks: current.checks + 1 }));
    if (linkedPuzzleComplete(puzzle) && nullDock === order.at(-1)) { setConfirmed(true); return; }
    if (placed < order.length) showMessage(`Còn ${order.length - placed} nút trong khay. Mỗi nút chứa một số; hãy chọn nút rồi chọn ô để đưa nó vào danh sách.`);
    else if (puzzle.slots.some((id, index) => id !== order[index])) showMessage(`Đọc từ HEAD, thứ tự hiện tại chưa khớp mục tiêu ${sequence}. HEAD là điểm bắt đầu; bạn có thể chọn khối rồi chọn ô khác để đổi chỗ.`);
    else if (correctLinks < order.length - 1) showMessage(`Đặt cạnh nhau chưa tạo thành danh sách: mỗi nút cần có next trỏ tới nút sau. ${hintText()} Dây nối chính là liên kết để đi từ nút này sang nút khác.`);
    else showMessage(`Nút ${values.at(-1)} là nút cuối, nhưng chưa đánh dấu kết thúc. Nối next của nó vào NULL: NULL có nghĩa là không còn nút tiếp theo.`);
    setFailedChecks(value => value + 1);
    setMessageError(true);
    setMistakes(value => value + 1);
    playCue("hint");
  }
  function reset() {
    setFocusedNode(null);
    setFailedChecks(0);
    setCounters(emptyLinkedCounters());
    setConfirmed(false);
    setNullDock(null);
    setPuzzle(createLinkedPuzzle(level));
    setSelectedNode(null); setSelectedNail(null); setDrag(null); setMistakes(0);
    showMessage("");
    completedRef.current = false;
  }
  function hintText() {
    if (placed < order.length) return `Đặt các khối lên hàng lắp theo thứ tự ${sequence}. Chạm khối rồi chạm ô nếu không muốn kéo.`;
    if (puzzle.slots.join() !== order.join()) return "Kéo khối sang ô khác để đổi vị trí. Khối ở ô đầu là HEAD.";
    for (let index = 0; index < order.length - 1; index++)
      if (puzzle.links[order[index]] !== order[index + 1]) return `Chọn đinh của khối ${values[index]} rồi cắm vào lỗ của khối ${values[index + 1]}.`;
    return `Cắm đinh khối ${values.at(-1)} vào lỗ NULL. Danh sách kết thúc ở đây.`;
  }

  return <GameLayout className={`linked-world linked-stage-layout linked-${mode}`} play={!demo}>
    <LinkedWorld map />
    <GameHeader assetIcons title="Linked List" beforeSettings={<LinkedStats score={score} counters={shownCounters} />} onBack={onBack} onSettings={() => setSettings(true)} />
    <section className="linked-content">
      {!demo && !discovered ? <LinkedDiscovery onComplete={() => setDiscovered(true)} /> : <>

      <div className="linked-workspace" ref={demoMotion.ref}>

        <div className="linked-playfield">
        <div className="linked-panel linked-bank" data-linked-bank="true" role={!demo ? "button" : undefined} tabIndex={!demo ? 0 : -1} aria-label="Trả khối về khay" onClick={event => { if (!demo && selectedNode && !(event.target as HTMLElement).closest("button")) putNode(selectedNode, null); }} onKeyDown={event => { if (event.target === event.currentTarget && selectedNode && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); putNode(selectedNode, null); } }}>

           <div className="linked-bank-row">{bank.map(node => <div key={node.id} className="linked-bank-cell">{!(demo ? shown.slots : puzzle.slots).includes(node.id) ? <NodeCard node={node} selected={focusedNode === node.id} onPointerDown={event => beginDrag("node", node.id, event)} onKeyboard={() => { if (!demo) { setFocusedNode(node.id); setSelectedNode(node.id); setSelectedNail(null); } }} /> : <span className="linked-bank-empty" aria-hidden="true" />}</div>)}</div>
        </div>
        <div className="linked-panel linked-assembly">

          <div className="linked-assembly-scroll">
             <div className="linked-board" ref={boardRef} style={{ "--linked-count": shown.slots.length } as CSSProperties}>
              <svg className="linked-ropes" aria-hidden="true"><LinkedRopeMaterial />{shown.slots.map(id => {
                if (!id || !geometry.anchors[id]) return null;
                const start = geometry.anchors[id];
                const target = drag?.kind === "nail" && drag.id === id ? { x: drag.x - (boardRef.current?.getBoundingClientRect().left ?? 0), y: drag.y - (boardRef.current?.getBoundingClientRect().top ?? 0) } : linkTarget(id) && geometry.holes[linkTarget(id)!] ? geometry.holes[linkTarget(id)!] : { x: start.x + geometry.freeOffset.x, y: start.y + geometry.freeOffset.y };
                return <path key={id} data-demo-wire={id} className={`linked-rope ${linkTarget(id) ? "rope-plugged" : ""}`} d={`M ${start.x} ${start.y} L ${target.x} ${target.y}`} />;
              })}</svg>
              {shown.slots.map((id, index) => <div key={index} className={`linked-slot ${selectedNode ? "slot-available" : ""}`} data-linked-slot={index} role={selectedNode ? "button" : undefined} tabIndex={selectedNode ? 0 : -1} aria-label={selectedNode ? `Đặt khối vào ô ${index + 1}` : undefined} onClick={() => { if (selectedNode && !demo) putNode(selectedNode, index); }} onKeyDown={event => { if (selectedNode && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); putNode(selectedNode, index); } }}>
                 <span className="linked-slot-label">{index === 0 ? "HEAD" : index === shown.slots.length - 1 ? "TAIL" : `VỊ TRÍ ${index + 1}`}</span>
                 {id ? <NodeCard node={nodes.find(node => node.id === id)!} assembled nextKnown={Boolean(shown.links[id] || shownDock === id)} complete={demo && demoStep === DEMO_LINES.length - 1} selected={focusedNode === id} onPointerDown={event => beginDrag("node", id, event)} onKeyboard={() => { setFocusedNode(id); if (selectedNail) plugNail(selectedNail, id); else if (puzzle.slots.every(Boolean)) detachNail(id); else { setSelectedNode(id); setSelectedNail(null); } }} onHole={() => { if (selectedNail) plugNail(selectedNail, id); }} holeActive={Boolean(selectedNail && selectedNail !== id)} /> : <div className="linked-empty-slot">+ Đặt khối</div>}
              </div>)}
              <div className="construction-null"><button className={`ll-hole ${selectedNail ? "hole-active" : ""}`} data-node="null" type="button" disabled={demo} aria-label="Lỗ NULL" onClick={() => { if (selectedNail) plugNail(selectedNail, "null"); }}><span /></button><button className="linked-null-target" type="button" disabled={demo} onClick={() => { if (selectedNail) plugNail(selectedNail, "null"); }}>NULL</button></div>
              {shown.slots.map(id => {
                if (!id || !geometry.anchors[id] || drag?.kind === "nail" && drag.id === id) return null;
                const at = linkTarget(id) && geometry.holes[linkTarget(id)!] ? geometry.holes[linkTarget(id)!] : { x: geometry.anchors[id].x + geometry.freeOffset.x, y: geometry.anchors[id].y + geometry.freeOffset.y };
                return <button key={id} data-demo-nail={id} className={`linked-nail ${linkTarget(id) ? "nail-plugged" : ""} ${selectedNail === id ? "nail-selected" : ""}`} style={{ left: at.x, top: at.y }} type="button" aria-label={`Đinh của khối ${valueOf(id)}${shown.links[id] ? ` đang cắm vào khối ${valueOf(shown.links[id]!)}` : shownDock === id ? " đang cắm vào NULL" : " đang rời"}`} disabled={demo} onPointerDown={event => beginDrag("nail", id, event)} onClick={event => { if (event.detail === 0 && !demo) { detachNail(id); } }}><span className="linked-nail-head" /><span className="linked-nail-tip" /></button>;
              })}
            </div>
          </div>
        </div>
        </div>
        {!demo && !finished && !lost && <LinkedChallengeGuide objective={`Tạo đường đi ${sequence} → NULL. Chọn nút trong khay để bắt đầu; khi sẵn sàng, bấm Kiểm tra.`} message={message} error={messageError} guidance={hintText()}>
          <button className="chunky-button linked-check-button" onClick={checkPuzzle}><Check size={23} /> Kiểm tra</button>
        </LinkedChallengeGuide>}
        {demo && <LinkedDemoControls step={demoStep} count={DEMO_LINES.length} narration={DEMO_LINES[demoStep]} onStep={setDemoStep} suspended={settings} onPauseChange={demoMotion.onPauseChange} onSpeedChange={demoMotion.onSpeedChange} onPlay={onPlay} />}
      </div>
      {finished && <VictoryCelebration className="bubble-victory linked-victory" companion={<Fox mood="celebrate" />} companionName="Cáo" title="Danh sách đã kết nối!" nextLabel={level < 3 ? "Màn tiếp theo" : "Bài tiếp theo"} stars={3} difficulty={level === 1 ? "easy" : level === 2 ? "medium" : "hard"} onReplay={reset} onHarder={level < 3 ? onNextLevel : onChooseMap} onMap={onChooseMap}><LinkedResultSummary counters={counters} mistakes={mistakes} /><strong>{sequence} → NULL</strong><p>Bạn đã lắp {order.length} nút và nối {order.length - 1} con trỏ next.</p></VictoryCelebration>}
      </>}
    </section>
    {lost && <LinkedFailure counters={counters} mistakes={mistakes} message={message} onReplay={reset} onBack={onBack} />}
    {settings && <div className="linked-settings-backdrop" role="presentation" onClick={() => setSettings(false)}><section className="linked-settings" role="dialog" aria-modal="true" aria-label="Tùy chọn Linked List" onClick={event => event.stopPropagation()}><button className="round-button linked-settings-close" aria-label="Đóng tùy chọn" onClick={() => setSettings(false)}><X size={18} /></button><h2>Tùy chọn</h2><button className="chunky-button button-green" onClick={() => onSoundChange(!sound)}>{sound ? <Volume2 /> : <VolumeX />}{sound ? "Âm thanh: Bật" : "Âm thanh: Tắt"}</button><button className="linked-settings-reset" onClick={() => { reset(); setSettings(false); }}><RotateCcw size={17} /> Bắt đầu lại</button></section></div>}
      {drag && <div className={`linked-drag-ghost ghost-${drag.kind}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true">{drag.kind === "node" ? <div className={`linked-node linked-node-${nodes.find(node => node.id === drag.id)!.color}`}><span className="linked-node-body"><span className="linked-node-value">{valueOf(drag.id)}</span></span></div> : <><span className="linked-nail-head" /><span className="linked-nail-tip" /></>}</div>}
  </GameLayout>;
}

function NodeCard({ node, assembled = false, complete = false, nextKnown = false, selected, onPointerDown, onKeyboard, onHole, holeActive = false }: {
  node: LinkedPuzzle["nodes"][number]; assembled?: boolean; complete?: boolean; nextKnown?: boolean; selected: boolean;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void; onKeyboard: () => void;
  onHole?: () => void; holeActive?: boolean;
}) {
  return <div data-next-known={nextKnown} data-demo-node={node.id} className={`linked-node linked-node-${node.color} ${selected ? "node-selected" : ""} ${assembled ? "node-assembled" : ""}`}>
    {assembled && <button className={`ll-hole ${holeActive ? "hole-active" : ""}`} data-node={node.id} type="button" aria-label={`Lỗ của khối ${node.value}`} onClick={event => { event.stopPropagation(); onHole?.(); }}><span /></button>}
    <button className="linked-node-body" type="button" aria-label={`Khối ${node.value}${assembled ? " ở hàng lắp" : " ở khay"}`} aria-pressed={selected} onPointerDown={onPointerDown} onClick={event => { if (event.detail === 0) onKeyboard(); }}><span className="linked-node-value">{node.value}</span><span className="linked-node-next" aria-hidden="true">next</span></button>
    {complete && <span className="linked-complete-check" role="img" aria-label="Hoàn thành"><Check size={16} /></span>}
    {assembled && <span className="ll-rope-anchor" data-node={node.id} aria-hidden="true" />}
  </div>;
}

import LinkedDemoControls from "./LinkedDemoControls";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowRight, Check, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { GameFooter, GameHeader, GameHintButton, GameLayout, GameStats } from "./GameHud";
import VictoryCelebration from "./VictoryCelebration";
import Pig from "./Pig";
import { connectLinkedNode, createLinkedPuzzle, linkedPuzzleComplete, CONSTRUCTION_LEVELS, placeLinkedNode, type LinkedPuzzle } from "../engine/linkedList";
import { gameAudio } from "../audio/gameAudio";
import type { LinkedLevel } from "../engine/linkedCurriculum";

type Props = {
  mode: "demo" | "play";
  sound: boolean;
  onSoundChange: (enabled: boolean) => void;
  onBack: () => void;
  onPlay: () => void;
  onChooseMap: () => void;
  onComplete: () => void;
  level: LinkedLevel;
  onNextLevel: () => void;
};
type Point = { x: number; y: number };
type Geometry = { anchors: Record<string, Point>; holes: Record<string, Point> };
type Drag = { kind: "node" | "nail"; id: string; x: number; y: number; startX: number; startY: number; original: string | null };

const FREE_ROPE_OFFSET = { x: 0, y: 60 };

const DEMO_LINES = [
  "Mỗi khối là một nút. Ô lớn chứa dữ liệu; phần bên phải chứa con trỏ next.",
  "Đặt nút 7 vào ô HEAD. Đây là điểm bắt đầu danh sách.",
  "Đặt nút 2 ngay sau 7.",
  "Đặt nút 9 vào ô thứ ba.",
  "Đặt nút 4 vào ô TAIL ở cuối hàng lắp.",
  "Kéo đinh của 7 tới lỗ của 2 để nối 7 → 2.",
  "Nối tiếp đinh của 2 vào lỗ của 9: ta có 7 → 2 → 9.",
  "Nối 9 → 4 để giữ danh sách liền mạch.",
  "Cắm đinh của nút cuối 4 vào lỗ NULL để kết thúc danh sách.",
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
  const [puzzle, setPuzzle] = useState(() => createLinkedPuzzle(level));
  const [demoStep, setDemoStep] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nullDock, setNullDock] = useState<string | null>(null);
  const [selectedNail, setSelectedNail] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [geometry, setGeometry] = useState<Geometry>({ anchors: {}, holes: {} });
  const [hint, setHint] = useState(false);
  const [settings, setSettings] = useState(false);
  const [message, setMessage] = useState(() => `Kéo các khối từ khay lên hàng lắp theo thứ tự ${CONSTRUCTION_LEVELS[level].values.join(" → ")}, rồi nối các đinh.`);
  const [mistakes, setMistakes] = useState(0);
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
      setGeometry({ anchors: locate(".ll-rope-anchor"), holes: locate(".ll-hole") });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [shown.slots.join(",")]);

  function playCue(cue: "correct" | "retry" | "hint" | "enter") {
    gameAudio.unlock();
    gameAudio.play(cue);
  }
  function putNode(id: string, slot: number | null) {
    const next = placeLinkedNode(puzzle, id, slot);
    setPuzzle(next);
    setNullDock(current => current && next.slots.includes(current) ? current : null);
    setSelectedNode(null);
    setSelectedNail(null);
    setMessage(slot === null ? "Khối đã trở về khay." : `Khối ${valueOf(id)} đã vào ô ${slot + 1}. Giờ hãy nối dây vào lỗ của khối tiếp theo.`);
    playCue("correct");
  }
  function plugNail(id: string, target: string | null) {
    const next = connectLinkedNode(puzzle, id, target === "null" ? null : target);
    if (next === puzzle && target !== null) {
      setMistakes(value => value + 1);
      setMessage("Không thể nối một khối vào chính nó hoặc tạo vòng tròn. Hãy chọn lỗ khác.");
      playCue("retry");
      return;
    }
    setPuzzle(next);
    setNullDock(current => target === "null" ? id : current === id ? null : current);
    setSelectedNail(null);
    setMessage(target === "null" ? `Đã cắm đinh của ${valueOf(id)} vào NULL.` : target ? `Đã cắm đinh của ${valueOf(id)} vào lỗ của ${valueOf(target)}.` : `Đã rút đinh của ${valueOf(id)}. Chọn một lỗ mới hoặc cắm vào lỗ NULL.`);
    playCue("correct");
  }
  function valueOf(id: string) { return nodes.find(node => node.id === id)?.value; }
  function beginDrag(kind: Drag["kind"], id: string, event: PointerEvent<HTMLElement>) {
    if (demo || finished) return;
    event.preventDefault();
    event.stopPropagation();
    if (kind === "nail") setNullDock(current => current === id ? null : current);
    setDrag({ kind, id, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, original: kind === "nail" ? puzzle.links[id] : null });
  }
  useEffect(() => {
    if (!drag) return;
    const move = (event: globalThis.PointerEvent) => setDrag(current => current && { ...current, x: event.clientX, y: event.clientY });
    const end = (event: globalThis.PointerEvent) => {
      const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 7;
      const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      if (drag.kind === "node") {
        const slot = element?.closest<HTMLElement>("[data-linked-slot]");
        const bank = element?.closest<HTMLElement>("[data-linked-bank]");
        if (moved && slot) putNode(drag.id, Number(slot.dataset.linkedSlot));
        else if (moved && bank) putNode(drag.id, null);
        else if (!moved) { setSelectedNode(drag.id); setSelectedNail(null); setMessage(`Đã chọn khối ${valueOf(drag.id)}. Chạm ô trống ở hàng lắp để đặt khối.`); }
      } else {
        const hole = element?.closest<HTMLElement>(".ll-hole[data-node]");
        if (moved && hole) plugNail(drag.id, hole.dataset.node ?? null);
        else if (moved) plugNail(drag.id, null);
        else {
          setPuzzle(before => connectLinkedNode(before, drag.id, null));
          setSelectedNail(drag.id);
          setSelectedNode(null);
          setMessage(`Đã rút đinh của ${valueOf(drag.id)}. Chạm lỗ muốn cắm, hoặc kéo đinh đến lỗ đó.`);
          playCue("enter");
        }
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end, { once: true });
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); };
  }, [drag, puzzle]);

  function checkPuzzle() {
    if (linkedPuzzleComplete(puzzle) && nullDock === order.at(-1)) { setConfirmed(true); return; }
    if (placed < order.length) setMessage(`Còn ${order.length - placed} khối chưa đặt lên hàng lắp.`);
    else if (puzzle.slots.some((id, index) => id !== order[index])) setMessage(`Thứ tự khối cần là ${sequence}. Kéo khối trên hàng lắp sang ô khác để đổi chỗ.`);
    else if (correctLinks < order.length - 1) setMessage(`Các khối đã đúng chỗ. Hãy nối từng cặp theo thứ tự ${sequence}.`);
    else setMessage(`Cắm đinh cuối của ${values.at(-1)} vào lỗ NULL.`);
    setMistakes(value => value + 1);
    playCue("hint");
  }
  function reset() {
    setConfirmed(false);
    setNullDock(null);
    setPuzzle(createLinkedPuzzle(level));
    setSelectedNode(null); setSelectedNail(null); setDrag(null); setHint(false); setMistakes(0);
    setMessage(`Kéo các khối từ khay lên hàng lắp theo thứ tự ${sequence}, rồi nối các đinh.`);
    completedRef.current = false;
  }
  function hintText() {
    if (placed < order.length) return `Đặt các khối lên hàng lắp theo thứ tự ${sequence}. Chạm khối rồi chạm ô nếu không muốn kéo.`;
    if (puzzle.slots.join() !== order.join()) return "Kéo khối sang ô khác để đổi vị trí. Khối ở ô đầu là HEAD.";
    for (let index = 0; index < order.length - 1; index++)
      if (puzzle.links[order[index]] !== order[index + 1]) return `Nhấp đinh bên phải khối ${values[index]} rồi cắm vào lỗ bên trái khối ${values[index + 1]}.`;
    return `Cắm đinh khối ${values.at(-1)} vào lỗ NULL. Danh sách kết thúc ở đây.`;
  }

  return <GameLayout className={`linked-world linked-${mode}`} play={!demo}>
    <GameHeader title="Linked List" onBack={onBack} onSettings={() => setSettings(true)} />
    {demo && <GameStats className="linked-stats">
       <span>{`Bước ${demoStep + 1} / ${DEMO_LINES.length}`}</span>
       <span>Một chiều · HEAD → NULL</span>
    </GameStats>}
    <section className="linked-content">
       <div className="linked-intro"><span className="linked-eyebrow">LINKED LIST CONSTRUCTION</span><h2>{demo ? "Nối từng mắt xích" : "Lắp một danh sách liên kết"}</h2><p>{demo ? DEMO_LINES[demoStep] : `Đặt các khối theo thứ tự ${sequence}. Nối các nút liên tiếp và cắm đinh cuối vào lỗ NULL.`}</p></div>
      <div className="linked-workspace">
        <div className="linked-panel linked-bank" data-linked-bank="true">
           <div className="linked-panel-heading"><span className="linked-section-number">01</span><div><h3>Khay khối</h3><p>Chọn hoặc kéo khối cần lắp</p></div><span className="linked-panel-count">{demo ? "MẪU" : `${order.length - placed} CÒN LẠI`}</span></div>
           <div className="linked-bank-row">{bank.map(node => <div key={node.id} className="linked-bank-cell">{!(demo ? shown.slots : puzzle.slots).includes(node.id) ? <NodeCard node={node} selected={selectedNode === node.id} onPointerDown={event => beginDrag("node", node.id, event)} onKeyboard={() => { if (!demo) { setSelectedNode(node.id); setSelectedNail(null); } }} /> : <span className="linked-bank-empty">{demo ? "Đã lắp" : "Đã chuyển"}</span>}</div>)}</div>
        </div>
        <div className="linked-flow-arrow" aria-hidden="true"><ArrowRight size={24} /></div>
        <div className="linked-panel linked-assembly">
          <div className="linked-panel-heading"><span className="linked-section-number">02</span><div><h3>Hàng lắp</h3><p>Đặt khối, rồi cắm đinh vào lỗ</p></div><span className="linked-panel-count">HEAD → NULL</span></div>
          <div className="linked-assembly-scroll">
             <div className="linked-board" ref={boardRef} style={{ gridTemplateColumns: `repeat(${shown.slots.length}, 180px)`, gap: 50, width: shown.slots.length * 180 + (shown.slots.length - 1) * 50 + 120 }}>
              <svg className="linked-ropes" aria-hidden="true">{shown.slots.map(id => {
                if (!id || !geometry.anchors[id]) return null;
                const start = geometry.anchors[id];
                const target = drag?.kind === "nail" && drag.id === id ? { x: drag.x - (boardRef.current?.getBoundingClientRect().left ?? 0), y: drag.y - (boardRef.current?.getBoundingClientRect().top ?? 0) } : linkTarget(id) && geometry.holes[linkTarget(id)!] ? geometry.holes[linkTarget(id)!] : { x: start.x + FREE_ROPE_OFFSET.x, y: start.y + FREE_ROPE_OFFSET.y };
                return <path key={id} className={`linked-rope ${linkTarget(id) ? "rope-plugged" : ""}`} d={`M ${start.x} ${start.y} C ${start.x + 20} ${start.y + 52}, ${target.x - 20} ${target.y + 42}, ${target.x} ${target.y}`} />;
              })}</svg>
              {shown.slots.map((id, index) => <div key={index} className={`linked-slot ${selectedNode ? "slot-available" : ""}`} data-linked-slot={index} role={selectedNode ? "button" : undefined} tabIndex={selectedNode ? 0 : -1} aria-label={selectedNode ? `Đặt khối vào ô ${index + 1}` : undefined} onClick={() => { if (selectedNode && !demo) putNode(selectedNode, index); }} onKeyDown={event => { if (selectedNode && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); putNode(selectedNode, index); } }}>
                 <span className="linked-slot-label">{index === 0 ? "HEAD" : index === shown.slots.length - 1 ? "TAIL" : `VỊ TRÍ ${index + 1}`}</span>
                 {id ? <NodeCard node={nodes.find(node => node.id === id)!} assembled selected={selectedNode === id} onPointerDown={event => beginDrag("node", id, event)} onKeyboard={() => { setSelectedNode(id); setSelectedNail(null); }} onHole={() => { if (selectedNail) plugNail(selectedNail, id); }} holeActive={Boolean(selectedNail && selectedNail !== id)} /> : <div className="linked-empty-slot"><span>+</span><small>Đặt khối</small></div>}
                <span className="linked-slot-index">{String(index + 1).padStart(2, "0")}</span>
              </div>)}
              <div className="construction-null"><button className={`ll-hole ${selectedNail ? "hole-active" : ""}`} data-node="null" type="button" disabled={demo} aria-label="Lỗ NULL" onClick={() => { if (selectedNail) plugNail(selectedNail, "null"); }}><span /></button><button className="linked-null-target" type="button" disabled={demo} onClick={() => { if (selectedNail) plugNail(selectedNail, "null"); }}>NULL</button></div>
              {shown.slots.map(id => {
                if (!id || !geometry.anchors[id] || drag?.kind === "nail" && drag.id === id) return null;
                const at = linkTarget(id) && geometry.holes[linkTarget(id)!] ? geometry.holes[linkTarget(id)!] : { x: geometry.anchors[id].x + FREE_ROPE_OFFSET.x, y: geometry.anchors[id].y + FREE_ROPE_OFFSET.y };
                return <button key={id} className={`linked-nail ${linkTarget(id) ? "nail-plugged" : ""} ${selectedNail === id ? "nail-selected" : ""}`} style={{ left: at.x, top: at.y }} type="button" aria-label={`Đinh của khối ${valueOf(id)}${shown.links[id] ? ` đang cắm vào khối ${valueOf(shown.links[id]!)}` : shownDock === id ? " đang cắm vào NULL" : " đang rời"}`} disabled={demo} onPointerDown={event => beginDrag("nail", id, event)} onClick={event => { if (event.detail === 0 && !demo) { setNullDock(current => current === id ? null : current); setSelectedNail(id); setPuzzle(before => connectLinkedNode(before, id, null)); } }}><span className="linked-nail-head" /><span className="linked-nail-tip" /></button>;
              })}
            </div>
          </div>
          <div className="linked-tail-note"><span className="linked-swipe-hint">Vuốt ngang để xem các ô · </span><span className="linked-null-dot" /> Cắm đinh ở nút cuối vào lỗ <strong>NULL</strong></div>
        </div>
      </div>
      {!demo && <div className="linked-actions"><p role="status">{message}</p><button className="chunky-button button-green" onClick={checkPuzzle} disabled={finished}><Check size={19} /> Kiểm tra</button></div>}
      {demo && <div className="linked-demo-controls"><div className="linked-demo-buta"><Pig mood="explaining" /><p>{DEMO_LINES[demoStep]}</p></div><LinkedDemoControls step={demoStep} count={DEMO_LINES.length} onStep={setDemoStep} onPlay={onPlay} /></div>}
       {finished && <VictoryCelebration className="linked-victory" title="Danh sách đã kết nối!" nextLabel="Màn tiếp theo" stars={mistakes === 0 ? 3 : mistakes < 3 ? 2 : 1} difficulty={level === 1 ? "easy" : level === 2 ? "medium" : "hard"} onReplay={reset} onHarder={onNextLevel} onMap={onChooseMap}><strong>{sequence} → NULL</strong><p>Bạn đã lắp {order.length} nút và nối {order.length - 1} con trỏ next.</p></VictoryCelebration>}
    </section>
    {!demo && <GameFooter className="linked-footer"><button className="linked-reset" onClick={reset}><RotateCcw size={17} /> Làm lại</button><GameHintButton aria-expanded={hint} onClick={() => { setHint(value => !value); playCue("hint"); }} />{hint && <div className="linked-hint"><Pig mood="thinking" /><p>{hintText()}</p><button className="round-button" aria-label="Đóng gợi ý" onClick={() => setHint(false)}><X size={17} /></button></div>}</GameFooter>}
    {settings && <div className="linked-settings-backdrop" role="presentation" onClick={() => setSettings(false)}><section className="linked-settings" role="dialog" aria-modal="true" aria-label="Tùy chọn Linked List" onClick={event => event.stopPropagation()}><button className="round-button linked-settings-close" aria-label="Đóng tùy chọn" onClick={() => setSettings(false)}><X size={18} /></button><h2>Tùy chọn</h2><button className="chunky-button button-green" onClick={() => onSoundChange(!sound)}>{sound ? <Volume2 /> : <VolumeX />}{sound ? "Âm thanh: Bật" : "Âm thanh: Tắt"}</button><button className="linked-settings-reset" onClick={() => { reset(); setSettings(false); }}><RotateCcw size={17} /> Bắt đầu lại</button></section></div>}
      {drag && <div className={`linked-drag-ghost ghost-${drag.kind}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true">{drag.kind === "node" ? <span>{valueOf(drag.id)}</span> : <><span className="linked-nail-head" /><span className="linked-nail-tip" /></>}</div>}
  </GameLayout>;
}

function NodeCard({ node, assembled = false, selected, onPointerDown, onKeyboard, onHole, holeActive = false }: {
  node: LinkedPuzzle["nodes"][number]; assembled?: boolean; selected: boolean;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void; onKeyboard: () => void;
  onHole?: () => void; holeActive?: boolean;
}) {
  return <div className={`linked-node linked-node-${node.color} ${selected ? "node-selected" : ""} ${assembled ? "node-assembled" : ""}`}>
    {assembled && <button className={`ll-hole ${holeActive ? "hole-active" : ""}`} data-node={node.id} type="button" aria-label={`Lỗ của khối ${node.value}`} onClick={event => { event.stopPropagation(); onHole?.(); }}><span /></button>}
    <button className="linked-node-body" type="button" aria-label={`Khối ${node.value}${assembled ? " ở hàng lắp" : " ở khay"}`} onPointerDown={onPointerDown} onClick={event => { if (event.detail === 0) onKeyboard(); }}><span className="linked-node-value">{node.value}</span><span className="linked-node-caption">DỮ LIỆU</span></button>
    <span className="ll-rope-anchor" data-node={node.id} aria-hidden="true" />
    {!assembled && <span className="linked-bank-rope" aria-hidden="true"><span className="linked-mini-nail" /></span>}
  </div>;
}

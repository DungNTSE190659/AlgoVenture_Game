import LinkedDemoControls from "./LinkedDemoControls";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowRight, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { GameFooter, GameHeader, GameLayout, GameStats } from "./GameHud";
import VictoryCelebration from "./VictoryCelebration";
import Pig from "./Pig";
import { gameAudio } from "../audio/gameAudio";
import { linkedChallenge } from "../engine/linkedChallenges";
import { LINKED_ACTIONS, type LinkedAction } from "../engine/linkedActions";
import { LINKED_DEMOS } from "../engine/linkedDemo";
import type { LinkedLevel, LinkedTrackId } from "../engine/linkedCurriculum";

type Algorithm = Exclude<LinkedTrackId, "linked-list">;
type Props = { mode: "demo" | "play"; onPlay: () => void; algorithm: Algorithm; level: LinkedLevel; sound: boolean; onSoundChange: (value: boolean) => void; onBack: () => void; onChooseMap: () => void; onComplete: () => void; onNextLevel: () => void };
const LABELS: Record<Algorithm, string> = { "linked-traversal": "Traversal", "linked-search": "Search", "linked-insertion": "Insertion", "linked-deletion": "Deletion", "linked-reversal": "Reversal" };

export default function LinkedAlgorithmGame({ mode, onPlay, algorithm, level, sound, onSoundChange, onBack, onChooseMap, onComplete, onNextLevel }: Props) {
  const demo = mode === "demo";
  const [demoStep, setDemoStep] = useState(0);
  const challenge = linkedChallenge(algorithm, level);
  const [step, setStep] = useState(0);
  const [held, setHeld] = useState<{ kind: LinkedAction["kind"]; from?: number } | null>(null);
  const [drag, setDrag] = useState<{ kind: LinkedAction["kind"]; from?: number; x: number; y: number; startX: number; startY: number } | null>(null);
  const [message, setMessage] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [settings, setSettings] = useState(false);
  const actions = LINKED_ACTIONS[algorithm];
  const finished = step === actions.length;
  const doneRef = useRef(false);
  useEffect(() => {
    if (demo || !finished || doneRef.current) return;
    doneRef.current = true;
    gameAudio.play("finish");
    onComplete();
  }, [finished, onComplete]);
  const task = actions[Math.min(step, actions.length - 1)];
  function begin(kind: LinkedAction["kind"], from: number | undefined, event: PointerEvent<HTMLElement>) {
    if (demo || finished) return;
    event.preventDefault(); event.stopPropagation();
    setHeld({ kind, from });
    setDrag({ kind, from, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
  }
  function accept(kind: LinkedAction["kind"], from: number | undefined, target: number | "bank" | "slot" | "null") {
    if (demo || finished || kind !== task.kind || from !== task.from || target !== task.to) {
      setMistakes(value => value + 1);
      setMessage("Chưa đúng thao tác. Hãy làm theo hướng dẫn bên dưới.");
      gameAudio.play("retry");
      return;
    }
    setStep(value => value + 1);
    setMessage(task.result);
    setHeld(null);
    gameAudio.play("correct");
  }
  useEffect(() => {
    if (!drag) return;
    const move = (event: globalThis.PointerEvent) => setDrag(current => current && { ...current, x: event.clientX, y: event.clientY });
    const up = (event: globalThis.PointerEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-linked-target]")?.dataset.linkedTarget;
      const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 8;
      if (moved && target !== undefined) accept(drag.kind, drag.from, /^\d+$/.test(target) ? Number(target) : target as "bank" | "slot" | "null");
      setDrag(null);
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up, { once: true });
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag, task, demo, finished]);
  function reset() { setStep(0); setDemoStep(0); setHeld(null); setDrag(null); setMessage(""); setMistakes(0); doneRef.current = false; }
  const frames = LINKED_DEMOS[algorithm];
  const frame = frames[demoStep];
  const shown = demo ? frame.values : algorithm === "linked-insertion" && step > 0 ? challenge.after as number[]
    : algorithm === "linked-deletion" && step >= 2 ? challenge.after as number[]
    : algorithm === "linked-reversal" && finished ? challenge.after as number[] : challenge.before as number[];
  const cursorIndex = algorithm === "linked-traversal" || algorithm === "linked-search" ? step - 1 : -1;

  return <GameLayout className="linked-world linked-algorithm-world" play={!demo}>
    <GameHeader title={`Linked List ${LABELS[algorithm]}`} onBack={onBack} onSettings={() => setSettings(true)} />
    <GameStats className="linked-stats" score={demo ? undefined : Math.max(0, 300 - mistakes * 50)}><span>{demo ? "Demo" : "Thử thách"}</span><span>Bước {demo ? demoStep + 1 : Math.min(step + 1, actions.length)}/{demo ? frames.length : actions.length}</span></GameStats>
    <section className="linked-content linked-algorithm-content">
      <div className="linked-intro"><span className="linked-eyebrow">LINKED LIST {LABELS[algorithm].toUpperCase()}</span><h2>{challenge.title}</h2><p>{challenge.instruction}</p></div>
      <div className="linked-workspace linked-algorithm-workspace">
        <div className="linked-panel linked-bank" data-linked-target="bank" onClick={() => { if (held && task.to === "bank") accept(held.kind, held.from, "bank"); }}>
          <div className="linked-panel-heading"><span className="linked-section-number">01</span><div><h3>Khay khối</h3><p>Các khối đang được sử dụng</p></div><span className="linked-panel-count">MẪU</span></div>
          <div className="linked-bank-row">{!demo && algorithm === "linked-insertion" && step === 0 && <button className="linked-bank-new linked-node linked-node-mint" type="button" onPointerDown={event => begin("node", 5, event)} onClick={() => setHeld({kind: "node", from: 5})}><span className="linked-node-body"><span className="linked-node-value">5</span><span className="linked-node-caption">NÚT MỚI</span></span></button>}{!demo && (algorithm === "linked-traversal" || algorithm === "linked-search" || algorithm === "linked-reversal") && <button className="linked-drag-token" type="button" onPointerDown={event => begin(algorithm === "linked-reversal" ? "head" : "cursor", undefined, event)} onClick={() => setHeld({kind: algorithm === "linked-reversal" ? "head" : "cursor"})}>{algorithm === "linked-reversal" ? "HEAD" : "CURRENT"}</button>}{shown.map((value, index) => <div className="linked-bank-cell" key={`bank-${index}`}><span className="linked-bank-empty">Đã lắp {value}</span></div>)}</div>
        </div>
        <div className="linked-flow-arrow" aria-hidden="true"><ArrowRight size={24} /></div>
        <div className="linked-panel linked-assembly">
          <div className="linked-panel-heading"><span className="linked-section-number">02</span><div><h3>Hàng lắp</h3><p>Theo dõi liên kết từ HEAD đến NULL</p></div><span className="linked-panel-count">HEAD → NULL</span></div>
          <div className="linked-assembly-scroll">
            <div className="linked-algorithm-slots" aria-label={`Danh sách liên kết ${shown.join(" đến ")}`}>
              {shown.map((value, index) => <div className="linked-slot linked-algorithm-slot" key={`${value}-${index}`}>
                <span className="linked-slot-label">{index === 0 ? "HEAD" : index === shown.length - 1 ? "TAIL" : `VỊ TRÍ ${index + 1}`}</span>
                {!demo && algorithm === "linked-insertion" && step === 0 && index === 2 && <div className="linked-insert-target" data-linked-target="slot" role="button" tabIndex={0} aria-label="Chỗ trống giữa 3 và 6" onClick={() => { if (held) accept(held.kind, held.from, "slot"); }}>+ Chèn 5</div>}
                <div className={`linked-node linked-node-${["peach", "mint", "lavender", "peach"][index % 4]} ${demo && frame.focus === index ? "demo-node-active" : ""} ${demo && frame.muted === index ? "demo-node-muted" : ""} ${demo && frame.link === index ? "demo-link-active" : ""} ${!demo && algorithm === "linked-insertion" && ((value === 3 && step < 3) || (value === 5 && step < 2)) ? "play-link-open" : ""} ${!demo && algorithm === "linked-deletion" && value === 3 && step >= 1 ? "demo-node-muted" : ""} ${!demo && algorithm === "linked-reversal" && index > 0 && step >= index + 1 ? "play-link-reversed" : ""} ${!demo && algorithm === "linked-reversal" && index === 0 && step >= 1 ? "play-link-null" : ""}`}>

                  <button className="ll-hole linked-static-hole" type="button" data-linked-target={value} disabled={demo} aria-label={`Lỗ của khối ${value}`} onClick={() => { if (held) accept(held.kind, held.from, value); }}><span /></button>
                  <button className="linked-node-body" type="button" data-linked-target={index} disabled={demo} aria-label={`Khối ${value} ở hàng lắp`} onPointerDown={event => { if (algorithm === "linked-deletion" && value === 3) begin("node", value, event); }} onClick={() => { if (held && (held.kind === "cursor" || held.kind === "head")) accept(held.kind, held.from, index); else if (algorithm === "linked-deletion" && value === 3) setHeld({kind: "node", from: 3}); }}><span className="linked-node-value">{value}</span><span className="linked-node-caption">DỮ LIỆU</span></button>
                  <span className="linked-static-rope" aria-hidden="true" /><button className="linked-static-nail" type="button" disabled={demo} aria-label={`Đinh của khối ${value}`} onPointerDown={event => begin("nail", value, event)} onClick={() => setHeld({kind: "nail", from: value})}><span className="linked-nail-head" /><span className="linked-nail-tip" /></button>
                </div>
                {!demo && cursorIndex === index && <span className="linked-current-marker">CURRENT</span>}
                <span className="linked-slot-index">{String(index + 1).padStart(2, "0")}</span>
              </div>)}
            </div>
          </div>
          <div className="linked-tail-note">{!demo && algorithm === "linked-reversal" && <button className="linked-null-target" type="button" data-linked-target="null" onClick={() => { if (held) accept(held.kind, held.from, "null"); }}>NULL</button>}<span className="linked-null-dot" /> Đinh ở nút cuối để rời = <strong>NULL</strong></div>
        </div>
      </div>
      {!demo && !finished && <div className="linked-action-guide" role="status"><Pig mood="pointing" /><div><strong>Bước {step + 1}/{actions.length}</strong><p>{task.instruction}</p>{message && <small>{message} · </small>}<small>Kéo bằng chuột hoặc chạm nguồn rồi chạm đích.</small></div></div>}
      {!demo && finished && <VictoryCelebration className="linked-victory" title={`Hoàn thành màn ${level}!`} nextLabel="Màn tiếp theo" stars={mistakes === 0 ? 3 : mistakes < 3 ? 2 : 1} difficulty="hard" onReplay={reset} onHarder={onNextLevel} onMap={onChooseMap}><strong>{challenge.after.join(" → ")} → NULL</strong><p>Bạn đã luyện {challenge.title.toLowerCase()} trên danh sách liên kết.</p></VictoryCelebration>}
      {demo && <div className="linked-demo-controls"><div className="linked-demo-buta"><Pig mood="explaining" /><p aria-live="polite">{frame.note}</p></div><LinkedDemoControls step={demoStep} count={frames.length} onStep={setDemoStep} onPlay={onPlay} /></div>}
      {drag && <div className="linked-drag-ghost linked-action-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">{drag.kind === "nail" ? "×" : drag.kind === "node" ? drag.from : drag.kind === "head" ? "HEAD" : "CURRENT"}</div>}
    </section>
    <GameFooter className="linked-algorithm-footer"><button className="linked-reset" onClick={reset}><RotateCcw size={17} /> Làm lại</button></GameFooter>
    {settings && <div className="linked-settings-backdrop" role="presentation" onClick={() => setSettings(false)}><section className="linked-settings" role="dialog" aria-modal="true" aria-label="Tùy chọn Linked List" onClick={event => event.stopPropagation()}><button className="round-button linked-settings-close" aria-label="Đóng tùy chọn" onClick={() => setSettings(false)}><X size={18} /></button><h2>Tùy chọn</h2><button className="chunky-button button-green" onClick={() => onSoundChange(!sound)}>{sound ? <Volume2 /> : <VolumeX />}{sound ? "Âm thanh: Bật" : "Âm thanh: Tắt"}</button><button className="linked-settings-reset" onClick={() => { reset(); setSettings(false); }}><RotateCcw size={17} /> Bắt đầu lại</button></section></div>}
  </GameLayout>;
}

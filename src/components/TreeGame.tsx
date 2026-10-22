import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowRight, Check, Flag, GitBranch, Grip, Leaf, Lightbulb, Pause, Play, RotateCcw, SkipBack, SkipForward, Sprout, Undo2, Volume2, VolumeX, X } from "./TreeAssetIcons";
import { GameHeader, GameStats } from "./GameHud";
import Pig from "./Pig";
import TreeWorld from "./TreeWorld";
import TreeSignalBranches from "./TreeSignalBranches";
import VictoryCelebration from "./VictoryCelebration";
import HapticsToggle from "./HapticsToggle";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import { cloneBoard, createTreeCourse, resolveTreeDrop, treePositions, type BSTReplacement, type TreeItem, type TreeLessonId } from "../engine/tree";
import useTreeDemoMotion from "./useTreeDemoMotion";
import { explainTreeMistake } from "../engine/treeFeedback";

type Props = { algorithm: TreeLessonId; mode: "demo" | "play"; sound: boolean; onSoundChange: (enabled: boolean) => void; onBack: () => void; onPlay: () => void; onChooseMap: () => void; onComplete: () => void };
type Drag = { item: TreeItem; x: number; y: number; over: string | null; nodeSkin?: string };
function ItemFace({ item }: { item: TreeItem }) {
  if (item.kind === "pig") return <span className="tree-buta-token"><Pig mood="happy" /></span>;
  if (item.kind === "flag") return <Flag size={26} />;
  if (item.kind === "branch") return <><GitBranch size={20} /><span>{item.label}</span></>;
  if (item.kind === "label") return <span>{item.label}</span>;
  return <>{item.kind === "seed" && <Sprout size={17} />}<span>{item.value}</span></>;
}
function readSpeed() { try { const value = Number(localStorage.getItem("algoventure.tree-speed")); return [1, 1.5, 2].includes(value) ? value : 1; } catch { return 1; } }

export default function TreeGame(props: Props) {
  const { algorithm, mode, sound, onSoundChange, onBack, onPlay, onChooseMap, onComplete } = props;
  const demo = mode === "demo";
  const [replacementStrategy, setReplacementStrategy] = useState<BSTReplacement>("successor");
  const course = useMemo(() => createTreeCourse(algorithm, replacementStrategy), [algorithm, replacementStrategy]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [labelPlacements, setLabelPlacements] = useState<Record<number, number>>({});
  const [mistakes, setMistakes] = useState(0);
  const [held, setHeld] = useState<TreeItem | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [message, setMessage] = useState("");
  const [outcome, setOutcome] = useState<"correct" | "retry" | "">("");
  const [modal, setModal] = useState<"settings" | "hint" | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(readSpeed);
  const [victory, setVictory] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const modalTrigger = useRef<HTMLElement | null>(null);
  const pointer = useRef<{ id: number; item: TreeItem; x: number; y: number; moved: boolean; nodeSkin?: string } | null>(null);
  const suppressClick = useRef(false);
  const committed = useRef("");
  const completionSent = useRef(false);
  const boardViewport = useRef<HTMLDivElement>(null);
  const round = course.rounds[roundIndex];
  const step = round.steps[stepIndex];
  const roundDone = stepIndex >= round.steps.length;
  const allDone = roundDone && roundIndex === course.rounds.length - 1;
  const scriptedScene = stepIndex === 0 ? round.initial : round.steps[stepIndex - 1].after;
  const scene = algorithm === "tree-basics" && roundIndex === 1 && !demo ? cloneBoard(scriptedScene) : scriptedScene;
  if (scene !== scriptedScene) for (const [indexText, slot] of Object.entries(labelPlacements)) {
    const index = Number(indexText);
    if (index >= stepIndex) continue;
    const assigned = round.steps[index], original = Number(assigned.target.slice(5));
    if (slot === original) continue;
    const name = assigned.items.find(i => i.id === assigned.item)!.label;
    scene.labels[original] = (scene.labels[original] ?? "").split(" · ").filter(label => label && label !== name).join(" · ");
    scene.labels[slot] = [scene.labels[slot], name].filter(Boolean).join(" · ");
  }
  const positions = treePositions(scene, step);
  const totalSteps = course.rounds.reduce((sum, r) => sum + r.steps.length, 0);
  const progress = course.rounds.slice(0, roundIndex).reduce((sum, r) => sum + r.steps.length, 0) + stepIndex;
  const score = Math.max(0, progress * 100 - mistakes * 25);
  const blocked = demo || !!modal || victory;
  const trayItems = step?.items.filter(item => item.slot === undefined) ?? [];
  const harvestTarget = step?.targets.some(target => target.id === "result") ?? false;
  const harvestTray = harvestTarget || scene.result.length > 0;

  function cancelDrag() { pointer.current = null; setDrag(null); setHeld(null); }
  useEffect(() => {
    const interrupt = () => { cancelDrag(); setPlaying(false); gameAudio.stop(); stopHaptics(); };
    const visibility = () => { if (document.hidden) interrupt(); };
    window.addEventListener("blur", interrupt); document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("blur", interrupt); document.removeEventListener("visibilitychange", visibility); gameAudio.stop(); stopHaptics(); };
  }, []);

  useEffect(() => {
    const panel = dialog.current;
    if (!modal || !panel) return;
    panel.showModal();
    return () => { panel.close(); modalTrigger.current?.focus({ preventScroll: true }); };
  }, [modal]);
  function openModal(kind: "settings" | "hint") { modalTrigger.current = document.activeElement as HTMLElement; cancelDrag(); setPlaying(false); gameAudio.stop(); setModal(kind); }

  useEffect(() => {
    if (!demo || !playing || modal || allDone || document.hidden) return;
    const timer = window.setTimeout(() => {
      if (roundDone) { setRoundIndex(i => i + 1); setStepIndex(0); }
      else { setStepIndex(i => i + 1); gameAudio.play("drop"); }
    }, 2300 / speed);
    return () => window.clearTimeout(timer);
  }, [demo, playing, modal, allDone, roundDone, roundIndex, stepIndex, speed, replacementStrategy]);
  useEffect(() => { if (allDone) setPlaying(false); }, [allDone]);



  function drop(item: TreeItem, target: string | null) {
    setHeld(null); setDrag(null);
    if (blocked || !step || !target || (item.slot !== undefined && target === `slot:${item.slot}` && item.kind !== "pig")) return;
    const key = `${roundIndex}:${stepIndex}`;
    if (committed.current === key) return;
    gameAudio.unlock();
    if (!resolveTreeDrop(step, item.id, target)) {
      setMistakes(v => v + 1); setOutcome("retry");
      setMessage(explainTreeMistake({ lesson: algorithm, round, step, board: scene, item, target })); playFeedback("retry"); return;
    }
    committed.current = key;
    const choice = step.choices?.find(option => option.target === target);
    const acceptedStep = choice ? createTreeCourse(algorithm, choice.strategy).rounds[roundIndex].steps[stepIndex] : step;
    if (choice) setReplacementStrategy(choice.strategy);
    if (step.acceptedTargets && target.startsWith("slot:")) setLabelPlacements(previous => ({ ...previous, [stepIndex]: Number(target.slice(5)) }));
    const slot = Number(target.slice(5));
    const labelReason = item.label.startsWith("Độ sâu") ? `Từ gốc đến ${scene.nodes[slot]} có ${Math.floor(Math.log2(slot + 1))} cạnh.` : item.label === "Lá" ? `${scene.nodes[slot]} không có nút con nên là lá.` : item.label === "Cha" ? `${scene.nodes[slot]} có nút con nên là cha.` : acceptedStep.explanation;
    setStepIndex(i => i + 1); setOutcome("correct"); setMessage(step.acceptedTargets ? labelReason : acceptedStep.explanation); playFeedback("correct");
  }
  function pickOrDrop(item: TreeItem | undefined, target?: string) {
    if (suppressClick.current) { suppressClick.current = false; return; }
    if (blocked) return;
    if (held && target) { drop(held, target); return; }
    if (item) { setHeld(held?.id === item.id ? null : item); gameAudio.unlock(); gameAudio.play("tap"); }
  }
  function startDrag(event: PointerEvent, item: TreeItem) {
    if (blocked || pointer.current || event.button !== 0) return;
    const nodeSkin = event.currentTarget.classList.contains("tree-node") ? getComputedStyle(event.currentTarget).backgroundImage : undefined;
    pointer.current = { id: event.pointerId, item, x: event.clientX, y: event.clientY, moved: false, nodeSkin };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event: PointerEvent) {
    const p = pointer.current; if (!p || p.id !== event.pointerId) return;
    if (!p.moved && Math.hypot(event.clientX - p.x, event.clientY - p.y) < 6) return;
    p.moved = true;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-drop]")?.dataset.drop ?? null;
    setHeld(p.item); setDrag({ item: p.item, x: event.clientX, y: event.clientY, over: target, nodeSkin: p.nodeSkin });
    const area = boardViewport.current;
    if (area && area.scrollWidth > area.clientWidth) {
      const bounds = area.getBoundingClientRect();
      if (event.clientY >= bounds.top && event.clientY <= bounds.bottom) {
        if (event.clientX > bounds.right - 30) area.scrollLeft += 8;
        if (event.clientX < bounds.left + 30) area.scrollLeft -= 8;
      }
    }
  }
  function endDrag(event: PointerEvent) {
    const p = pointer.current; if (!p || p.id !== event.pointerId) return;
    pointer.current = null;
    if (p.moved) {
      suppressClick.current = true;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-drop]")?.dataset.drop ?? null;
      drop(p.item, target);
      // Pointer capture may route the click to a different element; never suppress a later keyboard click.
      window.setTimeout(() => { suppressClick.current = false; }, 0);
    }
  }
  function moveStep(delta: number) {
    cancelDrag(); setPlaying(false); setMessage(""); setOutcome(""); committed.current = "";
    if (demo && delta < 0 && stepIndex === 0 && roundIndex > 0) { setRoundIndex(i => i - 1); setStepIndex(course.rounds[roundIndex - 1].steps.length); }
    else if (demo && delta > 0 && roundDone && !allDone) { setRoundIndex(i => i + 1); setStepIndex(0); }
    else setStepIndex(i => Math.max(0, Math.min(round.steps.length, i + delta)));
  }
  function restart(all = false) { cancelDrag(); setPlaying(false); setStepIndex(0); setLabelPlacements({}); setReplacementStrategy("successor"); if (all) { setRoundIndex(0); setMistakes(0); } setMessage(""); setOutcome(""); setVictory(false); committed.current = ""; completionSent.current = false; }
  function chooseDemoReplacement(strategy: BSTReplacement) {
    if (strategy === replacementStrategy) return;
    cancelDrag(); setPlaying(false); setReplacementStrategy(strategy);
    if (roundIndex === 2) setStepIndex(0);
    setMessage(""); setOutcome(""); committed.current = "";
  }
  function verify() {
    if (demo || !roundDone || completionSent.current || !round.validate(scene)) return;
    const key = `verify:${roundIndex}`;
    if (committed.current === key) return;
    committed.current = key;
    if (!allDone) { setRoundIndex(i => i + 1); setStepIndex(0); setMessage("Chặng trước chính xác. Cùng khám phá chặng tiếp theo!"); setOutcome("correct"); playFeedback("correct"); }
    else { completionSent.current = true; setVictory(true); playFeedback("finish"); onComplete(); }
  }
  const paused = !playing || !!modal;
  useTreeDemoMotion(root, demo, `${replacementStrategy}:${roundIndex}:${stepIndex}`, step, paused, speed);

  return <div ref={root} className={`tree-game ${demo ? "tree-demo" : "tree-play"} ${paused ? "tree-paused" : ""}`} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={event => { if (pointer.current?.id === event.pointerId) { suppressClick.current = true; cancelDrag(); window.setTimeout(() => { suppressClick.current = false; }, 0); } }}>
    <TreeWorld />
    <GameHeader assetTheme="tree" title={course.title} beforeSettings={<GameStats assetTheme="tree" score={score} className="tree-hud" scoreClassName="tree-score">{null}</GameStats>} onBack={onBack} onSettings={() => openModal("settings")} />
    <div className="tree-shell">
      <div className="tree-course-progress"><span style={{ width: `${progress / totalSteps * 100}%` }} /></div>
      <div className="tree-mission"><div className="tree-mission-heading"><h2>{round.title}</h2><span className="tree-meta">{demo ? "Demo" : "Thử thách"} · {roundIndex + 1}/{course.rounds.length}</span></div><p>{roundDone ? demo ? "Xong chặng này! Xem tiếp hoặc tự mình thử." : "Cây đã sẵn sàng. Kiểm tra kết quả của bạn nhé!" : step.instruction}</p></div>
      <section className="tree-workshop" aria-label={`Bài ${course.title}`}>
        <div className="tree-main">
          <div className="tree-board-viewport" ref={boardViewport}>
            <div className={`tree-board ${Object.keys(positions).some(i => Number(i) >= 7) ? "tree-has-depth" : ""}`} aria-label="Bàn chơi cây">
              <div className="tree-board-caption"><GitBranch size={14} /><span>{algorithm.startsWith("bst") ? "Nhỏ bên trái · Lớn bên phải" : "Mỗi nhánh kể một câu chuyện"}</span></div>
              <TreeSignalBranches positions={positions} scene={scene} step={step} order={round.traversalOrder}
                paused={!!modal || victory || (demo && paused)} speed={speed} />
              {Object.entries(positions).map(([key, pos]) => {
                const slot = Number(key), value = scene.nodes[slot];
                const target = step?.targets.find(t => t.slot === slot);
                const item = step?.items.find(t => t.slot === slot && t.kind !== "pig" && t.kind !== "seed");
                const token = step?.items.find(t => t.slot === slot && (t.kind === "pig" || t.kind === "seed"));
                const isOver = drag?.over === `slot:${slot}`;
                const replacing = algorithm === "bst-delete" && scene.nodes[0] === undefined && step?.target === "slot:0";
                const removingRoot = step?.target === "tray" && step.item === "node:0";
                const markedSource = (replacing || removingRoot) && item?.id === step?.item;
                const replacementTarget = replacing && slot === 0;
                const show = value !== undefined || target || scene.cursor === slot || scene.labels[slot];
                if (!show) return null;
                return <div className={`tree-node-wrap ${slot >= 7 ? "tree-node-deep" : ""}`} key={slot} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                  {!(slot >= 7 && scene.labels[slot]) && <span className="tree-node-relation">{slot === 0 ? "Gốc" : slot % 2 ? "Trái" : "Phải"}</span>}
                  <button type="button" className={`tree-node ${markedSource ? "tree-replacement-source" : ""} ${replacementTarget ? "tree-replacement-target" : ""} ${value === undefined ? "tree-empty-node" : ""} ${scene.visited.includes(slot) ? "tree-visited" : ""} ${scene.cursor === slot ? "tree-current" : ""} ${target && (held || demo && playing) ? "tree-drop-ready" : ""} ${isOver ? "tree-drop-over" : ""} ${held?.id === item?.id && item ? "tree-item-selected" : ""}`}
                    aria-label={value === undefined ? target?.label ?? "Nhánh rỗng" : `Nút ${value}`} aria-pressed={item ? held?.id === item.id : undefined}
                    data-item={item?.id} data-drop={`slot:${slot}`} data-slot={slot} data-tree-motion={value !== undefined ? `node:${value}` : undefined}
                    onPointerDown={item ? e => startDrag(e, item) : undefined} onClick={() => pickOrDrop(item, `slot:${slot}`)}
                    tabIndex={demo ? -1 : 0}>
                    {value === undefined ? <span className="tree-empty-plus">+</span> : <><span>{value}</span>{scene.visited.includes(slot) && <Check size={12} className="tree-node-check" />}</>}
                  </button>
                  {(markedSource || replacementTarget) && <span className="tree-replacement-label">{replacementTarget ? "Ô gốc trống" : removingRoot ? "40 → khay" : "Kéo lên gốc"}</span>}
                  {token && <button className={`tree-traveler tree-traveler-${token.kind} ${slot % 2 ? "tree-traveler-left" : ""} ${held?.id === token.id ? "tree-item-selected" : ""}`} aria-label={token.label} data-item={token.id} data-tree-motion={token.id} onPointerDown={e => startDrag(e, token)} onClick={() => pickOrDrop(token)} tabIndex={demo ? -1 : 0}><ItemFace item={token} /></button>}
                  {scene.labels[slot] && <span className="tree-node-label">{scene.labels[slot]}</span>}
                  {scene.cursor === slot && !token && !scene.labels[slot] && <span className="tree-cursor-marker" aria-label="Điểm dừng hiện tại"><Flag size={15} /></span>}
                </div>;
              })}
            </div>
          </div>
        </div>
        <aside className="tree-side">
          <div className={`tree-supply ${harvestTarget && held ? "tree-harvest-ready" : ""} ${harvestTarget && drag?.over === "result" ? "tree-harvest-over" : ""}`}
            data-drop={harvestTarget ? "result" : undefined} role={harvestTarget && !demo ? "button" : undefined}
            aria-label={harvestTarget ? "Giỏ thu hoạch" : undefined} tabIndex={harvestTarget && !demo ? 0 : undefined}
            onClick={() => { if (harvestTarget) pickOrDrop(undefined, "result"); }}
            onKeyDown={event => { if (harvestTarget && event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); pickOrDrop(undefined, "result"); } }}>
            <div className="tree-supply-heading"><span><Grip size={16} /> {harvestTray ? "Giỏ thu hoạch" : step?.targets.some(t => t.id === "tray") ? "Khay tháo nút" : "Túi thám hiểm"}</span><span>{stepIndex}/{round.steps.length}</span></div>
            {harvestTray ? <div className="tree-harvest" aria-label="Thứ tự duyệt">
              {scene.result.map((v, i) => <span className="tree-result-chip" key={i}><small>{i + 1}</small>{v}</span>)}
              {!scene.result.length && <span className="tree-supply-note">Thả nút cây vào khay</span>}
            </div> : step?.targets.some(t => t.id === "tray") ? <button className={`tree-remove-tray ${held ? "tree-drop-ready" : ""} ${drag?.over === "tray" ? "tree-drop-over" : ""}`} data-drop="tray" aria-label="Khay tháo nút" onClick={() => { if (held) drop(held, "tray"); }} tabIndex={demo ? -1 : 0}><Leaf size={22} /><span>Thả nút cần tháo vào đây</span></button> : <div className="tree-items">
              {trayItems.map(item => <button key={item.id} className={`tree-supply-item tree-supply-${item.kind} ${held?.id === item.id ? "tree-item-selected" : ""}`} aria-label={item.label} aria-pressed={held?.id === item.id} data-item={item.id} onPointerDown={e => startDrag(e, item)} onClick={() => pickOrDrop(item)} tabIndex={demo ? -1 : 0}><ItemFace item={item} /></button>)}
              {!trayItems.length && <span className="tree-supply-note">{roundDone ? <><Check size={18} /> Đã xong các thao tác</> : <><Grip size={18} /> Nhấc thẻ trực tiếp từ cây</>}</span>}
            </div>}
          </div>
          <div className="tree-guide"><div className="tree-guide-pig"><Pig mood={roundDone ? "proud" : outcome === "retry" ? "thinking" : "explaining"} /></div><div className="tree-speech"><span>Buta đồng hành</span><p className={`tree-local-feedback ${outcome}`} role="status">{message || (held ? `Đã chọn ${held.label}. Kéo hoặc chọn nơi đặt.` : demo && stepIndex > 0 ? round.steps[stepIndex - 1].explanation : round.summary)}</p></div></div>
          <div className="tree-actions">
            {demo ? <>
              <div className="tree-demo-buttons"><button className="round-button" aria-label="Bước trước" disabled={!roundIndex && !stepIndex} onClick={() => moveStep(-1)}><SkipBack size={21} /></button><button className={`chunky-button ${allDone ? "button-green" : "button-purple"}`} onClick={() => { if (allDone) onPlay(); else { gameAudio.unlock(); setPlaying(v => !v); } }}>{allDone ? <Play size={20} /> : playing ? <Pause size={20} /> : <Play size={20} />}{allDone ? "Tự mình thử" : playing ? "Tạm dừng" : "Phát demo"}</button><button className="round-button" aria-label={allDone ? "Xem lại từ đầu" : "Bước tiếp"} onClick={() => allDone ? restart(true) : moveStep(1)}>{allDone ? <RotateCcw size={21} /> : <SkipForward size={21} />}</button></div>
              <div className="tree-demo-status"><span>Bước {progress}/{totalSteps}</span><button aria-label={`Tốc độ demo ${speed}x`} onClick={() => { const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1; setSpeed(next); try { localStorage.setItem("algoventure.tree-speed", String(next)); } catch { /* Optional storage. */ } }}>{speed}x</button><button className="tree-demo-try" onClick={onPlay}>Tự mình thử <ArrowRight size={15} /></button></div>
            </> : <>
              {roundDone ? <button className="chunky-button button-green tree-verify" onClick={verify}><Check size={21} /> Kiểm tra cây <ArrowRight size={18} /></button> : <button className="tree-hint" onClick={() => openModal("hint")}><Lightbulb size={20} /> Buta gợi ý</button>}
              <div className="tree-tools"><button aria-label="Hoàn tác" disabled={!stepIndex} onClick={() => moveStep(-1)}><Undo2 size={18} /> Hoàn tác</button><button aria-label="Làm lại chặng" onClick={() => restart()}><RotateCcw size={17} /> Làm lại</button></div>
            </>}
          </div>
        </aside>
      </section>
    </div>
    {drag && <div className={`tree-drag-ghost tree-supply-${drag.item.kind}`} style={{ left: drag.x, top: drag.y, backgroundImage: drag.nodeSkin }} aria-hidden="true"><ItemFace item={drag.item} /></div>}
    {modal && <dialog ref={dialog} className="modal tree-modal" aria-labelledby="tree-modal-title" onCancel={e => { e.preventDefault(); setModal(null); }}>
      <div className="modal-header"><h2 id="tree-modal-title">{modal === "settings" ? "Nhịp học của bạn" : "Buta gợi ý"}</h2><button className="round-button" aria-label="Đóng" onClick={() => setModal(null)}><X size={20} /></button></div>
      {modal === "settings" ? <><button className="tree-setting-toggle" aria-pressed={sound} onClick={() => onSoundChange(!sound)}>{sound ? <Volume2 size={21} /> : <VolumeX size={21} />} Hiệu ứng âm thanh <strong>{sound ? "Bật" : "Tắt"}</strong></button><HapticsToggle assetTheme="tree" /><p>Kéo bằng chuột hoặc ngón tay. Bạn cũng có thể chọn vật rồi chọn nơi đặt bằng chạm hoặc phím Enter/Space. Escape đóng hộp thoại.</p><p>Giá trị BST không trùng nhau. Khi xóa nút hai con, có thể dùng successor (nhỏ nhất bên phải) hoặc predecessor (lớn nhất bên trái). Trong Thử thách, kéo Buta từ nút cần xóa sang nhánh bạn chọn.</p>{demo && algorithm === "bst-delete" && <div className="tree-replacement-options" role="group" aria-label="Cách xóa nút hai con trong Demo"><span>Cách xóa nút hai con trong Demo</span><button aria-pressed={replacementStrategy === "successor"} onClick={() => chooseDemoReplacement("successor")}>Successor · Nhỏ nhất bên phải</button><button aria-pressed={replacementStrategy === "predecessor"} onClick={() => chooseDemoReplacement("predecessor")}>Predecessor · Lớn nhất bên trái</button></div>}</> : <p>{step?.hint ?? "Đã xong các bước. Bấm Kiểm tra cây để xác nhận kết quả."}</p>}
      <button className="chunky-button button-green tree-modal-primary" onClick={() => setModal(null)}>Trở lại khu rừng <ArrowRight size={18} /></button>
    </dialog>}
    {victory && <VictoryCelebration className="tree-victory" title="Khu rừng đã thêm xanh!" stars={mistakes === 0 ? 3 : mistakes < 4 ? 2 : 1} difficulty="hard" onReplay={() => restart(true)} onHarder={() => {}} onMap={onChooseMap}><p>Bạn đã hoàn thành {course.title}.</p><p>{course.rounds.length} chặng · {score} điểm</p></VictoryCelebration>}
  </div>;
}

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Check, Flag, GitFork, Pause, Play, RotateCcw, SkipBack, SkipForward, Undo2, Volume2, VolumeX, X } from "lucide-react";
import { checkTrail, createQuickTrail, createQuickTrailLesson, emptyTrailArrangement, moveTrailFriend, trailPool, type QuickTrail, type TrailArrangement, type TrailDestination, type TrailGroup } from "../engine/quickTrail";
import { createArray, type Difficulty, type Item } from "../engine/quicksort";
import { LEVELS } from "../engine/gameConfig";
import { GameHeader, GameStats, GameLayout, GameFooter, GameHintButton } from "./GameHud";
import { useDemoPlayback, useDemoMotionSpeed } from "./useDemoPlayback";
import { activateTouchButton } from "./touchActivation";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import HapticsToggle from "./HapticsToggle";
import Pig from "./Pig";
import { FriendArt } from "./BubbleRunBoard";
import VictoryCelebration from "./VictoryCelebration";
import "../quickForest.css";

type Props = {
  mode:"demo"|"play";input:number[];difficulty:Difficulty;sound:boolean;speed:number;
  onBack:()=>void;onPlay:()=>void;onChooseMap:()=>void;onComplete:()=>void;
  onChange:(values:number[],level:Difficulty)=>void;onSoundChange:(value:boolean)=>void;onSpeedChange:(speed:number)=>void;
};
const labels={small:"Nhỏ hơn",equal:"Bằng mốc",large:"Lớn hơn"};
export function createForestArray(level:Difficulty){const values=createArray(level);if(level === "hard")values[0]=-Math.abs(values[0]);return values;}
export default function QuickForestGame({mode,input,difficulty,sound,speed,onBack,onPlay,onChooseMap,onComplete,onChange,onSoundChange,onSpeedChange}:Props){
  const demo=mode === "demo",frames=useMemo(()=>createQuickTrailLesson(input),[input]);
  const [trail,setTrail]=useState(()=>createQuickTrail(input)),[active,setActive]=useState<string|null>("root"),[arrangement,setArrangement]=useState<TrailArrangement>(emptyTrailArrangement);
  const [history,setHistory]=useState<TrailArrangement[]>([]),[selected,setSelected]=useState<number|null>(null),[wrong,setWrong]=useState<number[]>([]);
  const [score,setScore]=useState(0),[mistakes,setMistakes]=useState(0),[feedback,setFeedback]=useState(""),[hint,setHint]=useState(false),[settings,setSettings]=useState(false);
  const [cursor,setCursor]=useState(0),[playing,setPlaying]=useState(false),[motionPaused,setMotionPaused]=useState(false),[visible,setVisible]=useState(!document.hidden);
  const frame=frames[cursor],shown=demo ? frame.trail : trail,shownActive=demo ? frame.active : active,a=demo ? frame.arrangement : arrangement;
  const node=shown.nodes.find(n=>n.id === shownActive),pivot=shown.items.find(item=>item.id === a.pivot),open=shown.nodes.filter(n=>n.status === "open"),done=demo ? frame.kind === "done" : open.length === 0;
  const paused=settings||!visible||(demo&&motionPaused),blocked=demo||paused||hint||done,ready=!!node&&!!pivot&&trailPool(node,a).length === 0;
  const current=useRef({trail,active,arrangement,blocked});current.current={trail,active,arrangement,blocked};
  const awarded=useRef(false),lastCue=useRef(-1),touchStart=useRef<{x:number;y:number}|null>(null),motionRoot=useDemoMotionSpeed(demo ? speed : 1);
  useEffect(()=>{const change=()=>setVisible(!document.hidden);document.addEventListener("visibilitychange",change);return()=>{document.removeEventListener("visibilitychange",change);gameAudio.stop();stopHaptics();};},[]);
  useEffect(()=>{if(paused||!sound)gameAudio.stop();if(paused)stopHaptics();},[paused,sound]);
  useDemoPlayback(cursor,frame.duration,speed,demo&&playing&&!paused&&!done,()=>setCursor(n=>Math.min(n+1,frames.length-1)));
  useEffect(()=>{if(!demo||paused||cursor === 0||lastCue.current === cursor)return;gameAudio.play(frame.kind === "move" ? "drop" : frame.kind === "split" ? "split" : frame.kind === "done" ? "finish" : "scan");lastCue.current=cursor;},[demo,paused,cursor,frame.kind]);
  useEffect(()=>{if(!demo&&done&&!awarded.current){awarded.current=true;playFeedback("finish");onComplete();}},[demo,done,onComplete]);
  function activate(id:string){if(blocked||!trail.nodes.some(n=>n.id === id&&n.status === "open"))return;setActive(id);setArrangement(emptyTrailArrangement());setHistory([]);setSelected(null);setWrong([]);setFeedback("");gameAudio.unlock();playFeedback("tap");}
  function place(id:number,destination:TrailDestination){
    const before=current.current,branch=before.trail.nodes.find(n=>n.id === before.active);if(before.blocked||!branch)return;
    if(before.arrangement.pivot === null&&destination !== "pivot"&&destination !== "pool"){setFeedback("Chọn một số làm mốc trước nhé.");return;}
    const next=moveTrailFriend(branch,before.arrangement,id,destination);if(next === before.arrangement)return;
    current.current={...before,arrangement:next};setHistory(h=>[...h,before.arrangement]);setArrangement(next);setSelected(null);setWrong([]);setFeedback("");gameAudio.unlock();playFeedback(destination === "pivot" ? "pivot" : "drop");
  }
  function commit(){
    const before=current.current;if(before.blocked||!before.active)return;const result=checkTrail(before.trail,before.active,before.arrangement);gameAudio.unlock();
    if(!result.ok){if(result.reason === "missing"){setFeedback("Chia hết các số rồi kiểm tra nhé.");return;}setWrong(result.wrong);setMistakes(n=>n+1);setScore(n=>Math.max(0,n-25));setFeedback("Có số chưa đúng nhóm. So sánh lại với mốc rồi chuyển nhóm để sửa. −25 điểm.");playFeedback("retry");return;}
    current.current={trail:result.trail,active:null,arrangement:emptyTrailArrangement(),blocked:false};setTrail(result.trail);setActive(null);setArrangement(emptyTrailArrangement());setHistory([]);setSelected(null);setWrong([]);setScore(n=>n+result.gained+100);setFeedback("Đúng rồi! Chọn một nhánh đang mở để tiếp tục.");playFeedback("split");
  }
  function reset(){const fresh=createQuickTrail(input);gameAudio.stop();current.current={trail:fresh,active:"root",arrangement:emptyTrailArrangement(),blocked:false};setTrail(fresh);setActive("root");setArrangement(emptyTrailArrangement());setHistory([]);setSelected(null);setWrong([]);setScore(0);setMistakes(0);setFeedback("");setHint(false);setSettings(false);setCursor(0);setPlaying(false);setMotionPaused(false);awarded.current=false;lastCue.current=-1;}
  function step(delta:number){gameAudio.unlock();gameAudio.stop();setPlaying(false);setMotionPaused(false);setCursor(n=>Math.max(0,Math.min(frames.length-1,n+delta)));}
  const title=demo ? frame.title : !node ? "Chọn nhánh tiếp theo" : pivot ? `Chia nhóm theo mốc ${pivot.value}` : "Chọn một số làm mốc";
  const task=done ? "Cả mảng đã có thứ tự từ bé đến lớn." : !node ? "Chọn nhóm nhỏ hoặc nhóm lớn đang mở trên bản đồ." : !pivot ? "Chạm một thẻ, rồi chọn làm mốc. Bạn có thể chọn số bất kỳ." : ready ? "Kiểm tra các nhóm, hoặc chuyển thẻ để sửa lại." : "Dẫn bạn đang chờ sang một lối, hoặc đứng cạnh mốc nếu bằng nhau.";
  return <GameLayout ref={motionRoot} play={!demo} className={`quick-forest-world qf-${mode}`} data-frame={cursor} data-paused={paused} data-active={shownActive??""}
    onPointerDownCapture={event=>{touchStart.current={x:event.clientX,y:event.clientY};}} onPointerUpCapture={event=>{
      if(event.pointerType !== "touch"||!touchStart.current||Math.hypot(event.clientX-touchStart.current.x,event.clientY-touchStart.current.y)>8)return;
      const button=(event.target as Element).closest<HTMLButtonElement>("button");if(!button||button.disabled)return;const box=button.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)return;event.preventDefault();activateTouchButton(button);
    }}>
    <GameHeader title="Quick Sort" play={!demo} onBack={onBack} onSettings={()=>{gameAudio.unlock();setSettings(true);}} />
    <GameStats className="qf-stats" score={demo ? undefined : score}><span>{shown.partitions} lần chia nhóm</span><span>{shown.fixed.length}/{input.length} số đã xong</span></GameStats>
    <section className="qf-content"><h2>{title}</h2><p className="qf-task">{task}</p>
      <nav className={`qf-map ${shown.nodes.length === 1&&shownActive ? "is-single" : ""}`} aria-label="Bản đồ các nhánh">{shown.nodes.map(branch=><button key={branch.id} className={`qf-node ${branch.id === shownActive ? "is-current" : ""} ${branch.status !== "open" ? "is-finished" : ""}`} data-node={branch.id} disabled={blocked||branch.status !== "open"||branch.id === shownActive} onClick={()=>activate(branch.id)} aria-label={`Khám phá nhánh ${branch.id}`}>
        {branch.status === "open" ? <GitFork size={12}/> : <Check size={12}/>}<span>{branch.id === "root" ? "Khởi hành" : branch.id.slice(4).split("").map(n=>n === "L" ? "Nhỏ" : "Lớn").join(" · ")}</span><small>{branch.ids.length}</small>
      </button>)}</nav>
      <div className={`qf-overview ${shown.fixed.length === 0 ? "is-pristine" : ""}`} aria-label="Thứ tự toàn mảng">{shown.items.map(item=><span key={item.id} data-result-id={item.id} data-value={item.value} className={shown.fixed.includes(item.id) ? "is-fixed" : ""}>{item.value}{shown.fixed.includes(item.id)&&<Check size={9}/>}</span>)}</div>
      {node ? <PartitionBoard trail={shown} active={node.id} arrangement={a} selected={demo ? null : selected} wrong={demo ? [] : wrong} enabled={!blocked} paused={paused} onSelect={setSelected} onPlace={place}/> : !done&&<div className="qf-choose-path"><GitFork size={34}/><p>{open.length} nhánh cần xử lý.<br/>Chọn một nhánh để tiếp tục.</p></div>}
      {!demo&&!done&&<><div className="qf-actions"><button className="round-button" aria-label="Hoàn tác lượt đi" disabled={blocked||!history.length} onClick={()=>{const previous=history.at(-1)!;current.current={...current.current,arrangement:previous};setArrangement(previous);setHistory(h=>h.slice(0,-1));setWrong([]);setSelected(null);}}><Undo2 size={18}/></button><button className="chunky-button button-green" disabled={blocked||!ready} onClick={commit}><Check size={19}/> Kiểm tra nhóm</button></div><p className="qf-feedback" role="status">{feedback}</p></>}
      {!demo&&done&&<VictoryCelebration className="qf-victory" stars={mistakes === 0 ? 3 : mistakes<=3 ? 2 : 1} difficulty={difficulty} onReplay={reset} onHarder={level=>onChange(createForestArray(level),level)} onMap={onChooseMap}><strong>{score.toLocaleString("vi-VN")} điểm</strong><p>{trail.partitions} lần chia nhóm · {mistakes} lần sửa nhóm</p></VictoryCelebration>}
    </section>
    {!demo&&!done&&<GameFooter><GameHintButton aria-expanded={hint} onClick={()=>{gameAudio.unlock();playFeedback("hint");setHint(v=>!v);}}/>{hint&&<div className="qf-hint"><Pig mood="thinking"/><p>{!pivot ? "Chọn một thẻ bất kỳ làm pivot. Số gần giữa về giá trị thường giúp chia hai nhánh cân bằng hơn." : "So sánh từng số với pivot: bé hơn vào nhóm nhỏ, bằng vào nhóm giữa, lớn hơn vào nhóm lớn. Không cần xếp thứ tự bên trong nhóm. Chọn thẻ đã đặt để chuyển nhóm nếu cần."}</p><button className="round-button" aria-label="Đóng gợi ý" onClick={()=>setHint(false)}><X size={17}/></button></div>}</GameFooter>}
    {demo&&<footer className="qf-demo-controls"><div className="qf-dialogue"><Pig mood={done ? "celebrate" : frame.kind === "intro"||frame.kind === "move" ? "happy" : frame.kind === "compare" ? "thinking" : frame.kind === "split" ? "proud" : "pointing"}/><p aria-live="polite">{frame.narration}</p></div><div className="qf-playback"><button className="round-button" aria-label="Bước trước" disabled={cursor === 0} onClick={()=>step(-1)}><SkipBack size={20}/></button><button className="chunky-button button-purple" onClick={()=>{gameAudio.unlock();if(done)onPlay();else{setMotionPaused(playing);setPlaying(v=>!v);}}}>{playing&&!done ? <Pause size={19}/> : <Play size={19}/>}{done ? "Tự mình thử" : playing ? "Tạm dừng" : cursor === 0 ? "Phát demo" : "Tiếp tục"}</button><button className="round-button" aria-label={done ? "Xem lại từ đầu" : "Bước tiếp"} onClick={()=>done ? reset() : step(1)}>{done ? <RotateCcw size={20}/> : <SkipForward size={20}/>}</button></div><div className="qf-demo-progress"><span>{cursor+1}/{frames.length}</span><progress value={cursor} max={frames.length-1} aria-label="Tiến trình demo"/><button className="lesson-speed-button" aria-label={`Tốc độ demo: ${speed}x. Bấm để đổi tốc độ`} onClick={()=>onSpeedChange(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)}>{speed}x</button></div></footer>}
    {settings&&<QuickSettings {...{input,difficulty,sound,onChange,onSoundChange}} onClose={()=>setSettings(false)} onReset={reset}/>}
  </GameLayout>;
}

type Cache=Map<number,{x:number;y:number;location:string}>;
function PartitionBoard({trail,active,arrangement:a,selected,wrong,enabled,paused,onSelect,onPlace}:{trail:QuickTrail;active:string;arrangement:TrailArrangement;selected:number|null;wrong:number[];enabled:boolean;paused:boolean;onSelect:(id:number|null)=>void;onPlace:(id:number,destination:TrailDestination)=>void}){
  const root=useRef<HTMLDivElement>(null),hold=useRef<{id:number;pointer:number;x:number;y:number;moved:boolean}|null>(null),suppress=useRef(false),cache=useRef<Cache>(new Map());
  const [ghost,setGhost]=useState<{id:number;x:number;y:number}|null>(null),[over,setOver]=useState<TrailDestination|null>(null);
  const node=trail.nodes.find(n=>n.id === active)!,pool=trailPool(node,a),byId=(id:number)=>trail.items.find(item=>item.id === id)!,pivot=a.pivot === null ? null : byId(a.pivot);
  function targetAt(x:number,y:number){return document.elementFromPoint(x,y)?.closest<HTMLElement>("[data-forest-drop]")?.dataset.forestDrop as TrailDestination|undefined;}
  function cancel(){const old=hold.current;hold.current=null;setGhost(null);setOver(null);if(old&&root.current?.hasPointerCapture(old.pointer))root.current.releasePointerCapture(old.pointer);}
  useEffect(()=>{if(!enabled||paused)cancel();},[enabled,paused]);
  useEffect(()=>{window.addEventListener("blur",cancel);return()=>window.removeEventListener("blur",cancel);},[]);
  useEffect(()=>{if(!ghost||!enabled)return;const timer=setInterval(()=>{const area=root.current?.closest<HTMLElement>(".quick-forest-world");if(!area)return;const delta=ghost.y<45 ? -10 : ghost.y>innerHeight-45 ? 10 : 0;if(delta)area.scrollBy({top:delta});},16);return()=>clearInterval(timer);},[ghost,enabled]);
  function begin(event:PointerEvent<HTMLButtonElement>,id:number){if(!enabled||event.button !== 0)return;suppress.current=false;hold.current={id,pointer:event.pointerId,x:event.clientX,y:event.clientY,moved:false};}
  function card(id:number,location:string){return <NumberCard key={id} item={byId(id)} location={`${active}:${location}`} cache={cache.current} selected={selected === id} wrong={wrong.includes(id)} enabled={enabled} paused={paused} onPointerDown={event=>begin(event,id)} onClick={event=>{if(suppress.current&&event.detail !== 0){suppress.current=false;return;}if(enabled)onSelect(selected === id ? null : id);}}/>;}
  function send(destination:TrailDestination){if(enabled&&selected !== null)onPlace(selected,destination);}
  return <div ref={root} className={`qf-junction qf-gate ${pivot ? "has-milestone" : ""}`} onPointerMove={event=>{const held=hold.current;if(!held||held.pointer !== event.pointerId||!enabled)return;if(!held.moved&&Math.hypot(event.clientX-held.x,event.clientY-held.y)<7)return;if(!held.moved){held.moved=true;suppress.current=true;event.currentTarget.setPointerCapture(event.pointerId);}setGhost({id:held.id,x:event.clientX,y:event.clientY});setOver(targetAt(event.clientX,event.clientY)??null);}} onPointerUp={event=>{const held=hold.current;if(!held||held.pointer !== event.pointerId)return;const destination=targetAt(event.clientX,event.clientY);cancel();if(enabled&&held.moved&&destination)onPlace(held.id,destination);}} onPointerCancel={cancel} onLostPointerCapture={event=>{if(event.target === event.currentTarget)cancel();}}>
    <svg className="qf-woodland" viewBox="0 0 820 400" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 170Q140 125 270 169T550 165T820 160V400H0Z" fill="#f0f4e7"/>
      <path d="M410 400V300Q410 260 135 145M410 300V145M410 300Q510 250 685 145" fill="none" stroke="#d0bc94" strokeWidth="35" strokeLinecap="round"/>
      <path d="M410 400V300Q410 260 135 145M410 300V145M410 300Q510 250 685 145" fill="none" stroke="#eadabc" strokeWidth="29" strokeLinecap="round"/>
      <path d="M336 115V48Q410 18 484 48V115" fill="none" stroke="#b69a70" strokeWidth="9" strokeLinecap="round"/>
      <path d="M338 47Q410 21 482 47" fill="none" stroke="#d8bd91" strokeWidth="5" strokeLinecap="round"/>
      {[20,800].map((x,i)=><g key={x}><path d={`M${x} 279v80`} stroke="#bdc9a8" strokeWidth="6" strokeLinecap="round"/><path d={`M${x} 219l-22 47h11l-20 38h62l-20-38h11Z`} fill={i ? "#d0dfbc" : "#d9e4c9"}/></g>)}
    </svg>
    {(["small","equal","large"] as TrailGroup[]).map(group=><section key={group} className={`qf-group qf-${group} ${over === group ? "is-over" : ""}`} data-forest-drop={group} aria-label={`Nhóm ${labels[group].toLowerCase()}`}><button className="qf-sign" disabled={!enabled||!pivot} onClick={()=>send(group)} aria-label={`Đưa vào nhóm ${labels[group].toLowerCase()}`}><strong>{group === "equal" ? "Đứng cùng mốc" : labels[group]}</strong><small>{a[group].length}</small><span>{group === "small" ? "<" : group === "equal" ? "=" : ">"} {pivot?.value??"mốc"}</span></button><div className="qf-group-friends">{a[group].map(id=>card(id,group))}{!a[group].length&&<span className="qf-empty">{pivot ? "Thả số vào đây" : "—"}</span>}</div></section>)}
    <div className="qf-station"><section className={`qf-pool ${over === "pool" ? "is-over" : ""}`} data-forest-drop="pool" aria-label="Hàng chờ"><button className="qf-pool-label" disabled={!enabled} onClick={()=>send("pool")}>Hàng chờ <small>{pool.length} bạn</small></button><div className={`qf-pool-friends ${pivot ? "has-pivot" : ""}`}>{(pivot ? pool.slice(0,1) : pool).map(id=>card(id,"pool"))}{!pool.length&&<span className="qf-empty"><Check size={15}/> Đã chia hết</span>}</div>{pivot&&pool.length>1&&<div className="qf-waiting" aria-label="Các số chờ tới lượt">{pool.slice(1).map(id=><span key={id}>{byId(id).value}</span>)}</div>}</section>
      <section className={`qf-pivot ${over === "pivot" ? "is-over" : ""}`} data-forest-drop="pivot" aria-label="Mốc pivot"><button className="qf-pivot-label" disabled={!enabled} onClick={()=>send("pivot")} aria-label="Chọn làm mốc"><Flag size={13}/>{pivot ? "Mốc · pivot" : "Chọn làm mốc"}</button><div>{pivot ? card(pivot.id,"pivot") : <span className="qf-pivot-empty">?</span>}</div><small>{pivot ? `So sánh với ${pivot.value}` : "Chọn một số"}</small></section>
    </div>{ghost&&<div className="qf-ghost" style={{left:ghost.x,top:ghost.y}} aria-hidden="true"><strong>{byId(ghost.id).value}</strong></div>}
  </div>;
}
function NumberCard({item,location,cache,selected,wrong,enabled,paused,onClick,onPointerDown}:{item:Item;location:string;cache:Cache;selected:boolean;wrong:boolean;enabled:boolean;paused:boolean;onClick:React.MouseEventHandler<HTMLButtonElement>;onPointerDown:React.PointerEventHandler<HTMLButtonElement>}){
  const ref=useRef<HTMLButtonElement>(null),animation=useRef<Animation|null>(null),origin=useRef(cache.get(item.id));
  useLayoutEffect(()=>{const node=ref.current;if(!node)return;const box=node.getBoundingClientRect(),before=origin.current;cache.set(item.id,{x:box.x,y:box.y,location});if(!before||before.location === location||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    animation.current?.cancel();const dx=before.x-box.x,dy=before.y-box.y,walking=node.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:`translate(${dx*.5}px,${dy*.5-10}px)`,offset:.5},{transform:"translate(0,0)"}],{duration:400,easing:"ease-in-out"});animation.current=walking;node.dataset.travelling="true";const arrive=()=>{if(animation.current === walking)delete node.dataset.travelling;};walking.onfinish=arrive;walking.oncancel=arrive;if(paused)walking.pause();
  },[location]);
  useLayoutEffect(()=>{const node=ref.current;if(node){const box=node.getBoundingClientRect();cache.set(item.id,{x:box.x,y:box.y,location});}});
  useEffect(()=>{if(paused)animation.current?.pause();else if(animation.current?.playState === "paused")animation.current.play();},[paused]);useEffect(()=>()=>animation.current?.cancel(),[]);
  return <button ref={ref} className={`qf-friend ${selected ? "is-selected" : ""} ${wrong ? "is-wrong" : ""}`} style={{ "--digits": String(item.value).length } as CSSProperties} data-friend={item.id} data-value={item.value} aria-label={`Số ${item.value}, thẻ ${String.fromCharCode(65+item.id)}`} aria-pressed={selected} disabled={!enabled} onClick={onClick} onPointerDown={onPointerDown}><FriendArt id={item.id} resting={false}/><strong>{item.value}</strong><small>{String.fromCharCode(65+item.id)}</small></button>;
}
function QuickSettings({input,difficulty,sound,onChange,onSoundChange,onClose,onReset}:Pick<Props,"input"|"difficulty"|"sound"|"onChange"|"onSoundChange">&{onClose:()=>void;onReset:()=>void}){
  const ref=useRef<HTMLDialogElement>(null),[draft,setDraft]=useState(input.join(", ")),[error,setError]=useState("");useEffect(()=>{const previous=document.activeElement as HTMLElement;ref.current?.showModal();return()=>{ref.current?.close();previous?.focus();};},[]);
  return <dialog ref={ref} className="modal lesson-settings" aria-label="Tùy chọn Quick Sort" onCancel={event=>{event.preventDefault();onClose();}}><div className="modal-header"><h2>Chuyến đi của bạn</h2><button className="round-button" aria-label="Đóng" onClick={onClose}><X size={20}/></button></div><button className="lesson-sound-toggle" aria-pressed={sound} onClick={()=>onSoundChange(!sound)}>{sound ? <Volume2 size={20}/> : <VolumeX size={20}/>}<span>Hiệu ứng âm thanh</span><b>{sound ? "Bật" : "Tắt"}</b></button><HapticsToggle/><label className="setting-label" htmlFor="qf-level">Cấp độ</label><select id="qf-level" className="setting-select" value={difficulty} onChange={event=>{const level=event.target.value as Difficulty;onChange(createForestArray(level),level);}}>{Object.entries(LEVELS).map(([level,config])=><option key={level} value={level}>{config.label} · {config.count} số</option>)}</select><form onSubmit={event=>{event.preventDefault();const tokens=draft.trim().replaceAll("−","-").split(/[,;\s]+/).filter(Boolean),values=tokens.map(Number);if(tokens.length<2||tokens.length>8||tokens.some(token=>!/^[-+]?\d+$/.test(token))||values.some(n=>!Number.isInteger(n)||n< -99||n>99)){setError("Nhập 2–8 số nguyên từ −99 đến 99.");return;}onChange(values,difficulty);}}><label className="setting-label" htmlFor="qf-array">Các phần tử của mảng</label><input id="qf-array" className="custom-input" value={draft} onChange={event=>{setDraft(event.target.value);setError("");}} aria-invalid={!!error}/><p className="lesson-input-help">2–8 số nguyên −99…99. Số bằng mốc thuộc nhóm giữa.</p>{error&&<p className="form-error" role="alert">{error}</p>}<div className="lesson-setting-actions"><button type="submit">Dùng mảng này</button><button type="button" onClick={onReset}>Chơi lại từ đầu</button></div></form><button className="chunky-button button-green modal-primary" onClick={onClose}>Tiếp tục</button></dialog>;
}

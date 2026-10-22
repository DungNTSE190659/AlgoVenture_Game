import { ArrowDown,ArrowUp,CheckCircle2,CircleAlert,Eye,Flag,Heart,Pause,Play,RotateCcw,SkipBack,SkipForward,Star,Volume2,VolumeX,X } from "lucide-react";
import { useEffect,useMemo,useRef,useState,type CSSProperties } from "react";
import { CLOSE,createStackRun,isOpening,missStackBracket,nextStackWave,readStackRecord,saveStackRecord,stackAct,stackMultiplier,startStackRun,type StackAction,type StackRun } from "../engine/stack";
import { STACK_CONFIG as C,STACK_COPY as T,stackTier } from "../engine/stackConfig";
import { createStackLesson } from "../engine/stackLesson";
import { GameFooter,GameHeader,GameHintButton,GameLayout,GameStats } from "./GameHud";
import { useDemoPlayback,useDemoMotionSpeed } from "./useDemoPlayback";
import { useConveyorClock } from "./useConveyorClock";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback,stopHaptics } from "../audio/gameFeedback";
import HapticsToggle from "./HapticsToggle";
import Pig from "./Pig";
import World from "./World";

type Props={mode:"demo"|"play";sound:boolean;speed:number;onBack:()=>void;onPlay:()=>void;onChooseMap:()=>void;onComplete:()=>void;onSoundChange:(on:boolean)=>void;onSpeedChange:(speed:number)=>void};
const theme=(ch:string)=>ch==="("||ch===")"?"round":ch==="["||ch==="]"?"square":"curly";
function StackTube({values,capacity,peek=false,revision=0}:{values:string[];capacity:number;peek?:boolean;revision?:number}){
  return <div className={`stack-store ${peek?"is-peeking":""}`} aria-label={`Stack: ${values.join(" ")||T.empty}`}><span className="stack-store-label">{T.top}<ArrowDown size={14}/></span><div className="stack-tube" style={{"--slots":capacity}as CSSProperties}>{Array.from({length:capacity},(_,index)=><div key={index} className={`stack-slot ${index===values.length-1?"is-top":""}`} data-stack-index={index}>{values[index]!==undefined?<span key={`${revision}:${index}:${values[index]}`} className={`stack-token ${theme(values[index])}`} data-stack-value={values[index]}>{values[index]}</span>:<span className="stack-vacancy">{index}</span>}{index===values.length-1&&<b>{T.top}</b>}</div>)}</div><span className="stack-capacity">{values.length}/{capacity} · {T.base}</span></div>;
}
export default function StackGame({mode,sound,speed,onBack,onPlay,onChooseMap,onComplete,onSoundChange,onSpeedChange}:Props){
  const demo=mode==="demo",lesson=useMemo(createStackLesson,[]),[cursor,setCursor]=useState(0),[playing,setPlaying]=useState(false),[motionPaused,setMotionPaused]=useState(false);
  const[run,setRun]=useState(()=>startStackRun(createStackRun(1,C.defaultSeed+811))),current=useRef(run),[attempt,setAttempt]=useState(0),[record,setRecord]=useState(readStackRecord);
  const[settings,setSettings]=useState(false),[visible,setVisible]=useState(!document.hidden),[hint,setHint]=useState(false),[draft,setDraft]=useState("1"),[error,setError]=useState("");
  const consumed=useRef(""),soundedFrame=useRef(0);
  const panel=useRef<HTMLDialogElement>(null),result=useRef<HTMLDialogElement>(null),awarded=useRef(false),frame=lesson[cursor],cfg=stackTier(run.tier);
  const paused=settings||!visible,flowPaused=paused||hint,finished=run.phase==="won"||run.phase==="lost",demoDone=frame.kind==="done";
  const ch=run.lines[run.wave][run.index],top=run.stack.at(-1),multiplier=stackMultiplier(run);
  function commit(next:StackRun){current.current=next;setRun(next);}
  useEffect(()=>{const change=()=>setVisible(!document.hidden);document.addEventListener("visibilitychange",change);return()=>{document.removeEventListener("visibilitychange",change);gameAudio.stop();stopHaptics();};},[]);
  useEffect(()=>{if(paused||!sound||motionPaused)gameAudio.stop();if(paused)stopHaptics();},[paused,sound,motionPaused]);
  useEffect(()=>{if(!settings)return;const previous=document.activeElement as HTMLElement,dialog=panel.current;dialog?.showModal();return()=>{dialog?.close();previous?.focus();};},[settings]);
  useEffect(()=>{if(demo||!finished)return;const dialog=result.current;dialog?.showModal();return()=>dialog?.close();},[demo,finished]);
  useEffect(()=>{
    if(demo||run.phase==="ready")return;saveStackRecord(run);setRecord(readStackRecord());
    if(run.phase==="won"&&!awarded.current){awarded.current=true;playFeedback("finish");onComplete();}
  },[demo,run.phase,run.tier,onComplete]);
  useDemoPlayback(cursor,Math.max(2400,frame.narration.split(/\s+/).length*150),speed,demo&&playing&&!paused&&!demoDone,()=>setCursor(value=>Math.min(lesson.length-1,value+1)));
  useEffect(()=>{
    if(!demo||soundedFrame.current===cursor)return;
    soundedFrame.current=cursor;
    if(!sound||paused||motionPaused)return;
    gameAudio.play(frame.kind==="push"?"stack-push":frame.kind==="pop"?"stack-pop":frame.kind==="peek"?"stack-peek":frame.kind==="error"?"stack-error":frame.kind==="done"?"finish":"scan");
  },[cursor,demo,frame.kind,sound,paused,motionPaused]);
  const motion=useDemoMotionSpeed(demo?speed:1);
  const clock=useConveyorClock(`${attempt}:${run.wave}:${run.index}:${run.phase}`,cfg.fallMs,!demo&&run.phase==="playing"&&!flowPaused,()=>{const next=missStackBracket(current.current);commit(next);playFeedback("stack-error");});
  useDemoPlayback(run.wave+attempt*10,C.reviewMs,1,!demo&&run.phase==="review"&&!flowPaused,()=>commit(nextStackWave(current.current)));
  const inZone=ch===undefined||clock.progress>=C.greenStart,canAct=!demo&&run.phase==="playing"&&!flowPaused&&inZone;
  function act(action:StackAction){const key=`${attempt}:${run.wave}:${run.index}`;if(!canAct||consumed.current===key)return;gameAudio.unlock();const before=current.current,next=stackAct(before,action,clock.progress);if(next.index!==before.index||next.phase!=="playing")consumed.current=key;commit(next);playFeedback(next.mistakes>before.mistakes?"stack-error":next.phase==="review"?"stack-clear":action==="push"?"stack-push":"stack-pop");}
  function begin(tier:number){gameAudio.stop();stopHaptics();const next=createStackRun(tier,C.defaultSeed+tier*811);commit(startStackRun(next));setAttempt(value=>value+1);setSettings(false);setHint(false);setDraft(String(tier));setError("");awarded.current=false;}
  function step(delta:number){gameAudio.unlock();setPlaying(false);setMotionPaused(false);setCursor(value=>Math.min(lesson.length-1,Math.max(0,value+delta)));}
  const peekText=top?T.peekTop(top,CLOSE[top]):T.peekEmpty;
  const reviewKind=run.review?.success?(run.review.valid?"valid":"invalid"):"missed";
  return <GameLayout play={!demo} className={`stack-world stack-${mode}`} data-stack-phase={demo?frame.kind:run.phase} data-motion-paused={demo?paused||motionPaused:flowPaused} data-wave={run.wave} data-index={run.index} data-tier={run.tier} data-fall-ms={cfg.fallMs} data-hearts={run.hearts}>
    {!demo&&<World map/>}<GameHeader title={T.title} play={!demo} onBack={onBack} onSettings={()=>{gameAudio.unlock();setSettings(true);}}/>
    {!demo&&<GameStats className="stack-stats" score={run.score}><span>{T.level(run.tier)} · {T.wave(run.wave+1,run.lines.length)}</span><span className="stack-multiplier">{T.combo(multiplier)}</span></GameStats>}
    <section className="stack-content" ref={motion}>
      {demo?<div className={`stack-demo-board is-${frame.kind}`}>
        {frame.line&&<div className="stack-demo-line" aria-label="Dòng ngoặc minh họa">{[...frame.line].map((token,index)=><span className={`${theme(token)} ${index===frame.index?"is-current":""} ${index<(frame.index??0)?"is-read":""}`} key={index}>{token}</span>)}</div>}
        <StackTube values={frame.stack} capacity={frame.capacity} peek={frame.kind==="peek"} revision={cursor}/>
        {frame.value&&<div className={`stack-demo-moving ${theme(frame.value)}`} key={cursor}>{frame.kind==="pop"?<ArrowUp size={17}/>:<ArrowDown size={17}/>} {frame.value}</div>}
      </div>:<>
        <div className="stack-wave-top"><div className="stack-hearts" aria-label={`${run.hearts}/${C.hearts} tim`}>{Array.from({length:C.hearts},(_,index)=><Heart key={index} size={20} fill={index<run.hearts?"currentColor":"none"} className={index>=run.hearts?"is-empty":""}/>)}</div><div className="stack-source-line" aria-label="Dòng đang xử lý">{[...run.lines[run.wave]].map((token,index)=><span key={index} className={`${theme(token)} ${index===run.index?"is-current":""} ${index<run.index?"is-read":""}`}>{token}</span>)}</div>{cfg.boss&&<b className="stack-boss">{T.boss}</b>}</div>
        <div className={`stack-arena ${run.error?"has-feedback":""}`}>
          <div className="stack-drop-column" aria-label="Cột ngoặc đang rơi"><span className="stack-drop-label">{ch===undefined?T.end:ch&&isOpening(ch)?T.open:T.closing}</span><div className="stack-drop-track"><div className="stack-action-zone"><span>{T.zone}</span></div><div className="stack-perfect-zone"/>
            {run.phase==="playing"&&<div key={`${run.wave}:${run.index}`} className={`stack-falling ${ch?theme(ch):"is-end"}`} data-bracket={ch??"END"} data-progress={clock.progress.toFixed(3)} style={{top:ch===undefined?"82%":`${clock.progress*100}%`}}>{ch??<Flag size={27}/>}</div>}
          </div></div>
          <div className="stack-tower"><button className="stack-peek-button" onClick={()=>{gameAudio.unlock();setHint(true);playFeedback("stack-peek");}} disabled={finished||run.phase==="ready"} aria-label={T.peek}><Eye size={17}/>{T.peek}</button><StackTube values={run.stack} capacity={cfg.capacity} peek={hint} revision={run.revision}/></div>
        </div>
        <div className={`stack-feedback ${run.error?"is-warning":""}`} role="status" aria-live="polite" aria-atomic="true">
          {run.phase==="review"?<span key={`${attempt}:${run.wave}`} className={`stack-wave-notice is-${reviewKind}`} data-review-kind={reviewKind} style={{"--notice-duration":`${C.reviewMs}ms`}as CSSProperties}>{run.review?.success?<CheckCircle2 aria-hidden="true"/>:<CircleAlert aria-hidden="true"/>}<span>{reviewKind==="valid"?T.noticeValid:reviewKind==="invalid"?T.noticeInvalid:T.noticeMissed}</span></span>:run.feedback||(run.tier>=3?T.flagIntro:T.readyBody)}
        </div>
        <div className="stack-actions"><button className="stack-push" disabled={!canAct||ch===undefined} onClick={()=>act("push")}><ArrowDown size={21}/>{T.push}</button><button className="stack-pop" disabled={!canAct||ch===undefined} onClick={()=>act("pop")}><ArrowUp size={21}/>{T.pop}</button>{run.tier>=3&&<button className="stack-flag" disabled={!canAct} onClick={()=>act("flag")}><Flag size={20}/>{T.flag}</button>}</div>

      </>}
    </section>
    {demo?<footer className="stack-demo-controls"><div className="lesson-narrator stack-dialogue"><div className="lesson-pig-stage"><Pig mood={demoDone?"celebrate":"explaining"}/></div><div className="lesson-narration"><p aria-live="polite">{frame.narration}</p></div></div><div className="stack-playback"><button className="round-button" aria-label={T.previous} disabled={cursor===0} onClick={()=>step(-1)}><SkipBack size={21}/></button><button className="chunky-button button-purple" onClick={()=>{gameAudio.unlock();if(demoDone)onPlay();else{setMotionPaused(playing);setPlaying(value=>!value);}}}>{playing&&!demoDone?<Pause size={21}/>:<Play size={21}/>} {demoDone?T.try:playing?T.pause:cursor?T.resume:T.start}</button><button className="round-button" aria-label={demoDone?T.replayDemo:T.next} onClick={()=>demoDone?(setCursor(0),setPlaying(false),setMotionPaused(false)):step(1)}>{demoDone?<RotateCcw size={21}/>:<SkipForward size={21}/>}</button></div><div className="stack-demo-progress"><span>{cursor+1}/{lesson.length}</span><progress value={cursor} max={lesson.length-1}/><button className="lesson-speed-button" aria-label={T.speed(speed)} onClick={()=>onSpeedChange(speed===1?1.5:speed===1.5?2:1)}>{speed}x</button></div></footer>:!finished&&<GameFooter className="stack-footer"><GameHintButton aria-expanded={hint} onClick={()=>{gameAudio.unlock();setHint(value=>!value);playFeedback("stack-peek");}}/>{hint&&<div className="stack-hint bubble-dialogue"><Pig mood="thinking"/><p>{peekText} {T.hintBody}</p><button className="round-button" aria-label={T.hint} onClick={()=>setHint(false)}><X size={18}/></button></div>}</GameFooter>}
    {settings&&<dialog className="modal lesson-settings" ref={panel} aria-label="Tùy chọn Stack" onCancel={event=>{event.preventDefault();setSettings(false);}}><div className="modal-header"><h2>{T.optionTitle}</h2><button className="round-button" aria-label={T.close} onClick={()=>setSettings(false)}><X size={21}/></button></div><button className="lesson-sound-toggle" aria-pressed={sound} onClick={()=>onSoundChange(!sound)}>{sound?<Volume2 size={21}/>:<VolumeX size={21}/>}<span>{T.sound}</span><b>{sound?T.on:T.off}</b></button><HapticsToggle/>{!demo&&<form onSubmit={event=>{event.preventDefault();const value=Number(draft);if(!Number.isInteger(value)||value<1||value>10000){setError(T.invalidTier);return;}begin(value);}}><label className="setting-label" htmlFor="stack-tier">{T.tier}</label><input className="custom-input" id="stack-tier" type="number" min="1" max="10000" value={draft} onChange={event=>{setDraft(event.target.value);setError("");}}/>{error&&<p className="form-error" role="alert">{error}</p>}<button className="chunky-button button-green" type="submit">{T.apply}</button></form>}<button className="chunky-button button-green modal-primary" onClick={()=>setSettings(false)}>{T.resume}</button></dialog>}
    {!demo&&finished&&<dialog className="victory-screen" ref={result} aria-label={run.phase==="won"?T.victory:T.lost} onCancel={event=>event.preventDefault()}><div className="stack-result"><h2>{run.phase==="won"?T.victory:T.lost}</h2><Pig mood={run.phase==="won"?"celebrate":"oops"}/>{run.phase==="won"&&<div className="stack-result-stars" role="img" aria-label={`${run.hearts===C.hearts?3:run.score>=cfg.waves*cfg.pairs*20?2:1} trên 3 sao`}>{[0,1,2].map(index=><Star key={index} size={40} fill={index<(run.hearts===C.hearts?3:run.score>=cfg.waves*cfg.pairs*20?2:1)?"currentColor":"none"}/>)}</div>}<strong>{T.points(run.score)}</strong><p>{T.summary(run.cleared,run.mistakes)}</p><small>{T.highest}: {record.highestTier} · {T.best}: {record.bestScore}</small><div className="stack-result-actions"><button className="chunky-button button-purple" onClick={()=>begin(run.tier)}><RotateCcw size={18}/>{T.retry}</button><button className="chunky-button button-green" onClick={()=>begin(run.phase==="won"?run.tier+1:Math.max(1,run.tier-1))}>{run.phase==="won"?T.harder:T.easier}</button></div><button className="stack-result-map" onClick={onChooseMap}>{T.continueMap}</button></div></dialog>}
  </GameLayout>;
}

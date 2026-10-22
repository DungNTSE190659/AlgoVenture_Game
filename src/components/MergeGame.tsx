import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { createMergeLesson,mergeHint,type MergeLane } from "../engine/mergeSort";
import { createMergeRace,startMergeRace,steerMergeRace,crossMergeGate,nextMergeRaceGroup,mergeRaceScore,RACE_LEVELS,RACE_GROUP_MS,type MergeRace } from "../engine/mergeRace";
import { useConveyorClock } from "./useConveyorClock";
import { createArray, type Difficulty } from "../engine/quicksort";
import { factoryAsset } from "../engine/mergeFactoryAssets";
import MergeConveyor from "./MergeConveyor";
import MergeDemoBoard from "./MergeDemoBoard";
import { LEVELS, type Mode } from "../engine/gameConfig";
import { gameAudio } from "../audio/gameAudio";
import { playFeedback, stopHaptics } from "../audio/gameFeedback";
import { GameFooter, GameHeader, GameHintButton, GameLayout, GameStats } from "./GameHud";
import { useDemoPlayback } from "./useDemoPlayback";
import HapticsToggle from "./HapticsToggle";
import Pig from "./Pig";
import VictoryCelebration from "./VictoryCelebration";

type Props={mode:Mode;input:number[];difficulty:Difficulty;sound:boolean;speed:number;onBack:()=>void;onPlay:()=>void;onChooseMap:()=>void;onComplete:()=>void;onChange:(values:number[],level:Difficulty)=>void;onSoundChange:(enabled:boolean)=>void;onSpeedChange:(speed:number)=>void};
export default function MergeGame({mode,input,difficulty,sound,speed,onBack,onPlay,onChooseMap,onComplete,onChange,onSoundChange,onSpeedChange}:Props) {
  const demo=mode==="demo",frames=useMemo(()=>createMergeLesson(input),[input]),divisions=useMemo(()=>frames.filter(frame=>frame.groups),[frames]);
  const [run,setRun]=useState(()=>createMergeRace(input)),current=useRef(run);
  const [cursor,setCursor]=useState(0),[opening,setOpening]=useState(0),[playing,setPlaying]=useState(false),[motionPaused,setMotionPaused]=useState(false);
  const [settings,setSettings]=useState(false),[visible,setVisible]=useState(!document.hidden),[hint,setHint]=useState(false),[attempt,setAttempt]=useState(0),[showLoss,setShowLoss]=useState(false),[showVictory,setShowVictory]=useState(false);
  const [draft,setDraft]=useState(input.join(", ")),[error,setError]=useState("");
  const awarded=useRef(false),dialog=useRef<HTMLDialogElement>(null),lossDialog=useRef<HTMLDialogElement>(null);
  const frame=frames[cursor],state=run.sorting,paused=settings||!visible,flowPaused=paused||hint;
  const dividing=!demo&&run.status==="running"&&opening<divisions.length,groups=demo?frame.groups:dividing?divisions[opening].groups:undefined;
  const done=demo?frame.kind==="done":state.phase==="done",level=RACE_LEVELS[difficulty];
  const enabled=!demo&&!flowPaused&&!dividing&&run.status==="running";
  function commit(next:MergeRace){current.current=next;setRun(next);}
  useEffect(()=>{
    const change=()=>setVisible(!document.hidden);document.addEventListener("visibilitychange",change);
    return()=>{document.removeEventListener("visibilitychange",change);gameAudio.stop();stopHaptics();};
  },[]);
  useEffect(()=>{if(paused||motionPaused||!sound)gameAudio.stop();if(paused)stopHaptics();},[paused,motionPaused,sound]);
  useEffect(()=>{
    if(!settings)return;const previous=document.activeElement as HTMLElement,panel=dialog.current;panel?.showModal();
    return()=>{panel?.close();previous?.focus();};
  },[settings]);
  useEffect(()=>{
    if(run.status!=="lost"||demo){setShowLoss(false);return;}
    const timer=setTimeout(()=>setShowLoss(true),450);return()=>clearTimeout(timer);
  },[run.status,demo]);
  useEffect(()=>{
    if(!showLoss)return;const panel=lossDialog.current;panel?.showModal();return()=>panel?.close();
  },[showLoss]);
  useEffect(()=>{
    if(demo||!done||awarded.current)return;awarded.current=true;playFeedback("finish");onComplete();
  },[demo,done,onComplete]);
  useDemoPlayback(cursor,Math.max(2000,frame.narration.split(/\s+/).length*145),speed,demo&&playing&&!paused&&!done,()=>setCursor(value=>Math.min(value+1,frames.length-1)));
  useDemoPlayback(attempt,3600,1,!demo&&run.status==="won"&&!showVictory&&!flowPaused,()=>setShowVictory(true));
  const clock=useConveyorClock(`${attempt}:${run.status}:${dividing?`split-${opening}`:`${state.taskIndex}-${state.moves}-${state.phase}`}`,dividing?450:state.phase==="joined"?RACE_GROUP_MS:level.beatMs,!demo&&run.status==="running"&&!flowPaused,()=>{
    if(dividing){setOpening(value=>value+1);return;}
    if(current.current.sorting.phase==="joined"){commit(nextMergeRaceGroup(current.current));playFeedback("enter");return;}
    const next=crossMergeGate(current.current);commit(next);playFeedback(next.status==="lost"?"retry":"drop");
  });
  useEffect(()=>{
    if(demo&&cursor>0&&!paused&&!motionPaused)gameAudio.play(frame.kind==="split"?"split":frame.kind==="place"?"drop":frame.kind==="done"?"finish":"tap");
  },[cursor,demo,frame.kind,paused,motionPaused]);
  function selectLane(lane:MergeLane){
    if(!enabled)return;const next=steerMergeRace(current.current,lane);if(next===current.current)return;
    gameAudio.unlock();commit(next);playFeedback("pivot");
  }
  function start(){gameAudio.unlock();commit(startMergeRace(current.current));playFeedback("enter");}
  function reset(){
    gameAudio.stop();stopHaptics();awarded.current=false;commit(createMergeRace(input));
    setCursor(0);setOpening(0);setPlaying(false);setMotionPaused(false);setSettings(false);setHint(false);setShowLoss(false);setShowVictory(false);setAttempt(value=>value+1);
  }
  function step(delta:number){gameAudio.unlock();gameAudio.stop();setPlaying(false);setMotionPaused(false);setCursor(value=>Math.max(0,Math.min(frames.length-1,value+delta)));}
  function applyInput(event:React.FormEvent){
    event.preventDefault();const tokens=draft.trim().replaceAll("−","-").split(/[,;\s]+/).filter(Boolean),values=tokens.map(Number);
    if(tokens.length<2||tokens.length>8||tokens.some(token=>!/^[-+]?\d+$/.test(token))||values.some(value=>!Number.isInteger(value)||value< -99||value>99)) {setError("Nhập từ 2 đến 8 số nguyên từ −99 đến 99.");return;}
    onChange(values,difficulty);
  }
  return <GameLayout play={!demo} className={`merge-world merge-${mode}`} data-phase={dividing?"split":state.phase} data-race-status={run.status} data-opening={opening} data-motion-paused={demo?paused||motionPaused:flowPaused||run.status!=="running"}>
    {!demo&&<div className="factory-background" aria-hidden="true"><img src={factoryAsset("factory")} alt=""/><div/></div>}
    <GameHeader title="Merge Sort" play={!demo} onBack={onBack} onSettings={()=>{gameAudio.unlock();setSettings(true);}}/>
    {!demo&&<GameStats className="merge-stats" scoreClassName="merge-score" score={mergeRaceScore(run)}><span>{state.completed}/{state.tasks.length} nhóm đã ghép</span><span className="factory-level">{level.label}</span></GameStats>}
    <section className="merge-content">
      {demo?<MergeDemoBoard state={frame.state} groups={groups} chosen={frame.kind==="compare"?frame.chosen:undefined} paused={paused||motionPaused} speed={speed}/>:<MergeConveyor key={attempt} run={run} groups={groups} difficulty={difficulty} enabled={enabled} paused={flowPaused||run.status!=="running"} progress={clock.progress} time={clock.time} onLane={selectLane} onStart={start} showVictory={showVictory} presentationPaused={flowPaused} onShowResults={()=>setShowVictory(true)}/>}
    </section>
    {!demo&&!done&&<GameFooter className="merge-footer"><GameHintButton disabled={dividing||run.status==="lost"} aria-expanded={hint} onClick={()=>{gameAudio.unlock();playFeedback("hint");setHint(value=>!value);}}/>
      {hint&&<div className="merge-dialogue bubble-dialogue merge-hint"><Pig mood="thinking"/><p>{mergeHint(state)}</p><button className="round-button" aria-label="Đóng gợi ý" onClick={()=>setHint(false)}><X size={18}/></button></div>}
    </GameFooter>}
    {demo&&<footer className="merge-controls"><div className="merge-dialogue bubble-dialogue"><Pig mood={done?"celebrate":"explaining"}/><p aria-live="polite">{frame.narration}</p></div>
      <div className="merge-playback"><button className="round-button" aria-label="Bước trước" disabled={cursor===0} onClick={()=>step(-1)}><SkipBack size={21}/></button>
      <button className="chunky-button button-purple" onClick={()=>{gameAudio.unlock();if(done)onPlay();else{setMotionPaused(playing);setPlaying(value=>!value);}}}>{playing&&!done?<Pause size={21}/>:<Play size={21}/>} {done?"Tự mình thử":playing?"Tạm dừng":cursor===0?"Bắt đầu":"Tiếp tục"}</button>
      <button className="round-button" aria-label={done?"Xem lại từ đầu":"Bước tiếp"} onClick={()=>done?reset():step(1)}>{done?<RotateCcw size={21}/>:<SkipForward size={21}/>}</button></div>
      <div className="merge-demo-progress"><span>{cursor+1}/{frames.length}</span><progress value={cursor} max={frames.length-1} aria-label="Tiến trình demo"/><button className="lesson-speed-button" aria-label={`Tốc độ demo: ${speed}x. Bấm để đổi tốc độ`} onClick={()=>onSpeedChange(speed===1?1.5:speed===1.5?2:1)}>{speed}x</button></div>
    </footer>}
    {!demo&&done&&showVictory&&<VictoryCelebration title="Dây chuyền đã phân loại xong!" className="merge-victory" stars={3} difficulty={difficulty} onReplay={reset} onHarder={value=>onChange(createArray(value),value)} onMap={onChooseMap}><strong>{mergeRaceScore(run).toLocaleString("vi-VN")} điểm</strong><p>{state.moves} kiện qua cổng · Chuỗi hoàn hảo!</p></VictoryCelebration>}
    {!demo&&showLoss&&<dialog className="modal race-loss-dialog" ref={lossDialog} aria-label="Ca phân loại thất bại" onCancel={event=>event.preventDefault()}><Pig mood="oops"/><span>CA PHÂN LOẠI KẾT THÚC</span><h2>Sai một kiện, dừng cả ca!</h2><p>{run.failure?.picked.value===run.failure?.expected.value?"Hai kiện bằng nhau: cần ưu tiên làn A để giữ thứ tự ban đầu.":`Kiện ${run.failure?.picked.value} đã qua trước ${run.failure?.expected.value}. Cần cho kiện nhỏ hơn đi trước.`}</p><strong>{mergeRaceScore(run).toLocaleString("vi-VN")} điểm · {state.moves} kiện đúng</strong><button className="chunky-button button-green" onClick={reset}><RotateCcw size={19}/> Chơi lại</button><button className="race-loss-back" onClick={onBack}>Về bản đồ</button></dialog>}
    {settings&&<dialog className="modal lesson-settings" ref={dialog} aria-label="Tùy chọn Merge Sort" onCancel={event=>{event.preventDefault();setSettings(false);}}><div className="modal-header"><h2>Chuyến đi của bạn</h2><button className="round-button" aria-label="Đóng" onClick={()=>setSettings(false)}><X size={21}/></button></div>
      <button className="lesson-sound-toggle" aria-pressed={sound} onClick={()=>onSoundChange(!sound)}>{sound?<Volume2 size={21}/>:<VolumeX size={21}/>}<span>Hiệu ứng âm thanh</span><b>{sound?"Bật":"Tắt"}</b></button><HapticsToggle/>
      <label className="setting-label" htmlFor="merge-level">Mảng mẫu</label><select id="merge-level" className="setting-select" value={difficulty} onChange={event=>{const value=event.target.value as Difficulty;onChange(createArray(value),value);}}>{Object.entries(LEVELS).map(([id,value])=><option key={id} value={id}>{value.label} · {value.count} {demo?"phần tử":"kiện hàng"}</option>)}</select>
      <form onSubmit={applyInput}><label className="setting-label" htmlFor="merge-array">Mảng của bạn</label><input id="merge-array" className="custom-input" value={draft} onChange={event=>{setDraft(event.target.value);setError("");}} aria-invalid={!!error} aria-describedby="merge-input-help"/><p id="merge-input-help" className="lesson-input-help">Từ 2 đến 8 số nguyên từ −99 đến 99, cách nhau bằng dấu phẩy hoặc khoảng trắng.</p>{error&&<p className="form-error" role="alert">{error}</p>}<div className="lesson-setting-actions"><button type="submit">Dùng mảng này</button><button type="button" onClick={reset}>Chơi lại từ đầu</button></div></form><button className="chunky-button button-green modal-primary" onClick={()=>setSettings(false)}>Tiếp tục</button>
    </dialog>}
  </GameLayout>;
}

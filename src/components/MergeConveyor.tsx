import { useEffect,useId,useRef,useState,type CSSProperties,type PointerEvent } from "react";
import { ArrowRight,GitMerge,PackageCheck,Split } from "lucide-react";
import type { MergeLane,MergeNode } from "../engine/mergeSort";
import { RACE_LEVELS,mergeRaceRoute,type MergeRace } from "../engine/mergeRace";
import { conveyorTracks,conveyorStop,type Point } from "../engine/conveyorTracks";
import type { Difficulty,Item } from "../engine/quicksort";
import MergeParcelShowcase from "./MergeParcelShowcase";
import { factoryAsset } from "../engine/mergeFactoryAssets";

type Props={run:MergeRace;groups?:MergeNode[];difficulty:Difficulty;enabled:boolean;paused:boolean;progress:number;time:number;onLane:(lane:MergeLane)=>void;onStart:()=>void;showVictory:boolean;presentationPaused:boolean;onShowResults:()=>void};
type Traveller={item:Item;lane:MergeLane;from:number;progress:number};
export default function MergeConveyor({run,groups,difficulty,enabled,paused,progress,time,onLane,onStart,showVictory,presentationPaused,onShowResults}:Props){
  const root=useRef<HTMLDivElement>(null),filter=useId().replaceAll(":",""),drag=useRef<{id:number;x:number;moved:boolean}|null>(null);
  const[size,setSize]=useState({width:innerWidth,height:Math.max(240,innerHeight-105)});
  useEffect(()=>{const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));if(root.current)observer.observe(root.current);return()=>observer.disconnect();},[]);
  const vertical=size.width<=600,tracks=conveyorTracks(size.width,size.height,vertical),state=run.sorting;
  const visual=useRef({task:-1,time:0,positions:new Map<number,number>(),departed:new Set<number>(),travellers:[]as Traveller[]});
  const world=visual.current,dt=Math.max(0,time-world.time);world.time=time;
  if(world.task!==state.taskIndex){world.task=state.taskIndex;world.positions.clear();world.departed.clear();world.travellers=[];}
  const parcelSize=vertical?Math.min(64,size.width*.16):Math.min(82,Math.max(50,size.height*.15));
  const stop=conveyorStop(tracks,parcelSize,vertical);
  const gap=parcelSize*1.15,beat=RACE_LEVELS[difficulty].beatMs;
  for(const item of state.output)if(!world.departed.has(item.id)){
    const lane=state.tasks[state.taskIndex].left!.items.some(source=>source.id===item.id)?"left":"right";
    world.travellers.push({item,lane,from:world.positions.get(item.id)??stop,progress:0});world.departed.add(item.id);world.positions.delete(item.id);
  }
  for(const traveller of world.travellers){const distance=(1-traveller.from)*tracks[traveller.lane].length+tracks.output.length;traveller.progress+=dt*(state.phase==="joined"?.85:.40)/Math.max(1,distance);}
  world.travellers=world.travellers.filter(traveller=>traveller.progress<1);
  function parcel(item:Item,point:Point,head=false,outgoing=false,lane?:MergeLane){
    return <span key={item.id} className={`race-parcel ${head?"is-head":""} ${outgoing?"is-outgoing":""}`} data-item-id={item.id} data-value={item.value} data-head={head} data-lane={lane} style={{left:point.x,top:point.y,width:parcelSize,height:parcelSize}as CSSProperties}><img src={factoryAsset("parcel")} alt="" draggable={false}/><strong style={String(item.value).length>2?{fontSize:parcelSize*.29}:undefined}>{item.value}</strong><small>{String.fromCharCode(65+item.id)}</small></span>;
  }
  const travelling=world.travellers.map(traveller=>{
    const track=tracks[traveller.lane],tail=(1-traveller.from)*track.length,total=tail+tracks.output.length,distance=traveller.progress*total;
    const point=distance<tail?track.at(traveller.from+distance/track.length):tracks.output.at((distance-tail)/tracks.output.length);
    return parcel(traveller.item,point,false,true,traveller.lane);
  });
  const incoming=(["left","right"]as const).flatMap(lane=>state[lane].map((item,index)=>{
    const target=stop-index*gap/tracks[lane].length;
    const previous=world.positions.get(item.id)??Math.max(-.15,.20-index*gap/tracks[lane].length);
    const position=Math.min(target,previous+(run.status==="running"&&!paused?dt/beat*.8:0));world.positions.set(item.id,position);
    return parcel(item,tracks[lane].at(position),index===0,false,lane);
  }));
  const leverPoint=vertical?{x:size.width*.79,y:tracks.gate.y+size.height*.17}:size.height<420?{x:size.width*.82,y:size.height*.69}:{x:tracks.gate.x,y:tracks.gate.y+size.height*.25};
  function move(event:PointerEvent<HTMLDivElement>){if(!enabled||drag.current?.id!==event.pointerId)return;const delta=event.clientX-drag.current.x;if(Math.abs(delta)>7||drag.current.moved){drag.current.moved=true;const box=event.currentTarget.getBoundingClientRect(),center=box.left+box.width/2;if(Math.abs(event.clientX-center)>5)onLane(event.clientX<center?"left":"right");}}
  const active=run.status==="running"&&!groups;
  const route=mergeRaceRoute(run),automatic=!!state.left.length!==!!state.right.length;
  const task=state.tasks[state.taskIndex],laneLetter=run.lane==="left"?"A":"B";
  return <div ref={root} className={`race-surface ${vertical?"is-vertical":"is-horizontal"} ${run.status==="lost"?"is-crashed":""}`} data-orientation={vertical?"vertical":"horizontal"} data-progress={progress.toFixed(3)} data-task={state.taskIndex} data-moves={state.moves} data-beat-ms={beat} aria-label="Dây chuyền Merge Sort tự động">
    <svg className="race-tracks" width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
      <defs><filter id={filter} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="7" stdDeviation="4" floodColor="#273c33" floodOpacity=".26"/></filter></defs>
      <g filter={`url(#${filter})`}>{(["left","right","output"]as const).map(lane=><g key={lane} className={`race-track ${lane===route?"is-selected":""}`} data-track={lane}>
        <path className="race-track-rail" d={tracks[lane].path}/><path className="race-track-rim" d={tracks[lane].path}/><path className="race-track-bed" d={tracks[lane].path}/><path className="race-track-slats" d={tracks[lane].path} style={{strokeDashoffset:-time*.09}}/><path className="race-track-guide" d={tracks[lane].path}/>
      </g>)}</g>
      <circle className="race-deadline-base" cx={tracks.gate.x} cy={tracks.gate.y} r={vertical?48:60}/>
      <circle className={`race-deadline ${progress>.75?"is-urgent":""}`} cx={tracks.gate.x} cy={tracks.gate.y} r={vertical?48:60} pathLength={100} strokeDasharray={`${Math.max(0,100-progress*100)} 100`} transform={`rotate(-90 ${tracks.gate.x} ${tracks.gate.y})`}/>
    </svg>
    <div className="race-route-label route-a" style={vertical?{left:"23%",top:26}:{left:24,top:"8%"}}><b>A</b><span>{state.left.length} kiện</span></div>
    <div className="race-route-label route-b" style={vertical?{left:"77%",top:26}:{left:24,top:"85%"}}><b>B</b><span>{state.right.length} kiện</span></div>
    <div className="race-machine" style={{left:tracks.gate.x,top:tracks.gate.y,width:vertical?108:138,height:vertical?108:138}}><img src={factoryAsset("gate")} alt="" style={{transform:`rotate(${vertical?180:90}deg)`}}/><i className={route==="left"?"select-a":"select-b"}/></div>
    <div className="race-parcels">{incoming}{travelling}</div>
    <div className="race-gate-caption" style={{left:tracks.gate.x,top:tracks.gate.y-(vertical?88:100)}}><GitMerge size={14}/>{state.phase==="joined"?"GHÉP THÀNH CÔNG!":`CỔNG ${route==="left"?"A":"B"} · ${automatic?"TỰ ĐỘNG":"ĐANG MỞ"}`}</div>
    <div className="race-output-sign" style={vertical?{left:"26%",top:size.height<550?"77%":"83%"}:{left:"87%",top:"25%"}}><PackageCheck size={17}/><b>{state.output.length}/{task?.items.length??state.output.length}</b><span>ĐÃ GỘP</span></div>
    <div className="race-lever-zone" style={{left:leverPoint.x,top:leverPoint.y}}>
      <span className="race-lever-title">CHUYỂN LÀN</span>
      <div className={`race-lever ${run.lane==="left"?"select-a":"select-b"}`} role="slider" tabIndex={0} aria-label="Cần gạt chuyển làn" aria-valuemin={0} aria-valuemax={1} aria-valuenow={run.lane==="left"?0:1} aria-valuetext={`Làn ${laneLetter}`} aria-disabled={!enabled} onKeyDown={event=>{
        if(!enabled)return;
        if(["ArrowLeft","ArrowUp","a","A"].includes(event.key)){event.preventDefault();onLane("left");}
        if(["ArrowRight","ArrowDown","d","D"].includes(event.key)){event.preventDefault();onLane("right");}
        if(event.key===" "||event.key==="Enter"){event.preventDefault();onLane(run.lane==="left"?"right":"left");}
      }} onPointerDown={event=>{if(!enabled||event.button!==0)return;drag.current={id:event.pointerId,x:event.clientX,moved:false};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={move} onPointerUp={event=>{
        if(drag.current?.id!==event.pointerId)return;
        if(!drag.current.moved&&enabled)onLane(run.lane==="left"?"right":"left");drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
      }} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}><span className="race-lever-a">A</span><span className="race-lever-b">B</span><div className="race-lever-slot"/><div className="race-lever-arm"><i/></div><div className="race-lever-pivot"/></div>
      <small>Kéo cần hoặc chạm để đổi</small>
    </div>
    <div className="race-manifest" aria-label="Tiến trình các kiện"><span>CA PHÂN LOẠI</span><div>{state.assembled.map((item,index)=><i key={item.id} className={state.tasks.slice(0,state.completed).some(node=>index>=node.start&&index<node.end)?"is-sorted":""}>{item.value}</i>)}</div></div>
    {active&&<div className={`race-callout ${state.phase==="joined"?"is-success":""}`} key={`${state.taskIndex}:${state.moves}`} role="status">{state.phase==="joined"?<><PackageCheck size={20}/>Nhóm đã có thứ tự!</>:state.moves>0?<><span>CHUỖI {state.moves}</span><b>CHUẨN! +100</b></>:<><ArrowRight size={16}/>Giữ cần ở làn có số nhỏ hơn</>}</div>}
    {groups&&<div className="race-splitting"><Split size={24}/><b>ĐANG CHIA KIỆN</b><span>{groups.length} nhánh · {groups.every(group=>group.items.length===1)?"Sẵn sàng gộp!":"Chia đến từng kiện đơn"}</span><div>{groups.map(group=><i key={group.id}>{group.items.map(item=>item.value).join(" · ")}</i>)}</div></div>}
    {run.status==="ready"&&<MergeParcelShowcase items={state.root.items} variant="intro" paused={presentationPaused} onContinue={onStart}/>}
    {run.status==="won"&&!showVictory&&<MergeParcelShowcase items={state.assembled} variant="outro" paused={presentationPaused} onContinue={onShowResults}/>}
    {run.status==="lost"&&<div className="race-crash-flash" aria-hidden="true"><b>SAI THỨ TỰ!</b>{Array.from({length:8},(_,i)=><i key={i} style={{"--spark":i}as CSSProperties}/>)}</div>}
  </div>;
}

import type { CSSProperties } from "react";
import type { MergeNode, MergeState } from "../engine/mergeSort";
import type { Item } from "../engine/quicksort";
import { useMergeMotion } from "./useMergeMotion";

type Props={state:MergeState;groups?:MergeNode[];chosen?:number;paused:boolean;speed:number};
/** A passive explanation board, deliberately separate from gameplay controls. */
export default function MergeDemoBoard({state,groups,chosen,paused,speed}:Props){
  const root=useMergeMotion(state,groups,paused,speed);
  const task=state.tasks[state.taskIndex],done=state.phase==="done";
  const placed=new Set(state.output.map(item=>item.id));
  const ordered=(items:Item[])=>[...items].sort((a,b)=>a.value-b.value||a.id-b.id);
  const tile=(item:Item,moving=true)=><span key={item.id} className={`md-tile stream-leaf ${chosen===item.id?"is-compared":""}`} data-merge-item={moving?item.id:undefined} data-value={item.value} style={{"--digits":String(item.value).length} as CSSProperties}><img src={`${import.meta.env.BASE_URL}assets/bubble-ui/tile${done?"-settled":""}.svg`} alt="" draggable={false}/><strong>{item.value}</strong></span>;
  const depth=groups?Math.max(...groups.map(g=>g.id.length-4)):0;
  const previous:MergeNode[]=[];
  function collect(node:MergeNode){if(node.id.length-4>=depth-1||!node.left)previous.push(node);else{collect(node.left);collect(node.right!);}}
  if(groups&&depth>0)collect(state.root);
  const row=(nodes:MergeNode[],moving:boolean)=><div className="md-groups">{nodes.map(node=><div className="md-group" key={node.id} style={{flex:node.items.length}}>{node.items.map(item=>tile(item,moving))}</div>)}</div>;
  return <div ref={root} className="merge-demo-board" style={{"--count":groups||done?state.root.items.length:task.items.length} as CSSProperties}>
    {groups?<div className="md-split" aria-label="Chia mảng thành các nhóm liên tiếp">
      {depth>0&&<>{row(previous,false)}<div className="md-arrow" aria-hidden="true">↓</div></>}
      {row(groups,true)}
    </div>:done?<div className="md-final" aria-label="Mảng đã sắp xếp">{state.assembled.map(item=>tile(item))}</div>:<div className="md-merge">
      <div className="md-inputs" aria-label="Hai nhóm đang ghép">{[task.left!,task.right!].map((node,index)=><section key={node.id} style={{flex:node.items.length}}><span className="md-label">{index===0?"Trái":"Phải"}</span><div className="md-run">{ordered(node.items).map(item=>placed.has(item.id)?<span className="md-vacancy" key={item.id}/>:tile(item))}</div></section>)}</div>
      <div className="md-arrow" aria-hidden="true">↓</div>
      <div className="md-label">Kết quả</div>
      <div className="md-result" aria-label="Kết quả ghép">{Array.from({length:task.items.length},(_,i)=>state.output[i]?tile(state.output[i]):<span className="md-slot" key={`slot-${i}`} aria-label={`Vị trí ${i+1}`}/>)}</div>
    </div>}
  </div>;
}

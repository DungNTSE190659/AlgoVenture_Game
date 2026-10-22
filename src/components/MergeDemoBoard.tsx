import type { CSSProperties } from "react";
import type { MergeNode, MergeState } from "../engine/mergeSort";
import type { Item } from "../engine/quicksort";
import { useMergeMotion } from "./useMergeMotion";

type Props={state:MergeState;groups?:MergeNode[];chosen?:number;paused:boolean;speed:number};
export default function MergeDemoBoard({state,groups,chosen,paused,speed}:Props) {
  const root=useMergeMotion(state,groups,paused,speed);
  const task=state.tasks[state.taskIndex],count=state.root.items.length;
  const completed=state.tasks.slice(0,state.completed);
  const sortedAt=(index:number)=>state.phase==="done"||completed.some(node=>index>=node.start&&index<node.end);
  const activeAt=(index:number)=>!groups&&!!task&&index>=task.start&&index<task.end;
  const placed=new Set(state.output.map(item=>item.id));
  // Reconstruct the two sorted child runs, including after their parent commits.
  // This keeps vacated source positions fixed while each identity moves downward.
  const ordered=(items:Item[])=>[...items].sort((a,b)=>a.value-b.value||a.id-b.id);
  const sources=groups?state.root.items:task?[...state.assembled.slice(0,task.start),...ordered(task.left!.items),...ordered(task.right!.items),...state.assembled.slice(task.end)]:state.assembled;
  const tile=(item:Item,classes="")=><span className={`merge-number ${classes} ${chosen===item.id?"is-compared":""}`} data-merge-item={item.id} data-value={item.value}><strong>{item.value}</strong><small>{String.fromCharCode(65+item.id)}</small></span>;
  return <div className="merge-demo-board" ref={root} style={{"--merge-count":count}as CSSProperties}>
    <div className="merge-overview" aria-label="Tiến độ toàn mảng">
      <span className="merge-small-label">TOÀN MẢNG</span>
      <div className="merge-overview-row">{state.assembled.map((item,index)=><span key={item.id} className={`merge-overview-number ${sortedAt(index)?"is-sorted":""} ${state.phase!=="done"&&activeAt(index)?"is-active":""}`} data-overview-id={item.id} data-value={item.value} data-sorted={sortedAt(index)} aria-label={`${item.value}${sortedAt(index)?", thuộc đoạn đã ghép có thứ tự":""}`}><b>{item.value}</b></span>)}</div>
      <span className="merge-overview-key"><i/> Đoạn đã ghép có thứ tự</span>
    </div>
    {groups?<div className="merge-split-flow" aria-label="Chia mảng">
      <div className="merge-flow-caption">{groups.length===1?"MẢNG BAN ĐẦU":"CHIA THÀNH CÁC MẢNG CON"}</div>
      <div className="merge-flow-row merge-split-row">{groups.map(group=><div className={`merge-split-group ${group.items.length===1?"is-single":""}`} key={group.id} style={{gridColumn:`${group.start+1} / span ${group.items.length}`}}>{group.items.map(item=><span key={item.id}>{tile(item,group.items.length===1?"is-sorted":"")}</span>)}</div>)}</div>
      <span className="merge-split-direction" aria-hidden="true">↓</span>
    </div>:<div className="merge-flow" aria-label="Các ô đi xuống để hợp nhất">
      <div className="merge-flow-row merge-flow-labels">{task&&<><span style={{gridColumn:`${task.start+1} / span ${task.left!.items.length}`}}>TRÁI</span><span style={{gridColumn:`${task.right!.start+1} / span ${task.right!.items.length}`}}>PHẢI</span></>}</div>
      <div className="merge-flow-row merge-flow-sources">{sources.map((item,index)=><span key={item.id} className={`merge-flow-cell ${activeAt(index)?"is-active":"is-muted"}`} style={{gridColumn:index+1}}>{activeAt(index)&&placed.has(item.id)?<span className="merge-source-vacancy" aria-hidden="true"/>:tile(item,activeAt(index)?"is-sorted":"")}</span>)}</div>
      <div className="merge-flow-row merge-flow-drop" aria-hidden="true"><span style={{gridColumn:`${(task?.start??0)+1} / span ${task?.items.length??count}`}}>↓</span></div>
      <div className="merge-flow-row merge-flow-output" aria-label="Mảng kết quả">{Array.from({length:task?.items.length??count},(_,index)=>{
        const item=state.output[index];
        return <span className="merge-flow-cell" key={item?.id??`empty-${index}`} style={{gridColumn:(task?.start??0)+index+1}}>{item?tile(item,"is-sorted"):<span className="merge-number is-empty" aria-label={`Vị trí kết quả ${index+1}`}>{index+1}</span>}</span>;
      })}</div>
      <span className="merge-flow-caption merge-flow-result-label">{state.phase==="done"?"MẢNG ĐÃ ĐƯỢC SẮP XẾP":state.phase==="joined"?"ĐOẠN ĐÃ GHÉP CÓ THỨ TỰ":"ĐƯA SỐ NHỎ HƠN XUỐNG TRƯỚC"}</span>
    </div>}
  </div>;
}

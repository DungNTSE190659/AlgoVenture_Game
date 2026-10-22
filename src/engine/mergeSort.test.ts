import { describe,expect,it } from "vitest";
import { createMerge,createMergeLesson,mergeExpected,releaseMerge } from "./mergeSort";
import { createMergeRace,startMergeRace,steerMergeRace,crossMergeGate,nextMergeRaceGroup,mergeRaceScore,RACE_LEVELS } from "./mergeRace";
import { conveyorTracks,conveyorStop } from "./conveyorTracks";
function solve(values:number[]) {
  let run=startMergeRace(createMergeRace(values)),guard=0;
  while(run.sorting.phase!=="done"&&guard++<100) {
    if(run.sorting.phase==="joined") {run=nextMergeRaceGroup(run);continue;}
    const expected=mergeExpected(run.sorting)!,lane=run.sorting.left[0]?.id===expected.id?"left":"right";
    const before=JSON.stringify(run);const result=crossMergeGate(steerMergeRace(run,lane));
    expect(result.status).toBe("running");expect(JSON.stringify(run)).toBe(before);run=result;
  }
  expect(run.sorting.phase).toBe("done");return run;
}
describe("Merge Gate",()=>{
  it("sorts every binary-valued array of 2–8 parcels stably and preserves every identity",()=>{
    for(let length=2;length<=8;length++)for(let mask=0;mask<2**length;mask++) {
      const values=Array.from({length},(_,id)=>((mask>>id)&1)?-3:4),run=solve(values);
      expect(run.sorting.assembled).toEqual(values.map((value,id)=>({value,id})).sort((a,b)=>a.value-b.value||a.id-b.id));
      expect(run.sorting.completed).toBe(length-1);expect(run.status).toBe("won");expect(mergeRaceScore(run)).toBe(run.sorting.moves*100);
    }
  });
  it("only releases one front parcel and never auto-fills the other lane",()=>{
    const state=releaseMerge(createMerge([1,2]),"left")!;
    expect(state.output.map(item=>item.value)).toEqual([1]);expect(state.right.map(item=>item.value)).toEqual([2]);expect(state.phase).toBe("merge");
    expect(releaseMerge(state,"left")).toBeNull();expect(releaseMerge(state,"right")?.phase).toBe("joined");
  });
  it("does not move until the player starts, and steering never releases a parcel",()=>{
    const ready=createMergeRace([2,1]);expect(crossMergeGate(ready)).toBe(ready);expect(steerMergeRace(ready,"right")).toBe(ready);
    const running=startMergeRace(ready),steered=steerMergeRace(running,"right");expect(steered.sorting).toBe(running.sorting);expect(steered.sorting.moves).toBe(0);
    expect(crossMergeGate(steered).sorting.output.map(item=>item.value)).toEqual([1]);
  });
  it("fails on the first wrong automatic crossing and freezes sorting and score",()=>{
    const run=startMergeRace(createMergeRace([2,1])),lost=crossMergeGate(run);
    expect(lost.status).toBe("lost");expect(lost.failure).toEqual({picked:{value:2,id:0},expected:{value:1,id:1}});expect(lost.sorting).toBe(run.sorting);
    expect(crossMergeGate(lost)).toBe(lost);expect(steerMergeRace(lost,"right")).toBe(lost);expect(nextMergeRaceGroup(lost)).toBe(lost);expect(mergeRaceScore(lost)).toBe(0);
  });
  it("requires the first child for ties, preserving stable identities across every group",()=>{
    const run=startMergeRace(createMergeRace([5,5]));expect(crossMergeGate(steerMergeRace(run,"right")).status).toBe("lost");
    expect(solve([5,5,5,5,5]).sorting.assembled.map(item=>item.id)).toEqual([0,1,2,3,4]);
  });
  it("finishes one parcel per beat and drains the remaining lane without moving the handle",()=>{
    let run=startMergeRace(createMergeRace([1,2]));expect(nextMergeRaceGroup(run)).toBe(run);
    run=crossMergeGate(run);expect(run.sorting.moves).toBe(1);expect(run.lane).toBe("left");expect(steerMergeRace(run,"left")).toBe(run);
    run=crossMergeGate(run);expect(run.sorting.phase).toBe("joined");expect(crossMergeGate(run)).toBe(run);
    run=nextMergeRaceGroup(run);expect(run.status).toBe("won");expect(crossMergeGate(run)).toBe(run);expect(mergeRaceScore(run)).toBe(200);
  });
  it("never resets the handle after a crossing, an empty lane or a new group",()=>{
    let run=steerMergeRace(startMergeRace(createMergeRace([2,1,4,3])),"right");
    run=crossMergeGate(run);expect(run.lane).toBe("right");run=crossMergeGate(run);expect(run.lane).toBe("right");
    run=nextMergeRaceGroup(run);expect(run.lane).toBe("right");run=crossMergeGate(run);expect(run.sorting.output[0].value).toBe(3);
    run=crossMergeGate(run);run=steerMergeRace(run,"left");expect(run.lane).toBe("left");run=nextMergeRaceGroup(run);expect(run.lane).toBe("left");
  });
  it("separates waiting head parcels by their size on desktop and phone",()=>{
    for(const[w,h,vertical]of [[1440,796,false],[1280,476,false],[844,286,false],[390,740,true],[320,464,true]]as const){
      const tracks=conveyorTracks(w,h,vertical),size=vertical?Math.min(64,w*.16):Math.min(82,Math.max(50,h*.15)),stop=conveyorStop(tracks,size,vertical),a=tracks.left.at(stop),b=tracks.right.at(stop);
      expect(Math.abs(vertical?a.x-b.x:a.y-b.y)).toBeGreaterThanOrEqual(size+20);
      expect(stop).toBeGreaterThan(.35);expect(stop).toBeLessThan(1);
    }
  });
  it("continuous tracks join exactly at the gate and travel horizontally or vertically",()=>{
    for(const[w,h,vertical]of [[1440,790,false],[320,464,true],[844,286,false]]as const){
      const tracks=conveyorTracks(w,h,vertical);
      expect(tracks.left.at(1)).toEqual(tracks.gate);expect(tracks.right.at(1)).toEqual(tracks.gate);expect(tracks.output.at(0)).toEqual(tracks.gate);
      if(vertical){expect(tracks.left.at(0).y).toBeLessThan(0);expect(tracks.output.at(1).y).toBeGreaterThan(h);}
      else{expect(tracks.left.at(0).x).toBeLessThan(0);expect(tracks.output.at(1).x).toBeGreaterThan(w);}
      for(const track of [tracks.left,tracks.right,tracks.output])expect(track.length).toBeGreaterThan(100);
    }
  });
  it("handles odd, reverse, sorted, negative and boundary values",()=>{
    for(const values of [[99,0,-99,4,-3],[8,7,6,5,4,3,2,1],[-99,0,99],[5,5,5,5,5]])expect(solve(values).sorting.assembled.map(item=>item.value)).toEqual([...values].sort((a,b)=>a-b));
  });
  it("plain demo partitions preserve order, explain stability and end at the same sorted result",()=>{
    const values=[3,-1,3,0,5],frames=createMergeLesson(values);
    for(const frame of frames.filter(frame=>frame.groups))expect(frame.groups!.flatMap(group=>group.items.map(item=>item.value))).toEqual(values);
    expect(frames.at(-1)!.state.assembled.map(item=>item.value)).toEqual([-1,0,3,3,5]);
    expect(frames.at(-1)!.state.completed).toBe(4);expect(frames.map(frame=>frame.narration).join(" ")).not.toMatch(/chế tạo|cầu|linh kiện/i);
  });
  it("every difficulty runs automatically, with progressively shorter reaction windows",()=>{
    expect(RACE_LEVELS.easy.beatMs).toBeGreaterThan(0);expect(RACE_LEVELS.medium.beatMs).toBeLessThan(RACE_LEVELS.easy.beatMs);expect(RACE_LEVELS.hard.beatMs).toBeLessThan(RACE_LEVELS.medium.beatMs);
  });
  it("defends empty/single input and rejects non-finite values",()=>{
    expect(createMerge([]).phase).toBe("done");expect(createMerge([4]).assembled).toEqual([{id:0,value:4}]);
    expect(()=>createMerge([NaN,1])).toThrow();expect(()=>createMerge([Infinity,1])).toThrow();
  });
});

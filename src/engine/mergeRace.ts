import { advanceMerge,createMerge,mergeExpected,releaseMerge,type MergeLane,type MergeState } from "./mergeSort";
import type { Item } from "./quicksort";

export type MergeRace={sorting:MergeState;lane:MergeLane;status:"ready"|"running"|"lost"|"won";failure?:{picked:Item;expected:Item}};
export const RACE_LEVELS={
  easy:{beatMs:2300,label:"Khởi động"},
  medium:{beatMs:1650,label:"Tăng tốc"},
  hard:{beatMs:1150,label:"Siêu tốc"},
}as const;
export const RACE_GROUP_MS=1400;
export function createMergeRace(input:readonly number[]):MergeRace {return{sorting:createMerge(input),lane:"left",status:"ready"};}
export function startMergeRace(run:MergeRace):MergeRace {return run.status!=="ready"?run:{...run,status:run.sorting.phase==="done"?"won":"running"};}
export function steerMergeRace(run:MergeRace,lane:MergeLane):MergeRace {
  return run.status!=="running"||lane===run.lane?run:{...run,lane};
}
/** Single-run draining is automatic; the physical handle remains owned by the player. */
export function mergeRaceRoute(run:MergeRace):MergeLane {
  return run.sorting.left.length&&!run.sorting.right.length?"left":run.sorting.right.length&&!run.sorting.left.length?"right":run.lane;
}
/** The simulation calls this once at the gate deadline; steering never transfers a parcel. */
export function crossMergeGate(run:MergeRace):MergeRace {
  if(run.status!=="running"||run.sorting.phase!=="merge")return run;
  const lane=mergeRaceRoute(run);
  const picked=run.sorting[lane][0],expected=mergeExpected(run.sorting);
  if(!picked||!expected)return run;
  const sorting=releaseMerge(run.sorting,lane);
  if(!sorting)return{...run,status:"lost",failure:{picked,expected}};
  return{...run,sorting};
}
export function nextMergeRaceGroup(run:MergeRace):MergeRace {
  if(run.status!=="running"||run.sorting.phase!=="joined")return run;
  const sorting=advanceMerge(run.sorting);
  return{...run,sorting,status:sorting.phase==="done"?"won":"running"};
}
export function mergeRaceScore(run:MergeRace){return run.sorting.moves*100;}

import {describe,it,expect} from 'vitest';
import {createMergeChallenge,challengeSplit,challengeMerge,challengePlace,type MergeChallengeState} from './mergeChallenge';
function drain(s:MergeChallengeState){while(s.active){const {left:l,right:r}=s.active;const next=!r[0]||(l[0]&&l[0].value<=r[0].value)?l[0]:r[0];s=challengePlace(s,next.id);}return s;}
describe('free Merge Sort challenge',()=>{
 it('allows right branch to merge before the left branch is split',()=>{
  let s=challengeSplit(createMergeChallenge([4,3,2,1]),'root',2);
  s=challengeSplit(s,'rootR',1);s=drain(challengeMerge(s,['rootRR','rootRL']));
  expect(s.groups.find(g=>g.node.id==='rootR')!.items.map(i=>i.value)).toEqual([1,2]);
  s=challengeSplit(s,'rootL',1);s=drain(challengeMerge(s,['rootLL','rootLR']));s=drain(challengeMerge(s,['rootR','rootL']));
  expect(s.done).toBe(true);expect(s.score).toBe(950);
 });
 it('penalizes wrong boundaries, premature and unrelated merges without changing valid groups',()=>{
  const s=createMergeChallenge([8,3,6,2,5]);
  const wrong=challengeSplit(s,'root',3);expect(wrong.mistakes).toBe(1);expect(wrong.groups).toBe(s.groups);
  const split=challengeSplit(wrong,'root',2);
  const early=challengeMerge(split,['rootL','rootR']);expect(early.score).toBe(25);expect(early.active).toBeUndefined();
  const next=challengeSplit(split,'rootL',1);const unrelated=challengeMerge(next,['rootLL','rootR']);expect(unrelated.error).toBe(true);expect(unrelated.groups).toBe(next.groups);
 });
 it('rejects non-head, larger, unstable and wrong output positions and recovers',()=>{
  let s=challengeSplit(createMergeChallenge([5,5]),'root',1);s=challengeMerge(s,['rootL','rootR']);
  const tie=challengePlace(s,1);expect(tie.score).toBe(25);expect(tie.active).toBe(s.active);expect(tie.feedback).toContain('bên trái');
  const slot=challengePlace(tie,0,1);expect(slot.score).toBe(0);expect(slot.active).toBe(s.active);
  s=drain(slot);expect(s.done).toBe(true);expect(s.groups[0].items.map(i=>i.id)).toEqual([0,1]);expect(s.mistakes).toBe(2);
 });
 it('sorts reverse, odd, negative and duplicate inputs with arbitrary sibling order; cannot farm points',()=>{
  for(const values of [[8,7,6,5,4,3,2,1],[3,-1,3,0,-1],[99,-99],[5,5,5]]){
   let s=createMergeChallenge(values),guard=0;
   while(!s.done&&guard++<100){
    const ready=s.groups.find(g=>g.node.id.endsWith('L')&&g.sorted&&s.groups.some(r=>r.sorted&&r.node.id===g.node.id.slice(0,-1)+'R'));
    if(ready)s=drain(challengeMerge(s,[ready.node.id,ready.node.id.slice(0,-1)+'R']));
    else{const g=s.groups.filter(g=>!g.sorted).at(-1)!;s=challengeSplit(s,g.node.id,Math.floor(g.items.length/2));}
   }
   expect(s.done).toBe(true);expect(s.mistakes).toBe(0);expect(s.groups[0].items).toEqual(values.map((value,id)=>({value,id})).sort((a,b)=>a.value-b.value||a.id-b.id));
   expect(challengeSplit(s,'root',1)).toBe(s);expect(challengePlace(s,0)).toBe(s);
  }
 });
 it('lets users attempt a tail or larger head but preserves the current merge on rejection',()=>{
  let s=challengeSplit(createMergeChallenge([4,3,2,1]),'root',2);
  s=challengeSplit(s,'rootL',1);s=drain(challengeMerge(s,['rootLL','rootLR']));
  s=challengeSplit(s,'rootR',1);s=drain(challengeMerge(s,['rootRL','rootRR']));
  s=challengeMerge(s,['rootL','rootR']);
  const tail=challengePlace(s,0);expect(tail.active).toBe(s.active);expect(tail.score).toBe(s.score-25);expect(tail.feedback).toContain('đầu mỗi nhóm');
  const larger=challengePlace(tail,1);expect(larger.active).toBe(s.active);expect(larger.score).toBe(s.score-50);
  const next=challengePlace(larger,3);expect(next.active!.output[0].value).toBe(1);expect(next.error).toBe(false);expect(next.wrongId).toBeUndefined();
 });
});

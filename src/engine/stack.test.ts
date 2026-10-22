import { afterEach,describe,expect,it,vi } from "vitest";
import { CLOSE,createStackRun,generateStackLines,isOpening,missStackBracket,nextStackWave,readStackRecord,saveStackRecord,stackAct,stackMultiplier,stackViolation,startStackRun,validBrackets,type StackRun } from "./stack";
import { STACK_CONFIG as C,stackTier } from "./stackConfig";
import { createStackLesson } from "./stackLesson";
afterEach(()=>vi.unstubAllGlobals());
function solve(tier:number,seed:number){let run=startStackRun(createStackRun(tier,seed)),guard=0;while(run.phase!=="won"&&guard++<500){const before=JSON.stringify(run);if(run.phase==="review")run=nextStackWave(run);else run=stackAct(run,stackViolation(run)?"flag":isOpening(run.lines[run.wave][run.index]??"")?"push":"pop",.85);expect(run.phase).not.toBe("lost");expect(before).not.toBe(JSON.stringify(run));}return run;}
describe("Bracket Defender Stack",()=>{
  it("validates all three bracket shapes with true LIFO semantics",()=>{
    for(const line of ["","()","[]","{}","{[()]}","([]){}","()[]{}"])expect(validBrackets(line)).toBe(true);
    for(const line of [")","(","([)]","{[}","(()","a","()[}"])expect(validBrackets(line)).toBe(false);
  });
  it("generates reproducible, playable lines and keeps invalid ratio at most one half",()=>{
    for(let tier=1;tier<=30;tier++)for(let seed=1;seed<=25;seed++){
      const lines=generateStackLines(tier,seed),cfg=stackTier(tier);
      expect(lines).toEqual(generateStackLines(tier,seed));expect(lines).toHaveLength(cfg.waves);
      expect(lines.filter(line=>!validBrackets(line)).length).toBeLessThanOrEqual(Math.floor(lines.length/2));
      if(tier<3){expect(lines.every(validBrackets)).toBe(true);for(const line of lines)for(const ch of ["(","[","{"])expect(line).toContain(ch);}
      else expect(lines.some(line=>!validBrackets(line))).toBe(true);
      for(const line of lines){let depth=0;for(const ch of line){if(isOpening(ch)){depth++;expect(depth).toBeLessThanOrEqual(cfg.capacity);}else depth=Math.max(0,depth-1);}}
      const result=solve(tier,seed);expect(result.phase).toBe("won");expect(result.hearts).toBe(3);expect(result.cleared).toBe(lines.length);if(result.review?.valid)expect(result.stack).toEqual([]);
    }
  });
  it("pushes and pops the top only, with perfect timing points and clean-line bonus",()=>{
    let run={...startStackRun(createStackRun()),lines:["()"]};const original=JSON.stringify(run);
    run=stackAct(run,"push",.85);expect(JSON.stringify({...run,score:0})).not.toBe(original);expect(run.stack).toEqual(["("]);expect(run.score).toBe(15);
    run=stackAct(run,"pop",.85);expect(run.stack).toEqual([]);expect(run.phase).toBe("review");expect(run.score).toBe(60);
    expect(nextStackWave(run).phase).toBe("won");expect(stackAct(run,"push",.85)).toBe(run);
  });
  it("wrong POP/PUSH and false flags cost one heart, preserve the token and reset combo",()=>{
    const run={...startStackRun(createStackRun(3)),lines:["()"],combo:7};const original=JSON.stringify(run),bad=stackAct(run,"pop",.85);
    expect(JSON.stringify(run)).toBe(original);expect(bad.hearts).toBe(2);expect(bad.stack).toEqual([]);expect(bad.index).toBe(0);expect(bad.combo).toBe(0);expect(bad.feedback).toContain("underflow");
    const falseFlag=stackAct(run,"flag",.85);expect(falseFlag.hearts).toBe(2);expect(falseFlag.phase).toBe("playing");
    const closer={...run,lines:[")"]};expect(stackAct(closer,"push",.85).feedback).toContain("ngoặc đóng");
  });
  it("reports mismatches, underflow and unclosed lines exactly when visible to the parser",()=>{
    let run={...startStackRun(createStackRun(3)),lines:["([)]"]};run=stackAct(run,"push",.85);run=stackAct(run,"push",.85);
    expect(stackViolation(run)).toBe(true);expect(stackAct(run,"pop",.85).stack).toEqual(["(","["]);expect(stackAct(run,"flag",.85).review?.valid).toBe(false);
    const empty={...startStackRun(createStackRun(3)),lines:[")"]};expect(stackAct(empty,"flag",.85).phase).toBe("review");
    run=stackAct({...empty,lines:["("]},"push",.85);expect(run.phase).toBe("playing");expect(run.index).toBe(1);expect(stackAct(run,"flag",0).review?.valid).toBe(false);
  });
  it("does not permit flagging a future error before it is reached",()=>{
    const run={...startStackRun(createStackRun(3)),lines:["(]"]};expect(validBrackets(run.lines[0])).toBe(false);expect(stackViolation(run)).toBe(false);expect(stackAct(run,"flag",.85).hearts).toBe(2);
  });
  it("rejects overflow without appending, and an expired token cannot corrupt the stack",()=>{
    const cfg=stackTier(12),run:StackRun={...startStackRun(createStackRun(12)),lines:["()"],stack:Array.from({length:cfg.capacity},()=>"("as const)};
    const bad=stackAct(run,"push",.85);expect(bad.feedback).toContain("overflow");expect(bad.stack).toBe(run.stack);expect(bad.index).toBe(run.index);
    for(const p of [-1,NaN,Infinity,1.01])expect(stackAct(run,"push",p)).toBe(run);
    expect(stackAct(run,"push",.2).hearts).toBe(3);expect(stackAct(run,"push",.2).index).toBe(0);
  });
  it("misses advance failed waves, stop at zero hearts and never award completion",()=>{
    let run=startStackRun(createStackRun());for(let i=0;i<3;i++){run=missStackBracket(run);if(i<2){expect(run.phase).toBe("review");run=nextStackWave(run);}}
    expect(run.phase).toBe("lost");expect(run.hearts).toBe(0);expect(run.cleared).toBe(0);expect(missStackBracket(run)).toBe(run);expect(nextStackWave(run)).toBe(run);
  });
  it("scales endless tiers, uses boss lines, preserves fairness and caps combo multiplier",()=>{
    expect(stackTier(10001).tier).toBe(10001);expect(stackTier(0).tier).toBe(1);expect(stackTier(100).fallMs).toBe(C.minFallMs);
    expect(generateStackLines(5,12).at(-1)!.length).toBeGreaterThanOrEqual(17);
    expect(stackMultiplier({...createStackRun(),combo:1000})).toBe(5);
  });
  it("the plain demo shows PEEK without removal, rejected overflow/underflow and LIFO",()=>{
    const frames=createStackLesson(),peek=frames.find(frame=>frame.kind==="peek")!;
    expect(peek.stack).toEqual(["10","20"]);expect(frames.find(frame=>frame.call.includes("underflow"))?.stack).toEqual([]);expect(frames.find(frame=>frame.call.includes("overflow"))?.stack).toEqual(["10","20"]);
    expect(frames.some(frame=>frame.narration.includes("LIFO"))).toBe(true);expect(frames.at(-1)?.kind).toBe("done");expect(CLOSE["["]).toBe("]");
  });
  it("recovers storage corruption and never lowers a record",()=>{
    let stored="{bad";vi.stubGlobal("localStorage",{getItem:()=>stored,setItem:(_key:string,value:string)=>{stored=value;}});expect(readStackRecord()).toEqual({highestTier:1,bestScore:0});
    saveStackRecord({...createStackRun(8),phase:"won",score:900});saveStackRecord({...createStackRun(2),phase:"lost",score:10});expect(readStackRecord()).toEqual({highestTier:8,bestScore:900});
  });
});

import { STACK_CONFIG as C,STACK_COPY as T,stackTier } from "./stackConfig";
export type OpenBracket="("|"["|"{";
export type Bracket=OpenBracket|")"|"]"|"}";
export const CLOSE:Record<OpenBracket,Bracket>={"(":")","[":"]","{":"}"};
export function isOpening(ch:string):ch is OpenBracket{return ch==="("||ch==="["||ch==="{";}
export function validBrackets(line:string){const stack:OpenBracket[]=[];for(const ch of line){if(isOpening(ch))stack.push(ch);else if(!stack.length||CLOSE[stack.pop()!]!==ch)return false;}return stack.length===0;}
export function bracketSeed(seed:number){let value=seed>>>0||1;return()=>{value^=value<<13;value^=value>>>17;value^=value<<5;return(value>>>0)/4294967296;};}
export function generateStackLines(tier:number,seed:number):string[]{
  const cfg=stackTier(tier),random=bracketSeed(seed),types:OpenBracket[]=["(","[","{"];
  const invalid=new Set<number>();
  if(cfg.invalidRatio>0){invalid.add(cfg.waves-1);const count=Math.min(Math.floor(cfg.waves/2),Math.max(1,Math.round(cfg.waves*cfg.invalidRatio)));while(invalid.size<count)invalid.add(Math.floor(random()*cfg.waves));}
  return Array.from({length:cfg.waves},(_,wave)=>{
    const pairs=cfg.boss&&wave===cfg.waves-1?9+Math.floor(random()*2):cfg.pairs+(tier>1&&random()>.6?1:0),depth=Math.min(cfg.depth,cfg.capacity),stack:OpenBracket[]=[];
    let opened=0,line="";const rotate=Math.floor(random()*3);
    while(opened<pairs||stack.length){if(opened<pairs&&(!stack.length||(stack.length<depth&&random()<.62))){const ch=types[(opened+rotate)%3];line+=ch;stack.push(ch);opened++;}else line+=CLOSE[stack.pop()!];}
    if(invalid.has(wave)){
      const mode=Math.floor(random()*3);
      if(mode===0)return")"+line;
      if(mode===1)return line.slice(0,-1);
      const at=[...line].findIndex(ch=>!isOpening(ch)),old=line[at],closers=[")","]","}"].filter(ch=>ch!==old);return line.slice(0,at)+closers[Math.floor(random()*2)]+line.slice(at+1);
    }
    return line;
  });
}
export type StackAction="push"|"pop"|"flag";
export type StackBranch="push"|"pop"|"reject"|"return";
export type StackReview={line:string;valid:boolean;success:boolean;call:string;branch:StackBranch};
export type StackRun={tier:number;seed:number;lines:string[];wave:number;index:number;stack:OpenBracket[];phase:"ready"|"playing"|"review"|"won"|"lost";hearts:number;score:number;combo:number;mistakes:number;cleared:number;feedback:string;error:boolean;call:string;branch:StackBranch;review?:StackReview;revision:number};
export function createStackRun(tier=1,seed=C.defaultSeed):StackRun{return{tier:stackTier(tier).tier,seed,lines:generateStackLines(tier,seed),wave:0,index:0,stack:[],phase:"ready",hearts:C.hearts,score:0,combo:0,mistakes:0,cleared:0,feedback:"",error:false,call:"",branch:"return",revision:0};}
export function startStackRun(run:StackRun):StackRun{return run.phase==="ready"?{...run,phase:"playing"}:run;}
export const stackMultiplier=(run:StackRun)=>Math.min(C.maxMultiplier,1+Math.floor(run.combo/C.comboStep));
export function stackViolation(run:StackRun){const line=run.lines[run.wave],ch=line[run.index],top=run.stack.at(-1);return ch===undefined?!!run.stack.length:!isOpening(ch)&&(!top||CLOSE[top]!==ch);}
function review(run:StackRun,success:boolean,valid:boolean,feedback:string):StackRun{return{...run,phase:"review",cleared:run.cleared+Number(success),feedback,review:{line:run.lines[run.wave],valid,success,call:run.call,branch:run.branch}};}
function mistake(run:StackRun,feedback:string):StackRun{return{...run,hearts:run.hearts-1,mistakes:run.mistakes+1,combo:0,phase:run.hearts<=1?"lost":run.phase,feedback,error:true,revision:run.revision+1};}
export function stackAct(run:StackRun,action:StackAction,progress:number):StackRun{
  if(run.phase!=="playing"||!Number.isFinite(progress)||progress<0||progress>1)return run;
  const line=run.lines[run.wave],ch=line[run.index],top=run.stack.at(-1);
  if(ch!==undefined&&progress<C.greenStart)return{...run,feedback:T.wait};
  if(progress>1)return run;
  if(action==="flag"){
    if(run.tier<3)return run;
    if(!stackViolation(run))return mistake(run,T.falseFlag);
    const next={...run,score:run.score+C.flagPoints*stackMultiplier(run),combo:run.combo+1,error:false,call:ch===undefined?"return stack.empty() → false":"return false",branch:ch===undefined?"return"as const:"reject"as const,revision:run.revision+1};
    return review(next,true,false,T.invalidFound);
  }
  if(ch===undefined)return mistake(run,T.unclosed);
  if(action==="push"){
    if(!isOpening(ch))return mistake(run,T.pushCloser);
    if(run.stack.length>=stackTier(run.tier).capacity)return mistake(run,T.overflow);
  }else{
    if(!top)return mistake(run,T.underflow);
    if(isOpening(ch))return mistake(run,T.popOpener);
    if(CLOSE[top]!==ch)return mistake(run,T.mismatch(top,ch));
  }
  const points=(C.pushPoints+(progress>=C.perfectStart&&progress<=C.perfectEnd?C.perfectBonus:0))*stackMultiplier(run);
  const next:StackRun={...run,index:run.index+1,stack:action==="push"?[...run.stack,ch as OpenBracket]:run.stack.slice(0,-1),score:run.score+points,combo:run.combo+1,error:false,call:action==="push"?`stack.push("${ch}")`:`stack.pop() → "${top}"`,branch:action,feedback:action==="push"?T.correctPush(ch):T.correctPop(top!),revision:run.revision+1};
  if(next.index===line.length&&!next.stack.length)return review({...next,score:next.score+C.cleanPoints*stackMultiplier(next)},true,true,T.clean);
  if(next.index===line.length)return{...next,feedback:T.unclosed};
  return next;
}
export function missStackBracket(run:StackRun):StackRun{
  if(run.phase!=="playing")return run;
  const next=mistake(run,T.missed);
  return next.phase==="lost"?next:review(next,false,validBrackets(run.lines[run.wave]),T.missed);
}
export function nextStackWave(run:StackRun):StackRun{
  if(run.phase!=="review")return run;
  return run.wave===run.lines.length-1?{...run,phase:"won"}:{...run,wave:run.wave+1,index:0,stack:[],phase:"playing",feedback:"",error:false,call:"",review:undefined};
}
export type StackRecord={highestTier:number;bestScore:number};
export const STACK_RECORD_KEY="algoventure.stack-record.v1";
export function readStackRecord():StackRecord{try{const value=JSON.parse(localStorage.getItem(STACK_RECORD_KEY)??"{}");return{highestTier:Number.isInteger(value?.highestTier)&&value.highestTier>0?value.highestTier:1,bestScore:Number.isFinite(value?.bestScore)&&value.bestScore>=0?Math.trunc(value.bestScore):0};}catch{return{highestTier:1,bestScore:0};}}
export function saveStackRecord(run:StackRun){if(run.phase==="ready")return;const previous=readStackRecord();try{localStorage.setItem(STACK_RECORD_KEY,JSON.stringify({highestTier:Math.max(previous.highestTier,run.tier),bestScore:Math.max(previous.bestScore,run.score)}));}catch{/* Optional storage. */}}

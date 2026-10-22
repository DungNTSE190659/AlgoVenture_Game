import { useEffect,useRef,useState } from "react";

/** One pausable clock owns both the deadline and world motion. No hidden-tab catch-up. */
export function useConveyorClock(step:string,duration:number,running:boolean,onDeadline:()=>void){
  const elapsed=useRef(0),world=useRef(0),callback=useRef(onDeadline);
  callback.current=onDeadline;
  const[clock,setClock]=useState({step,duration,progress:0,time:0});
  useEffect(()=>{elapsed.current=0;setClock({step,duration,progress:0,time:world.current});},[step,duration]);
  useEffect(()=>{
    if(!running)return;
    let frame=0,last=performance.now(),cancelled=false;
    const update=(now:number)=>{
      if(cancelled)return;
      const dt=Math.min(80,Math.max(0,now-last));last=now;
      elapsed.current=Math.min(duration,elapsed.current+dt);world.current+=dt;
      setClock({step,duration,progress:elapsed.current/duration,time:world.current});
      if(elapsed.current>=duration){callback.current();return;}
      frame=requestAnimationFrame(update);
    };
    frame=requestAnimationFrame(update);
    return()=>{cancelled=true;cancelAnimationFrame(frame);};
  },[step,duration,running]);
  // A new item must never expose the preceding item's progress before effects reset it.
  return clock.step===step&&clock.duration===duration?clock:{progress:0,time:world.current};
}

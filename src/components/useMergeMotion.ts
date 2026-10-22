import { useEffect, useLayoutEffect, useRef } from "react";

/** Damped spring motion with a small flight arc, tilt and landing compression.
 * Motion never decides sorting/collisions: the gate state owns every transfer. */
export function useMergeMotion(state: unknown, groups: unknown, paused: boolean, speed=1) {
  const root=useRef<HTMLDivElement>(null);
  const previous=useRef(new Map<number,DOMRect>());
  useLayoutEffect(()=>{
    const positions=new Map<number,DOMRect>();
    root.current?.querySelectorAll<HTMLElement>("[data-merge-item]").forEach(node=>{
      const id=Number(node.dataset.mergeItem),box=node.getBoundingClientRect(),old=previous.current.get(id);
      positions.set(id,box);
      if(!old||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
      const dx=old.x-box.x,dy=old.y-box.y;
      if(Math.abs(dx)+Math.abs(dy)<2)return;
      const frames=Array.from({length:37},(_,i)=>{
        const t=i/36,rest=i===36?0:Math.exp(-7*t)*Math.cos(11*t);
        const arc=dy< -30?Math.sin(Math.PI*t)*22:0;
        const tilt=Math.sin(Math.PI*t)*Math.sign(dx)*7*Math.exp(-2*t);
        const squash=1-.055*Math.sin(Math.PI*Math.max(0,(t-.65)/.35));
        return {transform:`translate(${dx*rest}px,${dy*rest-arc}px) rotate(${tilt}deg) scale(1,${squash})`,offset:t};
      });
      node.animate(frames,{duration:560,easing:"linear"});
    });
    previous.current=positions;
  },[state,groups]);
  useEffect(()=>{
    for(const animation of root.current?.getAnimations({subtree:true})??[]) {
      animation.updatePlaybackRate(speed);
      if(paused)animation.pause();else if(animation.playState==="paused")animation.play();
    }
  },[paused,speed,state,groups]);
  useEffect(()=>{
    const resize=()=>previous.current.clear();window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[]);
  return root;
}

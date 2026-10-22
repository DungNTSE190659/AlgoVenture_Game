export type Point={x:number;y:number};
export type Track={path:string;length:number;at:(progress:number)=>Point};
function track(points:[Point,Point,Point,Point]):Track {
  const[a,b,c,d]=points;
  const evaluate=(t:number)=>({x:(1-t)**3*a.x+3*(1-t)**2*t*b.x+3*(1-t)*t*t*c.x+t**3*d.x,y:(1-t)**3*a.y+3*(1-t)**2*t*b.y+3*(1-t)*t*t*c.y+t**3*d.y});
  const samples=[{point:a,distance:0}];
  for(let i=1;i<=100;i++){const point=evaluate(i/100),previous=samples[i-1];samples.push({point,distance:previous.distance+Math.hypot(point.x-previous.point.x,point.y-previous.point.y)});}
  const length=samples[100].distance;
  return{path:`M ${a.x} ${a.y} C ${b.x} ${b.y}, ${c.x} ${c.y}, ${d.x} ${d.y}`,length,at(progress){
    const distance=Math.min(1,Math.max(0,progress))*length;
    const index=Math.max(1,samples.findIndex(sample=>sample.distance>=distance));
    const before=samples[index-1],after=samples[index],t=(distance-before.distance)/(after.distance-before.distance||1);
    return{x:before.point.x+(after.point.x-before.point.x)*t,y:before.point.y+(after.point.y-before.point.y)*t};
  }};
}
export function conveyorTracks(width:number,height:number,vertical:boolean){
  const p=(x:number,y:number)=>({x,y});
  const gate=p(width*(vertical ? .5 : .58),height*(vertical ? .56 : .46));
  const left=vertical?track([p(width*.23,-80),p(width*.23,height*.32),p(width*.18,height*.47),gate]):track([p(-80,height*.21),p(width*.3,height*.21),p(width*.48,height*.21),gate]);
  const right=vertical?track([p(width*.77,-80),p(width*.77,height*.32),p(width*.82,height*.47),gate]):track([p(-80,height*.73),p(width*.3,height*.73),p(width*.48,height*.73),gate]);
  const output=vertical?track([gate,p(gate.x,height*.74),p(gate.x,height*.88),p(gate.x,height+90)]):track([gate,p(width*.76,gate.y),p(width*.9,gate.y),p(width+90,gate.y)]);
  return{left,right,output,gate};
}

/** Keep both waiting parcels readable, including at a short desktop aspect ratio. */
export function conveyorStop(tracks:ReturnType<typeof conveyorTracks>,parcelSize:number,vertical:boolean){
  for(let progress=.9;progress>=.35;progress-=.005){
    const a=tracks.left.at(progress),b=tracks.right.at(progress);
    const gateAxis=vertical?tracks.gate.x:tracks.gate.y;
    if(Math.min(Math.abs((vertical?a.x:a.y)-gateAxis),Math.abs((vertical?b.x:b.y)-gateAxis))>=parcelSize+14)return progress;
  }
  return .35;
}

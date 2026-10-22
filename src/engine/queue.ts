export type Drink="berry"|"orange"|"grape";
export const DRINKS:Drink[]=["berry","orange","grape"];
export const DRINK_NAMES:Record<Drink,string>={berry:"Dâu",orange:"Cam",grape:"Việt quất"};
export type Customer={id:number;drink:Drink;patience:number};
export function queueLevel(tier:number){const level=Math.max(1,Math.min(3,Math.trunc(tier)||1));return{tier:level,capacity:4,target:[6,8,10][level-1],arrivalMs:[6200,4900,3800][level-1],waitingMs:[11000,9000,7500][level-1],patienceMs:[18000,15000,12000][level-1]};}
export type QueueRun={tier:number;phase:"playing"|"won"|"lost";queue:Customer[];incoming:Customer|null;arrivalIn:number;waiting:number;nextId:number;served:number;hearts:number;score:number;combo:number;feedback:string;error:boolean;revision:number;departing?:Customer};
const guest=(id:number,tier:number):Customer=>({id,drink:DRINKS[(id*7+Math.floor(id/3)+tier)%3],patience:queueLevel(tier).patienceMs});
export function createQueueRun(tier=1):QueueRun{const c=queueLevel(tier);return{tier:c.tier,phase:"playing",queue:[guest(1,c.tier),guest(2,c.tier)],incoming:guest(3,c.tier),arrivalIn:c.arrivalMs,waiting:c.waitingMs,nextId:4,served:0,hearts:3,score:0,combo:0,feedback:"Khách đến trước được phục vụ trước. Chọn nước cho khách ở FRONT.",error:false,revision:0};}
function fail(run:QueueRun,feedback:string):QueueRun{return{...run,hearts:run.hearts-1,combo:0,error:true,feedback,phase:run.hearts<=1?"lost":run.phase,revision:run.revision+1};}
export function enqueueCustomer(run:QueueRun):QueueRun{
  if(run.phase!=="playing"||!run.incoming)return run;
  if(run.queue.length>=queueLevel(run.tier).capacity)return fail(run,"Hàng đã đầy! Phục vụ khách đầu hàng để có chỗ trống (overflow).");
  return{...run,queue:[...run.queue,run.incoming],incoming:null,arrivalIn:queueLevel(run.tier).arrivalMs,feedback:`Khách ${run.incoming.id} vào cuối hàng — ENQUEUE.`,error:false,revision:run.revision+1};
}
export function serveCustomer(run:QueueRun,drink:Drink):QueueRun{
  if(run.phase!=="playing")return run;
  const first=run.queue[0];if(!first)return fail(run,"Hàng đang rỗng, chưa thể phục vụ (underflow). Đón khách mới nhé!");
  if(first.drink!==drink)return fail(run,`Khách FRONT muốn nước ${DRINK_NAMES[first.drink]}. Không phục vụ người phía sau trước nhé!`);
  const served=run.served+1,combo=run.combo+1;
  return{...run,queue:run.queue.slice(1),served,score:run.score+100+(combo%3===0?50:0),combo,feedback:`Đã phục vụ khách ${first.id} — DEQUEUE!${combo%3===0?" Thưởng chuỗi +50!":""}`,error:false,departing:first,revision:run.revision+1,phase:served>=queueLevel(run.tier).target?"won":"playing"};
}
/** Only the first customer is at the counter. Others keep their full serving time. */
export function tickQueue(run:QueueRun,ms:number):QueueRun{
  if(run.phase!=="playing"||!Number.isFinite(ms)||ms<=0)return run;
  const c=queueLevel(run.tier),dt=Math.min(ms,1000);let next={...run,queue:run.queue.map((v,i)=>i===0?{...v,patience:Math.max(0,v.patience-dt)}:v)};
  if(next.queue[0]?.patience===0)next={...fail(next,"Khách đầu hàng chờ quá lâu · −1 tim"),queue:next.queue.slice(1)};
  if(next.phase!=="playing")return next;
  if(next.incoming){next.waiting=Math.max(0,next.waiting-dt);if(next.waiting===0)next={...fail(next,"Bỏ lỡ khách mới · −1 tim"),incoming:null,arrivalIn:c.arrivalMs};}
  else{next.arrivalIn=Math.max(0,next.arrivalIn-dt);if(next.arrivalIn===0)next={...next,incoming:guest(next.nextId,next.tier),nextId:next.nextId+1,waiting:c.waitingMs};}
  return next;
}
export type QueueFrame={values:number[];capacity:number;kind:"intro"|"enqueue"|"dequeue"|"peek"|"error"|"done";narration:string;moving?:number};
export function queueLesson():QueueFrame[]{
 const out:QueueFrame[]=[],values:number[]=[];const add=(kind:QueueFrame["kind"],narration:string,moving?:number)=>out.push({values:[...values],capacity:3,kind,narration,moving});
 add("intro","Queue là hàng đợi. Giống như xếp hàng mua nước, ai đến trước sẽ được phục vụ trước: FIFO.");
 values.push(10);add("enqueue","ENQUEUE thêm 10 vào cuối hàng. Vì chỉ có một phần tử nên 10 vừa ở đầu FRONT, vừa ở cuối REAR.",10);
 values.push(20);add("enqueue","20 đến sau, xếp ở cuối hàng REAR. 10 vẫn ở đầu hàng FRONT.",20);
 values.push(30);add("enqueue","30 tiếp tục nối vào cuối hàng. Thứ tự bây giờ là 10, 20 rồi 30.",30);
 add("peek","FRONT chỉ xem phần tử ở đầu hàng: đó là 10. Cả ba phần tử vẫn còn trong Queue.");
 values.shift();add("dequeue","DEQUEUE lấy 10 ở đầu hàng ra. 10 vào trước nên ra trước, khác với Stack lấy phần tử vào sau cùng.",10);
 add("peek","Bây giờ 20 trở thành FRONT, còn 30 vẫn là REAR. Những người còn lại giữ nguyên thứ tự.");
 values.push(40);add("enqueue","40 mới đến sẽ nối sau 30, không chen vào đầu hàng. Đây là ENQUEUE.",40);
 values.shift();add("dequeue","DEQUEUE tiếp theo lấy 20 ra, dù 40 là phần tử vừa được thêm vào.",20);
 values.shift();add("dequeue","Sau đó mới đến lượt 30. Queue luôn giữ quy tắc vào trước, ra trước.",30);
 values.shift();add("dequeue","Cuối cùng là 40. Hàng đã rỗng, không còn FRONT hay REAR.",40);
 add("error","Nếu DEQUEUE khi hàng rỗng, thao tác bị từ chối. Lỗi này gọi là underflow.");
 values.push(10,20,30);add("intro","Thử một hàng đợi chỉ có ba chỗ. Cả ba chỗ đã kín.");
 add("error","Không thể ENQUEUE thêm 40 khi hàng đã đầy. Đây là overflow; hàng vẫn giữ 10, 20 và 30.",40);
 values.shift();add("dequeue","Đưa 10 ra bằng DEQUEUE để tạo một chỗ trống.",10);
 values.push(40);add("enqueue","Bây giờ mới có thể ENQUEUE 40 vào cuối hàng. Không bỏ qua người đang chờ để nhận khách mới.",40);
 add("done","Nhớ nhé: ENQUEUE thêm ở cuối, DEQUEUE lấy ở đầu, FRONT chỉ xem đầu hàng. Cùng Buta mở quầy nước và phục vụ đúng FIFO nào!");
 return out;
}
export const QUEUE_RECORD="algoventure.queue-best.v1";
export function queueBest(){try{const v=Number(localStorage.getItem(QUEUE_RECORD));return Number.isFinite(v)&&v>=0?v:0;}catch{return 0;}}
export function saveQueueBest(score:number){const best=Math.max(queueBest(),score);try{localStorage.setItem(QUEUE_RECORD,String(best));}catch{/* Optional persistence. */}return best;}

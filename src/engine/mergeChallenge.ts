import { createMerge, type MergeNode } from './mergeSort';
import type { Item } from './quicksort';
export type ChallengeGroup = {node:MergeNode; items:Item[]; sorted:boolean};
export type MergeChallengeState = {groups:ChallengeGroup[]; active?:{parent:MergeNode; left:Item[]; right:Item[]; output:Item[]}; score:number; mistakes:number; moves:number; splits:number; merged:number; feedback:string; wrongId?:number; error:boolean; done:boolean};
export function createMergeChallenge(values:readonly number[]):MergeChallengeState {
 const root=createMerge(values).root;
 return {groups:[{node:root,items:root.items,sorted:values.length<=1}],score:0,mistakes:0,moves:0,splits:0,merged:0,feedback:'Chia mảng, rồi ghép các nhóm để sắp xếp từ bé đến lớn.',error:false,done:values.length<=1};
}
function reject(s:MergeChallengeState,reason:string,wrongId?:number):MergeChallengeState{return {...s,score:Math.max(0,s.score-25),mistakes:s.mistakes+1,error:true,wrongId,feedback:`−25 điểm. ${reason} Bạn thử lại nhé!`};}
export function challengeSplit(s:MergeChallengeState,id:string,cut:number):MergeChallengeState {
 if(s.done)return s;
 if(s.active)return reject(s,'Mình đang ghép một nhóm. Hãy ghép xong nhóm này trước khi chia tiếp.');
 const g=s.groups.find(g=>g.node.id===id);
 if(!g)return s;
 if(g.sorted)return reject(s,'Nhóm này đã có thứ tự sau khi ghép, mình không chia lại nữa.');
 if(!g.node.left||cut!==g.node.left.items.length)return reject(s,`Bạn đang chia thành ${cut} và ${g.items.length-cut} thẻ. Nhóm ${g.items.length} thẻ cần chia thành ${Math.floor(g.items.length/2)} và ${Math.ceil(g.items.length/2)} thẻ liên tiếp; nếu lẻ, nửa trái ít hơn một thẻ.`);
 const children=[g.node.left,g.node.right!].map(node=>({node,items:node.items,sorted:node.items.length===1}));
 return {...s,groups:s.groups.flatMap(x=>x===g?children:[x]),splits:s.splits+1,score:s.score+50,error:false,wrongId:undefined,feedback:'Tiếp tục chia hoặc chọn hai nhóm để ghép.'};
}
export function challengeMerge(s:MergeChallengeState,ids:string[]):MergeChallengeState {
 if(s.done)return s;
 if(s.active)return reject(s,'Hãy hoàn tất nhóm đang ghép trước.');
 const gs=s.groups.filter(g=>ids.includes(g.node.id)).sort((a,b)=>a.node.start-b.node.start);
 if(gs.length!==2)return reject(s,'Chọn đúng hai nhóm để ghép.');
 const [a,b]=gs;
 if(a.node.id.slice(0,-1)!==b.node.id.slice(0,-1)||!a.node.id.endsWith('L')||!b.node.id.endsWith('R'))return reject(s,'Hai nhóm phải là hai nửa được tách ra từ cùng một nhóm cha.');
 if(!a.sorted||!b.sorted)return reject(s,'Hai nhóm con chưa ghép xong. Chia nhỏ và ghép từng nhóm con trước nhé.');
 const parent:MergeNode={id:a.node.id.slice(0,-1),start:a.node.start,end:b.node.end,items:[...a.items,...b.items],left:a.node,right:b.node};
 return {...s,active:{parent,left:a.items,right:b.items,output:[]},error:false,wrongId:undefined,feedback:'Ghép hai nhóm vào hàng kết quả.'};
}
export function challengePlace(s:MergeChallengeState,id:number,position?:number):MergeChallengeState {
 if(s.done)return s;
 const a=s.active;
 if(!a)return reject(s,'Chọn hai nhóm và bắt đầu ghép trước khi chuyển thẻ.',id);
 const l=a.left[0],r=a.right[0],expected=!r||(l&&l.value<=r.value)?l:r;
 if(position!==undefined&&position!==a.output.length)return reject(s,`Bạn chọn ô ${position+1}, nhưng ô ${a.output.length+1} chưa được điền. Điền kết quả từ trái sang phải, không bỏ qua ô trống.`,id);
 if(id!==l?.id&&id!==r?.id)return reject(s,'Chỉ lấy thẻ đầu mỗi nhóm, giữ thứ tự các thẻ còn lại.',id);
 if(id!==expected?.id)return reject(s,l&&r&&l.value===r.value?'Hai số bằng nhau: lấy thẻ bên trái trước để giữ thứ tự ban đầu.':`Bạn chọn ${[...a.left,...a.right].find(item=>item.id===id)?.value}, nhưng ${expected?.value} ở đầu nhóm còn lại nhỏ hơn. Lấy số nhỏ hơn trước nhé.`,id);
 const left=id===l?.id?a.left.slice(1):a.left,right=id===r?.id?a.right.slice(1):a.right,output=[...a.output,expected!];
 const finished=!left.length&&!right.length;
 const groups=finished?[...s.groups.filter(g=>g.node.id!==a.parent.left!.id&&g.node.id!==a.parent.right!.id),{node:a.parent,items:output,sorted:true}].sort((a,b)=>a.node.start-b.node.start):s.groups;
 return {...s,groups,active:finished?undefined:{...a,left,right,output},score:s.score+100,moves:s.moves+1,merged:s.merged+Number(finished),done:finished&&a.parent.id==='root',error:false,wrongId:undefined,feedback:finished?'Chọn nhóm tiếp theo để chia hoặc ghép.':'Tiếp tục ghép vào hàng kết quả.'};
}

import { isOpening } from "./stack";
export type StackDemoFrame={stack:string[];capacity:number;kind:"intro"|"push"|"pop"|"peek"|"error"|"done";call:string;narration:string;line?:string;index?:number;value?:string};
export function createStackLesson():StackDemoFrame[]{
  const frames:StackDemoFrame[]=[],stack:string[]=[];
  const add=(kind:StackDemoFrame["kind"],call:string,narration:string,options:Partial<StackDemoFrame>={})=>frames.push({stack:[...stack],capacity:3,kind,call,narration,...options});
  add("intro","stack = []","Stack là ngăn xếp. Chúng mình chỉ thêm hoặc lấy phần tử ở một đầu, gọi là đỉnh TOP.");
  stack.push("10");add("push","stack.push(10)","PUSH thêm 10 lên đỉnh của stack.",{value:"10"});
  stack.push("20");add("push","stack.push(20)","PUSH thêm 20 lên trên 10. Bây giờ 20 là phần tử ở đỉnh.",{value:"20"});
  add("peek","stack.peek() → 20","PEEK chỉ xem phần tử ở đỉnh. Ta thấy 20, nhưng stack vẫn giữ cả hai phần tử.");
  stack.pop();add("pop","stack.pop() → 20","POP lấy 20 ra trước, vì 20 được thêm vào sau cùng. Đây là LIFO: vào sau, ra trước.",{value:"20"});
  stack.pop();add("pop","stack.pop() → 10","POP lần nữa mới lấy được 10. Stack đã rỗng.",{value:"10"});
  add("error","stack.pop() → underflow","Stack rỗng thì không có gì để POP. Đó là underflow; thao tác bị từ chối và stack vẫn rỗng.");
  stack.push("10");add("push","stack.push(10)","Thử một stack chỉ có hai ô chứa. Chúng mình thêm 10.",{capacity:2,value:"10"});
  stack.push("20");add("push","stack.push(20)","Thêm 20 nữa là đã dùng hết hai ô.",{capacity:2,value:"20"});
  add("error","stack.push(30) → overflow","PUSH thêm khi stack đã đầy gây overflow. Số 30 không được thêm vào; stack vẫn chỉ có 10 và 20.",{capacity:2,value:"30"});
  stack.length=0;add("intro","stack = []","Stack còn giúp kiểm tra các cặp ngoặc. Gặp ngoặc mở thì PUSH; gặp ngoặc đóng thì so sánh với đỉnh.",{line:"{[()]}",index:0});
  const line="{[()]}";
  for(let index=0;index<line.length;index++){
    const ch=line[index];
    if(isOpening(ch)){stack.push(ch);add("push",`stack.push("${ch}")`,`Gặp ngoặc mở ${ch}, PUSH dấu này lên đỉnh.`,{line,index,value:ch});}
    else{
      if(index===3)add("peek",`stack.peek() → "${stack.at(-1)}"`,`PEEK thấy ${stack.at(-1)} ở đỉnh. Dấu ${ch} cần khớp chính đỉnh này, không phải một dấu ở phía dưới.`,{line,index});
      const top=stack.pop()!;add("pop",`stack.pop() → "${top}"`,`Dấu ${ch} khớp ${top} ở đỉnh. POP bỏ ngoặc mở và hoàn thành một cặp.`,{line,index,value:top});
    }
  }
  add("intro","return stack.empty() → true","Đã đọc hết dòng và stack rỗng, nên các dấu ngoặc hợp lệ.",{line,index:line.length});
  stack.push("(","[");add("error",'peek() → "["; cần "]"',`Trong dòng ([)], dấu ) không khớp đỉnh [. Không được bỏ qua đỉnh để tìm dấu ( ở dưới: dòng này không hợp lệ.`,{line:"([)]",index:2});
  stack.splice(0,stack.length,"(","(");add("error","return stack.empty() → false","Đọc hết dòng mà vẫn còn ngoặc mở trong stack cũng là không hợp lệ: có ngoặc chưa được đóng.",{line:"((",index:2});
  stack.length=0;add("done","PUSH · POP · PEEK · LIFO","Nhớ nhé: PUSH thêm lên đỉnh, POP lấy ở đỉnh, PEEK xem đỉnh. Phần tử vào sau sẽ ra trước. Bây giờ thử giữ cổng mã cùng Buta! ");
  return frames;
}

export const STACK_CONFIG={hearts:3,greenStart:.62,perfectStart:.78,perfectEnd:.94,reviewMs:1500,comboStep:5,maxMultiplier:5,pushPoints:10,perfectBonus:5,flagPoints:50,cleanPoints:30,defaultSeed:90421,minFallMs:1150};
export function stackTier(raw:number){
  const tier=Math.max(1,Number.isSafeInteger(raw)?raw:1);
  return{tier,waves:tier<3?3:4,pairs:Math.min(7,3+Math.floor(tier/3)),depth:Math.min(5,2+Math.floor(tier/2)),capacity:tier<7?6:Math.max(3,6-Math.floor(tier/7)),fallMs:Math.max(STACK_CONFIG.minFallMs,3600-(tier-1)*230),invalidRatio:tier<3?0:Math.min(.5,.2+(tier-3)*.04),boss:tier%5===0};
}
export const STACK_COPY={
  title:"Stack",demoTitle:"Ngăn xếp",back:"Về bản đồ",settings:"Tùy chọn",close:"Đóng",hint:"Đóng gợi ý",start:"Bắt đầu",resume:"Tiếp tục",pause:"Tạm dừng",previous:"Bước trước",next:"Bước tiếp",replayDemo:"Xem lại từ đầu",try:"Tự mình thử",speed:(speed:number)=>`Tốc độ demo: ${speed}x. Bấm để đổi tốc độ`,
  optionTitle:"Chuyến đi của bạn",sound:"Hiệu ứng âm thanh",on:"Bật",off:"Tắt",tier:"Cấp thử thách",apply:"Dùng cấp này",invalidTier:"Nhập cấp từ 1 đến 10000.",
  readyTag:"BRACKET DEFENDER",readyTitle:"Giữ cổng mã an toàn!",readyBody:"Chờ dấu vào vùng xanh. Ngoặc mở thì PUSH; ngoặc đóng khớp đỉnh thì POP.",flagIntro:"Từ cấp 3: dùng FLAG khi gặp ngoặc đóng sai hoặc hết dòng mà stack vẫn còn dấu.",play:"Vào ca",push:"PUSH",pop:"POP",flag:"FLAG",peek:"PEEK",top:"TOP",empty:"Rỗng",base:"ĐÁY",capacity:"DUNG LƯỢNG",zone:"VÙNG THAO TÁC",perfect:"CHUẨN NHỊP",end:"HẾT DÒNG",open:"Ngoặc mở",closing:"Ngoặc đóng",wait:"Chờ dấu vào vùng xanh.",
  noticeValid:"Dòng hợp lệ!",noticeInvalid:"Đã tìm ra ngoặc sai!",noticeMissed:"Bỏ lỡ dòng · −1 tim",
  wave:(wave:number,total:number)=>`Dòng ${wave}/${total}`,level:(tier:number)=>`Cấp ${tier}`,combo:(multiplier:number)=>`×${multiplier}`,boss:"DÒNG ĐẶC BIỆT",correctPush:(ch:string)=>`PUSH ${ch}: thêm dấu lên đỉnh.`,correctPop:(ch:string)=>`POP: lấy ${ch} khỏi đỉnh và ghép cặp.`,underflow:"Stack rỗng: không thể POP (underflow).",overflow:"Stack đầy: không thể PUSH thêm (overflow).",pushCloser:"Đây là ngoặc đóng. So sánh với đỉnh rồi dùng POP.",popOpener:"Đây là ngoặc mở. Dùng PUSH để lưu vào stack.",mismatch:(top:string,ch:string)=>`${ch} không khớp đỉnh ${top}. Hãy dùng FLAG.`,falseFlag:"Chưa có lỗi ở vị trí này. Tiếp tục xử lý dấu đang rơi.",unclosed:"Hết dòng nhưng stack chưa rỗng: còn ngoặc chưa đóng.",missed:"Dấu đã qua vùng thao tác. Bạn mất một tim.",invalidFound:"Đã phát hiện dòng ngoặc không hợp lệ!",clean:"Dòng hợp lệ! Stack đã rỗng.",nextWave:"Sang dòng tiếp theo",reviewTitle:"Đối chiếu dòng vừa xử lý",lastCall:"Thao tác vừa rồi",valid:"Hợp lệ",invalid:"Không hợp lệ",missedWave:"Bỏ lỡ dòng",victory:"Cổng mã đã an toàn!",lost:"Cổng mã cần được sửa!",retry:"Chơi lại",harder:"Chơi khó hơn",easier:"Về cấp dễ hơn",map:"Về bản đồ",continueMap:"Đi tiếp cùng Buta",best:"Kỷ lục",highest:"Cấp cao nhất",points:(score:number)=>`${score.toLocaleString("vi-VN")} điểm`,summary:(lines:number,mistakes:number)=>`${lines} dòng xử lý đúng · ${mistakes} lỗi`,peekEmpty:"Stack rỗng, chưa có dấu ở đỉnh.",peekTop:(top:string,close:string)=>`PEEK thấy ${top} ở đỉnh, không lấy ra. Ngoặc đóng cần khớp là ${close}.`,hintBody:"Ngoặc mở: PUSH. Ngoặc đóng khớp TOP: POP. Ngoặc đóng sai hoặc hết dòng còn dấu: FLAG.",help:"Buta chỉ đỉnh",codeTitle:"Thuật toán kiểm tra ngoặc",recordReadError:"",validResult:(line:string,valid:boolean)=>`isValid("${line}") → ${valid?"true":"false"}`,
};
export const STACK_CODE=[
  {branch:"push",text:"if opening(ch): stack.push(ch)"},
  {branch:"reject",text:"elif empty() or top != match(ch):"},
  {branch:"reject",text:"    return false"},
  {branch:"pop",text:"else: stack.pop()"},
  {branch:"return",text:"return stack.empty()"},
]as const;

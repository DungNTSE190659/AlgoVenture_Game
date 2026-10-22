import { expect,test,type Page } from "@playwright/test";
async function enter(page:Page,demo=false){
  await page.addInitScript(()=>{if(!localStorage.getItem("algoventure.world-progress.v3"))localStorage.setItem("algoventure.world-progress.v3",JSON.stringify({bubble:true,selection:true,insertion:true}));});
  await page.goto("/");await page.emulateMedia({reducedMotion:"reduce"});await page.getByRole("button",{name:"Xem chủ đề Mảng",exact:true}).click();await page.locator(".atlas-enter").click();await page.getByRole("button",{name:"Merge Sort",exact:true}).click();await page.getByRole("button",{name:demo?"Xem demo":"Thử thách",exact:true}).click();
}
async function custom(page:Page,values:string){await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await page.getByLabel("Mảng của bạn",{exact:true}).fill(values);await page.getByRole("button",{name:"Dùng mảng này",exact:true}).click();}
async function freeze(page:Page){await page.clock.install();await page.clock.pauseAt(new Date());}
async function start(page:Page){
  await page.getByRole("button",{name:"Vào ca",exact:false}).click();await expect(page.locator(".merge-world")).toHaveAttribute("data-race-status","running");
  while(await page.locator(".merge-world").getAttribute("data-phase")==="split"){
    const opening=Number(await page.locator(".merge-world").getAttribute("data-opening"));await page.clock.runFor(480);await expect(page.locator(".merge-world")).toHaveAttribute("data-opening",String(opening+1));
  }
}
async function tick(page:Page){const moves=Number(await page.locator(".race-surface").getAttribute("data-moves"));const ms=Number(await page.locator(".race-surface").getAttribute("data-beat-ms"));await page.clock.runFor(ms+50);return moves;}
async function chooseCorrect(page:Page){
  const heads=await page.locator('.race-parcel[data-head="true"]').evaluateAll(nodes=>nodes.map(n=>({lane:n.getAttribute("data-lane"),value:Number(n.getAttribute("data-value"))})));
  const head=heads.sort((a,b)=>a.value-b.value||(a.lane==="left"?-1:1))[0];
  await page.getByRole("slider",{name:"Cần gạt chuyển làn"}).focus();await page.keyboard.press(head.lane==="left"?"ArrowLeft":"ArrowRight");
}
async function advanceGroup(page:Page){const task=Number(await page.locator(".race-surface").getAttribute("data-task"));await page.clock.runFor(1450);await expect.poll(async()=>await page.locator(".merge-world").getAttribute("data-race-status")==="won"?"won":await page.locator(".race-surface").getAttribute("data-task")).toMatch(new RegExp(`^(won|${task+1})$`));}
async function correct(page:Page){
  if(await page.locator(".merge-world").getAttribute("data-phase")==="joined")await advanceGroup(page);
  await chooseCorrect(page);const moves=await tick(page);await expect(page.locator(".race-surface")).toHaveAttribute("data-moves",String(moves+1));
}
async function solve(page:Page){
  for(let i=0;i<40;i++){
    if(await page.locator(".merge-world").getAttribute("data-race-status")==="won"){await page.clock.runFor(3700);await expect(page.locator(".merge-victory")).toBeVisible();return;}
    if(await page.locator(".merge-world").getAttribute("data-phase")==="joined"){await advanceGroup(page);if(await page.locator(".merge-world").getAttribute("data-race-status")==="won")continue;}
    await correct(page);
  }
  throw new Error("Race did not finish");
}

test("only lever controls the running game; the first wrong automatic crossing ends the shift",async({page})=>{
  await enter(page);await custom(page,"2,1");await freeze(page);
  await expect(page.getByRole("button",{name:/Chọn làn trái|Chọn làn phải|Nhả kiện/})).toHaveCount(0);
  await page.clock.runFor(20000);await expect(page.locator(".race-surface")).toHaveAttribute("data-moves","0");
  await start(page);await tick(page);await expect(page.locator(".merge-world")).toHaveAttribute("data-race-status","lost");
  await page.clock.runFor(500);await expect(page.getByRole("dialog",{name:"Ca phân loại thất bại",exact:true})).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Kiện 2 đã qua trước 1");await expect(page.locator(".merge-score strong")).toHaveText("0");
  await page.clock.runFor(10000);await expect(page.locator(".race-surface")).toHaveAttribute("data-moves","0");
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!).merge)).not.toBe(true);
  await page.getByRole("button",{name:"Chơi lại",exact:true}).click();await expect(page.locator(".merge-world")).toHaveAttribute("data-race-status","ready");
});

test("automatic merging preserves duplicates and negatives, wins once and opens Quick",async({page})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));await enter(page);await custom(page,"3,-1,3,0");await freeze(page);await start(page);await solve(page);
  await expect(page.locator(".merge-victory")).toContainText("800 điểm");expect(await page.locator(".race-manifest i").allTextContents()).toEqual(["-1","0","3","3"]);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!).merge)).toBe(true);
  await page.clock.resume();await page.getByRole("button",{name:"Đi tiếp cùng Buta",exact:true}).click();await expect(page.locator("#track-sheet-title")).toHaveText("Quick Sort");expect(errors).toEqual([]);
});

test("equal values must take A first; steering alone never moves or scores a parcel",async({page})=>{
  await enter(page);await custom(page,"5,5");await freeze(page);await start(page);
  const lever=page.getByRole("slider",{name:"Cần gạt chuyển làn"});await lever.focus();await page.keyboard.press("ArrowRight");await expect(lever).toHaveAttribute("aria-valuenow","1");
  await expect(page.locator(".race-surface")).toHaveAttribute("data-moves","0");await tick(page);await page.clock.runFor(500);await expect(page.getByRole("dialog")).toContainText("Hai kiện bằng nhau");
});

test("settings, hint and hidden tab freeze both physical position and gate deadline",async({page})=>{
  await enter(page);await custom(page,"2,1");await freeze(page);await start(page);await chooseCorrect(page);await page.clock.runFor(900);
  const snapshot=()=>page.locator(".race-surface").evaluate(n=>({progress:n.getAttribute("data-progress"),parcels:[...n.querySelectorAll<HTMLElement>(".race-parcel")].map(p=>p.style.cssText)}));
  await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await expect(page.locator(".merge-world")).toHaveAttribute("data-motion-paused","true");const before=await snapshot();
  await page.clock.runFor(10000);expect(await snapshot()).toEqual(before);await page.getByRole("button",{name:"Đóng",exact:true}).click();
  await page.getByRole("button",{name:/Buta gợi ý/}).click();await expect(page.getByRole("button",{name:"Đóng gợi ý",exact:true})).toBeVisible();const hint=await snapshot();await page.clock.runFor(10000);expect(await snapshot()).toEqual(hint);await page.getByRole("button",{name:"Đóng gợi ý",exact:true}).click();
  await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"));});await expect(page.locator(".merge-world")).toHaveAttribute("data-motion-paused","true");const hidden=await snapshot();await page.clock.runFor(10000);expect(await snapshot()).toEqual(hidden);
  await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"));});await expect(page.locator(".merge-world")).toHaveAttribute("data-motion-paused","false");await solve(page);
});

test("mouse drag, touch tap and keyboard operate the same lever",async({page})=>{
  await enter(page);await custom(page,"2,1");await freeze(page);await start(page);const lever=page.getByRole("slider",{name:"Cần gạt chuyển làn"});
  const b=(await lever.boundingBox())!;await page.mouse.move(b.x+10,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width-10,b.y+b.height/2,{steps:8});await page.mouse.up();await expect(lever).toHaveAttribute("aria-valuenow","1");
  const cdp=await page.context().newCDPSession(page);await cdp.send("Emulation.setTouchEmulationEnabled",{enabled:true});
  for(const expected of ["0","1"]){await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await expect(lever).toHaveAttribute("aria-valuenow",expected);}
  await tick(page);await expect(page.locator(".race-surface")).toHaveAttribute("data-moves","1");await expect(lever).toHaveAttribute("aria-valuenow","1");await solve(page);
});

test("connected tracks fill screen, rotate for phones and move real parcel sprites",async({page})=>{
  await enter(page);await custom(page,"8,7,6,5,4,3,2,1");await freeze(page);await start(page);for(let i=0;i<16;i++)await correct(page);await advanceGroup(page);
  await chooseCorrect(page);await page.clock.runFor(2100);
  for(const[width,height]of [[1440,900],[1280,580],[390,844],[320,568],[844,390]]){
    await page.setViewportSize({width,height});await expect(page.locator(".race-surface")).toHaveAttribute("data-orientation",width<=600?"vertical":"horizontal");
    const size=await page.locator(".race-surface").boundingBox();expect(size!.width).toBe(width);expect(size!.height).toBeGreaterThanOrEqual(height-110);
    expect(await page.locator(".merge-world").evaluate(n=>n.scrollHeight-n.clientHeight)).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    const geometry=await page.locator(".race-tracks").evaluate(svg=>{const point=(name:string,end:boolean)=>{const path=svg.querySelector<SVGPathElement>(`[data-track="${name}"] .race-track-bed`)!;const p=path.getPointAtLength(end?path.getTotalLength():0);return{x:p.x,y:p.y};};return{a:point("left",true),b:point("right",true),c:point("output",false)};});
    expect(Math.hypot(geometry.a.x-geometry.c.x,geometry.a.y-geometry.c.y)).toBeLessThan(1);expect(Math.hypot(geometry.b.x-geometry.c.x,geometry.b.y-geometry.c.y)).toBeLessThan(1);
    const heads=await page.locator('.race-parcel[data-head="true"]').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom};}));
    if(width<=600)expect(heads[1].x-heads[0].right).toBeGreaterThanOrEqual(15);else expect(heads[1].y-heads[0].bottom).toBeGreaterThanOrEqual(15);
    await expect(page.getByRole("slider",{name:"Cần gạt chuyển làn"})).toBeInViewport();await expect.poll(()=>page.locator(".race-parcel img,.race-machine img,.factory-background img").evaluateAll((nodes:HTMLImageElement[])=>nodes.every(n=>n.complete&&n.naturalWidth>0))).toBe(true);
    await page.screenshot({path:`.qa/merge-express-${width}.png`});
  }
  await correct(page);
  const positions=()=>page.locator(".race-parcel.is-outgoing").evaluateAll((nodes:HTMLElement[])=>nodes.map(n=>n.style.cssText));const before=await positions();await page.clock.runFor(350);expect(await positions()).not.toEqual(before);await solve(page);
});

test("difficulty increases automatic speed and parcel count; invalid settings preserve the shift",async({page})=>{
  await enter(page);await custom(page,"2,1");await freeze(page);await start(page);await solve(page);
  for(const[level,count,ms]of [["medium",7,"1650"],["hard",8,"1150"]]as const){
    await page.getByRole("button",{name:"Tăng độ khó",exact:true}).click();await expect(page.locator(".race-surface")).toHaveAttribute("data-beat-ms",ms);
    await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await expect(page.getByRole("combobox")).toHaveValue(level);expect((await page.getByLabel("Mảng của bạn",{exact:true}).inputValue()).split(",")).toHaveLength(count);
    for(const invalid of ["","1","100,2","1.5,2","a,2","1,2,3,4,5,6,7,8,9"]){await page.getByLabel("Mảng của bạn",{exact:true}).fill(invalid);await page.getByRole("button",{name:"Dùng mảng này",exact:true}).click();await expect(page.getByRole("alert")).toBeVisible();}
    await page.getByLabel("Mảng của bạn",{exact:true}).fill("2,1");await page.getByRole("button",{name:"Dùng mảng này",exact:true}).click();await start(page);await solve(page);
  }
  await expect(page.getByRole("button",{name:"Tăng độ khó",exact:true})).toHaveCount(0);
});
test("Demo pauses physical motion and retains its step through settings",async({page})=>{
  await enter(page,true);await custom(page,"2,1");await page.emulateMedia({reducedMotion:"no-preference"});
  for(let i=0;i<3;i++)await page.getByRole("button",{name:"Bước tiếp",exact:true}).click();
  await page.getByRole("button",{name:"Tiếp tục",exact:true}).click();await page.getByRole("button",{name:"Tạm dừng",exact:true}).click();
  const motion=()=>page.locator(".merge-demo-board").evaluate(n=>n.getAnimations({subtree:true}).map(a=>({state:a.playState,time:Number(a.currentTime),rate:a.playbackRate})));
  await expect.poll(async()=>(await motion()).some(a=>a.state==="paused")).toBe(true);const before=await motion();await page.waitForTimeout(160);expect(await motion()).toEqual(before);
  await page.getByRole("button",{name:/Tốc độ demo/}).click();expect((await motion()).every(a=>a.rate===1.5)).toBe(true);
  const step=await page.locator(".merge-demo-progress span").textContent();await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await page.getByRole("button",{name:"Đóng",exact:true}).click();await expect(page.locator(".merge-demo-progress span")).toHaveText(step!);
});

test("Buta dialogue matches Bubble dimensions on desktop and phone",async({page})=>{
  for(const[width,height]of [[1440,900],[1280,580],[390,844],[320,568]]) {
    await page.setViewportSize({width,height});await enter(page,true);
    const measure=(selector:string)=>page.locator(selector).evaluate(n=>{const p=getComputedStyle(n.querySelector("p")!),pig=getComputedStyle(n.querySelector(".pig")!);return{font:p.fontSize,padding:p.padding,radius:p.borderRadius,pigWidth:pig.width};});
    const merge=await measure(".merge-dialogue");await page.getByRole("button",{name:"Về bản đồ",exact:true}).click();await page.getByRole("button",{name:"Bubble Sort",exact:true}).click();await page.getByRole("button",{name:"Xem demo",exact:true}).click();expect(merge).toEqual(await measure(".bubble-dialogue"));
  }
});

test("every Demo frame uses plain numbers and fits without scrolling",async({page})=>{
  await enter(page,true);await custom(page,"8,7,6,5,4,3,2,1");
  for(const [width,height] of [[1440,900],[1280,580],[390,844],[320,568],[844,390]]) {
    await page.setViewportSize({width,height});await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await page.getByRole("button",{name:"Chơi lại từ đầu",exact:true}).click();
    for(let frame=0;frame<100;frame++) {
      await expect(page.locator('.merge-world img[src*="/assets/merge"]')).toHaveCount(0);await expect(page.locator(".merge-world")).not.toContainText(/chế tạo|linh kiện|cầu hợp nhất|sửa cầu|kiện hàng/i);
      expect(await page.locator(".merge-world").evaluate(n=>n.scrollHeight-n.clientHeight),`Demo ${width}x${height} frame ${frame}`).toBeLessThanOrEqual(2);
      const geometry=await page.locator(".merge-demo-board").evaluate(n=>{const overview=n.querySelector(".merge-overview-row")!.getBoundingClientRect(),flow=n.querySelector(".merge-flow,.merge-split-flow")!.getBoundingClientRect();return{top:overview.bottom,bottom:flow.top,width:n.scrollWidth,client:n.clientWidth,ids:[...n.querySelectorAll("[data-merge-item]")].map(el=>el.getAttribute("data-merge-item"))};});
      expect(geometry.top).toBeLessThan(geometry.bottom);expect(geometry.width).toBeLessThanOrEqual(geometry.client+1);
      expect(geometry.ids).toHaveLength(8);expect(new Set(geometry.ids).size).toBe(8);
      if(await page.getByRole("button",{name:"Tự mình thử",exact:true}).count())break;
      await page.getByRole("button",{name:"Bước tiếp",exact:true}).click();
    }
    await page.screenshot({path:`.qa/merge-demo-${width}.png`});
  }
});


test("Demo keeps a compact whole-array row, drops numbers and restores green progress when stepping back",async({page})=>{
  await enter(page,true);await custom(page,"14,9,1,19,7,8,11");
  const next=()=>page.getByRole("button",{name:"Bước tiếp",exact:true}).click();
  for(let i=0;i<3;i++)await next();
  await expect(page.locator(".merge-demo-progress span")).toHaveText("4/57");
  expect(await page.locator(".merge-overview-number").evaluateAll(nodes=>nodes.map(n=>Number(n.getAttribute("data-value"))))).toEqual([14,9,1,19,7,8,11]);
  await expect(page.locator(".merge-overview-number.is-sorted")).toHaveCount(0);
  await page.screenshot({path:".qa/merge-flow-page-4.png"});await next();
  await expect(page.locator(".merge-flow-sources .is-compared")).toHaveAttribute("data-value","1");
  await expect(page.locator(".merge-overview-number.is-active")).toHaveCount(2);
  await expect(page.locator(".merge-number-lane,.merge-demo-sources,.merge-demo-output")).toHaveCount(0);
  await page.screenshot({path:".qa/merge-flow-page-5.png"});await next();
  await expect(page.locator(".merge-flow-output [data-merge-item]")).toHaveAttribute("data-value","1");
  await expect(page.locator(".merge-source-vacancy")).toHaveCount(1);
  const source=(await page.locator('.merge-flow-sources [data-value="9"]').boundingBox())!,output=(await page.locator('.merge-flow-output [data-value="1"]').boundingBox())!;
  expect(output.y).toBeGreaterThan(source.y+source.height);
  await next();await next(); // second parcel commits the first sorted pair
  expect(await page.locator(".merge-overview-number").evaluateAll(nodes=>nodes.map(n=>Number(n.getAttribute("data-value"))))).toEqual([14,1,9,19,7,8,11]);
  await expect(page.locator(".merge-overview-number.is-sorted")).toHaveCount(2);
  await page.screenshot({path:".qa/merge-flow-first-group.png"});
  await page.getByRole("button",{name:"Bước trước",exact:true}).click();
  await expect(page.locator(".merge-overview-number.is-sorted")).toHaveCount(0);
  await expect(page.locator(".merge-flow-output [data-merge-item]")).toHaveCount(1);
  await next();await expect(page.locator(".merge-overview-number.is-sorted")).toHaveCount(2);
});


test("intro zoom presents unsorted parcels; outro presents stable sorted parcels before victory",async({page})=>{
  await enter(page);await custom(page,"8,7,6,5,4,3,2,1");
  const intro=page.getByRole("region",{name:"Các kiện hàng chưa sắp xếp",exact:true});
  await page.emulateMedia({reducedMotion:"no-preference"});
  const motion=()=>intro.locator(".race-showcase-camera").evaluate(n=>n.getAnimations().map(a=>({state:a.playState,time:Number(a.currentTime)})));
  await expect.poll(async()=>(await motion()).some(a=>a.state==="running")).toBe(true);
  await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await expect.poll(async()=>(await motion()).some(a=>a.state==="paused")).toBe(true);
  await intro.locator(".race-showcase-camera").evaluate(async n=>{await Promise.all(n.getAnimations().map(a=>a.ready));});
  const still=await motion();await page.waitForTimeout(160);const held=await motion();expect(held).toHaveLength(still.length);held.forEach((animation,index)=>{expect(animation.state).toBe("paused");expect(Math.abs(animation.time-still[index].time)).toBeLessThan(1);});
  await page.getByRole("button",{name:"Đóng",exact:true}).click();await page.emulateMedia({reducedMotion:"reduce"});await freeze(page);
  expect(await intro.locator("[data-value]").evaluateAll(nodes=>nodes.map(n=>Number(n.getAttribute("data-value"))))).toEqual([8,7,6,5,4,3,2,1]);
  for(const[width,height]of [[1440,900],[1280,580],[390,844],[320,568],[844,390]]){
    await page.setViewportSize({width,height});await expect(page.getByRole("button",{name:"Vào ca",exact:false})).toBeInViewport();
    expect(await page.locator(".merge-world").evaluate(n=>n.scrollHeight-n.clientHeight)).toBe(0);
    for(const box of await intro.locator(".race-showcase-parcel").evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return{x:b.x,right:b.right,y:b.y,bottom:b.bottom};}))){expect(box.x).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(width);expect(box.y).toBeGreaterThanOrEqual(104);expect(box.bottom).toBeLessThanOrEqual(height);}
    await page.screenshot({path:`.qa/merge-intro-${width}.png`});
  }
  await page.setViewportSize({width:1440,height:900});await custom(page,"3,-1,3,0");await start(page);for(let i=0;i<8;i++)await correct(page);await advanceGroup(page);
  const outro=page.getByRole("region",{name:"Các kiện hàng đã sắp xếp",exact:true});await expect(outro).toBeVisible();await expect(page.locator(".merge-victory")).toHaveCount(0);
  expect(await outro.locator("[data-value]").evaluateAll(nodes=>nodes.map(n=>Number(n.getAttribute("data-value"))))).toEqual([-1,0,3,3]);
  expect(await outro.locator('[data-value="3"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute("data-item-id")))).toEqual(["0","2"]);
  await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await expect(outro).toHaveAttribute("data-paused","true");await page.clock.runFor(10000);await expect(page.locator(".merge-victory")).toHaveCount(0);await page.getByRole("button",{name:"Đóng",exact:true}).click();
  await page.screenshot({path:".qa/merge-outro-1440.png"});await page.clock.runFor(2000);await expect(outro).toBeVisible();await page.clock.runFor(1800);await expect(page.locator(".merge-victory")).toBeVisible();
});

test("handle obeys absolute drag direction and persists through draining and group transitions",async({page})=>{
  await enter(page);await custom(page,"2,1,4,3");await freeze(page);await start(page);
  const lever=page.getByRole("slider",{name:"Cần gạt chuyển làn"});await lever.focus();await page.keyboard.press("ArrowRight");
  await tick(page);await expect(lever).toHaveAttribute("aria-valuenow","1");await tick(page);await expect(lever).toHaveAttribute("aria-valuenow","1");
  await advanceGroup(page);await expect(lever).toHaveAttribute("aria-valuenow","1");
  const box=(await lever.boundingBox())!,y=box.y+box.height/2;
  await page.mouse.move(box.x+box.width*.1,y);await page.mouse.down();await page.mouse.move(box.x+box.width*.9,y,{steps:5});await expect(lever).toHaveAttribute("aria-valuenow","1");
  await page.mouse.move(box.x+box.width*.25,y,{steps:5});await expect(lever).toHaveAttribute("aria-valuenow","0");await page.mouse.up();await expect(lever).toHaveAttribute("aria-valuenow","0");
  await chooseCorrect(page);await tick(page);await expect(lever).toHaveAttribute("aria-valuenow","1");await solve(page);
});

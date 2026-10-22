import { expect,test,type Page } from "@playwright/test";
async function enter(page:Page,demo=false){
  await page.goto("/");await page.evaluate(()=>{(window as any).stackAudioUrl=performance.getEntriesByType("resource").find(e=>new URL(e.name).pathname==="/src/audio/gameAudio.ts")?.name;});await freeze(page);await page.emulateMedia({reducedMotion:"reduce"});await page.getByRole("button",{name:"Xem chủ đề Mảng",exact:true}).click();await page.locator(".atlas-enter").click();await page.getByRole("button",{name:"Lộ trình Stack & Queue",exact:true}).click();await page.getByRole("button",{name:"Stack",exact:true}).click();await expect(page.locator(".sheet-description")).toHaveCount(0);await page.getByRole("button",{name:demo?"Xem demo":"Thử thách",exact:true}).click();
}
async function freeze(page:Page){const now=new Date("2026-10-21T10:00:00Z");await page.clock.install({time:now});await page.clock.pauseAt(new Date(now.getTime()+1000));}
async function tier(page:Page,value:number){await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await page.getByLabel("Cấp thử thách",{exact:true}).fill(String(value));await page.getByRole("button",{name:"Dùng cấp này",exact:true}).click();await expect(page.locator(".stack-world")).toHaveAttribute("data-tier",String(value));}
async function start(page:Page){await expect(page.locator(".stack-ready")).toHaveCount(0);await expect(page.locator(".stack-world")).toHaveAttribute("data-stack-phase","playing");}
async function zone(page:Page){const fall=Number(await page.locator(".stack-world").getAttribute("data-fall-ms")),progress=Number(await page.locator(".stack-falling").getAttribute("data-progress"));await page.clock.runFor(Math.max(0,fall*(.85-progress)));await expect(page.getByRole("button",{name:"PUSH",exact:true})).toBeEnabled();}
async function correct(page:Page){
  const ch=await page.locator(".stack-falling").getAttribute("data-bracket"),values=await page.locator(".stack-tower [data-stack-value]").allTextContents(),top=values.at(-1),close:Record<string,string>={"(":")","[":"]","{":"}"};
  if(ch!=="END")await zone(page);
  const action=ch==="END"?"FLAG":"([{ ".trim().includes(ch!)?"PUSH":top&&close[top]===ch?"POP":"FLAG";
  const before=await page.locator(".stack-world").evaluate(n=>`${n.getAttribute("data-wave")}:${n.getAttribute("data-index")}:${n.getAttribute("data-stack-phase")}`);
  await page.getByRole("button",{name:action,exact:true}).click();
  await expect.poll(()=>page.locator(".stack-world").evaluate(n=>`${n.getAttribute("data-wave")}:${n.getAttribute("data-index")}:${n.getAttribute("data-stack-phase")}`)).not.toBe(before);
}
async function solve(page:Page){const notices=new Set<string>();for(let i=0;i<200;i++){const phase=await page.locator(".stack-world").getAttribute("data-stack-phase");if(phase==="won")return notices;if(phase==="lost")throw new Error("Lost while following valid parser algorithm");if(phase==="review"){await expect(page.locator(".stack-wave-notice")).toBeVisible();notices.add((await page.locator(".stack-wave-notice").getAttribute("data-review-kind"))!);await expect(page.locator(".stack-review")).toHaveCount(0);await expect(page.getByRole("button",{name:"Sang dòng tiếp theo",exact:true})).toHaveCount(0);await page.clock.runFor(1550);await expect(page.locator(".stack-world")).not.toHaveAttribute("data-stack-phase","review");}else await correct(page);}throw new Error("Stack run did not finish");}

test("Demo shows PEEK, LIFO and rejected overflow/underflow, with no progress award",async({page})=>{
  await enter(page,true);const next=()=>page.getByRole("button",{name:"Bước tiếp",exact:true}).click();
  await next();await next();await next();await expect(page.locator(".stack-dialogue")).toContainText("PEEK");await expect(page.locator("[data-stack-value]")).toHaveText(["10","20"]);
  await next();await expect(page.locator("[data-stack-value]")).toHaveText(["10"]);await expect(page.locator(".stack-dialogue")).toContainText("LIFO");
  await next();await next();await expect(page.locator(".stack-dialogue")).toContainText("underflow");await expect(page.locator("[data-stack-value]")).toHaveCount(0);
  await next();await next();await next();await expect(page.locator(".stack-dialogue")).toContainText("overflow");await expect(page.locator("[data-stack-value]")).toHaveText(["10","20"]);
  while(!await page.getByRole("button",{name:"Tự mình thử",exact:true}).count())await next();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("algoventure.world-progress.v3")??"{}").stack)).not.toBe(true);
  await page.getByRole("button",{name:"Tự mình thử",exact:true}).click();await expect(page.locator(".stack-world")).toHaveAttribute("data-stack-phase","playing");
});

test("timed PUSH/POP handles one token per action and wins a complete first tier",async({page})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));await enter(page);await start(page);
  await expect(page.getByRole("button",{name:"PUSH",exact:true})).toBeDisabled();await expect(page.getByRole("button",{name:"FLAG",exact:true})).toHaveCount(0);await zone(page);
  await page.getByRole("button",{name:"PUSH",exact:true}).evaluate((button:HTMLButtonElement)=>{button.click();button.click();});await expect(page.locator(".stack-world")).toHaveAttribute("data-index","1");await expect(page.locator(".play-score strong")).toHaveText("15");await expect(page.locator(".stack-falling")).toHaveAttribute("data-progress","0.000");await expect(page.getByRole("button",{name:"PUSH",exact:true})).toBeDisabled();
  await solve(page);await expect(page.getByRole("dialog",{name:"Cổng mã đã an toàn!",exact:true})).toBeVisible();await expect(page.getByRole("img",{name:"3 trên 3 sao",exact:true})).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!).stack)).toBe(true);
  await page.getByRole("button",{name:"Chơi khó hơn",exact:true}).click();await expect(page.locator(".stack-world")).toHaveAttribute("data-tier","2");await expect(page.locator(".stack-world")).toHaveAttribute("data-stack-phase","playing");expect(errors).toEqual([]);
});

test("tier 3 introduces FLAG and handles invalid syntax and unclosed endings without false completion",async({page})=>{
  await enter(page);await tier(page,3);await expect(page.locator(".stack-feedback")).toContainText("FLAG");await start(page);const notices=await solve(page);expect([...notices]).toEqual(expect.arrayContaining(["valid","invalid"]));
  await expect(page.getByRole("dialog",{name:"Cổng mã đã an toàn!",exact:true})).toBeVisible();await expect(page.locator(".stack-world")).toHaveAttribute("data-hearts","3");expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("algoventure.stack-record.v1")!).highestTier)).toBe(3);
});

test("three missed brackets lose the game and retry resets score, stack and hearts",async({page})=>{
  await enter(page);await start(page);
  for(let i=0;i<3;i++){await page.clock.runFor(3700);await expect(page.locator(".stack-world")).toHaveAttribute("data-hearts",String(2-i));if(i<2){await expect(page.locator(".stack-wave-notice")).toBeVisible();await expect(page.locator(".stack-review")).toHaveCount(0);await expect(page.locator(".stack-world code")).toHaveCount(0);await page.clock.runFor(1550);await expect(page.locator(".stack-world")).toHaveAttribute("data-stack-phase","playing");}}
  await expect(page.getByRole("dialog",{name:"Cổng mã cần được sửa!",exact:true})).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("algoventure.world-progress.v3")??"{}").stack)).not.toBe(true);
  await page.getByRole("button",{name:"Chơi lại",exact:true}).click();await expect(page.locator(".stack-world")).toHaveAttribute("data-hearts","3");await expect(page.locator(".play-score strong")).toHaveText("0");
});

test("PEEK, settings and hidden tab pause the falling bracket without removing the top",async({page})=>{
  await enter(page);await start(page);await correct(page);
  const values=await page.locator(".stack-tower [data-stack-value]").allTextContents();await page.getByRole("button",{name:"PEEK",exact:true}).click();await expect(page.locator(".stack-hint")).toContainText("PEEK");
  const before=await page.locator(".stack-falling").getAttribute("data-progress");await page.clock.runFor(12000);await expect(page.locator(".stack-falling")).toHaveAttribute("data-progress",before!);expect(await page.locator(".stack-tower [data-stack-value]").allTextContents()).toEqual(values);
  await page.getByRole("button",{name:"Đóng gợi ý",exact:true}).click();await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await page.clock.runFor(12000);await expect(page.locator(".stack-world")).toHaveAttribute("data-hearts","3");await page.getByRole("button",{name:"Đóng",exact:true}).click();
  await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"));});await expect(page.locator(".stack-world")).toHaveAttribute("data-motion-paused","true");await page.clock.runFor(12000);await expect(page.locator(".stack-world")).toHaveAttribute("data-hearts","3");
  await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"));});await expect(page.locator(".stack-world")).toHaveAttribute("data-motion-paused","false");await correct(page);
});

test("every Demo frame and tier-3 play layout fit desktop, phone and landscape",async({page})=>{
  await enter(page,true);
  for(const[width,height]of [[1440,900],[1280,580],[390,844],[320,568],[844,390]]){
    await page.setViewportSize({width,height});
    if(await page.getByRole("button",{name:"Xem lại từ đầu",exact:true}).count())await page.getByRole("button",{name:"Xem lại từ đầu",exact:true}).click();
    for(let frame=0;frame<50;frame++){
      await expect(page.locator(".stack-world code")).toHaveCount(0);expect(await page.locator(".stack-world").evaluate(n=>n.scrollHeight-n.clientHeight),`Demo ${width} frame ${frame}`).toBeLessThanOrEqual(2);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
      if(await page.getByRole("button",{name:"Tự mình thử",exact:true}).count())break;await page.getByRole("button",{name:"Bước tiếp",exact:true}).click();
    }
    await page.screenshot({path:`.qa/stack-demo-${width}.png`});
  }
  await page.getByRole("button",{name:"Tự mình thử",exact:true}).click();await tier(page,3);await start(page);
  for(const[width,height]of [[1440,900],[1280,580],[390,844],[320,568],[844,390]]){
    await page.setViewportSize({width,height});expect(await page.locator(".stack-world").evaluate(n=>n.scrollHeight-n.clientHeight),`Play ${width}`).toBeLessThanOrEqual(2);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    for(const name of ["PUSH","POP","FLAG"]){const button=page.getByRole("button",{name,exact:true});await expect(button).toBeInViewport();const box=(await button.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
    const tube=(await page.locator(".stack-tower .stack-tube").boundingBox())!;expect(tube.height).toBeGreaterThan(60);await page.screenshot({path:`.qa/stack-play-${width}.png`});
  }
});

test("touch controls reject a false FLAG and wrong POP without consuming the bracket",async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();
  await enter(page);await tier(page,3);await start(page);await zone(page);
  const token=await page.locator(".stack-falling").getAttribute("data-bracket");
  await page.getByRole("button",{name:"FLAG",exact:true}).tap();await expect(page.locator(".stack-world")).toHaveAttribute("data-hearts","2");await expect(page.locator(".stack-feedback")).toContainText("Chưa có lỗi");await expect(page.locator(".stack-falling")).toHaveAttribute("data-bracket",token!);
  await page.getByRole("button",{name:"POP",exact:true}).tap();await expect(page.locator(".stack-world")).toHaveAttribute("data-hearts","1");await expect(page.locator(".stack-feedback")).toContainText("underflow");await expect(page.locator(".stack-tower [data-stack-value]")).toHaveCount(0);
  await page.getByRole("button",{name:"PUSH",exact:true}).tap();await expect(page.locator(".stack-world")).toHaveAttribute("data-index","1");await expect(page.locator(".stack-tower [data-stack-value]")).toHaveText([token!]);await expect(page.locator(".stack-world")).toHaveAttribute("data-hearts","1");await context.close();
});

test("Demo illustration and Buta speech stay large on desktop and phones",async({page})=>{
  for(const[width,height]of [[1440,900],[1280,580],[390,844],[320,568],[844,390]]){
    await page.setViewportSize({width,height});await enter(page,true);await page.getByRole("button",{name:"Bước tiếp",exact:true}).click();await page.getByRole("button",{name:"Bước tiếp",exact:true}).click();
    const sizes=await page.locator(".stack-demo").evaluate(n=>{
      const p=n.querySelector(".stack-dialogue p")!,tube=n.querySelector(".stack-tube")!,token=n.querySelector(".stack-token")!;
      return {pig:n.querySelector(".stack-dialogue .pig")!.getBoundingClientRect().width,font:parseFloat(getComputedStyle(p).fontSize),speech:p.getBoundingClientRect().width,tube:tube.getBoundingClientRect().width,token:parseFloat(getComputedStyle(token).fontSize)};
    });
    expect(sizes.tube).toBeGreaterThanOrEqual(width>1000?240:168);expect(sizes.token).toBeGreaterThanOrEqual(29);expect(sizes.font).toBeGreaterThanOrEqual(width>1000?20:14);expect(sizes.speech).toBeGreaterThan(width>1000?400:130);expect(sizes.pig).toBeGreaterThanOrEqual(width>1000?132:86);
    await expect(page.locator(".stack-world code")).toHaveCount(0);await page.screenshot({path:`.qa/stack-large-${width}.png`});
  }
});


test("wave result is a compact inline notice, stays paused with hints and clears automatically",async({page})=>{
  for(const[width,height]of [[1440,900],[320,568],[844,390]]){
    await page.setViewportSize({width,height});await enter(page);await start(page);const before=await page.locator(".stack-actions").boundingBox();await page.clock.runFor(3700);
    const notice=page.locator(".stack-wave-notice");await expect(notice).toHaveText("Bỏ lỡ dòng · −1 tim");await expect(notice).toHaveAttribute("data-review-kind","missed");await expect(page.locator(".stack-review")).toHaveCount(0);await expect(page.getByRole("button",{name:"Sang dòng tiếp theo",exact:true})).toHaveCount(0);
    const box=(await notice.boundingBox())!,after=(await page.locator(".stack-actions").boundingBox())!;expect(box.height).toBeLessThanOrEqual(32);expect(box.width).toBeLessThan(width-24);expect(Math.abs(after.y-before!.y)).toBeLessThanOrEqual(1);await expect(page.locator(".stack-tower .stack-tube")).toBeInViewport();expect(await page.locator(".stack-world").evaluate(n=>n.scrollHeight-n.clientHeight)).toBeLessThanOrEqual(2);
    await page.screenshot({path:`.qa/stack-notice-${width}.png`});await page.getByRole("button",{name:"PEEK",exact:true}).click();await page.clock.runFor(4000);await expect(notice).toBeVisible();await page.getByRole("button",{name:"Đóng gợi ý",exact:true}).click();await page.clock.runFor(1550);await expect(notice).toHaveCount(0);await expect(page.locator(".stack-world")).toHaveAttribute("data-stack-phase","playing");
  }
});


test("Stack reuses Search speech styling with a content-sized bubble",async({page})=>{
  await page.setViewportSize({width:1440,height:900});await enter(page,true);
  const measure=()=>page.locator(".stack-dialogue .lesson-narration").evaluate(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,padding:getComputedStyle(n).padding,radius:getComputedStyle(n).borderRadius,background:getComputedStyle(n).backgroundColor,minimum:getComputedStyle(n).minHeight}));
  const long=await measure();await page.getByRole("button",{name:"Bước tiếp",exact:true}).click();const short=await measure();expect(short.width).toBeLessThan(long.width-100);expect(["auto","0px"]).toContain(short.minimum);
  const pig=await page.locator(".stack-dialogue .pig").evaluate(n=>n.getBoundingClientRect().width);
  await page.getByRole("button",{name:"Về bản đồ",exact:true}).click();await page.getByRole("button",{name:"Lộ trình Search",exact:true}).click();await page.getByRole("button",{name:"Linear Search",exact:true}).click();await page.getByRole("button",{name:"Xem demo",exact:true}).click();
  const search=await page.locator(".linear-dialogue .lesson-narration").evaluate(n=>({padding:getComputedStyle(n).padding,radius:getComputedStyle(n).borderRadius,background:getComputedStyle(n).backgroundColor}));expect({padding:short.padding,radius:short.radius,background:short.background}).toEqual(search);expect(pig).toBe(await page.locator(".linear-dialogue .pig").evaluate(n=>n.getBoundingClientRect().width));
});


async function traceStackAudio(page:Page){
  await page.evaluate(async()=>{
    const url=(window as any).stackAudioUrl??"/src/audio/gameAudio.ts";
    const {gameAudio}=await import(url),play=gameAudio.play.bind(gameAudio);(window as any).stackSounds=[];
    gameAudio.play=(cue:any)=>{const played=play(cue);if(played)(window as any).stackSounds.push(cue);return played;};
  });
}
const playedStackSounds=(page:Page)=>page.evaluate(()=>(window as any).stackSounds.filter((cue:string)=>cue.startsWith("stack-"))as string[]);

test("Stack cues render distinct non-silent audio and Demo plays operations, respects mute and pause",async({page})=>{
  await enter(page,true);await traceStackAudio(page);
  const audio=await page.evaluate(async()=>{
    const url=(window as any).stackAudioUrl??"/src/audio/gameAudio.ts";const{renderCue}=await import(url);
    const values=[];
    for(const cue of ["stack-push","stack-pop","stack-peek","stack-error","stack-clear"]){const context=new OfflineAudioContext(2,22050,44100);renderCue(context,context.destination,cue,0);const result=await context.startRendering(),data=result.getChannelData(0);let energy=0;for(const n of data)energy+=n*n;values.push(energy/data.length);}
    return values;
  });
  expect(audio.every(energy=>energy>0.00001)).toBe(true);expect(new Set(audio.map(n=>n.toFixed(7))).size).toBe(5);
  const next=()=>page.getByRole("button",{name:"Bước tiếp",exact:true}).click();await next();await next();await next();await next();await expect.poll(()=>playedStackSounds(page)).toEqual(["stack-push","stack-push","stack-peek","stack-pop"]);
  await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await page.getByRole("button",{name:/^Hiệu ứng âm thanh/}).click();await page.getByRole("button",{name:"Đóng",exact:true}).click();const before=await playedStackSounds(page);await next();expect(await playedStackSounds(page)).toEqual(before);
  await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await page.getByRole("button",{name:/^Hiệu ứng âm thanh/}).click();await page.getByRole("button",{name:"Đóng",exact:true}).click();await page.getByRole("button",{name:"Tiếp tục",exact:true}).click();await page.clock.runFor(2500);await expect.poll(()=>playedStackSounds(page)).toContain("stack-error");await page.getByRole("button",{name:"Tạm dừng",exact:true}).click();const paused=await playedStackSounds(page);await page.clock.runFor(10000);expect(await playedStackSounds(page)).toEqual(paused);
});

test("challenge PUSH, POP, PEEK and errors play their own cues",async({page})=>{
  await enter(page);await traceStackAudio(page);await correct(page);await correct(page);await page.getByRole("button",{name:"PEEK",exact:true}).click();await page.getByRole("button",{name:"Đóng gợi ý",exact:true}).click();await zone(page);await page.getByRole("button",{name:"POP",exact:true}).click();await expect.poll(()=>playedStackSounds(page)).toEqual(["stack-push","stack-pop","stack-peek","stack-error"]);
});

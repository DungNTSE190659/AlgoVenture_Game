import { expect, test } from "@playwright/test";
import { enterForest, forestInput } from "./quick-forest-helpers";
import { createQuickTrailLesson } from "../src/engine/quickTrail";

test("demo explains pivot choice, strict three-way groups and recursive branches",async({page})=>{
  await enterForest(page,"Demo");await forestInput(page,[3,1,3,5]);const frames=createQuickTrailLesson([3,1,3,5]);
  const narrations:string[]=[];for(let i=0;i<frames.length;i++){
    narrations.push((await page.locator(".qf-dialogue p").textContent())!);
    if(i===2){await expect(page.locator(".qf-pivot [data-friend]")).toHaveAttribute("data-value","3");await expect(page.locator(".qf-small [data-friend],.qf-equal [data-friend],.qf-large [data-friend]")).toHaveCount(0);}
    if(i<frames.length-1)await page.getByRole("button",{name:"Bước tiếp",exact:true}).click();
  }
  expect(narrations.some(n=>n.includes("bằng 3"))).toBe(true);expect(narrations.some(n=>n.includes("không cần chia tiếp"))).toBe(true);expect(await page.locator("[data-result-id]").evaluateAll(nodes=>nodes.map(n=>Number(n.getAttribute("data-value"))))).toEqual([1,3,3,5]);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!).quick)).toBeUndefined();
});
test("settings freezes playback, validates custom arrays and preserves speed across restart",async({page})=>{
  await enterForest(page,"Demo");await page.getByRole("button",{name:/^Tốc độ demo:/}).click();await page.getByRole("button",{name:"Phát demo",exact:true}).click();await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();const cursor=await page.locator(".quick-forest-world").getAttribute("data-frame");await page.waitForTimeout(800);await expect(page.locator(".quick-forest-world")).toHaveAttribute("data-frame",cursor!);
  await page.getByLabel("Các phần tử của mảng").fill("1,2.5");await page.getByRole("button",{name:"Dùng mảng này",exact:true}).click();await expect(page.getByRole("alert")).toBeVisible();await page.getByLabel("Các phần tử của mảng").fill("-99,0,0,99");await page.getByRole("button",{name:"Dùng mảng này",exact:true}).click();await expect(page.locator(".quick-forest-world")).toHaveAttribute("data-frame","0");await expect(page.getByRole("button",{name:/^Tốc độ demo:/})).toHaveText("1.5x");await expect(page.locator(".qf-overview > span")).toHaveCount(4);
});
test("pausing freezes an actual friend walking between locations, and settings does not replay it",async({page})=>{
  await enterForest(page,"Demo");await page.getByRole("button",{name:"Bước tiếp",exact:true}).click();await page.getByRole("button",{name:"Bước tiếp",exact:true}).click();
  await page.getByRole("button",{name:"Tiếp tục",exact:true}).click();await page.getByRole("button",{name:"Tạm dừng",exact:true}).click();
  const pivot=page.locator(".qf-pivot .qf-friend"), time=()=>pivot.evaluate(n=>n.getAnimations().map(a=>({time:Number(a.currentTime),state:a.playState})));
  await expect.poll(async()=>(await time()).some(a=>a.state==="paused")).toBe(true);const before=await time();await page.waitForTimeout(150);expect(await time()).toEqual(before);await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await page.getByRole("button",{name:"Đóng",exact:true}).click();expect(await time()).toEqual(before);
});
test("demo content stays within every viewport width and narration follows the board",async({page})=>{
  await enterForest(page,"Demo");const input=[-3,5,2,-3,7,0,2,4],frames=createQuickTrailLesson(input);await forestInput(page,input);await page.emulateMedia({reducedMotion:"reduce"});
  const checkpoints=new Set([0,2,4,frames.findIndex(frame=>frame.kind==="split"),frames.length-1]);
  for(let i=0;i<frames.length;i++){
    if(checkpoints.has(i))for(const[width,height]of[[1440,900],[1280,580],[390,844],[320,568],[844,390]]){
      await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
      const controls=(await page.locator(".qf-demo-controls").boundingBox())!,content=(await page.locator(".qf-content").boundingBox())!,header=(await page.locator(".lesson-header").boundingBox())!;
      expect(content.y).toBeGreaterThanOrEqual(header.y+header.height-1);
      if(height>500)expect(content.y+content.height).toBeLessThanOrEqual(controls.y+1);
      if(width>=1000){expect(await page.locator(".quick-forest-world").evaluate(n=>n.scrollHeight-n.clientHeight)).toBeLessThanOrEqual(1);await expect(page.locator(".qf-demo-controls")).toBeInViewport({ratio:1});}
      await page.screenshot({path:`.qa/quick-forest-demo-${width}.png`,fullPage:true});
    }
    if(i<frames.length-1)await page.getByRole("button",{name:"Bước tiếp",exact:true}).click();
  }
});

import { expect, test, type Page } from "@playwright/test";
import { enterForest, forestInput, sendFriend, solveForest } from "./quick-forest-helpers";
async function dragFriend(page: Page,id:number,destination:string) {
  const source=page.locator(`[data-friend="${id}"]`), target=page.locator(`[data-forest-drop="${destination}"]`);
  await source.scrollIntoViewIfNeeded(); const a=(await source.boundingBox())!,b=(await target.boundingBox())!;
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+Math.min(b.height/2,40),{steps:12});await page.mouse.up();
}
test("players may choose any pivot, make and repair mistakes, undo, and choose either child first",async({page})=>{
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));await enterForest(page);await forestInput(page,[8,3,6,2,5]);
  await expect(page.getByRole("button",{name:"Kiểm tra nhóm",exact:true})).toBeDisabled();
  await dragFriend(page,4,"pivot");
  await dragFriend(page,0,"small");await sendFriend(page,1,"small");await sendFriend(page,2,"large");await sendFriend(page,3,"small");
  await expect(page.locator(".is-wrong")).toHaveCount(0);
  await page.getByRole("button",{name:"Hoàn tác lượt đi",exact:true}).click();await expect(page.locator('.qf-pool [data-friend="3"]')).toBeVisible();await sendFriend(page,3,"small");
  await page.getByRole("button",{name:"Kiểm tra nhóm",exact:true}).click();await expect(page.locator(".qf-friend.is-wrong")).toHaveCount(1);await expect(page.getByRole("status")).toContainText("−25");
  await sendFriend(page,0,"large");await page.getByRole("button",{name:"Kiểm tra nhóm",exact:true}).click();
  await expect(page.locator(".qf-map button:enabled")).toHaveCount(2);await expect(page.locator(".qf-junction")).toHaveCount(0);await page.waitForTimeout(1200);await expect(page.locator(".qf-junction")).toHaveCount(0);
  await page.locator('[data-node="rootR"]').click();await expect(page.locator(".quick-forest-world")).toHaveAttribute("data-active","rootR");
  await solveForest(page);await expect(page.locator(".qf-victory")).toBeVisible();expect(await page.locator("[data-result-id]").evaluateAll(nodes=>nodes.map(n=>Number(n.getAttribute("data-value"))))).toEqual([2,3,5,6,8]);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("algoventure.world-progress.v3")!).quick)).toBe(true);expect(errors).toEqual([]);
});
test("three groups handle negative values, duplicate pivots and all-equal input",async({page})=>{
  await enterForest(page);await forestInput(page,[-3,5,2,-3,7,0,2,4]);await solveForest(page);expect(await page.locator("[data-result-id]").evaluateAll(nodes=>nodes.map(n=>Number(n.getAttribute("data-value"))))).toEqual([-3,-3,0,2,2,4,5,7]);
  await page.getByRole("button",{name:"Chơi lại",exact:true}).click();await forestInput(page,[3,3,3]);await sendFriend(page,0,"pivot");await sendFriend(page,1,"small");await sendFriend(page,2,"equal");await page.getByRole("button",{name:"Kiểm tra nhóm",exact:true}).click();await expect(page.locator('.qf-small .is-wrong')).toHaveCount(1);await sendFriend(page,1,"equal");await page.getByRole("button",{name:"Kiểm tra nhóm",exact:true}).click();await expect(page.locator(".qf-victory")).toBeVisible();await expect(page.locator(".qf-stats")).toContainText("1 lần chia nhóm");
});
test("changing pivot resets grouping and keyboard can finish without duplicate moves",async({page})=>{
  await enterForest(page);await forestInput(page,[9,-2]);
  async function key(id:number,name:string){await page.locator(`[data-friend="${id}"]`).focus();await page.keyboard.press("Enter");await page.getByRole("button",{name,exact:true}).press("Enter");}
  await key(1,"Chọn làm mốc");await key(0,"Chọn làm mốc");await expect(page.locator('.qf-pivot [data-friend="0"]')).toBeVisible();await key(1,"Đưa vào nhóm nhỏ hơn");await page.getByRole("button",{name:"Kiểm tra nhóm",exact:true}).press("Enter");await expect(page.locator(".qf-victory")).toBeVisible();
});
test("touch drag can repair a wrong group on a phone",async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();await enterForest(page);await forestInput(page,[9,-2]);const cdp=await context.newCDPSession(page);
  async function touch(id:number,destination:string){await page.locator(`[data-friend="${id}"]`).elementHandle().then(handle=>handle!.waitForElementState("stable"));const a=(await page.locator(`[data-friend="${id}"]`).boundingBox())!,b=(await page.locator(`[data-forest-drop="${destination}"]`).boundingBox())!,x=a.x+a.width/2,y=a.y+a.height/2;await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});for(let i=1;i<=10;i++)await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:x+(b.x+b.width/2-x)*i/10,y:y+(b.y+b.height/2-y)*i/10}]});await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await expect(page.locator(`[data-forest-drop="${destination}"] [data-friend="${id}"]`)).toBeVisible();}
  await touch(0,"pivot");await touch(1,"large");await page.getByRole("button",{name:"Kiểm tra nhóm",exact:true}).tap();await expect(page.locator(".qf-friend.is-wrong")).toHaveCount(1);await touch(1,"small");await page.getByRole("button",{name:"Kiểm tra nhóm",exact:true}).tap();await expect(page.locator(".qf-victory")).toBeVisible();await context.close();
});
test("missed and cancelled drags keep the group unchanged; settings and hints stop interactions",async({page})=>{
  await enterForest(page);await forestInput(page,[8,2,5]);await sendFriend(page,0,"pivot");const before=await page.locator(".qf-overview").textContent();const a=(await page.locator('[data-friend="1"]').boundingBox())!;
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(2,130,{steps:10});await page.locator(".qf-junction").dispatchEvent("pointercancel");await page.mouse.up();await expect(page.locator(".qf-ghost")).toHaveCount(0);await expect(page.locator('.qf-pool [data-friend="1"]')).toBeVisible();expect(await page.locator(".qf-overview").textContent()).toBe(before);
  await page.getByRole("button",{name:"Buta gợi ý",exact:true}).click();await expect(page.locator(".qf-friend:enabled")).toHaveCount(0);await page.getByRole("button",{name:"Đóng gợi ý",exact:true}).click();await page.getByRole("button",{name:"Tùy chọn",exact:true}).click();await expect(page.locator(".qf-friend:enabled")).toHaveCount(0);await page.getByLabel("Các phần tử của mảng").fill("2,1.5");await page.getByRole("button",{name:"Dùng mảng này",exact:true}).click();await expect(page.getByRole("alert")).toBeVisible();
});
test("all targets and eight friends fit phone and laptop widths, including a heavily unbalanced group",async({page})=>{
  await enterForest(page);await forestInput(page,[1,2,3,4,5,6,7,8]);await page.emulateMedia({reducedMotion:"reduce"});
  for(const[width,height]of[[1440,900],[1280,580],[390,844],[320,568],[844,390]]){await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);const boxes=await page.locator("[data-forest-drop]:visible").evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return{left:b.left,right:b.right,width:b.width};}));expect(boxes).toHaveLength((width<=700&&height>width)||(height<=520&&width>height) ? 2 : 5);expect(boxes.every(b=>b.left>=0&&b.right<=width&&b.width>40)).toBe(true);await page.screenshot({path:`.qa/quick-forest-${width}.png`,fullPage:true});}
  await page.setViewportSize({width:390,height:844});await sendFriend(page,7,"pivot");for(const id of[0,1,2,3,4,5,6])await sendFriend(page,id,"small");await expect(page.getByRole("button",{name:"Kiểm tra nhóm",exact:true})).toBeEnabled();await page.screenshot({path:".qa/quick-forest-large-group.png",fullPage:true});await page.getByRole("button",{name:"Kiểm tra nhóm",exact:true}).click();await expect(page.locator(".qf-map button:enabled")).toHaveCount(1);
});


test("preview shows all three groups, the pivot and the next waiting friend",async({page})=>{
  await page.setViewportSize({width:390,height:844});await enterForest(page);await forestInput(page,[8,3,5,2,5]);await sendFriend(page,4,"pivot");await sendFriend(page,0,"large");await sendFriend(page,1,"small");await sendFriend(page,2,"equal");
  await page.emulateMedia({reducedMotion:"reduce"});await page.waitForTimeout(550);
  await expect(page.locator(".qf-small .qf-friend")).toHaveCount(1);await expect(page.locator(".qf-equal .qf-friend")).toHaveCount(1);await expect(page.locator(".qf-large .qf-friend")).toHaveCount(1);await expect(page.locator(".qf-pool .qf-friend")).toHaveAttribute("data-value","2");
  await page.screenshot({path:".qa/quick-forest-preview.png",fullPage:true});
});

test("portrait starts with large pivot choices and reveals destinations after choosing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterForest(page);
  await expect(page.locator(".qf-group:visible")).toHaveCount(0);
  await expect(page.locator(".qf-pool .qf-friend")).toHaveCount(5);
  const choose = page.getByRole("button", { name: "Chọn làm mốc", exact: true });
  await expect(choose).toBeDisabled();
  await expect(page.getByRole("button", { name: "Kiểm tra nhóm", exact: true })).toBeHidden();
  for (const card of await page.locator(".qf-pool .qf-friend").all()) expect((await card.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  await page.locator('.qf-pool [data-friend="1"]').click();
  await expect(choose).toBeEnabled();
  await expect(choose).toContainText("Chọn số 3 làm mốc");
  await page.screenshot({ path: ".qa/quick-pivot-selection-mobile.png" });
  await choose.click();
  await expect(page.locator(".qf-group:visible")).toHaveCount(3);
  await expect(page.locator(".qf-pivot .qf-friend")).toHaveAttribute("data-value", "3");
  await expect(page.getByRole("button", { name: "Kiểm tra nhóm", exact: true })).toBeVisible();
});

import {test,expect,type Page} from '@playwright/test';
import {enterTrack} from './track-navigation';
async function enter(page:Page,values='4,3,2,1'){
 await enterTrack(page,'Merge Sort','Play');await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Tùy chọn',exact:true}).click();await page.getByLabel('Mảng của bạn',{exact:true}).fill(values);await page.getByRole('button',{name:'Dùng mảng này',exact:true}).click();
}
async function select(page:Page,id:string){await page.getByRole('button',{name:`Chọn nhóm ${id}`,exact:true}).click();}
async function split(page:Page,id:string,cut:number){await select(page,id);await page.getByRole('button',{name:`Chia sau vị trí ${cut}`,exact:true}).click();}
async function solve(page:Page){
 for(let i=0;i<100;i++){
  expect(await page.locator('.merge-challenge').evaluate(n=>({x:n.scrollWidth-n.clientWidth,y:n.scrollHeight-n.clientHeight})),JSON.stringify(await page.locator('.merge-challenge').evaluate(n=>[...n.querySelectorAll('*')].map(e=>({c:e.className,b:e.getBoundingClientRect().bottom})).filter(x=>x.b>innerHeight)))).toEqual({x:0,y:0});
  if(await page.locator('.merge-challenge').getAttribute('data-phase')==='done')return;
  if(await page.locator('.mc-inputs').count()){
   const options=await page.locator('.mc-inputs [data-card]').evaluateAll(ns=>ns.map(n=>({id:n.getAttribute('data-card')!,v:Number(n.getAttribute('data-value'))})));options.sort((a,b)=>a.v-b.v);
   await page.locator(`.mc-inputs [data-card="${options[0].id}"]`).click();await page.locator('.mc-slot[data-filled="false"]').first().click();continue;
  }
  const gs=await page.locator('[data-group]').evaluateAll(ns=>ns.map(n=>({id:n.getAttribute('data-group')!,sorted:n.getAttribute('data-sorted')==='true',count:n.querySelectorAll('[data-card]').length})));
  const ready=gs.find(g=>g.sorted&&g.id.endsWith('L')&&gs.some(r=>r.sorted&&r.id===g.id.slice(0,-1)+'R'));
  if(ready){await select(page,ready.id);await select(page,ready.id.slice(0,-1)+'R');await page.getByRole('button',{name:'Ghép nhóm',exact:true}).click();}
  else{const g=gs.filter(g=>!g.sorted).at(-1)!;await split(page,g.id,Math.floor(g.count/2));}
 }
 throw new Error('Challenge did not finish');
}
test('wrong split, early merge and wrong slot lose points, then player can finish',async({page})=>{
 await enter(page);await split(page,'root',1);await expect(page.getByRole('status')).toContainText('−25');await expect(page.locator('[data-group]')).toHaveCount(1);
 await page.getByRole('button',{name:'Chia sau vị trí 2',exact:true}).click();await select(page,'rootL');await select(page,'rootR');await page.getByRole('button',{name:'Ghép nhóm',exact:true}).click();await expect(page.getByRole('status')).toContainText('chưa ghép xong');
 // Clicking a selected group deselects it; choose only the right branch.
 await select(page,'rootL');await page.getByRole('button',{name:'Chia sau vị trí 1',exact:true}).click();
 await select(page,'rootRL');await select(page,'rootRR');await page.getByRole('button',{name:'Ghép nhóm',exact:true}).click();
 await page.locator('.mc-inputs [data-card="2"]').click();await page.getByRole('button',{name:'Đặt vào ô 1',exact:true}).click();await expect(page.getByRole('status')).toContainText('số nhỏ hơn');
 await page.locator('.mc-inputs [data-card="3"]').click();await page.getByRole('button',{name:'Đặt vào ô 2',exact:true}).click();await expect(page.getByRole('status')).toContainText('không bỏ qua');
 await solve(page);await expect(page.locator('.merge-victory')).toBeVisible();
});
for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390]])test(`free challenge fits and completes at ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});await enter(page,'6,-2,4,4,0,3,-2,5');
 await select(page,'root');await page.screenshot({path:`.qa/merge-challenge-${width}.png`});
 expect(await page.locator('.merge-challenge').evaluate(n=>({x:n.scrollWidth-n.clientWidth,y:n.scrollHeight-n.clientHeight})),JSON.stringify(await page.locator('.merge-challenge').evaluate(n=>[...n.querySelectorAll('*')].map(e=>({c:e.className,b:e.getBoundingClientRect().bottom})).filter(x=>x.b>innerHeight)))).toEqual({x:0,y:0});
 await select(page,'root');await solve(page);await expect(page.locator('.merge-victory')).toBeVisible();await expect(page.locator('.merge-victory')).toContainText('0 lần thử sai');
});
test('keyboard and dragging allow valid and invalid moves; missed drops preserve state',async({page})=>{
 await enter(page,'2,1');await split(page,'root',1);await select(page,'rootL');await select(page,'rootR');await page.getByRole('button',{name:'Ghép nhóm',exact:true}).press('Enter');
 const card=page.locator('.mc-inputs [data-card="0"]'),slot=page.locator('[data-mc-slot="0"]');
 const from=(await card.boundingBox())!,to=(await slot.boundingBox())!;
 await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(5,5,{steps:8});await page.mouse.up();await expect(page.locator('.merge-challenge')).toHaveAttribute('data-mistakes','0');
 await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:8});await page.mouse.up();await expect(page.getByRole('status')).toContainText('số nhỏ hơn');
 await page.locator('.mc-inputs [data-card="1"]').press('Enter');await slot.press('Enter');
 await expect(slot.locator('[data-result-card="1"] img')).toHaveAttribute('src',/bubble-ui\/tile.svg$/);
 await expect(slot.locator('strong')).toHaveText('1');await expect(slot.locator('small')).toHaveText('B');
 await expect(page.locator('.mc-inputs [data-card="1"]')).toHaveCount(0);
 await solve(page);await expect(page.locator('.merge-victory')).toBeVisible();
});
test('touch can choose a boundary and finish a merge',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();await enter(page,'5,5');
 await page.getByRole('button',{name:'Chọn nhóm root',exact:true}).tap();await page.getByRole('button',{name:'Chia sau vị trí 1',exact:true}).tap();
 for(const id of ['rootL','rootR'])await page.getByRole('button',{name:`Chọn nhóm ${id}`,exact:true}).tap();await page.getByRole('button',{name:'Ghép nhóm',exact:true}).tap();
 await page.locator('.mc-inputs [data-card="1"]').tap();await page.locator('[data-mc-slot="0"]').tap();await expect(page.getByRole('status')).toContainText('bên trái');
 for(const id of [0,1]){await page.locator(`.mc-inputs [data-card="${id}"]`).tap();await page.locator(`[data-mc-slot="${id}"]`).tap();}await expect(page.locator('.merge-victory')).toBeVisible();await context.close();
});

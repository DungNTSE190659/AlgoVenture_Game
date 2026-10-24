import {test,expect,type Page} from '@playwright/test';
import {enterTrack} from './track-navigation';
import {createSelectionLesson} from '../src/engine/selectionSort';
async function enter(page:Page,mode='Play',values='4,-1,4,0,-1'){
 await enterTrack(page,'Selection Sort',mode);await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Tùy chọn',exact:true}).click();await page.getByLabel('Mảng của bạn',{exact:true}).fill(values);await page.getByRole('button',{name:'Dùng mảng này',exact:true}).click();
}
async function ready(page:Page){await expect(page.locator('.selection-world')).toHaveAttribute('data-busy','false');}
async function solve(page:Page){for(let n=0;n<10;n++){await ready(page);if(await page.locator('.selection-victory').count())return;await fits(page);const xs=await page.locator('.selection-tile:not(.tile-fixed)').evaluateAll(ns=>ns.map(e=>({id:e.getAttribute('data-selection-id'),v:Number(e.getAttribute('data-value'))})));xs.sort((a,b)=>a.v-b.v);await page.locator(`[data-selection-id="${xs[0].id}"]`).click();await fits(page);await page.locator('[data-selection-target]').click();}throw new Error('Selection did not finish');}
async function fits(page:Page){expect(await page.locator('.selection-world').evaluate(n=>({x:n.scrollWidth-n.clientWidth,y:n.scrollHeight-n.clientHeight}))).toEqual({x:0,y:0});const outside=await page.locator('.ss-board,.selection-tile,.ss-sidebar,.selection-action').evaluateAll(ns=>ns.filter(n=>{const b=n.getBoundingClientRect();return b.left<0||b.top<0||b.right>innerWidth+1||b.bottom>innerHeight+1;}).map(n=>n.className));expect(outside).toEqual([]);}
test('free choices are scored only when committed; errors preserve items and allow recovery',async({page})=>{
 await enter(page);await page.locator('[data-selection-id="0"]').click();await expect(page.locator('.selection-score')).toHaveText('0');await page.locator('[data-selection-target]').click();await expect(page.getByRole('status')).toContainText('chưa phải nhỏ nhất');
 expect(await page.locator('.selection-tile').evaluateAll(ns=>ns.map(n=>Number(n.getAttribute('data-value'))))).toEqual([4,-1,4,0,-1]);
 await page.locator('[data-selection-id="4"]').click();await page.locator('[data-selection-index="2"]').click();await expect(page.getByRole('status')).toContainText('ô có cờ');await page.locator('[data-selection-target]').click();await ready(page);await expect(page.locator('.selection-score')).toHaveText('250');
 await page.locator('.tile-fixed').click();await page.locator('[data-selection-target]').click();await expect(page.getByRole('status')).toContainText('đã được cố định');await expect(page.locator('.selection-score')).toHaveText('225');
 await solve(page);await expect(page.locator('.selection-victory')).toBeVisible();expect(await page.locator('.selection-tile').evaluateAll(ns=>ns.map(n=>Number(n.getAttribute('data-value'))))).toEqual([-1,-1,0,4,4]);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('algoventure.world-progress.v3')!).selection)).toBe(true);
});
test('keep, cancel and keyboard selection do not duplicate points',async({page})=>{
 await enter(page,'Play','1,2');const card=page.locator('[data-selection-id="0"]');await card.press('Enter');await page.getByRole('button',{name:'Bỏ chọn',exact:true}).click();await expect(page.locator('.selection-score')).toHaveText('0');await card.press('Enter');await page.getByRole('button',{name:'Giữ nguyên vị trí',exact:true}).press('Enter');await expect(page.locator('.selection-victory')).toContainText('250 điểm');await expect(page.locator('.selection-victory')).toContainText('0 lần đổi chỗ');
});
test('dragging validates wrong destinations and cancellation preserves state',async({page})=>{
 await enter(page,'Play','5,1,3');async function drag(id:number,index:number|null){const a=(await page.locator(`[data-selection-id="${id}"]`).boundingBox())!,b=index===null?{x:0,y:0,width:2,height:2}:(await page.locator(`[data-selection-index="${index}"]`).boundingBox())!;await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:10});await page.mouse.up();}
 await drag(1,null);await expect(page.locator('.selection-score')).toHaveText('0');await expect(page.locator('.selection-world')).toHaveAttribute('data-phase','choose');await drag(1,2);await expect(page.getByRole('status')).toContainText('ô có cờ');await drag(1,0);await ready(page);await expect(page.locator('[data-selection-index="0"]')).toHaveAttribute('data-value','1');await solve(page);await expect(page.locator('.selection-victory')).toBeVisible();
});
test('touch can select and swap; settings validate input',async({browser})=>{
 const context=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});const page=await context.newPage();await enter(page,'Play','2,1');await page.locator('[data-selection-id="1"]').tap();await page.locator('[data-selection-target]').tap();await expect(page.locator('.selection-victory')).toBeVisible();await page.getByRole('button',{name:'Chơi lại',exact:true}).tap();await page.getByRole('button',{name:'Tùy chọn',exact:true}).tap();await page.getByLabel('Mảng của bạn',{exact:true}).fill('1,2.5');await page.getByRole('button',{name:'Dùng mảng này',exact:true}).tap();await expect(page.getByRole('alert')).toContainText('số nguyên');await context.close();
});
for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390]])test(`Selection demo and gameplay fit at ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});const input=[-99,8,4,4,0,3,-2,99];await enter(page,'Demo',input.join(','));
 await expect(page.locator('.selection-action,.selection-stats')).toHaveCount(0);
 const frames=createSelectionLesson(input);for(let i=0;i<frames.length;i++){await fits(page);if(i===frames.length-1)break;await page.getByRole('button',{name:'Bước tiếp',exact:true}).click();}
 await expect(page.getByRole('button',{name:'Tự mình thử',exact:true})).toBeVisible();await page.screenshot({path:`.qa/selection-studio-demo-${width}.png`});await page.getByRole('button',{name:'Tự mình thử',exact:true}).click();await fits(page);await solve(page);await fits(page);await page.screenshot({path:`.qa/selection-studio-play-${width}.png`});
});
test('demo narration follows scanning and playback supports back, pause and speed',async({page})=>{
 await enter(page,'Demo','2,2,1');await page.getByRole('button',{name:'Bước tiếp',exact:true}).click();await expect(page.locator('.tile-scan')).toHaveAttribute('data-selection-index','1');await page.getByRole('button',{name:'Bước tiếp',exact:true}).click();await expect(page.locator('.selection-dialogue')).toContainText('Hai số bằng nhau');await page.getByRole('button',{name:'Bước trước',exact:true}).click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.getByRole('button',{name:'Tạm dừng',exact:true}).click();const before=await page.locator('.selection-demo-progress>span').textContent();await page.waitForTimeout(500);await expect(page.locator('.selection-demo-progress>span')).toHaveText(before!);await page.getByRole('button',{name:/Tốc độ demo/}).click();await expect(page.getByRole('button',{name:/Tốc độ demo/})).toHaveText('1.5x');
});

test('swap animation pauses with demo playback and settings',async({page})=>{
 await enter(page,'Demo','2,1');await page.emulateMedia({reducedMotion:'no-preference'});
 for(let i=0;i<4;i++)await page.getByRole('button',{name:'Bước tiếp',exact:true}).click();
 await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.getByRole('button',{name:'Tạm dừng',exact:true}).click();
 const motion=()=>page.locator('.ss-board').evaluate(n=>n.getAnimations({subtree:true}).filter(a=>((a.effect as KeyframeEffect).target as Element)?.matches('.selection-tile')).map(a=>({state:a.playState,time:Number(a.currentTime)})));
 await expect.poll(async()=>(await motion()).some(a=>a.state==='paused')).toBe(true);const before=await motion();await page.waitForTimeout(150);expect(await motion()).toEqual(before);
 await page.getByRole('button',{name:'Tùy chọn',exact:true}).click();await page.getByRole('button',{name:'Đóng',exact:true}).click();expect(await motion()).toEqual(before);
});

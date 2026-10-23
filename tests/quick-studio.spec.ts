import { test, expect, type Page } from "@playwright/test";
import { enterForest, forestInput, sendFriend, solveForest } from "./quick-forest-helpers";

async function fits(page: Page) {
  const metrics = await page.locator('.quick-studio').evaluate(root => {
    const boxes = [...root.querySelectorAll('.qf-header,.qf-main,.qf-sidebar,.qf-gate,.qf-friend,.qf-sign,.qf-playback,.qf-actions,.qf-hint-button')].map(n => n.getBoundingClientRect());
    const board=root.querySelector('.qf-gate')?.getBoundingClientRect(), side=root.querySelector('.qf-sidebar')?.getBoundingClientRect();
    if(board && side && innerWidth < 700 && innerHeight > innerWidth && board.bottom > side.top+1) boxes.push(new DOMRect(0,-10,1,1));
    return { overflow: root.scrollHeight-root.clientHeight, horizontal: root.scrollWidth-root.clientWidth, outside: boxes.filter(b=>b.width && b.height && (b.left < -1 || b.top < -1 || b.right > innerWidth+1 || b.bottom > innerHeight+1)).map(b=>({x:b.x,y:b.y,w:b.width,h:b.height})) };
  });
  expect(metrics, JSON.stringify(metrics)).toEqual({overflow:0,horizontal:0,outside:[]});
}
for (const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]) {
  test(`Quick Sort demo fits every step at ${width}x${height}`, async ({page})=>{
    await page.setViewportSize({width,height}); await enterForest(page,'Demo');
    await forestInput(page,[-99,99,6,5,4,3,2,1]);
    await page.emulateMedia({reducedMotion:'reduce'});
    await expect(page.locator('.qf-task')).toHaveCount(0);
    await expect(page.locator('.qf-pool-label,.qf-waiting')).toHaveCount(0);
    for (let step=0;step<110;step++) {
      await fits(page);
      if (await page.getByRole('button',{name:'Tự mình thử',exact:true}).count()) break;
      await page.getByRole('button',{name:'Bước tiếp',exact:true}).click();
    }
    await expect(page.getByRole('button',{name:'Tự mình thử',exact:true})).toBeVisible();
    await page.screenshot({path:`.qa/quick-demo-${width}.png`});
  });
}
test('Quick Sort mobile corrects a wrong group, undoes, and finishes duplicates',async({page})=>{
  await page.setViewportSize({width:390,height:844}); await enterForest(page);
  await forestInput(page,[5,-99,5,99,2,1,3,4]); await page.emulateMedia({reducedMotion:'reduce'});
  await fits(page); await page.screenshot({path:'.qa/quick-play-start.png'});
  await sendFriend(page,0,'pivot'); await sendFriend(page,1,'large');
  await sendFriend(page,1,'pool');
  await expect(page.locator('.qf-pool [data-friend="1"]')).toBeVisible();
  await sendFriend(page,1,'large');
  await page.getByRole('button',{name:'Hoàn tác lượt đi',exact:true}).click();
  await expect(page.locator('.qf-pool [data-friend="1"]')).toBeVisible();
  await sendFriend(page,1,'large');
  for(const [id,group] of [[2,'equal'],[3,'large'],[4,'small'],[5,'small'],[6,'small'],[7,'small']] as const) await sendFriend(page,id,group);
  await page.getByRole('button',{name:'Kiểm tra nhóm',exact:true}).click();
  await expect(page.locator('[data-friend="1"]')).toHaveClass(/is-wrong/);
  await fits(page); await sendFriend(page,1,'small');
  await page.getByRole('button',{name:'Kiểm tra nhóm',exact:true}).click();
  await solveForest(page); await expect(page.locator('.qf-victory')).toBeVisible();
  await fits(page); await page.screenshot({path:'.qa/quick-victory.png'});
});
test('Quick Sort demo playback pauses and changes speed',async({page})=>{
  await enterForest(page,'Demo'); await page.getByRole('button',{name:'Phát demo',exact:true}).click();
  await expect.poll(()=>page.locator('.quick-studio').getAttribute('data-frame'),{timeout:12000}).not.toBe('0');
  await page.getByRole('button',{name:'Tạm dừng',exact:true}).click();
  const frame=await page.locator('.quick-studio').getAttribute('data-frame');
  await page.waitForTimeout(600); await expect(page.locator('.quick-studio')).toHaveAttribute('data-frame',frame!);
  await page.getByRole('button',{name:/Tốc độ demo/}).click();
  await expect(page.getByRole('button',{name:/Tốc độ demo/})).toHaveText('1.5x');
});
test('small touch screen keeps a one-sided partition reachable',async({browser})=>{
  const context=await browser.newContext({viewport:{width:320,height:568},hasTouch:true,isMobile:true});
  const page=await context.newPage();await enterForest(page);await forestInput(page,[1,2,3,4,5,6,7,8]);await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('[data-friend="0"]').tap();await page.getByRole('button',{name:'Chọn làm mốc',exact:true}).tap();
  for(let id=1;id<8;id++) {await page.locator(`[data-friend="${id}"]`).tap();await page.getByRole('button',{name:'Đưa vào nhóm lớn hơn',exact:true}).tap();await fits(page);}
  await page.screenshot({path:'.qa/quick-small-partition.png'});await page.getByRole('button',{name:'Kiểm tra nhóm',exact:true}).tap();await fits(page);
  await context.close();
});
test('settings fit small portrait and landscape without scrolling',async({page})=>{
  await enterForest(page);
  await page.getByRole('button',{name:'Tùy chọn',exact:true}).click();
  for(const [width,height] of [[320,568],[844,390]]) {
    await page.setViewportSize({width,height});
    expect(await page.locator('.qf-settings').evaluate(n=>n.scrollHeight-n.clientHeight)).toBeLessThanOrEqual(1);
  }
});
test('desktop supports dragging a number to a partition',async({page})=>{
  await enterForest(page);await page.emulateMedia({reducedMotion:'reduce'});await sendFriend(page,2,'pivot');
  const source=(await page.locator('[data-friend="0"]').boundingBox())!;
  const target=(await page.locator('.qf-large').boundingBox())!;
  await page.mouse.move(source.x+source.width/2,source.y+source.height/2);await page.mouse.down();
  await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:12});await page.mouse.up();
  await expect(page.locator('.qf-large [data-friend="0"]')).toBeVisible();
  await page.screenshot({path:'.qa/quick-desktop-play.png'});
});

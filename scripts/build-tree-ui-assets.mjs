import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
const root = new URL('../public/assets/hybrid-casual-ui/tree/', import.meta.url);
await Promise.all(['svg/', 'png/', 'backgrounds/'].map(d => mkdir(new URL(d, root), { recursive: true })));
const assets = [];
async function save(id, w, h, body, border = 0, profile = 'shared') {
  await writeFile(new URL(`svg/${id}.svg`, root), `<svg${id.startsWith('progress-') ? ' preserveAspectRatio="none"' : ''} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none">${body}</svg>`);
  assets.push({ id, svg: `svg/${id}.svg`, png: `png/${id}.png`, nativeSize: [w, h], pngSize: [w*2,h*2], profile, unityImageType: border ? 'Sliced' : 'Simple', preserveAspect: !border, borderPixels: [border*2,border*2,border*2,border*2] });
}
const panel = (w,h,fill,lip='#B6CDBE',ink='#376A54',r=18) => `<rect x="2" y="6" width="${w-4}" height="${h-8}" rx="${r}" fill="#234D3C" opacity=".16"/><rect x="2" y="2" width="${w-4}" height="${h-8}" rx="${r}" fill="${lip}" stroke="${ink}" stroke-width="2.4"/><rect x="3.2" y="3.2" width="${w-6.4}" height="${h-15}" rx="${r-1.2}" fill="${fill}"/><path d="M${r+4} 6H${w-r-4}" stroke="#FFFFFF" stroke-width="2.5" opacity=".55" stroke-linecap="round"/>`;
const states = { normal:['#35C990','#159563'], hover:['#4DDDA3','#159563'], pressed:['#23B77D','#117B55'], disabled:['#D1DDD6','#A5BBAF'] };
for(const [profile,size] of [['desktop',60],['mobile',48],['compact',44]]) {
  for(const [state,face,lip,ink] of [
    ['normal','#35C990','#159563','#245C46'],['visited','#F7B83D','#BE8018','#795014'],
    ['current','#B777ED','#8545BC','#623394'],['selected','#B777ED','#8545BC','#FFF4C5'],
    ['empty','#EFFBF4','#B2DCCA','#5AA88A'],['ready','#D1F8E5','#64CDA0','#208F66'],
    ['over','#FFE49A','#D5A33C','#9D681B'],['source','#FF9658','#CC6B31','#794327'],
    ['target','#D8F6E7','#79CFAC','#237B59']]) {
    await save(`node-${profile}-${state}`,size,size,panel(size,size,face,lip,ink,size*.29)+(['empty','target'].includes(state)?`<rect x="7" y="7" width="${size-14}" height="${size-18}" rx="${size*.19}" stroke="${ink}" stroke-width="1.4" stroke-dasharray="4 4"/>`:''),0,profile);
  }
}
for(const [profile,w,h] of [['desktop',720,560],['mobile',362,400]]) {
  for(const [name,pw,ph,face] of [['board',w,h,'#F0F8E9'],['supply',profile==='desktop'?290:362,profile==='desktop'?126:88,'#FFFCED'],['speech',profile==='desktop'?190:300,profile==='desktop'?180:94,'#FFFCEE'],['modal',profile==='desktop'?430:350,400,'#FFFCED'],['victory',profile==='desktop'?600:350,480,'#FFFCEE']])
    await save(`panel-${name}-${profile}`,pw,ph,panel(pw,ph,face,'#BDDBC9','#507C60',24),28,profile);
  for(const [kind,bw,bh] of [['action',profile==='desktop'?290:328,48],['neutral',profile==='desktop'?160:144,44],['icon',44,48],['hint',profile==='desktop'?290:328,49],['play',profile==='desktop'?186:196,48]]) {
    for(const [state,[green,lip]] of Object.entries(states)) {
      const face = state==='disabled'?green:kind==='neutral'||kind==='icon'?({normal:'#FFFCED',hover:'#FFFFFF',pressed:'#E2F4E9'}[state]):kind==='hint'?({normal:'#FFE18A',hover:'#FFEBA9',pressed:'#F5CA61'}[state]):kind==='play'?({normal:'#B777ED',hover:'#C88AF9',pressed:'#9E5DD9'}[state]):green;
      await save(`button-${kind}-${profile}-${state}`,bw,bh,panel(bw,bh,face,kind==='play'?'#8545BC':kind==='hint'?'#C49B39':lip,kind==='hint'?'#997126':'#296A50',kind==='icon'?14:16),kind==='icon'?18:20,profile);
    }
  }
}
for(const [id,w,h,fill,lip] of [['token-seed',52,52,'#FFD179','#D69E38'],['token-label',140,44,'#E0CEF7','#A37BC8'],['token-branch',116,44,'#BDEDDD','#69B79E'],['token-flag',52,52,'#FFE7AA','#D1AE5C'],['token-pig',58,56,'#FFF0C5','#D8BC77'],['harvest-chip',40,43,'#FFE09A','#D1A853'],['basket',60,52,'#FFF0C5','#D6B574'],['remove-tray',280,84,'#FFE6D9','#D39D7D'],['label',140,32,'#FFF9DF','#D3C287'],['score',100,38,'#FFF0B4','#D3AA49'],['badge-complete',24,24,'#35C990','#159563'],['demo-hand',30,30,'#FFFCED','#B3CDBE']]) {
  await save(id,w,h,panel(w,h,fill,lip,'#4F7358',Math.min(14,h*.28)),Math.min(16,Math.floor(h/2)-1));
  if(id.startsWith('token-') || ['basket','remove-tray'].includes(id)) for(const [state,face,edge] of [['selected','#E1CBFA','#A65FE0'],['ready','#DCF9E9','#35C990'],['over','#FFE49A','#DAA631']]) await save(`${id}-${state}`,w,h,panel(w,h,face,edge,edge,Math.min(14,h*.28)),Math.min(16,Math.floor(h/2)-1));
}
for(const [id,fill] of [['normal','#D6A168'],['visited','#F7B83D'],['empty','#CBE6D7']]) await save(`branch-${id}`,24,12,`<rect width="24" height="12" fill="${fill}"/><path d="M0 4H10M15 9H24" stroke="#FFF2CF" stroke-width="1.2" opacity=".5"/>`);
// Seamless spiral winding: fixed-size repeat, moved along each branch in the game.
for (const [state,base,shadow,light] of [['normal','#D9A566','#B97B3D','#FFE4AA'],['active','#B777ED','#8545BC','#F3E3FF'],['visited','#B777ED','#8545BC','#F3E3FF']]) {
 await save(`rope-helix-${state}`,18,10,`<path d="M0 0H18V10H0Z" fill="${base}"/><path d="M-9 0Q-3 5 0 10M0 0Q6 5 9 10M9 0Q15 5 18 10M18 0Q24 5 27 10" stroke="${shadow}" stroke-width="2.5"/><path d="M-6 0Q0 5 3 10M3 0Q9 5 12 10M12 0Q18 5 21 10" stroke="${light}" stroke-width="2"/><path d="M0 1H18M0 9H18" stroke="${shadow}" stroke-opacity=".3"/>`);
}
await save('progress-track',200,8,'<rect width="200" height="8" rx="4" fill="#CAE7D9"/>');
await save('progress-fill',200,8,'<rect width="200" height="8" rx="4" fill="#35C990"/>');
await save('scrim',8,8,'<path d="M0 0H8V8H0Z" fill="#163C2B" fill-opacity=".6"/>');
await writeFile(new URL('svg/scrim.svg',root),(await readFile(new URL('svg/scrim.svg',root),'utf8')).replace('<svg ','<svg preserveAspectRatio="none" '));
await save('speech-tail',20,24,'<path d="M19 2 2 10Q0 12 2 14L19 22" fill="#FFFCEE" stroke="#507C60" stroke-width="2.2" stroke-linejoin="round"/>');
await save('star-earned',64,64,'<path d="m32 5 8 17 19 3-14 14 3 20-16-9-17 9 4-20L5 25l19-3Z" fill="#FFD047" stroke="#916521" stroke-width="3" stroke-linejoin="round"/><path d="m32 11 6 14-12 8-11-6 13-2Z" fill="#FFF2A4"/>');
await save('star-unearned',64,64,'<path d="m32 5 8 17 19 3-14 14 3 20-16-9-17 9 4-20L5 25l19-3Z" fill="#D5E1D8" stroke="#9CB6A5" stroke-width="3" stroke-linejoin="round"/>');
const iconNames=['ArrowLeft','ArrowRight','Check','Flag','GitBranch','Grip','Leaf','Lightbulb','Pause','Play','RotateCcw','SkipBack','SkipForward','Sprout','Undo2','Volume2','VolumeX','X','Vibrate','Settings','Star','Map','ChevronRight','Sparkles'];
for(const name of iconNames) {
  const slug=name.replace(/([a-z])([A-Z0-9])/g,'$1-$2').toLowerCase();
  const color=['Play','Pause','Check'].includes(name)?'#FFFEF2':name==='Lightbulb'?'#8B6220':name==='Star'?'#D4A52B':'#237B59';
  const svg=renderToStaticMarkup(createElement(icons[name],{size:32,strokeWidth:2.6,color,fill:name==='Star'?'#FFD047':'none'}));
  await writeFile(new URL(`svg/icon-${slug}.svg`,root),svg);
  assets.push({id:`icon-${slug}`,svg:`svg/icon-${slug}.svg`,png:`png/icon-${slug}.png`,nativeSize:[32,32],pngSize:[64,64],unityImageType:'Simple',preserveAspect:true,borderPixels:[0,0,0,0]});
}
for(const orientation of ['landscape','portrait']) await copyFile(new URL(`../linked/backgrounds/meadow-${orientation}.png`,root),new URL(`backgrounds/forest-${orientation}.png`,root));
const browser=await chromium.launch({channel:'chrome',args:['--disable-gpu']});const page=await browser.newPage({deviceScaleFactor:2});
for(const a of assets){await page.setViewportSize({width:Math.max(800,a.nativeSize[0]),height:Math.max(600,a.nativeSize[1])});await page.setContent(`<style>body{margin:0}svg{display:block}</style>${await readFile(new URL(a.svg,root),'utf8')}`);await page.locator('svg').screenshot({path:fileURLToPath(new URL(a.png,root)),omitBackground:true});}
await writeFile(new URL('unity-assets.json',root),JSON.stringify({version:1,pixelsPerUnit:100,alphaIsTransparency:true,spriteMeshType:'FullRect',assets,backgrounds:['landscape','portrait'].map(orientation=>({file:`backgrounds/forest-${orientation}.png`,preserveAspect:true}))},null,2));
for(const profile of ['desktop','mobile']) {
 const cards=await Promise.all(assets.filter(a=>!a.profile||a.profile==='shared'||a.profile===profile).map(async a=>`<article><section>${await readFile(new URL(a.svg,root),'utf8')}</section><small>${a.id}</small></article>`));
 await page.setViewportSize({width:1200,height:800});await page.setContent(`<style>body{background:#DFECDD;padding:20px;font:14px sans-serif;color:#37634D}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}article{background:#FFFCEE;padding:12px;border-radius:14px;text-align:center}section{height:100px;display:flex;align-items:center;justify-content:center}svg{max-width:100%;max-height:90px}</style><h1>Tree UI assets · ${profile}</h1><div class="grid">${cards.join('')}</div>`);await page.screenshot({path:fileURLToPath(new URL(`preview-${profile}.png`,root)),fullPage:true});
}
await browser.close();await copyFile(new URL('../node_modules/lucide-react/LICENSE',import.meta.url),new URL('LICENSE-icons.txt',root));console.log(`Exported ${assets.length} Tree SVG/PNG pairs with Unity metadata.`);

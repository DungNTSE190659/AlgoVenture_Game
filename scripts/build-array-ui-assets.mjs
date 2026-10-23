import { mkdir, readFile, writeFile as fsWriteFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import { chromium } from '@playwright/test';

// Draft kit only: this builder never changes live application styles or routes.
const root = new URL('../public/assets/hybrid-casual-ui/array/', import.meta.url);
const palette = { cream:'#FFF9EB', terracotta:'#D49670', terracottaEdge:'#AD7655', river:'#94C9DA', riverEdge:'#6C9EAF', sage:'#A4BB83', sageEdge:'#7F9760', ink:'#594A3C', muted:'#DDE0D3', rim:'#D8CDB8', board:'#F7F6EB' };
await Promise.all(['svg/','png/'].map(dir => mkdir(new URL(dir,root),{recursive:true})));
async function writeFile(...args) {
  for(let attempt=0;;attempt++) {
    try { return await fsWriteFile(...args); }
    catch(error) { if(attempt>=8 || !['UNKNOWN','EBUSY','EPERM'].includes(error.code)) throw error; await new Promise(resolve=>setTimeout(resolve,200)); }
  }
}
const assets=[];
const frame=(w,h,face,edge,r=16)=>`<rect x="2" y="5" width="${w-4}" height="${h-7}" rx="${r}" fill="${edge}" opacity=".13"/><rect x="2" y="2" width="${w-4}" height="${h-7}" rx="${r}" fill="${edge}"/><rect x="2.8" y="2.8" width="${w-5.6}" height="${h-10}" rx="${r-.8}" fill="${face}" stroke="${edge}" stroke-opacity=".6" stroke-width="1.2"/>`;
async function save(id,w,h,body,{border=0,profile='shared',...extra}={}) {
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none"${border?' preserveAspectRatio="none"':''}>${body}</svg>`;
  await writeFile(new URL(`svg/${id}.svg`,root),svg);
  assets.push({id,svg:`svg/${id}.svg`,png:`png/${id}.png`,nativeSize:[w,h],pngSize:[w*2,h*2],profile,unityImageType:border?'Sliced':'Simple',preserveAspect:!border,borderPixels:Array(4).fill(border*2),...extra});
}
for(const [profile,buttonW,cellSize,panelW] of [['desktop',240,72,520],['mobile',156,56,350]]) {
  for(const [kind,face,edge] of [['primary',palette.terracotta,palette.terracottaEdge],['secondary',palette.cream,palette.rim],['river',palette.river,palette.riverEdge],['hint','#F1D89A','#BDA16C']]) {
    for(const state of ['normal','hover','pressed','disabled']) {
      const color=state==='disabled'?palette.muted:state==='hover'?{primary:'#E0AA89',secondary:'#FFFDF7',river:'#B0D9E6',hint:'#F7E4B7'}[kind]:state==='pressed'?{primary:'#C68A65',secondary:'#EEE6D5',river:'#82B8CC',hint:'#DEC58A'}[kind]:face;
      await save(`button-${kind}-${profile}-${state}`,buttonW,48,frame(buttonW,48,color,state==='disabled'?'#B6BDAA':edge,14),{border:18,profile,kind,state});
    }
  }
  for(const [state,face,edge] of [['normal',palette.cream,palette.rim],['selected',palette.river,palette.riverEdge],['compare','#F1D89A','#BDA16C'],['sorted','#DBE7C8',palette.sageEdge],['moving',palette.terracotta,palette.terracottaEdge],['empty','#F0EEE3','#C8C2AF'],['disabled',palette.muted,'#B6BDAA']]) {
    await save(`cell-${profile}-${state}`,cellSize,cellSize,frame(cellSize,cellSize,face,edge,14)+(state==='empty'?`<rect x="8" y="8" width="${cellSize-16}" height="${cellSize-21}" rx="9" stroke="${edge}" stroke-width="1.2" stroke-dasharray="4 4"/>`:''),{profile,state,usage:'Array value is runtime text; index is displayed below the sprite.'});
  }
  for(const [kind,face,h] of [['card',palette.cream,170],['board',palette.board,300],['speech','#FFFCEE',132]]) await save(`panel-${kind}-${profile}`,panelW,h,frame(panelW,h,face,palette.rim,22),{profile,border:26});
}
for(const state of ['normal','hover','pressed','disabled']) await save(`button-icon-${state}`,48,50,frame(48,50,state==='disabled'?palette.muted:state==='pressed'?'#EEE6D5':state==='hover'?'#FFFDF7':palette.cream,palette.rim,15),{state});
for(const [state,face,edge] of [['normal',palette.cream,palette.rim],['selected','#E7EEDB',palette.sageEdge],['disabled',palette.muted,'#B6BDAA']]) await save(`tab-${state}`,200,54,frame(200,54,face,edge,16),{border:20,state});
for(const [state,face,edge] of [['open',palette.terracotta,palette.terracottaEdge],['complete',palette.sage,palette.sageEdge],['locked',palette.muted,'#B6BDAA']]) await save(`badge-${state}`,40,42,frame(40,42,face,edge,14),{state});
for(const [state,face,edge] of [['normal',palette.cream,palette.rim],['selected',palette.terracotta,palette.terracottaEdge],['complete','#DBE7C8',palette.sageEdge],['locked',palette.muted,'#B6BDAA']]) await save(`station-${state}`,80,84,frame(80,84,face,edge,22),{state});
await save('progress-track',320,12,'<rect x="1" y="2" width="318" height="8" rx="4" fill="#E1DECB"/>',{border:5});
await save('progress-fill',320,12,`<rect x="1" y="2" width="318" height="8" rx="4" fill="${palette.terracotta}"/>`,{border:5});
await save('speech-tail',20,24,'<path d="M19 2 2 10Q0 12 2 14L19 22" fill="#FFFCEE" stroke="#D8CDB8" stroke-width="1.3" stroke-linejoin="round"/>');
for(const [name,component] of Object.entries({back:'ArrowLeft',next:'ArrowRight',play:'Play',pause:'Pause',check:'Check',hint:'Lightbulb',reset:'RotateCcw',undo:'Undo2',sound:'Volume2',settings:'Settings',sort:'ArrowDownUp',search:'Search',stack:'Layers3',flag:'Flag'})) {
  const svg=renderToStaticMarkup(createElement(icons[component],{size:28,strokeWidth:2.2,color:palette.ink}));
  await writeFile(new URL(`svg/icon-${name}.svg`,root),svg);
  assets.push({id:`icon-${name}`,svg:`svg/icon-${name}.svg`,png:`png/icon-${name}.png`,nativeSize:[28,28],pngSize:[56,56],profile:'shared',unityImageType:'Simple',preserveAspect:true,borderPixels:[0,0,0,0]});
}
const illustrations=[];
for(const file of ['illustrations/island-village.png','backgrounds/village-landscape.png','backgrounds/village-portrait.png']) {
  const buffer=await readFile(new URL(file,root));
  illustrations.push({file,nativeSize:[buffer.readUInt32BE(16),buffer.readUInt32BE(20)],preserveAspect:true,unityImageType:'Simple',transparent:file.startsWith('illustrations/')});
}
await writeFile(new URL('unity-assets.json',root),JSON.stringify({version:1,status:'draft-for-review',palette,pixelsPerUnit:100,alphaIsTransparency:true,spriteMeshType:'FullRect',filterMode:'Bilinear',assets,illustrations},null,2));
await writeFile(new URL('LICENSE-icons.txt',root),await readFile(new URL('../node_modules/lucide-react/LICENSE',import.meta.url),'utf8'));
const swatches=Object.entries(palette).filter(([name])=>!['muted','rim','board'].includes(name)).map(([name,color])=>`<span><i style="background:${color}"></i>${name}<small>${color}</small></span>`).join('');
const sampleCell=(value,state='normal')=>`<span class="value" style="background-image:url(svg/cell-desktop-${state}.svg)">${value}</span>`;
const sampleButton=(text,kind='primary')=>`<button class="sample-button ${kind}" type="button">${text}</button>`;
const html=`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Array · Làng ven sông · Asset nháp</title>
<style>*{box-sizing:border-box}body{margin:0;background:#F4F1E6;color:${palette.ink};font:16px/1.5 system-ui,sans-serif}main{max-width:1320px;margin:auto;padding:28px}h1{margin:0;font-size:28px}h2{font-size:20px;margin:22px 0 12px}p{margin:5px 0 16px}.palette{display:flex;gap:20px;flex-wrap:wrap;margin:18px 0}.palette span{display:grid;grid-template-columns:28px auto;gap:0 8px;font-size:12px}.palette i{grid-row:span 2;width:26px;height:32px;border-radius:6px;border:1px solid #594a3c20}.palette small{font-size:11px}.scenes{display:grid;grid-template-columns:1fr 1fr;gap:20px}.scene{border-radius:24px;padding:22px;text-align:center;background:${palette.board} url(backgrounds/village-landscape.png) center/cover;min-height:470px}.island{width:300px;height:300px;object-fit:contain;display:block;margin:auto}.scene-title{font-size:22px;font-weight:800;margin:0 0 12px}.card{background:url(svg/panel-card-desktop.svg) center/100% 100% no-repeat;padding:18px 22px;text-align:left}.card strong{display:block;font-size:20px}.sample-button{height:48px;width:100%;border:0;background:url(svg/button-primary-desktop-normal.svg) center/100% 100%;color:${palette.ink};font:700 16px system-ui;cursor:pointer;margin-top:10px}.sample-button:hover{background-image:url(svg/button-primary-desktop-hover.svg)}.sample-button:active{background-image:url(svg/button-primary-desktop-pressed.svg)}.sample-button.secondary{background-image:url(svg/button-secondary-desktop-normal.svg)}.sample-button.river{background-image:url(svg/button-river-desktop-normal.svg)}.board{background:url(svg/panel-board-desktop.svg) center/100% 100% no-repeat;padding:24px 14px;margin:35px 0 20px}.cells{display:flex;justify-content:center;gap:5px}.value{display:grid;place-items:center;background-size:100% 100%;width:65px;height:65px;font-size:26px;font-weight:800}.indices{display:flex;justify-content:center;gap:5px;font-size:12px}.indices span{width:65px}.progress{height:12px;background:url(svg/progress-track.svg) center/100% 100%;margin:14px 0}.progress i{display:block;width:60%;height:100%;background:url(svg/progress-fill.svg) left/100% 100%}.row{display:flex;gap:10px}.speech{background:url(svg/panel-speech-desktop.svg) center/100% 100%;padding:18px;text-align:left;font-size:14px}.samples{display:grid;grid-template-columns:repeat(7,1fr);gap:12px}.sample{background:#FFFCF5;padding:12px;border-radius:14px;text-align:center}.sample img{display:block;max-width:100%;height:60px;object-fit:contain;margin:auto}.sample small{font-size:11px}.landscape-preview{width:100%;border-radius:16px}.backgrounds{display:grid;grid-template-columns:3fr 1fr;gap:20px}.backgrounds img{width:100%;max-height:320px;object-fit:contain;background:#EDEDD9;border-radius:16px}details{margin-top:24px}summary{cursor:pointer;font-weight:700}.catalog{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:15px}.catalog article{background:#FFFCF5;border-radius:12px;padding:12px;overflow-wrap:anywhere;text-align:center}.catalog img{max-width:100%;height:70px;object-fit:contain}.catalog small{display:block;font-size:11px}a{color:#684B36}@media(max-width:700px){main{padding:16px}.scenes{grid-template-columns:1fr}.scene{background-image:url(backgrounds/village-portrait.png);padding:14px}.samples{grid-template-columns:repeat(3,1fr)}.catalog{grid-template-columns:repeat(2,1fr)}.value,.indices span{width:48px}.value{height:48px;font-size:22px}.island{max-width:100%}.backgrounds{grid-template-columns:2fr 1fr}}</style>
<main><h1>Mảng · Làng ven sông</h1><p>Bộ asset nháp để duyệt · 2D · viền nhẹ · ${assets.length} sprite SVG/PNG và 3 tranh minh họa</p><div class="palette">${swatches}</div>
<div class="scenes"><section class="scene"><p class="scene-title">Chủ đề Mảng</p><img class="island" src="illustrations/island-village.png" alt="Đảo làng có cây và sông"><div class="card"><strong>01 · Mảng</strong><div class="progress"><i></i></div>${sampleButton('Tiếp tục →')}</div></section>
<section class="scene"><p class="scene-title">Sắp xếp mảng</p><p>So sánh hai ô liền kề.</p><div class="board"><div class="cells">${sampleCell(3,'sorted')}${sampleCell(7,'compare')}${sampleCell(4,'selected')}${sampleCell(9)}</div><div class="indices"><span>0</span><span>1</span><span>2</span><span>3</span></div></div><div class="speech"><strong>Buta đồng hành</strong><br>7 lớn hơn 4. Đổi chỗ hai ô này nhé!</div><div class="row">${sampleButton('Demo','secondary')}${sampleButton('Thử thách →')}</div><div class="row">${sampleButton('Gợi ý','river')}${sampleButton('Làm lại','secondary')}</div></section></div>
<h2>Một số thành phần</h2><div class="samples">${['cell-desktop-normal','cell-desktop-selected','cell-desktop-compare','cell-desktop-sorted','cell-desktop-moving','station-selected','badge-complete'].map(id=>`<div class="sample"><img src="svg/${id}.svg" alt="${id}"><small>${id}</small></div>`).join('')}</div>
<h2>Nền ngang và dọc</h2><div class="backgrounds"><img src="backgrounds/village-landscape.png" alt="Nền desktop"><img src="backgrounds/village-portrait.png" alt="Nền mobile"></div>
<details><summary>Toàn bộ ${assets.length} sprite — thường, hover, nhấn, vô hiệu hóa và các trạng thái ô</summary><div class="catalog">${assets.map(a=>`<article><img src="${a.svg}" alt="${a.id}" loading="lazy"><small>${a.id}<br>${a.nativeSize.join(' × ')} · <a href="${a.svg}">SVG</a> / <a href="${a.png}">PNG</a></small></article>`).join('')}</div></details><p><a href="unity-assets.json">Manifest</a> · <a href="README.md">Hướng dẫn</a></p></main></html>`;
await writeFile(new URL('preview.html',root),html);
const browser=await chromium.launch({channel:'chrome'});
try {
  const page=await browser.newPage({deviceScaleFactor:2});
  for(const a of assets) {
    await page.setViewportSize({width:Math.max(600,a.nativeSize[0]),height:Math.max(400,a.nativeSize[1])});
    await page.setContent(`<style>body{margin:0}svg{display:block}</style>${await readFile(new URL(a.svg,root),'utf8')}`);
    await writeFile(new URL(a.png,root),await page.locator('svg').screenshot({omitBackground:true}));
  }
  await page.setViewportSize({width:1400,height:1100});
  await page.goto(new URL('preview.html',root).href);
  await page.evaluate(()=>Promise.all([...document.images].filter(img=>img.loading!=='lazy').map(img=>img.decode())));
  await writeFile(new URL('preview-overview.png',root),await page.screenshot());
  await page.setViewportSize({width:390,height:844});
  await writeFile(new URL('preview-mobile.png',root),await page.screenshot({fullPage:true}));
} finally { await browser.close(); }
console.log(`Prepared ${assets.length} Array SVG/PNG sprites, 3 illustrations, manifest, and review previews at ${fileURLToPath(root)}`);

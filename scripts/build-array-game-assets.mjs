import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
const root=new URL('../public/assets/hybrid-casual-ui/array/game/',import.meta.url);
const source=new URL('../public/assets/hybrid-casual-ui/array/sort-review-v2/',import.meta.url);
await Promise.all(['svg/','png/','illustrations/','items/','characters/'].map(p=>mkdir(new URL(p,root),{recursive:true})));
const manifest=JSON.parse(await readFile(new URL('manifest.json',source),'utf8'));
const assets=[];
for(const asset of manifest.assets.filter(a=>!a.id.endsWith('-old')&&!a.id.startsWith('gear-'))){
 let svg=await readFile(new URL(asset.svg,source),'utf8');
 if(/^(button-|tag-)/.test(asset.id))svg=svg.replace('<svg ', '<svg preserveAspectRatio="none" ');
 if(asset.id === 'tag-sorted')svg=svg.replaceAll('#cadbab','#fff8e6').replaceAll('#bdce9e','#f2e5c8').replaceAll('#5B7B43','#879568');
 if(asset.id.startsWith('map-'))svg=svg.replace(/<g transform="translate\(26 24\)[\s\S]*?<\/g>/,'');
 await writeFile(new URL(asset.svg,root),svg);assets.push(asset);
}
for(const name of ['bubble-bridge','selection-camp','insertion-desk','merge-stream','quick-crossroads'])await copyFile(new URL(`illustrations/${name}.png`,source),new URL(`illustrations/${name}.png`,root));
for(const [id,w,h]of[['panel-topic',540,160],['panel-map',540,184],['panel-speech',540,110]]){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none"><rect x="2" y="5" width="${w-4}" height="${h-7}" rx="23" fill="#867146" opacity=".08"/><rect x="2" y="2" width="${w-4}" height="${h-8}" rx="23" fill="#FFF6DC" stroke="#D4C09A" stroke-width="1.2"/><path d="M26 5H${w-26}" stroke="#FFFDF3" stroke-width="1.5" opacity=".7"/></svg>`;
 await writeFile(new URL(`svg/${id}.svg`,root),svg.replace('<svg ', '<svg preserveAspectRatio="none" '));assets.push({id,svg:`svg/${id}.svg`,png:`png/${id}.png`,nativeSize:[w,h]});
}
await copyFile(new URL('LICENSE-icons.txt',source),new URL('LICENSE-icons.txt',root));
await writeFile(new URL('manifest.json',root),JSON.stringify({status:'live',palette:manifest.palette,assets,illustrations:manifest.illustrations,items:['backpack','bottle','flashlight','compass','map','tent','binoculars','pot','card-front','card-back','merge-leaf'].map(id=>({id,png:`items/${id}.png`})),characters:['fox-sage','rabbit-lavender','raccoon-honey','bear-river','fox-rose','rabbit-blue','raccoon-sand','bear-mint'].map((identity,id)=>({id,identity,png:`characters/friend-${id}.png`}))},null,2));
const browser=await chromium.launch({channel:'chrome'});
try{const page=await browser.newPage({deviceScaleFactor:2});for(const a of assets){await page.setViewportSize({width:Math.max(600,a.nativeSize[0]),height:Math.max(240,a.nativeSize[1])});await page.setContent(`<style>body{margin:0}svg{display:block}</style>${await readFile(new URL(a.svg,root),'utf8')}`);await page.locator('svg').screenshot({path:fileURLToPath(new URL(a.png,root)),omitBackground:true});}}finally{await browser.close();}
console.log(`Exported ${assets.length} production Array UI sprites.`);

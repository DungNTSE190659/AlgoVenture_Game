import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';

const root = new URL('../public/assets/hybrid-casual-ui/atlas/', import.meta.url);
await Promise.all(['svg/', 'png/', 'concepts/'].map(d => mkdir(new URL(d, root), { recursive: true })));
const assets = [];
async function save(id, w, h, body, profile = 'shared') {
  const stretch = /^(panel|button-enter).*(mobile|compact)/.test(id) ? ' preserveAspectRatio="none"' : '';
  await writeFile(new URL(`svg/${id}.svg`, root), `<svg${stretch} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none">${body}</svg>`);
  assets.push({ id, svg: `svg/${id}.svg`, png: `png/${id}.png`, nativeSize: [w, h], pngSize: [w * 2, h * 2], profile, unityImageType: 'Simple', preserveAspect: true });
}
const panel = (w, h, fill, rim, r = 22, ink = '#7B8966') => `<rect x="2" y="6" width="${w - 4}" height="${h - 8}" rx="${r}" fill="#3A5641" opacity=".14"/><rect x="2" y="2" width="${w - 4}" height="${h - 8}" rx="${r}" fill="${rim}" stroke="${ink}" stroke-width="2"/><rect x="3" y="3" width="${w - 6}" height="${h - 16}" rx="${r - 1}" fill="${fill}"/><path d="M${r + 3} 4H${w - r - 3}" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".65"/>`;
for (const [profile, w, h, buttonW, buttonH] of [['desktop', 540, 152, 492, 46], ['mobile', 362, 152, 328, 46], ['compact', 292, 144, 258, 42], ['landscape', 320, 144, 286, 42]]) {
  await save(`panel-${profile}`, w, h, panel(w, h, '#FFFCED', '#D7D2B7', 25, '#758363'), profile);
  await save(`panel-status-${profile}`, w, h + 22, panel(w, h + 22, '#FFFCED', '#D7D2B7', 25, '#758363'), profile);
  for (const state of ['normal', 'hover', 'pressed', 'disabled']) {
    const face = { normal: '#35C990', hover: '#4DDDA3', pressed: '#23B77D', disabled: '#C4D9CC' }[state];
    await save(`button-enter-${profile}-${state}`, buttonW, buttonH, panel(buttonW, buttonH, face, state === 'disabled' ? '#9FB9AB' : '#159563', 12, state === 'disabled' ? '#93A99C' : '#237B59'), profile);
  }
}
for (const state of ['normal', 'hover', 'pressed', 'disabled']) {
  const face = { normal: '#FFFDEC', hover: '#FFFFFF', pressed: '#E6EBD4', disabled: '#DFE5D3' }[state];
  await save(`button-icon-${state}`, 44, 48, panel(44, 48, face, '#CDD5B6', 14));
}
for (const name of ['arrays', 'linear-structures', 'trees', 'graph']) await save(`badge-${name}`, 43, 45, panel(43, 45, '#35C990', '#159563', 14, '#F9FBEA'));
await save('compass-disc', 48, 48, '<circle cx="24" cy="26" r="22" fill="#BCC9AB"/><circle cx="24" cy="23" r="21" fill="#FFFAE5" stroke="#B7C29D" stroke-width="2"/><circle cx="24" cy="23" r="16" stroke="#DFE3C5" stroke-width="2"/><path d="m30 12-3 14-13 8 5-15Z" fill="#8CAB71" stroke="#6C8258" stroke-width="2"/><path d="m30 12-3 14-8-7Z" fill="#E9C985"/><circle cx="23" cy="23" r="2.5" fill="#FFFAE5"/>');
await save('gateway', 44, 48, panel(44, 48, '#FFFAE5', '#CAC9A6', 13));
await save('pager-dot', 8, 8, '<circle cx="4" cy="4" r="4" fill="#B7C7B4"/>');
await save('pager-active', 24, 8, '<rect width="24" height="8" rx="4" fill="#35C990"/>');
await save('sheet-handle', 36, 4, '<rect width="36" height="4" rx="2" fill="#D7DCC3"/>');
for (const [profile, w, h] of [['desktop', 960, 540], ['mobile', 390, 844]]) await save(`backdrop-${profile}`, w, h, `
  <defs>
    <linearGradient id="sky-${profile}" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#BCEEFF"/><stop offset=".53" stop-color="#DDF8DD"/><stop offset="1" stop-color="#9BE5C2"/>
    </linearGradient>
    <radialGradient id="sun-${profile}"><stop stop-color="#FFF7BD" stop-opacity=".9"/><stop offset="1" stop-color="#FFF7BD" stop-opacity="0"/></radialGradient>
    <radialGradient id="lagoon-${profile}"><stop stop-color="#70DDE6" stop-opacity=".55"/><stop offset="1" stop-color="#70DDE6" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky-${profile})"/>
  <ellipse cx="${w * .12}" cy="${h * .13}" rx="${w * .44}" ry="${h * .42}" fill="url(#sun-${profile})"/>
  <ellipse cx="${w * .91}" cy="${h * .83}" rx="${w * .53}" ry="${h * .5}" fill="url(#lagoon-${profile})"/>
  <g fill="#FFFFFF" opacity=".22">
    <circle cx="${w * .11}" cy="${h * .58}" r="${Math.max(12, w * .023)}"/>
    <circle cx="${w * .85}" cy="${h * .2}" r="${Math.max(8, w * .015)}"/>
    <circle cx="${w * .95}" cy="${h * .42}" r="${Math.max(6, w * .012)}"/>
  </g>`, profile);
const names = { 'arrow-right': 'ArrowRight', audio: 'AudioLines', muted: 'VolumeX', check: 'Check', 'chevron-left': 'ChevronLeft', 'chevron-right': 'ChevronRight', flag: 'Flag', lock: 'LockKeyhole' };
for (const [name, icon] of Object.entries(names)) {
  await writeFile(new URL(`svg/icon-${name}.svg`, root), renderToStaticMarkup(createElement(icons[icon], { size: 32, strokeWidth: 2.6, color: name === 'arrow-right' ? '#FFFDF0' : '#7C9374' })));
  assets.push({ id: `icon-${name}`, svg: `svg/icon-${name}.svg`, png: `png/icon-${name}.png`, nativeSize: [32, 32], pngSize: [64, 64], unityImageType: 'Simple', preserveAspect: true });
}
const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-gpu'] });
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const a of assets) {
  await page.setViewportSize({ width: Math.max(600, a.nativeSize[0]), height: Math.max(300, a.nativeSize[1]) });
  await page.setContent(`<style>body{margin:0}svg{display:block}</style>${await readFile(new URL(a.svg, root), 'utf8')}`);
  await page.locator('svg').screenshot({ path: fileURLToPath(new URL(a.png, root)), omitBackground: true });
}
await writeFile(new URL('unity-assets.json', root), JSON.stringify({ version: 1, pixelsPerUnit: 100, alphaIsTransparency: true, assets, illustrations: [{ id: 'island-linear-structures', file: 'islands/linked-list.png', nativeSize: [1536, 1024], unityImageType: 'Simple', preserveAspect: true, approved: true }, { id: 'island-trees', file: 'islands/trees.png', nativeSize: [1536, 1024], unityImageType: 'Simple', preserveAspect: true }] }, null, 2));
for (const profile of ['desktop', 'mobile']) {
  const cards = await Promise.all(assets.filter(a => !a.profile || a.profile === 'shared' || a.profile === profile).map(async a => `<article><div>${await readFile(new URL(a.svg, root), 'utf8')}</div>${a.id}</article>`));
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.setContent(`<style>body{background:#E0ECDC;font:14px sans-serif;color:#506045;padding:20px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}article{background:#FFFDEC;padding:12px;border-radius:14px;text-align:center}article div{height:100px;display:flex;align-items:center;justify-content:center}svg{max-height:90px;max-width:100%}</style><h1>Topic selector UI · ${profile}</h1><div class="grid">${cards.join('')}</div>`);
  await page.screenshot({ path: fileURLToPath(new URL(`preview-${profile}.png`, root)), fullPage: true });
}
await browser.close();
await writeFile(new URL('LICENSE-icons.txt', root), await readFile(new URL('../node_modules/lucide-react/LICENSE', import.meta.url), 'utf8'));
console.log(`Exported ${assets.length} atlas UI assets and registered the approved Linked List island.`);

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import { chromium } from '@playwright/test';
import { lessonArt } from './linked-map-lesson-art.mjs';
import { treeLessonArt } from './tree-map-lesson-art.mjs';

const treeMode = process.argv.includes('--tree');
const root = new URL(`../public/assets/hybrid-casual-ui/${treeMode ? 'tree' : 'linked'}/map/`, import.meta.url);
await Promise.all(['svg/', 'png/'].map(dir => mkdir(new URL(dir, root), { recursive: true })));
const assets = [];
const xml = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none">${body}</svg>`;
async function save(id, w, h, body, usage, profile = 'shared') {
  let svg = id.startsWith('road-') ? xml(w, h, body.replaceAll('<path ', '<path vector-effect="non-scaling-stroke" ')).replace('<svg ', '<svg preserveAspectRatio="none" ') : xml(w, h, body);
  if (/^(sheet|button-(demo|challenge)).*mobile/.test(id)) svg = svg.replace('<svg ', '<svg preserveAspectRatio="none" ');
  await writeFile(new URL(`svg/${id}.svg`, root), svg);
  assets.push({ id, svg: `svg/${id}.svg`, png: `png/${id}.png`, nativeSize: [w, h], pngSize: [w * 2, h * 2], profile, usage, unityImageType: 'Simple', preserveAspect: true, borderPixels: [0, 0, 0, 0] });
}
const rect = (w, h, fill, rim = '#C8C2AE', ink = '#3A493D', r = 16, sw = 2) => `
 <rect x="2" y="5" width="${w - 4}" height="${h - 7}" rx="${r}" fill="#1D3527" opacity=".14"/>
 <rect x="2" y="2" width="${w - 4}" height="${h - 7}" rx="${r}" fill="${rim}" stroke="${ink}" stroke-width="${sw}"/>
 <rect x="${2 + sw / 2}" y="${2 + sw / 2}" width="${w - 4 - sw}" height="${h - 13}" rx="${r - 1}" fill="${fill}"/>
 <path d="M${r + 2} 3H${w - r - 2}" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`;
const lessons = treeMode ? [
 ['tree-basics', '#F7B83D', '#A96712', 'Sprout'], ['tree-traversal', '#27C9BE', '#117C79', 'Route'],
 ['bst', '#B777ED', '#7540A5', 'GitBranch'], ['bst-search', '#39B8F2', '#176B9C', 'Search'],
 ['bst-insert', '#35C990', '#159563', 'GitMerge'], ['bst-delete', '#FF9658', '#AD4E25', 'Leaf'],
] : [
 ['linked-list', '#F7B83D', '#A96712', 'Link'], ['linked-traversal', '#27C9BE', '#117C79', 'Route'],
 ['linked-search', '#39B8F2', '#176B9C', 'Search'], ['linked-insertion', '#FF9658', '#AD4E25', 'GitMerge'],
 ['linked-deletion', '#B777ED', '#7540A5', 'Layers3'], ['linked-reversal', '#35C990', '#159563', 'Shuffle'],
];
for (const [profile, tileW, tileH, panelW] of [['desktop', 82, 84, 540], ['mobile', 76, 80, 362]]) {
  for (const [id, face, lip] of lessons) {
    for (const state of ['normal', 'selected', 'locked']) {
      const selected = state === 'selected', locked = state === 'locked';
      await save(`station-${id}-${profile}-${state}`, tileW, tileH,
        (selected ? `<rect x="1" y="1" width="${tileW - 2}" height="${tileH - 2}" rx="25" stroke="#FFF9CC" stroke-width="2"/>` : '') +
        `<g transform="translate(4 4)">${rect(tileW - 8, tileH - 8, locked ? '#BCC6B1' : face, locked ? '#929F86' : lip, selected ? '#FFF9CC' : '#F9FBEA', 22)}</g>`, `Station ${id}, ${state}. Icon, number and status are separate sprites.`, profile);
    }
    await save(`number-${id}-${profile}`, 43, 45, rect(43, 45, face, lip, '#F9FBEA', 13), 'Selected lesson number; dynamic number text overlays.', profile);
  }
  const landW = profile === 'desktop' ? 140 : 132;
  await save(`island-${profile}`, landW, 88, `<ellipse cx="${landW / 2}" cy="52" rx="${landW / 2 - 2}" ry="32" fill="#D0C398"/><ellipse cx="${landW / 2}" cy="44" rx="${landW / 2 - 2}" ry="30" fill="#AEC58B"/><ellipse cx="${landW / 2}" cy="36" rx="${landW / 2 - 2}" ry="29" fill="#D9E8B4" stroke="#F3F8D8" stroke-width="2.5"/><ellipse cx="${landW - 22}" cy="45" rx="9" ry="4" fill="#AFC88C"/><path d="M14 38v10m-5-5h10" stroke="#FFFDE0" stroke-width="4" stroke-linecap="round"/>`, 'Station island; keep aspect ratio.', profile);
  for (const [kind, w, h] of [['caption', 150, 60], ['sheet', panelW, 164], ['sheet-status', panelW, 190]]) {
    await save(`${kind}-${profile}`, w, h, rect(w, h, '#FFFCED', '#D7D2B7', '#758363', kind === 'caption' ? 13 : 25), 'Panel authored at profile dimensions; use matching aspect ratio.', profile);
  }
  for (const [kind, width, fill, lip, ink] of [['demo', profile === 'desktop' ? 224 : 144, '#F4F5E8', '#D3D9BE', '#237B59'], ['challenge', profile === 'desktop' ? 258 : 164, '#35C990', '#159563', '#237B59']]) {
    for (const state of ['normal', 'hover', 'pressed', 'disabled']) {
      const face = state === 'disabled' ? '#D6DCCB' : state === 'hover' ? (kind === 'demo' ? '#FFFDED' : '#4DDDA3') : state === 'pressed' ? (kind === 'demo' ? '#E4E8D5' : '#23B77D') : fill;
      await save(`button-${kind}-${profile}-${state}`, width, 49, rect(width, 49, face, state === 'disabled' ? '#B7C2AB' : lip, state === 'disabled' ? '#A2AF96' : ink, 13), `Sheet ${kind} button, ${state}. Sprite Swap.`, profile);
    }
  }
  const roadW = profile === 'desktop' ? 570 : 390;
  for (const direction of ['up-right', 'up-left']) for (const state of ['open', 'locked']) {
    const ax = roadW * (direction === 'up-right' ? .325 : .675), bx = roadW - ax;
    const path = `M${ax} 220C${ax} 110 ${bx} 110 ${bx} 0`;
    await save(`road-${direction}-${profile}-${state}`, roadW, 220, `<path d="${path}" stroke="#82965D" stroke-width="30" opacity=".4"/><path d="${path}" stroke="${state === 'open' ? '#A88758' : '#ADAA91'}" stroke-width="25"/><path d="${path}" stroke="#FFF8DD" stroke-width="3" stroke-dasharray="3 12" stroke-linecap="round"/>`, 'One route segment. Position between consecutive station centers; keep the route geometry in sync with the station layout.', profile);
  }
}
for (const state of ['normal', 'hover', 'pressed', 'disabled']) {
  await save(`button-icon-${state}`, 44, 48, rect(44, 48, state === 'disabled' ? '#D6DCCB' : state === 'pressed' ? '#E7E9D4' : '#FFFDF3', '#C8C2AE', '#237B59', 14), `Header and locate button, ${state}.`);
}
await save('badge-number', 30, 32, '<circle cx="15" cy="17" r="14" fill="#9ACBB8"/><circle cx="15" cy="15" r="13" fill="#FFFDEC" stroke="#E5FFF3" stroke-width="2"/>', 'Station index badge; overlay dynamic number.');
for (const [state, fill] of [['complete', '#35C990'], ['locked', '#A0AE91'], ['open', '#A28756']]) await save(`badge-${state}`, 30, 32, `<circle cx="15" cy="17" r="14" fill="#667957" opacity=".2"/><circle cx="15" cy="15" r="13" fill="${fill}" stroke="#F4F8E4" stroke-width="2.5"/>`, 'Status badge with separate icon.');
await save('sheet-handle', 36, 4, '<rect width="36" height="4" rx="2" fill="#D5D9BF"/>', 'Sheet grab handle.');
for (const [name, fill] of [['track', '#CFECE0'], ['fill', '#35C990']]) await save(`progress-${name}`, 530, 8, `<rect x="1" y="1" width="528" height="6" rx="3" fill="${fill}"/>`, 'Progress strip; fill is clipped by runtime progress.');
await save('decoration-flower', 24, 24, '<path d="M12 4V20M4 12H20M6 6 18 18M18 6 6 18" stroke="#FFF7D6" stroke-width="5" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="#D7C47C"/>', 'Map decoration.');
const common = { 'arrow-left': 'ArrowLeft', 'arrow-right': 'ArrowRight', audio: 'AudioLines', muted: 'VolumeX', flag: 'Flag', trophy: 'Trophy', footprints: 'Footprints', check: 'Check', lock: 'LockKeyhole', eye: 'Eye', gamepad: 'Gamepad2', 'check-status': 'Check', 'lock-status': 'LockKeyhole' };
for (const [id, , , icon] of lessons) common[id] = icon;
for (const [name, icon] of Object.entries(common)) {
  if (lessons.some(([id]) => id === name)) {
    await save(`icon-${name}`, 96, 96, treeMode ? treeLessonArt(name) : lessonArt(name), 'Colored toy illustration for the lesson station. Scale uniformly; do not tint.');
    continue;
  }
  const svg = renderToStaticMarkup(createElement(icons[icon], { size: 32, strokeWidth: 2.3, color: name.startsWith('linked-') || ['gamepad', 'arrow-right', 'check', 'lock'].includes(name) ? '#FFFEF2' : '#237B59' }));
  await writeFile(new URL(`svg/icon-${name}.svg`, root), svg);
  assets.push({ id: `icon-${name}`, svg: `svg/icon-${name}.svg`, png: `png/icon-${name}.png`, nativeSize: [32, 32], pngSize: [64, 64], unityImageType: 'Simple', preserveAspect: true });
}
const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-gpu'] });
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const asset of assets) {
  await page.setViewportSize({ width: Math.max(600, asset.nativeSize[0]), height: 300 });
  await page.setContent(`<style>body{margin:0}svg{display:block}</style>${await readFile(new URL(asset.svg, root), 'utf8')}`);
  await page.locator('svg').screenshot({ path: fileURLToPath(new URL(asset.png, root)), omitBackground: true });
}
await writeFile(new URL('unity-assets.json', root), JSON.stringify({ version: 1, pixelsPerUnit: 100, alphaIsTransparency: true, spriteMeshType: 'FullRect', assets }, null, 2));
for (const profile of ['desktop', 'mobile']) {
  const selected = assets.filter(a => a.profile === profile || !a.profile);
  const cards = await Promise.all(selected.map(async a => `<div><section>${await readFile(new URL(a.svg, root), 'utf8')}</section><small>${a.id}</small></div>`));
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.setContent(`<style>body{padding:20px;background:#E3EDCF;font:14px sans-serif;color:#40513C}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.grid>div{background:#FFFCED;padding:12px;border-radius:12px;text-align:center}section{height:100px;display:flex;align-items:center;justify-content:center}svg{max-width:100%;max-height:90px}small{overflow-wrap:anywhere}</style><h1>${treeMode ? 'Trees' : 'Linked List'} map · ${profile}</h1><div class="grid">${cards.join('')}</div>`);
  await page.screenshot({ path: fileURLToPath(new URL(`preview-${profile}.png`, root)), fullPage: true });
}
const lessonCards = await Promise.all(lessons.map(async ([id]) => `<article><section>${await readFile(new URL(`svg/icon-${id}.svg`, root), 'utf8')}</section><b>${id.replace('linked-', '')}</b></article>`));
await page.setViewportSize({ width: 900, height: 440 });
await page.setContent(`<style>body{margin:0;padding:24px;background:#E3EDCF;font:16px sans-serif;color:#40513C}.icons{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}article{background:#FFFCED;border-radius:18px;padding:16px;text-align:center}section{height:130px;display:flex;justify-content:center;align-items:center}svg{width:120px;height:120px}</style><div class="icons">${lessonCards.join('')}</div>`);
await page.screenshot({ path: fileURLToPath(new URL('lesson-icons-preview.png', root)), fullPage: true });
await browser.close();
await writeFile(new URL('LICENSE-icons.txt', root), await readFile(new URL('../node_modules/lucide-react/LICENSE', import.meta.url), 'utf8'));
console.log(`Exported ${assets.length} map sprites with desktop/mobile profiles.`);

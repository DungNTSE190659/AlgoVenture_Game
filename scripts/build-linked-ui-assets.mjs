import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import './build-linked-ui-variants.mjs';

const root = new URL('../public/assets/hybrid-casual-ui/linked/', import.meta.url);
const profiles = JSON.parse(await readFile(new URL('variant-profiles.json', root), 'utf8'));
const variantById = new Map(profiles.assets.map(a => [a.id, a]));
await mkdir(new URL('png/', root), { recursive: true });
await writeFile(new URL('LICENSE-icons.txt', root), await readFile(new URL('../node_modules/lucide-react/LICENSE', import.meta.url), 'utf8'));
const iconNames = ['ArrowLeft', 'ArrowRight', 'Check', 'Lightbulb', 'Settings', 'RotateCcw', 'Undo2', 'X', 'Volume2', 'VolumeX', 'Pause', 'Play', 'SkipBack', 'SkipForward'];
for (const name of iconNames) {
  const slug = name.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();
  const color = name === 'Check' ? '#238A69' : name === 'Lightbulb' ? '#6B4D12' : ['Play', 'Pause'].includes(name) ? '#FFFFFF' : '#425C4C';
  const svg = renderToStaticMarkup(createElement(icons[name], { size: 32, color, strokeWidth: 2.6 }));
  await writeFile(new URL(`svg/icon-${slug}.svg`, root), svg);
}

// States are standalone sprites, rather than CSS-drawn or filter-based skins.
for (const name of (await readdir(new URL('svg/', root))).filter(name => /^node-block-[a-z]+\.svg$/.test(name))) {
  if (name.endsWith('-selected.svg')) continue;
  const svg = await readFile(new URL(`svg/${name}`, root), 'utf8');
  await writeFile(new URL(`svg/${name.replace('.svg', '-selected.svg')}`, root), svg.replaceAll('#23272E', '#9A6D22'));
}
for (const name of ['btn-check-mint', 'btn-hint-yellow', 'btn-action-green', 'btn-action-purple', 'btn-icon-squircle', 'btn-neutral-wide']) {
  const svg = await readFile(new URL(`svg/${name}.svg`, root), 'utf8');
  for (const state of ['hover', 'pressed', 'disabled']) {
    const tinted = svg.replace(/#[0-9a-f]{6}/gi, hex => {
      const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
      const gray = rgb.reduce((a, b) => a + b, 0) / 3;
      const out = rgb.map(value => Math.round(state === 'hover' ? value + (255 - value) * .08 : state === 'pressed' ? value * .9 : gray * .35 + 160));
      return '#' + out.map(value => value.toString(16).padStart(2, '0')).join('');
    });
    await writeFile(new URL(`svg/${name}-${state}.svg`, root), tinted);
  }
}

const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-gpu'] });
const page = await browser.newPage({ deviceScaleFactor: 2 });
const assets = [];
const names = (await readdir(new URL('svg/', root))).filter(name => name.endsWith('.svg')).sort();
for (const name of names) {
  const svg = await readFile(new URL(`svg/${name}`, root), 'utf8');
  const [, w] = svg.match(/\bwidth="([\d.]+)"/);
  const [, h] = svg.match(/\bheight="([\d.]+)"/);
  await page.setViewportSize({ width: Math.max(320, Math.ceil(+w)), height: Math.max(240, Math.ceil(+h)) });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`);
  const png = `png/${name.replace('.svg', '.png')}`;
  await page.locator('svg').screenshot({ path: new URL(png, root).pathname.replace(/^\/(\w:)/, '$1'), omitBackground: true });
  const sliced = /^(btn-|panel-|badge-|slot-|null-)/.test(name);
  const border = name.startsWith('panel-') ? 32 : name.startsWith('btn-icon-squircle') ? 20 : Math.min(28, Math.floor(Math.min(+w, +h) / 2) - 1);
  const variant = variantById.get(name.slice(0, -4));
  assets.push({ id: name.slice(0, -4), svg: `svg/${name}`, png, nativeSize: [+w, +h], pngSize: [+w * 2, +h * 2], pivot: [.5, .5], unityImageType: sliced ? 'Sliced' : 'Simple', borderPixels: sliced ? [border * 2, border * 2, border * 2, border * 2] : [0, 0, 0, 0], ...variant, ...(variant?.unityImageType === 'Simple' ? { borderPixels: [0, 0, 0, 0] } : {}) });
}
const backgrounds = [
  { id: 'meadow-landscape', file: 'backgrounds/meadow-landscape.png', size: [1536, 1024], unityImageType: 'Simple', preserveAspect: true },
  { id: 'meadow-portrait', file: 'backgrounds/meadow-portrait.png', size: [1024, 1536], unityImageType: 'Simple', preserveAspect: true },
];
await writeFile(new URL('unity-assets.json', root), JSON.stringify({ version: 1, pixelsPerUnit: 100, alphaIsTransparency: true, spriteMeshType: 'FullRect', filterMode: 'Bilinear', compression: 'None', assets, backgrounds }, null, 2) + '\n');
const cards = await Promise.all(names.map(async name => `<div class="card"><div class="art">${await readFile(new URL(`svg/${name}`, root), 'utf8')}</div><div>${name.slice(0, -4)}</div></div>`));
await page.setViewportSize({ width: 1200, height: 1000 });
await page.setContent(`<style>body{margin:0;padding:24px;background:#e0ecd6;font:13px sans-serif;color:#303c36}h1{font-size:26px}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.card{background:#faf7ec;border-radius:14px;padding:12px;text-align:center}.art{height:95px;display:flex;align-items:center;justify-content:center;margin-bottom:10px}.art svg{max-width:100%;max-height:90px}</style><h1>Linked UI · file-backed sprites and interaction states</h1><div class="grid">${cards.join('')}</div>`);
await page.screenshot({ path: new URL('linked-assets-preview.png', root).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
await page.locator('h1').evaluate(el => el.textContent = 'Linked UI · tailored aspect ratios for Unity');
await page.locator('.card').evaluateAll((cards, ids) => cards.forEach(card => { if (!ids.includes(card.lastElementChild.textContent)) card.remove(); }), profiles.assets.map(a => a.id));
await page.screenshot({ path: new URL('linked-variants-preview.png', root).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
await browser.close();
console.log(`Exported ${assets.length} SVG/PNG assets and Unity manifest.`);

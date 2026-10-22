import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Keep the original portable sprites; produce winter counterparts in their own folder.
const root = new URL('../public/assets/hybrid-casual-ui/linked/', import.meta.url);
await mkdir(new URL('winter/svg/', root), { recursive: true });
await mkdir(new URL('winter/png/', root), { recursive: true });
const names = [];
for (const name of ['panel-board', 'panel-bank']) {
  const source = await readFile(new URL(`svg/${name}.svg`, root), 'utf8');
  const palette = { '#ACC692': '#B4D9EA', '#728B61': '#6690A7', '#EDF5DE': '#F4FBFF', '#C4BDA0': '#BEDCEB', '#23272E': '#56768A', '#F5F0DE': '#F8FCFF' };
  await writeFile(new URL(`winter/svg/${name}.svg`, root), source.replace(/#[0-9A-F]{6}/g, color => palette[color] ?? color));
  names.push(name);
}
for (const profile of ['desktop', 'mobile']) {
  const source = await readFile(new URL(`map/svg/island-${profile}.svg`, root), 'utf8');
  const palette = { '#D0C398': '#9BC4D8', '#AEC58B': '#C9E4F1', '#D9E8B4': '#F5FCFF', '#F3F8D8': '#FFFFFF', '#AFC88C': '#BEDCEA', '#FFFDE0': '#FFFFFF' };
  const svg = source.replace(/#[0-9A-F]{6}/g, color => palette[color] ?? color);
  const name = `island-${profile}`;
  await writeFile(new URL(`winter/svg/${name}.svg`, root), svg);
  names.push(name);
}
for (const selected of [false, true]) {
  const name = `node-ice${selected ? '-selected' : ''}`;
  const edge = selected ? '#A47A29' : '#669BB8';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="88" viewBox="0 0 180 88" fill="none" preserveAspectRatio="none">
<defs><linearGradient id="ice" x1="20" y1="0" x2="135" y2="80" gradientUnits="userSpaceOnUse"><stop stop-color="#FFFFFF"/><stop offset=".52" stop-color="#F1FBFF"/><stop offset="1" stop-color="#CEEAF6"/></linearGradient></defs>
<rect x="3" y="7" width="174" height="79" rx="19" fill="#91B9CE" opacity=".2"/>
<rect x="2" y="2" width="176" height="80" rx="19" fill="#AACFE3" stroke="${edge}" stroke-width="3"/>
<rect x="4" y="4" width="172" height="70" rx="17" fill="url(#ice)"/>
<path d="M5 56H175V58Q175 74 158 74H22Q5 74 5 58Z" fill="#D3EDF8"/>
<path d="M5 56H175" stroke="${edge}" stroke-opacity=".55" stroke-width="2"/>
<path d="M20 8H152M9 21V41" stroke="#FFF" stroke-width="4" stroke-linecap="round"/>
<path d="m149 12-13 23m24-13-11 20M17 46l8-13" stroke="#FFF" stroke-opacity=".85" stroke-width="3" stroke-linecap="round"/>
<path d="m158 45 3-5 3 5-3 5Z" fill="#91C6E0" opacity=".6"/>
<rect x="2" y="2" width="176" height="80" rx="19" stroke="${edge}" stroke-width="3"/>
</svg>`;
  await writeFile(new URL(`winter/svg/${name}.svg`, root), svg);
  names.push(name);
}
const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-gpu'] });
try {
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  for (const name of names) {
    const svg = await readFile(new URL(`winter/svg/${name}.svg`, root), 'utf8');
    await page.setContent(`<style>body{margin:0;background:transparent}svg{display:block}</style>${svg}`);
    await page.locator('svg').screenshot({ path: fileURLToPath(new URL(`winter/png/${name}.png`, root)), omitBackground: true });
  }
} finally { await browser.close(); }

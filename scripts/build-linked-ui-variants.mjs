import { readFile, writeFile } from 'node:fs/promises';
import { softenGameUiSvg } from './soften-game-ui-assets.mjs';
import { linkedNodePalette, linkedNodeSvg } from './build-linked-node-blocks.mjs';

const root = new URL('../public/assets/hybrid-casual-ui/linked/', import.meta.url);
const variants = [];
const wrap = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none">${body}</svg>\n`;
async function save(id, w, h, body, usage, extra = {}) {
  await writeFile(new URL(`svg/${id}.svg`, root), softenGameUiSvg(wrap(w, h, body)));
  variants.push({ id, nativeSize: [w, h], unityImageType: 'Simple', preserveAspect: true, usage, ...extra });
}

// Redraw geometry for each aspect ratio: no nonuniform scale transforms.
const profiles = [['assembly', 124, 64], ['bank', 116, 56], ['mobile', 94, 64], ['compact', 77, 44], ['bank-mobile', 58, 44]];
for (const color of ['peach', 'mint', 'lavender']) {
  const source = await readFile(new URL(`svg/node-block-${color}.svg`, root), 'utf8');
  const palette = linkedNodePalette(source);
  for (const [profile, w, h] of profiles) for (const selected of [false, true]) {
    const id = `node-block-${color}-${profile}${selected ? '-selected' : ''}`;
    await writeFile(new URL(`svg/${id}.svg`, root), linkedNodeSvg(w, h, palette, id));
    variants.push({ id, nativeSize: [w, h], unityImageType: 'Simple', preserveAspect: true, usage: 'Node body with one data/next divider.', profile, color, state: selected ? 'selected' : 'normal' });
  }
}

for (const [profile, w, h] of [['desktop', 148, 80], ['mobile-tall', 136, 96], ['mobile-medium', 131, 72], ['mobile-compact', 112, 52]]) {
  for (const available of [false, true]) {
    const ink = '#23272E', rim = available ? '#159563' : '#B8B49B';
    const face = available ? '#EAF9F0' : '#F6F4E5';
    const r = h > 60 ? 18 : 13;
    await save(`slot-frame-${profile}${available ? '-available' : ''}`, w, h, `
  <rect x="2" y="5" width="${w - 4}" height="${h - 8}" rx="${r}" fill="#000000" fill-opacity=".08"/>
  <rect x="2" y="2" width="${w - 4}" height="${h - 8}" rx="${r}" fill="${rim}" stroke="${ink}" stroke-width="2"/>
  <rect x="3" y="3" width="${w - 6}" height="${h - 13}" rx="${r - 1}" fill="${face}"/>
  <rect x="8" y="8" width="${w - 16}" height="${h - 23}" rx="${r - 5}" stroke="${available ? '#159563' : '#C4C0A8'}" stroke-width="1.5" stroke-dasharray="6 5" stroke-linecap="round"/>
`, `Assembly slot: ${profile}; ${available ? 'available drop target' : 'normal'}. Fixed dash lengths and outline thickness; select matching aspect ratio.`, { profile, state: available ? 'available' : 'normal' });
  }
}

// A wide neutral button has its own silhouette and shallow bevel.
const button = (await readFile(new URL('svg/btn-check-mint.svg', root), 'utf8')).replaceAll('#689F90', '#C8C2AE').replaceAll('#F7FFF8', '#FFFDF7');
await writeFile(new URL('svg/btn-neutral-wide.svg', root), button);
for (const state of ['normal', 'hover', 'pressed', 'disabled']) {
  variants.push({ id: `btn-neutral-wide${state === 'normal' ? '' : `-${state}`}`, nativeSize: [264, 62], unityImageType: 'Sliced', preserveAspect: false, borderPixels: [56, 56, 56, 56], usage: 'Wide neutral actions: Try it yourself, reset, undo. Use Sprite Swap plus 9-slice for nearby sizes.', state });
}
await save('speech-tail-up', 24, 20, '<path d="M2 19 10 2Q11 0 13 2L22 19" fill="#FFFCEE"/><path d="M2 19 10 2Q11 0 13 2L22 19" stroke="#607452" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>', 'Mobile speech bubble pointing upward toward Buta. Separate from the sliced bubble body; do not stretch.');
await writeFile(new URL('variant-profiles.json', root), JSON.stringify({ version: 1, note: 'Supplementary Unity choices; existing web layout is unchanged. Sizes are logical pixels, exported PNGs are 2x.', assets: variants }, null, 2) + '\n');
console.log(`Prepared ${variants.length} tailored variants.`);

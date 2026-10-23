import { readdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function linkedNodePalette(svg) {
  const face = svg.match(/data-node-face="(#[\da-f]{6})"/i)?.[1]
    ?? svg.match(/<rect\b[^>]*y="3\.[\d]+"[^>]*fill="(#[\da-f]{6})"/i)?.[1];
  const next = svg.match(/data-node-next="(#[\da-f]{6})"/i)?.[1]
    ?? [...svg.matchAll(/<path\b[^>]*fill="(#[\da-f]{6})"/gi)].at(-1)?.[1];
  if (!face || !next) throw new Error('Missing Linked List data/next palette');
  return { face, next };
}

export function linkedNodeSvg(width, height, { face, next }, id) {
  const radius = Math.min(20, height * .23), split = Math.round(height * .66);
  const ink = '#' + [1, 3, 5].map(i => Math.round(parseInt(face.slice(i, i + 2), 16) * .76).toString(16).padStart(2, '0')).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none" preserveAspectRatio="none" data-ui-depth="soft" data-ui-border="tonal" data-node-face="${face}" data-node-next="${next}">
  <defs><clipPath id="${id}-face"><rect x="2" y="2" width="${width - 4}" height="${height - 8}" rx="${radius}"/></clipPath></defs>
  <g clip-path="url(#${id}-face)">
    <rect x="2" y="2" width="${width - 4}" height="${height - 8}" fill="${face}"/>
    <rect x="2" y="${split}" width="${width - 4}" height="${height - split}" fill="${next}"/>
    <path d="M2 ${split}H${width - 2}" stroke="${ink}" stroke-opacity=".65" stroke-width="1.4"/>
  </g>
  <rect x="2" y="2" width="${width - 4}" height="${height - 8}" rx="${radius}" stroke="${ink}" stroke-opacity=".65" stroke-width="1.8"/>
</svg>\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = new URL('../public/assets/hybrid-casual-ui/linked/svg/', import.meta.url);
  const files = (await readdir(root)).filter(name => /^node-block-.*\.svg$/.test(name));
  const palettes = new Map();
  for (const color of ['peach', 'mint', 'lavender', 'blue', 'red', 'yellow']) {
    palettes.set(color, linkedNodePalette(await readFile(new URL(`node-block-${color}.svg`, root), 'utf8')));
  }
  for (const name of files) {
    const svg = await readFile(new URL(name, root), 'utf8');
    const [, width, height] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    const color = name.match(/^node-block-([a-z]+)(?:-|\.)/)[1];
    await writeFile(new URL(name, root), linkedNodeSvg(Number(width), Number(height), palettes.get(color), name.slice(0, -4)));
  }
  console.log(`Updated ${files.length} Linked List blocks to one data/next divider.`);
}

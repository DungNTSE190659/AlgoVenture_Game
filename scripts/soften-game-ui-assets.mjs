import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Preserve sprite bounds, slicing and face colors; lighten only edges and depth.
function softenDepth(svg) {
  if (svg.includes('data-ui-depth="soft"')) return svg;
  const height = Number(svg.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)?.[1]);
  return svg.replace('<svg ', '<svg data-ui-depth="soft" ').replace(/<(?:rect|path|line|circle|ellipse)\b[^>]*>/g, tag => {
    if (tag.includes('stroke=')) {
      tag = tag.replace(/stroke-width="([\d.]+)"/, (_, width) => `stroke-width="${Math.max(.8, Number(width) * .65).toFixed(2)}"`);
      if (tag.includes('stroke-opacity=')) tag = tag.replace(/stroke-opacity="([\d.]+)"/, (_, opacity) => `stroke-opacity="${(Number(opacity) * .65).toFixed(3)}"`);
      else tag = tag.replace(/stroke="[^"]+"/, match => `${match} stroke-opacity="0.65"`);
    }
    // Shadow rectangles sit below the outline and never contain text.
    if (tag.startsWith('<rect') && /y="[56]"/.test(tag) && /(?:fill-opacity|opacity)="[\d.]+"/.test(tag)) {
      tag = tag.replace(/y="[56]"/, 'y="4"').replace(/((?:fill-opacity|opacity)=)"([\d.]+)"/, (_, attr, opacity) => `${attr}"${(Number(opacity) * .45).toFixed(3)}"`);
    }
    // Extend the inset face slightly to leave a shallower bottom bevel.
    if (tag.startsWith('<rect') && /y="3(?:\.[\d]+)?"/.test(tag) && /fill="#[\da-f]+"/i.test(tag)) {
      tag = tag.replace(/height="([\d.]+)"/, (_, faceHeight) => `height="${Math.min(Number(faceHeight) + 3, height - 8).toFixed(2)}"`);
    }
    return tag;
  });
}

// Choose the outline from the main face, rather than a shared dark ink.
export function softenGameUiSvg(svg) {
  const softened = softenDepth(svg);
  if (softened.includes('data-ui-border="tonal"')) return softened;
  const rects = [...softened.matchAll(/<rect\b[^>]*>/g)].map(match => match[0]);
  const faces = rects.filter(tag => /fill="#[\da-f]{6}"/i.test(tag) && !/(?:fill-opacity|opacity)=/.test(tag));
  const face = faces.find(tag => /\by="3(?:\.[\d]+)?"/.test(tag)) ?? faces[1] ?? faces[0];
  const color = face?.match(/fill="(#[\da-f]{6})"/i)?.[1] ?? softened.match(/<path\b[^>]*fill="(#[\da-f]{6})"/i)?.[1];
  if (!color) return softened;
  const outline = '#' + [1, 3, 5].map(index => Math.round(parseInt(color.slice(index, index + 2), 16) * .76).toString(16).padStart(2, '0')).join('');
  return softened.replace('<svg ', '<svg data-ui-border="tonal" ').replace(/\bstroke="(#[\da-f]{6})"/gi, (attribute, stroke) => {
    // Keep the white highlight that gives buttons their soft rounded face.
    return stroke.toUpperCase() === '#FFFFFF' ? attribute : `stroke="${outline}"`;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let changed = 0;
  const exports = [];
  for (const folder of ['linked/svg', 'linked/winter/svg', 'tree/svg', 'linked/map/svg', 'tree/map/svg', 'atlas/svg']) {
    const root = new URL(`../public/assets/hybrid-casual-ui/${folder}/`, import.meta.url);
    for (const name of await readdir(root)) {
      const pattern = folder.includes('/map/') || folder === 'atlas/svg'
        ? /^(sheet(?:-|\.)|caption-|panel-|button-|number-|badge-)/
        : /^(node-|slot-|panel-|btn-|button-|token-|badge-|null-|speech-tail|label\.|score\.|harvest-chip\.|basket(?:-|\.)|remove-tray(?:-|\.))/;
      if (!pattern.test(name) || !name.endsWith('.svg')) continue;
      const file = new URL(name, root), svg = await readFile(file, 'utf8');
      const softened = softenGameUiSvg(svg);
      if (softened !== svg) { await writeFile(file, softened); changed++; }
      if (process.argv.includes('--png')) {
        const png = new URL(`../png/${name.replace('.svg', '.png')}`, root);
        try { await access(png); exports.push({ svg: softened, png }); } catch { /* SVG-only asset. */ }
      }
    }
  }
  console.log(`Softened ${changed} Tree and Linked List UI sprites.`);
  if (exports.length) {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ channel: 'chrome' });
    const page = await browser.newPage({ deviceScaleFactor: 2 });
    for (const { svg, png } of exports) {
      const [, width, height] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
      await page.setViewportSize({ width: Math.max(320, Math.ceil(Number(width))), height: Math.max(240, Math.ceil(Number(height))) });
      await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`);
      const buffer = await page.locator('svg').screenshot({ omitBackground: true });
      for (let attempt = 0; ; attempt++) {
        try { await writeFile(fileURLToPath(png), buffer); break; }
        catch (error) {
          if (attempt >= 3 || !['UNKNOWN', 'EBUSY', 'EPERM'].includes(error.code)) throw error;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    await browser.close();
    console.log(`Updated ${exports.length} matching PNG exports.`);
  }
}

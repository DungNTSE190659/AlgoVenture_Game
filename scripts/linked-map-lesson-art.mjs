// Small toy illustrations, authored as vectors rather than font-like glyphs.
const ink = '#344337';
const palette = {
  peach: ['#F5AC79', '#C97B4F', '#FFD7AE'],
  mint: ['#79D8B4', '#3D9F7C', '#C5F4D8'],
  purple: ['#B6A0EC', '#8068BC', '#E0D1FF'],
};
function block(x, y, w = 28, h = 26, color = 'peach') {
  const [face, lip, light] = palette[color];
  return `<rect x="${x}" y="${y + 4}" width="${w}" height="${h}" rx="7" fill="${lip}" stroke="${ink}" stroke-width="2.6"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h - 1}" rx="7" fill="${face}" stroke="${ink}" stroke-width="2.6"/>
  <path d="M${x + 7} ${y + 5}H${x + w - 7}" stroke="${light}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="${x + w / 2}" cy="${y + h / 2 + 1}" r="4" fill="#FFF9E2" stroke="${ink}" stroke-width="2"/>`;
}
const rope = d => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#EFC879" stroke-width="6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#FFF0BF" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>`;
const spark = (x, y) => `<path d="M${x} ${y - 7}V${y + 7}M${x - 7} ${y}H${x + 7}" stroke="#FFF5B4" stroke-width="4" stroke-linecap="round"/>`;
const arrow = (d, head) => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="12" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#67D5EE" stroke-width="7" stroke-linecap="round"/><path d="${head}" fill="#67D5EE" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>`;

export function lessonArt(id) {
  const shadow = '<ellipse cx="48" cy="83" rx="36" ry="6" fill="#253C2B" opacity=".18"/>';
  const art = {
    'linked-list': rope('M32 47C43 38 53 60 64 49') + block(8, 35, 28, 30, 'peach') + block(60, 34, 28, 30, 'mint') +
      '<circle cx="49" cy="47" r="10" fill="#55CCE9" stroke="#344337" stroke-width="2.8"/><path d="m45 43 8 8m0-8-8 8" stroke="#225C70" stroke-width="3" stroke-linecap="round"/>' + spark(48, 20),
    'linked-traversal': rope('M20 67Q48 86 77 65') + block(6, 56, 23, 21, 'peach') + block(66, 55, 23, 21, 'mint') +
      '<path d="M31 17h22v25l16 7q6 3 5 12l-2 6H30q-8 0-8-9V43l8-3Z" fill="#E6AC65" stroke="#344337" stroke-width="3" stroke-linejoin="round"/><path d="M30 62h43v7H28q-6 0-6-7Z" fill="#9C6848" stroke="#344337" stroke-width="2.5"/><path d="M33 22h17v8H33Z" fill="#FBE1AA"/><path d="m36 37 13 2m-13 6 13 2" stroke="#FFF3D5" stroke-width="3" stroke-linecap="round"/>' + spark(79, 27),
    'linked-search': block(15, 23, 38, 39, 'purple') +
      '<path d="m57 60 23 23" stroke="#344337" stroke-width="17" stroke-linecap="round"/><path d="m57 60 23 23" stroke="#E6AA63" stroke-width="11" stroke-linecap="round"/><circle cx="46" cy="42" r="25" fill="#8BE6F1" fill-opacity=".65" stroke="#344337" stroke-width="4"/><circle cx="46" cy="42" r="20" stroke="#FFFBE2" stroke-width="4"/><path d="M32 35q4-8 13-9" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>' + spark(77, 17),
    'linked-insertion': rope('M24 68H72') + block(5, 56, 23, 22, 'peach') + block(68, 56, 23, 22, 'purple') + block(33, 10, 30, 29, 'mint') +
      '<path d="M42 46h12v9h8L48 69 34 55h8Z" fill="#66D983" stroke="#344337" stroke-width="2.7" stroke-linejoin="round"/>' + spark(16, 24) + spark(79, 35),
    'linked-deletion': rope('M18 65Q48 92 79 65') + block(5, 57, 23, 21, 'mint') + block(68, 57, 23, 21, 'purple') +
      `<g transform="rotate(-14 46 32)">${block(31, 16, 32, 31, 'peach')}</g>` +
      '<circle cx="68" cy="25" r="15" fill="#EE7E72" stroke="#344337" stroke-width="3"/><path d="M61 25h14" stroke="#FFFBE7" stroke-width="5" stroke-linecap="round"/><path d="m39 57 2-5m9 4 1-5" stroke="#FFF0BF" stroke-width="3" stroke-linecap="round"/>',
    'linked-reversal': block(9, 35, 28, 28, 'peach') + block(59, 35, 28, 28, 'mint') +
      arrow('M22 24Q48 2 75 24', 'M68 12 82 27 62 29Z') +
      arrow('M75 75Q48 94 22 75', 'M29 86 14 73 34 69Z'),
  }[id];
  if (!art) throw new Error(`Unknown lesson illustration: ${id}`);
  return shadow + art;
}

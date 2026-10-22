// Original vector miniatures matching the colorful toy icon family.
const ink = '#344337';
const node = (x, y, r, color) => `<circle cx="${x}" cy="${y + 3}" r="${r}" fill="#237B59" stroke="${ink}" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="${ink}" stroke-width="2.5"/><path d="M${x-r*.5} ${y-r*.5}q${r*.5} -4 ${r} 0" stroke="#FFF4D6" stroke-width="3" stroke-linecap="round"/>`;
const wood = d => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#D9A15F" stroke-width="5" stroke-linecap="round"/>`;
export function treeLessonArt(id) {
  const base = '<ellipse cx="48" cy="85" rx="36" ry="6" fill="#253C2B" opacity=".16"/>' + wood('M48 26V43M48 35 22 58M48 35 74 58M22 58 10 78M22 58 36 78M74 58 62 78M74 58 87 78') + node(48,24,15,'#F7B83D') + node(22,57,12,'#35C990') + node(74,57,12,'#39B8F2');
  if(id==='tree-basics') return base + '<path d="M48 18q-7-16-18-8 0 13 18 14 15-1 17-15-12-7-17 9" fill="#64DB8D" stroke="#344337" stroke-width="2.5"/>';
  if(id==='tree-traversal') return base + '<path d="M9 77Q48 98 86 77" stroke="#FFF0B0" stroke-width="5" stroke-dasharray="3 6" stroke-linecap="round"/><path d="m40 44 10 2-2 16 11 7v8H34V61l6-2Z" fill="#F4BB72" stroke="#344337" stroke-width="2.5"/><path d="M34 74h25" stroke="#965D39" stroke-width="5"/>';
  if(id==='bst') return base + node(10,78,8,'#FF9658') + node(87,78,8,'#B777ED') + '<path d="m22 19-9 7 9 7m52-14 9 7-9 7" stroke="#FFF0B0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
  if(id==='bst-search') return base + '<path d="m65 65 18 18" stroke="#344337" stroke-width="15" stroke-linecap="round"/><path d="m65 65 18 18" stroke="#E6AA63" stroke-width="9" stroke-linecap="round"/><circle cx="51" cy="51" r="23" fill="#8BE6F1" fill-opacity=".65" stroke="#344337" stroke-width="3"/><circle cx="51" cy="51" r="18" stroke="#FFFAE4" stroke-width="3"/>';
  if(id==='bst-insert') return base + node(10,78,9,'#B777ED') + '<circle cx="73" cy="76" r="17" fill="#35C990" stroke="#344337" stroke-width="3"/><path d="M73 67v18m-9-9h18" stroke="#FFFBE9" stroke-width="5" stroke-linecap="round"/>';
  return base + '<circle cx="72" cy="74" r="17" fill="#F27D72" stroke="#344337" stroke-width="3"/><path d="M62 74h20" stroke="#FFFBE9" stroke-width="5" stroke-linecap="round"/>';
}

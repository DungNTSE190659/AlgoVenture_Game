import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { nextTreeSignal } from '../engine/treeSignals';
import type { TreeBoard, TreeStep, TraversalOrder } from '../engine/tree';

type Props = { positions: Record<number, { x: number; y: number }>; scene: TreeBoard; step?: TreeStep; order?: TraversalOrder; paused: boolean; speed: number };

export default function TreeSignalBranches({ positions, scene, step, order, paused, speed }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, '');
  const [size, setSize] = useState({ width: 100, height: 100 });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    if (svg.current) observer.observe(svg.current);
    return () => observer.disconnect();
  }, []);
  const route = nextTreeSignal(scene, step, order);
  const point = (slot: number) => ({ x: positions[slot].x * size.width / 100, y: positions[slot].y * size.height / 100 });
  const routePoints = route.filter(slot => positions[slot]).map(point);
  const d = routePoints.map((p, index) => `${index ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  return <svg ref={svg} className="tree-branches tree-signal-branches" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true"
    data-order={order ?? 'operation'} data-route={route.join(',')} data-paused={paused}
    style={{ '--signal-speed': speed, '--signal-play-state': paused ? 'paused' : 'running' } as CSSProperties}>
    <defs>{['normal', 'active', 'visited'].map(state => <pattern key={state} id={`${id}-${state}`} width="18" height="10" patternUnits="userSpaceOnUse">
      <image href={`/assets/hybrid-casual-ui/tree/svg/rope-helix-${state}.svg`} width="18" height="10" />
    </pattern>)}</defs>
    {Object.keys(positions).map(key => {
      const child = Number(key), parent = Math.floor((child - 1) / 2);
      if (!child || !positions[parent]) return null;
      const connected = scene.links.includes(child) && scene.nodes[parent] !== undefined;
      const hop = route.findIndex((slot, i) => i < route.length - 1 && Math.max(slot, route[i + 1]) === child);
      const active = connected && hop >= 0;
      const start = point(active ? route[hop] : parent), end = point(active ? route[hop + 1] : child);
      if (!connected) return <path key={child} d={`M${start.x} ${start.y}L${end.x} ${end.y}`} className="tree-rope-empty" />;
      const length = Math.hypot(end.x - start.x, end.y - start.y);
      const state = active ? 'active' : scene.visited.includes(child) && scene.visited.includes(parent) ? 'visited' : 'normal';
      return <g key={child} data-edge={child} data-flow={active ? `${route[hop]}>${route[hop + 1]}` : undefined}
        transform={`translate(${start.x} ${start.y}) rotate(${Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI})`}>
        <defs><clipPath id={`${id}-clip-${child}`}><rect y="-5" width={length} height="10" rx="5" /></clipPath></defs>
        <g clipPath={`url(#${id}-clip-${child})`}><rect className={active ? 'tree-rope-flow' : ''} x="-18" y="-5" width={length + 36} height="10" fill={`url(#${id}-${state})`} /></g>
      </g>;
    })}
    {d && <path key={route.join(',')} d={d} pathLength="100" className="tree-signal-packet" />}
  </svg>;
}

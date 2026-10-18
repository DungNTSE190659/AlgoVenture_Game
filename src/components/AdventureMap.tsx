import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, AudioLines, CircleDot, Check, Eye, Flag, Footprints, Gamepad2, GitMerge, Layers3, LockKeyhole, Search, Shuffle, Trophy, ListOrdered, Link, Network, Route, ScanSearch, TreePine, GalleryVerticalEnd } from "lucide-react";
import World from "./World";
import Pig from "./Pig";
import { REGIONS, ARRAY_ROUTES, lessonPrerequisites, lessonAvailable, lessonUnlocked, regionUnlocked, type ArrayRouteId, type RegionId, type TrackId } from "../engine/learningTrack";
import type { Mode } from "../engine/gameConfig";
import { gameAudio } from "../audio/gameAudio";
import { useMapAudio } from "../audio/useMapAudio";

type Props = {
  region: RegionId;
  arrayRoute: ArrayRouteId;
  onArrayRoute: (id: ArrayRouteId) => void;
  onWorld: () => void;
  onStart: (mode: Mode) => void;
  sound: boolean;
  onSound: () => void;
  completed: Partial<Record<TrackId, boolean>>;
  algorithm: TrackId;
  onAlgorithm: (algorithm: TrackId) => void;
  arrivalFrom: TrackId | null;
  onArrived: () => void;
};
const icons = { bubble: CircleDot, selection: Search, insertion: Layers3, merge: GitMerge, quick: Shuffle, array: Layers3, stack: GalleryVerticalEnd, queue: ListOrdered, "linked-list": Link, "tree-basics": TreePine, bst: TreePine, "bst-search": Search, "bst-insert": GitMerge, "bst-delete": TreePine, linear: ScanSearch, binary: Search, "graph-basics": Network, dfs: Route, bfs: Network, dijkstra: Flag };
function geometry(count: number) {
  const point = (index: number) => ({ x: index % 2 ? 270 : 130, y: 160 + (count - 1 - index) * 220 });
  const curve = (from: number, to: number) => {
    const a = point(from), b = point(to), middle = (a.y + b.y) / 2;
    return `M${a.x} ${a.y} C${a.x} ${middle} ${b.x} ${middle} ${b.x} ${b.y}`;
  };
  const positionOnRoad = (from: number, to: number, t: number) => {
    const a = point(from), b = point(to), q = 1 - t;
    return {
      x: q ** 3 * a.x + 3 * q * q * t * a.x + 3 * q * t * t * b.x + t ** 3 * b.x,
      y: q ** 3 * a.y + 3 * q * q * t * (a.y + b.y) / 2 + 3 * q * t * t * (a.y + b.y) / 2 + t ** 3 * b.y,
    };
  };
  return { point, curve, positionOnRoad, height: 160 + (count - 1) * 220 + 180 };
}

export default function AdventureMap({ region, arrayRoute, onArrayRoute, onWorld, onStart, sound, onSound, completed, algorithm, onAlgorithm, arrivalFrom, onArrived }: Props) {
  const territory = REGIONS.find(item => item.id === region)!;
  const route = region === "arrays" ? ARRAY_ROUTES.find(item => item.id === arrayRoute)! : null;
  const TRACK = route?.lessons ?? territory.lessons;
  const { point, curve, positionOnRoad, height: worldHeight } = geometry(TRACK.length);
  const initial = Math.max(0, TRACK.findIndex(item => item.id === (arrivalFrom ?? algorithm)));
  const [selected, setSelected] = useState(initial);
  const [location, setLocation] = useState(initial);
  const [traveler, setTraveler] = useState(point(initial));
  const [walking, setWalking] = useState(false);
  const mapAudio = useMapAudio();
  const viewport = useRef<HTMLDivElement>(null);
  const animation = useRef(0);
  const arrivalHandled = useRef(false);
  const walkingRef = useRef(false);
  const openThrough = TRACK.reduce((last, item, index) => lessonUnlocked(item.id, completed) ? index : last, -1);
  const active = TRACK[selected];
  const locked = selected > openThrough;
  const available = lessonAvailable(active.id);
  const previous = lessonPrerequisites(active.id).at(-1);
  const finishedCount = TRACK.filter(item => completed[item.id]).length;

  function center(y: number, smooth = true) {
    const area = viewport.current;
    if (!area) return;
    area.scrollTo({ top: y - area.clientHeight * .55, behavior: smooth ? "smooth" : "instant" });
  }
  useLayoutEffect(() => {
    center(point(location).y, false);
    const area = viewport.current;
    if (!area) return;
    const observer = new ResizeObserver(() => { if (!walkingRef.current) center(point(location).y, false); });
    observer.observe(area);
    return () => observer.disconnect();
  }, [location]);
  useEffect(() => () => cancelAnimationFrame(animation.current), []);

  function travel(destination: number) {
    if (walkingRef.current) return;
    gameAudio.unlock();
    gameAudio.play(destination > openThrough ? "locked" : "island-select");
    setSelected(destination);
    if (destination > openThrough) {
      center(point(destination).y);
      return;
    }
    const id = TRACK[destination].id;
    onAlgorithm(id);
    if (destination === location) { center(point(destination).y); return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      mapAudio.arrive();
      setLocation(destination);
      setTraveler(point(destination));
      center(point(destination).y, false);
      return;
    }
    walkingRef.current = true;
    setWalking(true);
    mapAudio.begin();
    const origin = location;
    const distance = Math.abs(destination - origin);
    const direction = Math.sign(destination - origin);
    const started = performance.now();
    // Visit every intermediate island, including when returning to an older lesson.
    function frame(now: number) {
      mapAudio.tick(now - started);
      const progress = Math.min(distance, (now - started) / 1450);
      const leg = Math.min(distance - 1, Math.floor(progress));
      const t = progress >= distance ? 1 : progress - leg;
      const from = origin + direction * leg;
      const next = positionOnRoad(from, from + direction, t);
      setTraveler(next);
      center(next.y, false);
      if (progress < distance) animation.current = requestAnimationFrame(frame);
      else {
        walkingRef.current = false;
        setWalking(false);
        setLocation(destination);
        mapAudio.arrive();
      }
    }
    animation.current = requestAnimationFrame(frame);
  }
  useEffect(() => {
    if (!arrivalFrom || arrivalHandled.current) return;
    arrivalHandled.current = true;
    const origin = TRACK.findIndex(item => item.id === arrivalFrom);
    if (origin < 0) { onArrived(); return; }
    const nextPlayable = TRACK.findIndex((item, index) => index > origin && index <= openThrough && lessonAvailable(item.id));
    const destination = nextPlayable >= 0 ? nextPlayable : Math.min(origin + 1, openThrough);
    const timer = window.setTimeout(() => { travel(destination); onArrived(); }, 350);
    return () => { window.clearTimeout(timer); arrivalHandled.current = false; };
  }, [arrivalFrom]);

  function start(mode: Mode) {
    if (walking || locked || !available) return;
    const id = active.id;
    if (lessonAvailable(id)) {
      onAlgorithm(id);
      onStart(mode);
    }
  }

  return <main className={`adventure-map learning-map region-${region} ${route ? "has-route-picker" : ""} ${walking || locked || !available ? "map-has-status" : ""}`}>
    <World map />
    <header className="track-header">
      <button className="track-back" aria-label="Bản đồ thế giới" onClick={onWorld} disabled={walking}><ArrowLeft size={20} /></button>
      <div><h1>{territory.name}</h1></div>
      <button className="track-sound" onClick={onSound} aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"} aria-pressed={sound}><AudioLines size={20} />{!sound && <span />}</button>
    </header>
      {route && <nav className="track-routes" aria-label="Chọn lộ trình trong Mảng">
        {ARRAY_ROUTES.map(item => {
          const Icon = item.id === "sort" ? Shuffle : Search;
          const count = item.lessons.filter(lesson => completed[lesson.id]).length;
          return <button key={item.id} className={`track-route ${item.id === arrayRoute ? "route-active" : ""}`} aria-label={`Lộ trình ${item.name}`} aria-pressed={item.id === arrayRoute} disabled={walking} onClick={() => onArrayRoute(item.id)}>
            <Icon size={19} /><span><strong>{item.name}</strong><small>{item.description}</small></span><b>{count}/{item.lessons.length}</b>
          </button>;
        })}
      </nav>}
      <div className="track-progress" aria-label="Tiến trình"><span><Flag size={15} /></span><span><Trophy size={15} /> {finishedCount}/{TRACK.length}</span><div><i style={{ width: `${finishedCount / TRACK.length * 100}%` }} /></div></div>
      <div className="track-viewport" ref={viewport} aria-label={`Bản đồ lộ trình ${route?.name ?? territory.name}, cuộn để khám phá`} tabIndex={0}>
        <div className="track-world" style={{ height: worldHeight }}>
          <div className="track-destination" aria-hidden="true"><Flag size={20} /></div>
          <svg className="track-roads" style={{ height: worldHeight }} viewBox={`0 0 400 ${worldHeight}`} preserveAspectRatio="none" aria-hidden="true">
            {TRACK.slice(1).map((_, index) => <g key={index} className={index < openThrough ? "road-open" : "road-locked"}>
              <path className="road-shadow" d={curve(index, index + 1)} /><path className="road-fill" d={curve(index, index + 1)} /><path className="road-dashes" d={curve(index, index + 1)} />
            </g>)}
          </svg>
          {TRACK.map((item, index) => {
            const Icon = icons[item.id], p = point(index), isLocked = index > openThrough;
            return <div key={item.id} className={`track-stop ${isLocked ? "stop-locked" : "stop-open"} ${selected === index ? "stop-selected" : ""} ${completed[item.id] ? "stop-complete" : ""}`} style={{ left: `${p.x / 4}%`, top: p.y, "--stop-color": item.color, "--stop-dark": item.dark } as CSSProperties}>
              <span className="stop-land" aria-hidden="true"><span>✿</span><i /><i /></span>
              <button className="stop-button" aria-label={item.name} aria-pressed={selected === index} disabled={walking} onClick={() => travel(index)} onFocus={event => { if (event.currentTarget.matches(":focus-visible")) center(p.y); }}>
                <span className="stop-number">{String(index + 1).padStart(2, "0")}</span><Icon size={34} strokeWidth={2.3} />
                <span className="stop-badge">{completed[item.id] ? <Check size={15} strokeWidth={3} /> : isLocked ? <LockKeyhole size={13} /> : <Flag size={13} />}</span>
              </button>
              <div className="stop-caption"><strong>{item.name}</strong></div>
            </div>;
          })}
          {regionUnlocked(region, completed) && <div className={`track-buta ${walking ? "buta-walking" : "buta-resting"}`} style={{ left: `${traveler.x / 4}%`, top: traveler.y + 10 }} role="img" aria-label={walking ? `Buta đang đi tới ${active.name}` : `Buta đang ở ${TRACK[location].name}`}>
            <div className="buta-body"><Pig mood={walking ? "happy" : "pointing"} /></div>
          </div>}
          <span className="track-decoration deco-one" style={{ top: worldHeight * .62 }} aria-hidden="true">✿</span><span className="track-decoration deco-two" style={{ top: worldHeight * .4 }} aria-hidden="true">✿</span><span className="track-decoration deco-three" style={{ top: worldHeight * .27 }} aria-hidden="true">✦</span>
        </div>
      </div>
      {regionUnlocked(region, completed) && <button className="track-locate" onClick={() => center(traveler.y)} aria-label="Về vị trí Buta"><Footprints size={18} /></button>}
      <section className={`track-sheet ${locked ? "sheet-locked" : ""}`} aria-labelledby="track-sheet-title" aria-busy={walking}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-heading"><span className="sheet-number" style={{ background: active.color }}>{String(selected + 1).padStart(2, "0")}</span><div><h2 id="track-sheet-title" title={active.group}>{active.name}</h2></div>{locked ? <LockKeyhole className="sheet-status" size={21} /> : completed[active.id] ? <span className="sheet-done" aria-label="Đã vượt"><Check size={17} /></span> : <span className="sheet-status"><Flag size={20} /></span>}</div>
        {(walking || locked || !available) && <p className="sheet-description" aria-live="polite">{walking ? "Buta đang đi…" : locked ? `Xong ${previous?.name} để mở.` : "Đang phát triển."}</p>}
        <div className="sheet-actions"><button className="sheet-demo" aria-label="Xem demo" onClick={() => start("demo")} disabled={locked || walking || !available}><Eye size={20} /> Demo</button><button className="sheet-challenge" onClick={() => start("play")} disabled={locked || walking || !available}><Gamepad2 size={20} /> Thử thách<ArrowRight size={17} /></button></div>
      </section>
  </main>;
}

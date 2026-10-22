import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, AudioLines, Check, ChevronLeft, ChevronRight, Compass, Flag, GraduationCap, LockKeyhole, UserRound } from "lucide-react";
import ClassroomHub from "./ClassroomHub";
import LearnerProfile from "./LearnerProfile";
import Pig from "./Pig";
import RegionLandmark from "./RegionLandmark";
import { gameAudio } from "../audio/gameAudio";
import { useMapAudio } from "../audio/useMapAudio";
import { REGIONS, regionComplete, regionUnlocked, type Progress, type RegionId, type TrackId } from "../engine/learningTrack";

type Props = {
  completed: Progress;
  sound: boolean;
  onSound: () => void;
  onEnter: (id: RegionId) => void;
  location: RegionId;
  onLocation: (id: RegionId) => void;
  arrivalFrom: RegionId | null;
  onArrived: () => void;
  onContinue: (id: TrackId) => void;
};
const colors = ["#D4E0B5", "#E6D4AD", "#C4DCC0", "#D0CCDC"];

function RegionTerrain({ index }: { index: number }) {
  return <svg className="atlas-terrain" viewBox="0 0 600 550" fill="none" aria-hidden="true">
    <ellipse cx="306" cy="476" rx="241" ry="33" fill="#6F9E94" opacity=".12" />
    <path d="M82 158Q130 65 256 93T421 90Q542 113 558 242T518 424Q432 497 309 475T143 471Q38 434 43 319T82 158Z" fill="#B7C5A0" transform="translate(0 12)" />
    <path d="M82 158Q130 65 256 93T421 90Q542 113 558 242T518 424Q432 497 309 475T143 471Q38 434 43 319T82 158Z" fill={colors[index]} stroke="#FFF7DC" strokeWidth="9" />
    <path d="M71 350Q128 297 210 344T386 364T541 342L520 423Q430 492 310 472T143 468Q82 441 71 350Z" fill="#A8BF8A" opacity=".22" />
    <path d="M462 134Q425 196 469 248T484 349Q458 402 493 446" stroke="#F8F1D4" strokeWidth="37" strokeLinecap="round" />
    <path d="M462 134Q425 196 469 248T484 349Q458 402 493 446" stroke="#B5D4D0" strokeWidth="25" strokeLinecap="round" />
    <path className="topic-road-bed" d="M100 428C112 365 242 422 300 350" stroke="#C4AC7C" strokeWidth="24" strokeLinecap="round" />
    <path d="M100 428C112 365 242 422 300 350" stroke="#F4E5BE" strokeWidth="20" strokeLinecap="round" />
    <path d="M100 428C112 365 242 422 300 350" stroke="#FFF9E5" strokeWidth="3" strokeDasharray="2 11" strokeLinecap="round" />
    <path d="m469 291 24 8m-28 3 24 8m-28 3 24 8" stroke="#BEA880" strokeWidth="6" strokeLinecap="round" />
    <g stroke="#8CA06E" strokeWidth="4" fill="#AEC88D"><path d="m87 249 21-43 22 43h-16v21h-11v-21ZM376 429l19-41 21 41h-15v17h-11v-17Z" /></g>
    <g fill="#FFF8D8"><circle cx="153" cy="411" r="5" /><circle cx="160" cy="403" r="5" /><circle cx="167" cy="411" r="5" /><circle cx="396" cy="185" r="4" /><circle cx="402" cy="179" r="4" /><circle cx="408" cy="185" r="4" /></g>
    <g fill="#A0B47E"><ellipse cx="225" cy="450" rx="16" ry="6" /><ellipse cx="420" cy="368" rx="12" ry="5" /></g>
  </svg>;
}

export default function WorldMap({ completed, sound, onSound, onEnter, location, onLocation, arrivalFrom, onArrived, onContinue }: Props) {
  const [classroomOpen, setClassroomOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const initial = REGIONS.findIndex(region => region.id === location);
  const [selected, setSelected] = useState(initial);
  const audibleTopic = useRef(initial);
  const mapAudio = useMapAudio();
  const [walking, setWalking] = useState(false);
  const [traveler, setTraveler] = useState({ x: 300, y: 350 });
  const [walkingIn, setWalkingIn] = useState(initial);
  const carousel = useRef<HTMLDivElement>(null);
  const animation = useRef(0);
  const walkingRef = useRef(false);
  const suppressedClick = useRef(false);
  const scrollTarget = useRef<number | null>(null);
  const pointerStart = useRef<{ x: number; y: number; scroll: number } | null>(null);
  const position = useRef(arrivalFrom ?? location);
  const territory = REGIONS[selected];
  const locked = !regionUnlocked(territory.id, completed);
  const finished = territory.lessons.filter(lesson => completed[lesson.id]).length;

  function announceTopic(index: number) {
    const previous = audibleTopic.current;
    audibleTopic.current = index;
    if (index === previous) return;
    gameAudio.unlock();
    gameAudio.play(index > previous ? "topic-next" : "topic-prev");
  }

  function showTopic(index: number, smooth = true) {
    if (walkingRef.current) return;
    const target = Math.max(0, Math.min(REGIONS.length - 1, index));
    const area = carousel.current;
    if (!area) return;
    announceTopic(target);
    setSelected(target);
    area.dataset.selected = String(target);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = smooth && !reduced && Math.abs(area.scrollLeft - target * area.clientWidth) > 1;
    scrollTarget.current = animate ? target : null;
    area.scrollTo({ left: target * area.clientWidth, behavior: animate ? "smooth" : "instant" });
  }
  useLayoutEffect(() => {
    const area = carousel.current;
    if (!area) return;
    area.scrollLeft = initial * area.clientWidth;
    let width = area.clientWidth;
    const observer = new ResizeObserver(() => {
      // Locked-topic copy changes the carousel height. Only a width change
      // requires recentering; height changes must not interrupt smooth scrolling.
      if (area.clientWidth === width) return;
      width = area.clientWidth;
      scrollTarget.current = null;
      // A rotation keeps the selected topic centered instead of landing between maps.
      const index = Number(area.dataset.selected ?? initial);
      area.scrollTo({ left: index * area.clientWidth, behavior: "instant" });
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, []);
  useEffect(() => () => cancelAnimationFrame(animation.current), []);

  function travel(index: number, enterAfter: boolean) {
    if (walkingRef.current || !regionUnlocked(REGIONS[index].id, completed)) return;
    const destination = REGIONS[index].id;
    if (destination === position.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gameAudio.unlock();
      gameAudio.play(destination === position.current ? "enter" : "arrive");
      position.current = destination;
      onLocation(destination);
      onArrived();
      if (enterAfter) onEnter(destination);
      return;
    }
    showTopic(index, false);
    setWalkingIn(index);
    setTraveler({ x: 100, y: 428 });
    setWalking(true);
    walkingRef.current = true;
    mapAudio.begin();
    const started = performance.now();
    function frame(now: number) {
      mapAudio.tick(now - started);
      const t = Math.min(1, (now - started) / 1400), q = 1 - t;
      setTraveler({ x: q ** 3 * 100 + 3 * q * q * t * 112 + 3 * q * t * t * 242 + t ** 3 * 300, y: q ** 3 * 428 + 3 * q * q * t * 365 + 3 * q * t * t * 422 + t ** 3 * 350 });
      if (t < 1) animation.current = requestAnimationFrame(frame);
      else {
        position.current = destination;
        scrollTarget.current = null;
        walkingRef.current = false;
        setWalking(false);
        mapAudio.arrive();
        onLocation(destination);
        onArrived();
        if (enterAfter) onEnter(destination);
      }
    }
    animation.current = requestAnimationFrame(frame);
  }
  useEffect(() => {
    if (!arrivalFrom) return;
    const timer = window.setTimeout(() => travel(initial, false), 350);
    return () => clearTimeout(timer);
  }, [arrivalFrom]);

  return <main className={`adventure-map atlas-map ${locked || walking ? "atlas-has-status" : ""}`}>
    <header className="track-header atlas-header"><span className="atlas-compass"><Compass size={27} /></span><div><h1>Chủ đề</h1></div><button className="class-launch" onClick={() => setClassroomOpen(true)}><GraduationCap size={19} />Lớp học của tôi</button><button className="profile-launch" aria-label="Hồ sơ của tôi" onClick={() => setProfileOpen(true)}><UserRound size={18} /></button><button className="track-sound" onClick={onSound} aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"} aria-pressed={sound}><AudioLines size={20} />{!sound && <span />}</button></header>
    {classroomOpen && <ClassroomHub onClose={() => setClassroomOpen(false)} />}
    {profileOpen && <LearnerProfile completed={completed} onClose={() => setProfileOpen(false)} onClassrooms={() => { setProfileOpen(false); setClassroomOpen(true); }} onContinue={id => { setProfileOpen(false); onContinue(id); }} />}
    <div className="atlas-subtitle" aria-label={`Chủ đề ${selected + 1} trên ${REGIONS.length}`}><span>0{selected + 1} / 0{REGIONS.length}</span></div>
    <div className={`atlas-carousel ${walking ? "carousel-walking" : ""}`} ref={carousel} data-selected={selected} role="region" aria-label="Bản đồ chủ đề, vuốt trái phải để chuyển" aria-roledescription="carousel" onScroll={event => {
      const area = event.currentTarget;
      const index = Math.max(0, Math.min(REGIONS.length - 1, Math.round(area.scrollLeft / area.clientWidth)));
      if (walkingRef.current) return;
      // Keep the requested topic selected throughout an animated scroll. Otherwise
      // an immediate tap on Enter can open the old topic halfway through the slide.
      if (scrollTarget.current !== null) {
        if (Math.abs(area.scrollLeft - scrollTarget.current * area.clientWidth) > 1) return;
        scrollTarget.current = null;
      }
      announceTopic(index);
      setSelected(index);
      area.dataset.selected = String(index);
    }} onWheel={() => { scrollTarget.current = null; }} onKeyDown={event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      showTopic(selected + (event.key === "ArrowRight" ? 1 : -1));
    }} onPointerDown={event => { scrollTarget.current = null; pointerStart.current = { x: event.clientX, y: event.clientY, scroll: event.currentTarget.scrollLeft }; suppressedClick.current = false; }} onPointerMove={event => {
      const start = pointerStart.current;
      if (start && (Math.abs(start.x - event.clientX) > 10 || Math.abs(start.y - event.clientY) > 10)) suppressedClick.current = true;
      if (start && event.pointerType === "mouse" && suppressedClick.current && !walkingRef.current) {
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.style.scrollSnapType = "none";
        event.currentTarget.scrollLeft = start.scroll + start.x - event.clientX;
      }
    }} onPointerCancel={event => { pointerStart.current = null; suppressedClick.current = true; event.currentTarget.style.scrollSnapType = ""; }} onPointerUp={event => {
      const start = pointerStart.current;
      pointerStart.current = null;
      if (start && event.pointerType === "mouse" && suppressedClick.current) {
        event.currentTarget.style.scrollSnapType = "";
        const delta = start.x - event.clientX;
        const index = Math.abs(delta) > 45 ? Math.round(start.scroll / event.currentTarget.clientWidth) + Math.sign(delta) : Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth);
        showTopic(index);
      }
    }} onClickCapture={event => {
      if (suppressedClick.current) { event.preventDefault(); event.stopPropagation(); suppressedClick.current = false; }
    }}>
      {REGIONS.map((region, index) => {
        const isLocked = !regionUnlocked(region.id, completed), done = regionComplete(region.id, completed);
        const showButa = walking ? walkingIn === index : position.current === region.id;
        return <section key={region.id} className={`atlas-slide ${selected === index ? "slide-selected" : ""}`} role="group" aria-roledescription="slide" aria-label={`${index + 1} trên ${REGIONS.length}: ${region.name}`}>
          <div className={`atlas-canvas topic-${region.id} ${isLocked ? "region-locked" : "region-open"}`} style={{ "--region-color": region.color } as CSSProperties}>
            <button className="atlas-region" aria-label={region.name} tabIndex={selected === index ? 0 : -1} disabled={walking || isLocked} onClick={() => travel(index, true)}>
              <RegionTerrain index={index} />
              <span className="atlas-landmark"><RegionLandmark region={region.id} /></span>
              <span className={`topic-gateway ${done ? "status-done" : ""}`} aria-hidden="true">{done ? <Check size={20} /> : isLocked ? <LockKeyhole size={19} /> : <Flag size={20} />}</span>
            </button>
            {showButa && <div className={`atlas-buta ${walking ? "buta-walking" : ""}`} style={{ left: `${(walking ? traveler.x : 300) / 6}%`, top: `${(walking ? traveler.y : 350) / 5.5}%` }} role="img" aria-label={walking ? `Buta đang đi tới ${region.name}` : `Buta đang ở ${region.name}`}><div className="buta-body"><Pig mood={walking ? "happy" : "pointing"} /></div></div>}
          </div>
        </section>;
      })}
    </div>
    <nav className="atlas-topic-nav" aria-label="Chuyển chủ đề">
      <button className="topic-arrow" aria-label="Chủ đề trước" disabled={selected === 0 || walking} onClick={() => showTopic(selected - 1)}><ChevronLeft size={21} /></button>
      <div className="topic-dots">{REGIONS.map((region, index) => <button key={region.id} aria-label={`Xem chủ đề ${region.name}`} aria-current={selected === index ? "true" : undefined} disabled={walking} onClick={() => showTopic(index)}><span className={selected === index ? "dot-selected" : ""} />{!regionUnlocked(region.id, completed) && <LockKeyhole size={9} />}</button>)}</div>
      <button className="topic-arrow" aria-label="Chủ đề tiếp theo" disabled={selected === REGIONS.length - 1 || walking} onClick={() => showTopic(selected + 1)}><ChevronRight size={21} /></button>
    </nav>
    <section className="atlas-sheet" aria-labelledby="atlas-title" aria-busy={walking}>
      <div className="sheet-handle" aria-hidden="true" />
      <div className="atlas-sheet-heading"><span className="sheet-number" style={{ background: territory.color }}>0{selected + 1}</span><div><h2 id="atlas-title" title={territory.topics}>{territory.name}</h2></div><span className="atlas-region-progress">{finished}/{territory.lessons.length}</span></div>
      {(locked || walking) && <p className="atlas-description" aria-live="polite">{walking ? "Buta đang đi…" : `Xong ${REGIONS[selected - 1].name} để mở.`}</p>}
      <div className="atlas-actions"><button className="atlas-enter" aria-label={locked ? "Chưa mở khóa" : walking ? "Buta đang đi" : finished ? "Tiếp tục" : "Vào vùng đất"} disabled={locked || walking} onClick={() => travel(selected, true)}>{walking ? "Đang đi…" : locked ? <><LockKeyhole size={16} /> Đã khóa</> : <>{finished ? "Tiếp tục" : "Vào"}<ArrowRight size={18} /></>}</button></div>
    </section>
  </main>;
}

import { useRef, useState, type CSSProperties } from "react";
import { Check, ChevronRight, Eye, Gamepad2, LockKeyhole, Map, Volume2, VolumeX } from "lucide-react";
import { gameAudio } from "../audio/gameAudio";
import { CURRICULUM_MAP, MAP_LESSON_LABELS, mapLessonName, type CurriculumBranch } from "../engine/curriculumMap";
import { ALL_LESSONS, currentLesson, lessonAvailable, lessonPrerequisites, lessonUnlocked, type Progress, type TrackId } from "../engine/learningTrack";

type Props = {
  completed: Progress; algorithm: TrackId; onAlgorithm: (id: TrackId) => void;
  sound: boolean; onSound: () => void; onStart: (mode: "demo" | "play") => void;
};
const ROW = 49;
const assetRoot = `${import.meta.env.BASE_URL}assets/roadmap/`;

export default function CurriculumMap({ completed, algorithm, onAlgorithm, sound, onSound, onStart }: Props) {
  const active = ALL_LESSONS.find(lesson => lesson.id === algorithm) ?? currentLesson(completed);
  const available = lessonAvailable(active.id), unlocked = lessonUnlocked(active.id, completed);
  const finished = ALL_LESSONS.filter(lesson => completed[lesson.id]).length;
  const missing = lessonPrerequisites(active.id).filter(lesson => !completed[lesson.id]);
  const popup = useRef<HTMLElement | null>(null);
  const openedByHover = useRef<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ left: 0, top: 0 });

  function toggleTopic(id: string, pointerClick: boolean) {
    if (pointerClick && openedByHover.current === id) {
      openedByHover.current = null;
      return;
    }
    openedByHover.current = null;
    gameAudio.unlock();
    gameAudio.play("island-select");
    popup.current?.hidePopover();
    setExpandedTopic(current => current === id ? null : id);
  }

  function select(id: TrackId, button: HTMLButtonElement) {
    gameAudio.unlock();
    gameAudio.play(!lessonAvailable(id) || !lessonUnlocked(id, completed) ? "locked" : "island-select");
    onAlgorithm(id);
    const box = button.getBoundingClientRect();
    const width = Math.min(300, window.innerWidth - 24);
    const left = Math.max(12, Math.min(box.left + box.width / 2 - width / 2, window.innerWidth - width - 12));
    const top = box.bottom + 170 < window.innerHeight ? box.bottom + 10 : Math.max(12, box.top - 170);
    setPopupPosition({ left, top });
    popup.current?.showPopover();
  }
  function branch(group: CurriculumBranch | undefined, side: "upper" | "lower", topicId: string, expanded: boolean) {
    if (!group) return <div className={`roadmap-branch branch-${side} branch-empty`} aria-hidden="true" />;
    const height = group.lessons.length * ROW;
    const points = group.lessons.map((lesson, index) => ({ lesson, index, x: index % 2 ? 71 : 29,
      y: side === "upper" ? height - ROW * (index + 1) + 19 : ROW * index + 19 }));
    const desktopStem = `M100 ${side === "upper" ? height + 20 : -20} C96 ${height * .62} 104 ${height * .38} 100 ${side === "upper" ? 19 : height - 30}`;
    const mobileStem = `M${side === "upper" ? 200 : 0} ${height / 2} Q${side === "upper" ? 150 : 50} ${height / 2} 100 ${height / 2} M100 19V${height - 30}`;
    const desktopFork = (x: number, y: number) => {
      const from = y + (side === "upper" ? 13 : -13);
      return `M100 ${from} C100 ${y} ${x * 2} ${y + (side === "upper" ? 13 : -13)} ${x * 2} ${y}`;
    };
    const mobileFork = (index: number) => {
      const y = ROW * index + 19, x = side === "upper" ? 70 : 130;
      return `M100 ${y} C${side === "upper" ? 88 : 112} ${y} ${x + (side === "upper" ? 12 : -12)} ${y} ${x} ${y}`;
    };
    return <section id={`roadmap-branch-${topicId}-${side}`} className={`roadmap-branch branch-${side}`}
      aria-label={`${group.name} · ${group.subtitle}`} aria-hidden={!expanded} inert={!expanded}>
      <div className="roadmap-branch-name"><strong>{group.name}</strong></div>
      <div className="roadmap-branch-tree" style={{ height: `calc(${group.lessons.length} * var(--roadmap-row))` }}>
        {["desktop", "mobile"].map(view => <svg key={view} className={`roadmap-lines lines-${view}`} viewBox={`0 0 200 ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <path className="roadmap-route-outline" d={view === "desktop" ? desktopStem : mobileStem} />
          <path className="roadmap-route-core" d={view === "desktop" ? desktopStem : mobileStem} />
          {points.map(({ lesson, index, x, y }) => {
            const path = view === "desktop" ? desktopFork(x, y) : mobileFork(index);
            const jointY = view === "desktop" ? y + (side === "upper" ? 13 : -13) : ROW * index + 19;
            return <g key={lesson.id} className={completed[lesson.id] ? "route-complete" : ""}>
              <path className="roadmap-route-outline" d={path} />
              <path className="roadmap-route-core" d={path} />
              <circle className="roadmap-route-joint" cx="100" cy={jointY} r="4" />
            </g>;
          })}
        </svg>)}
        {points.map(({ lesson, index, x, y }) => {
          const done = !!completed[lesson.id], open = lessonUnlocked(lesson.id, completed), ready = lessonAvailable(lesson.id);
          const selected = active.id === lesson.id;
          return <button key={lesson.id}
            className={`roadmap-lesson ${selected ? "is-selected" : ""} ${done ? "is-complete" : !ready ? "is-upcoming" : !open ? "is-locked" : "is-open"}`}
            style={{ "--leaf-x": `${x}%`, "--leaf-index": index, "--mobile-leaf-y": `${(ROW * index + 19) / height * 100}%`, "--desktop-leaf-y": `${y / height * 100}%` } as CSSProperties}
            aria-label={mapLessonName(lesson)} aria-pressed={selected} aria-expanded={selected && popupOpen} aria-controls="roadmap-lesson-popup"
            data-lesson={lesson.id} title={mapLessonName(lesson)} onClick={event => select(lesson.id, event.currentTarget)}>
            <span className="roadmap-diamond">
              <img src={`${assetRoot}${done ? "diamond-complete" : !ready || !open ? "diamond-locked" : "diamond"}.svg`} alt="" draggable={false} />
              <b>{done ? <Check size={23} strokeWidth={3} /> : !ready || !open ? <LockKeyhole size={20} strokeWidth={2.7} aria-hidden="true" /> : String(index + 1).padStart(2, "0")}</b>
            </span>
            <span className="roadmap-lesson-label">{MAP_LESSON_LABELS[lesson.id] ?? mapLessonName(lesson)}</span>
          </button>;
        })}
      </div>
    </section>;
  }
  return <main className="curriculum-map">
    <header className="roadmap-header">
      <div className="roadmap-brand"><span className="roadmap-brand-mark" aria-hidden="true"><Map size={25} /></span><div><h1>Learning Map</h1></div></div>
      <div className="roadmap-header-actions">
        <div className="roadmap-progress" aria-label={`Đã hoàn thành ${finished} trên ${ALL_LESSONS.length} bài`}><span><b>{finished}</b> / {ALL_LESSONS.length} bài</span><progress max={ALL_LESSONS.length} value={finished} /></div>
        <button className="roadmap-sound" onClick={onSound} aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"} aria-pressed={sound}>{sound ? <Volume2 size={23} /> : <VolumeX size={23} />}</button>
      </div>
    </header>
    <nav className="roadmap-diagram" aria-label="Toàn bộ lộ trình cấu trúc dữ liệu và thuật toán">
      <div className="roadmap-spine" aria-hidden="true" />
      {CURRICULUM_MAP.map((topic) => {
        const lessons = [...(topic.upper?.lessons ?? []), ...(topic.lower?.lessons ?? [])];
        const count = lessons.filter(lesson => completed[lesson.id]).length;
        const expanded = expandedTopic === topic.id;
        const branchIds = [topic.upper && `roadmap-branch-${topic.id}-upper`, topic.lower && `roadmap-branch-${topic.id}-lower`].filter(Boolean).join(" ");
        return <article className={`roadmap-topic ${expanded ? "is-expanded" : ""}`} key={topic.id} aria-label={topic.name} data-topic={topic.id}>
          {branch(topic.upper, "upper", topic.id, expanded)}
          <button type="button" className="roadmap-topic-node" aria-label={`${expanded ? "Thu gọn" : "Mở nhánh"} ${topic.name}`}
            aria-expanded={expanded} aria-controls={branchIds}
            onPointerEnter={event => {
              if (event.pointerType !== "mouse" || !matchMedia("(hover: hover) and (pointer: fine)").matches || expanded) return;
              openedByHover.current = topic.id;
              popup.current?.hidePopover();
              setExpandedTopic(topic.id);
            }}
            onPointerLeave={() => { openedByHover.current = null; }}
            onClick={event => toggleTopic(topic.id, event.detail > 0)}>
            <h2>{topic.name}</h2><small>{count}/{lessons.length}</small>
            <span className="roadmap-topic-toggle" aria-hidden="true">{expanded ? "−" : "+"}</span>
          </button>
          {branch(topic.lower, "lower", topic.id, expanded)}
        </article>;
      })}
    </nav>
    <section id="roadmap-lesson-popup" ref={popup} popover="auto" className="roadmap-detail roadmap-popup"
      style={popupPosition} onToggle={event => setPopupOpen(event.newState === "open")} aria-labelledby="roadmap-detail-title">
      <div className="roadmap-detail-copy"><div className="roadmap-detail-heading"><span className="roadmap-detail-icon" aria-hidden="true">{completed[active.id] ? <Check size={22} /> : <Gamepad2 size={22} />}</span><div><h2 id="roadmap-detail-title">{mapLessonName(active)}</h2></div></div>
        <p id="roadmap-lesson-status" className="roadmap-lesson-status" aria-live="polite">{!available ? "Bài học đang được phát triển." : !unlocked ? `Hoàn thành ${missing.map(lesson => lesson.name).join(", ")} để mở bài này.` : ""}</p>
      </div>
      <div className="roadmap-detail-actions"><button className="roadmap-demo" aria-label="Xem demo" disabled={!available || !unlocked} onClick={() => { popup.current?.hidePopover(); onStart("demo"); }}><Eye size={20} /> Demo</button><button className="roadmap-play" aria-label="Thử thách" disabled={!available || !unlocked} onClick={() => { popup.current?.hidePopover(); onStart("play"); }}><Gamepad2 size={21} /> Challenge <ChevronRight size={18} /></button></div>
    </section>
  </main>;
}

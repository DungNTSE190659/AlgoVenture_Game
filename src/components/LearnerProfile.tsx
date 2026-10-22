import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Award, BookOpen, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, Compass, Crown, Flag, Flame, GraduationCap, History, Layers3, Leaf, LockKeyhole, Map, Network, Pencil, Save, ShieldCheck, Sparkles, Sprout, Star, Target, Trophy, X } from "lucide-react";
import { ALL_LESSONS, ARRAY_ROUTES, currentLesson, lessonAvailable, lessonUnlocked, REGIONS, regionForLesson, type Progress, type RegionId, type TrackId } from "../engine/learningTrack";
import { AVATARS, localDay, readActivity, readIdentity, resumableLesson, SAMPLE_PROGRESS, sampleActivity, saveIdentity, studyStreak, type Avatar } from "../engine/learnerProfile";
import { readMemberships } from "../engine/classroom";
import RegionLandmark from "./RegionLandmark";
import "../profile.css";

type Tab = "overview" | "progress" | "achievements" | "history";
type Props = { completed: Progress; onClose: () => void; onClassrooms: () => void; onContinue: (id: TrackId) => void };
const tabItems = [{ id: "overview", title: "Tổng quan", icon: Compass }, { id: "progress", title: "Tiến độ", icon: Map }, { id: "achievements", title: "Thành tích", icon: Award }, { id: "history", title: "Lịch sử", icon: History }] as const;
const date = (at: number) => new Date(at).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });
const time = (at: number) => new Date(at).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });
const avatarPath = (avatar: Avatar) => `${import.meta.env.BASE_URL}assets/buta/2d/${avatar}.webp`;
const regionLabels: Record<RegionId, string> = { arrays: "Array", "linear-structures": "LinkedList", trees: "Tree", graph: "Graph" };
const regionIcons = { arrays: Layers3, "linear-structures": Network, trees: Sprout, graph: Network };

export default function LearnerProfile({ completed, onClose, onClassrooms, onContinue }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [identity, setIdentity] = useState(readIdentity);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(identity.name);
  const [avatar, setAvatar] = useState(identity.avatar);
  const [message, setMessage] = useState("");
  const [sample, setSample] = useState(false);
  const [region, setRegion] = useState<RegionId>("arrays");
  const [historyFilter, setHistoryFilter] = useState("");
  const [recorded] = useState(readActivity);
  const [memberships] = useState(readMemberships);
  const [demoActivity] = useState(sampleActivity);
  const progress = sample ? SAMPLE_PROGRESS : completed;
  const activity = sample ? demoActivity : recorded;
  const doneCount = ALL_LESSONS.filter(l => progress[l.id]).length;
  const percentage = Math.round(doneCount / ALL_LESSONS.length * 100);
  const streak = studyStreak(activity);
  const lastId = resumableLesson(progress, activity, currentLesson(progress).id);
  const last = ALL_LESSONS.find(l => l.id === lastId)!;
  const lastRegion = regionForLesson(lastId);
  const badges = [
    { id: "first", title: "Bước chân đầu tiên", description: "Hoàn thành thử thách đầu tiên.", icon: Flag, color: "#a6be84", earned: doneCount >= 1 },
    { id: "sort", title: "Đôi tay khéo léo", description: "Hoàn thành 3 thuật toán Sort.", icon: Sparkles, color: "#d2ad6d", earned: ARRAY_ROUTES[0].lessons.filter(l => progress[l.id]).length >= 3 },
    { id: "search", title: "Thám tử ô số", description: "Hoàn thành Linear và Binary Search.", icon: Target, color: "#9dbeb6", earned: !!progress.linear && !!progress.binary },
    { id: "stack", title: "Người giữ trật tự", description: "Hoàn thành Stack và Queue.", icon: Layers3, color: "#b4a0cf", earned: !!progress.stack && !!progress.queue },
    { id: "linked", title: "Kết nối đầu tiên", description: "Hoàn thành một bài LinkedList.", icon: Network, color: "#d4ae85", earned: REGIONS[1].lessons.some(l => progress[l.id]) },
    { id: "tree", title: "Người ươm mầm", description: "Hoàn thành 3 bài về Tree và BST.", icon: Sprout, color: "#8fb99a", earned: REGIONS[2].lessons.filter(l => progress[l.id]).length >= 3 },
    { id: "streak", title: "Bền bỉ mỗi ngày", description: "Hoàn thành thử thách 3 ngày liên tiếp.", icon: Flame, color: "#d7a18a", earned: streak >= 3 },
    { id: "explorer", title: "Dấu chân bốn đảo", description: "Hoàn thành ít nhất 1 bài trên mỗi đảo.", icon: Crown, color: "#c4b073", earned: REGIONS.every(r => r.lessons.some(l => progress[l.id])) },
  ];
  const earned = badges.filter(b => b.earned).length;
  const selectedRegion = REGIONS.find(r => r.id === region)!;
  useEffect(() => {
    const panel = dialog.current, opener = document.activeElement;
    panel?.showModal();
    return () => { panel?.close(); if (opener instanceof HTMLElement) opener.focus(); };
  }, []);
  useEffect(() => { content.current?.scrollTo({ top: 0 }); }, [tab, sample]);
  function toggleSample() { setSample(value => !value); setEditing(false); setMessage(""); }
  function editProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim()) { setMessage("Hãy nhập tên hiển thị của bạn."); return; }
    const next = { ...identity, name: draft.trim(), avatar };
    const saved = saveIdentity(next);
    setIdentity(next); setEditing(false);
    setMessage(saved ? "Đã lưu hồ sơ trên thiết bị này." : "Đã cập nhật trong phiên này. Trình duyệt chưa cho phép lưu hồ sơ.");
  }
  function continueJourney(id: TrackId) {
    if (sample) { setSample(false); setMessage("Đã trở về dữ liệu học tập của bạn."); return; }
    onContinue(id);
  }
  function renderIsland(id: RegionId) {
    const island = REGIONS.find(r => r.id === id)!;
    const count = island.lessons.filter(l => progress[l.id]).length;
    const percent = Math.round(count / island.lessons.length * 100);
    const Icon = regionIcons[id];
    return <button key={id} className="profile-island" style={{ "--island-color": island.color } as CSSProperties} onClick={() => { setRegion(id); setTab("progress"); }} aria-label={`Xem tiến độ ${regionLabels[id]}`}>
      <span className="profile-island-art"><RegionLandmark region={id} /><span>{regionLabels[id]}</span></span>
      <span className="profile-island-title"><Icon size={15} /><strong>{island.name}</strong><b>{percent}%</b></span>
      <progress value={count} max={island.lessons.length} aria-label={`Tiến độ ${regionLabels[id]}`} />
      <span className="profile-island-bottom">{count} / {island.lessons.length} bài hoàn thành<ChevronRight size={14} /></span>
    </button>;
  }
  function renderBadge(badge: typeof badges[number], compact = false) {
    const Icon = badge.icon;
    return <article key={badge.id} className={`profile-badge ${badge.earned ? "is-earned" : "is-locked"} ${compact ? "is-compact" : ""}`} style={{ "--badge-color": badge.color } as CSSProperties}>
      <span className="profile-badge-medal"><Icon size={compact ? 24 : 32} strokeWidth={1.7} />{badge.earned ? <Check size={12} /> : <LockKeyhole size={11} />}</span>
      <div><h4>{badge.title}</h4><p>{badge.description}</p>{!compact && <small>{badge.earned ? "Đã mở khóa" : "Chưa mở khóa"}</small>}</div>
    </article>;
  }
  const filteredHistory = activity.filter(a => !historyFilter || a.kind === historyFilter);
  function renderHistory(compact = false) {
    const entries = compact ? filteredHistory.slice(0, 3) : filteredHistory;
    if (!entries.length) return <div className="profile-empty"><History size={30} /><h4>Những bước chân đầu tiên đang chờ bạn</h4><p>Chơi một demo hoặc thử thách để ghi lại hành trình tại đây.</p><small>Lịch sử bắt đầu được ghi nhận từ phiên bản hồ sơ này.</small></div>;
    return <div className="profile-history-list">{entries.map((entry, i) => {
      const lesson = ALL_LESSONS.find(l => l.id === entry.lesson)!;
      const Icon = entry.kind === "completed" ? CheckCircle2 : entry.kind === "demo" ? BookOpen : Flag;
      return <article key={`${entry.at}-${i}`} className="profile-history-row"><span className={`profile-history-symbol activity-${entry.kind}`}><Icon size={19} /></span><div><strong>{lesson.name}</strong><p>{entry.kind === "completed" ? "Hoàn thành thử thách" : entry.kind === "demo" ? "Khám phá demo" : "Bắt đầu thử thách"}<span> · {regionLabels[regionForLesson(entry.lesson).id]}</span></p></div><time dateTime={new Date(entry.at).toISOString()}>{date(entry.at)}<small>{time(entry.at)}</small></time>{!sample && <button className="profile-mini-button" aria-label={`Mở lại ${lesson.name}`} onClick={() => continueJourney(lesson.id)}><ArrowRight size={16} /></button>}</article>;
    })}</div>;
  }
  return <dialog ref={dialog} className="profile-dialog" aria-labelledby="profile-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="profile-layout">
      <header className="profile-topbar"><button className="profile-back" onClick={onClose}><ArrowLeft size={18} /><span>Về bản đồ</span></button><span className="profile-brand"><Compass size={19} /> AlgoVenture<span>HỒ SƠ HÀNH TRÌNH</span></span><button className="profile-close" aria-label="Đóng hồ sơ" onClick={onClose}><X size={20} /></button></header>
      <div className="profile-body">
        <aside className="profile-sidebar">
          <div className="profile-passport"><span className="profile-passport-eyebrow">THẺ NHÀ THÁM HIỂM</span><div className="profile-avatar"><img src={avatarPath(sample ? "proud" : identity.avatar)} alt="Avatar Buta của người chơi" /><span><Leaf size={15} /></span><i /><i /></div><h2>{sample ? "Buta Explorer" : identity.name}</h2><p>Cùng Buta khám phá từng hòn đảo</p><span className="profile-local-tag"><ShieldCheck size={12} />{sample ? "Hồ sơ minh họa" : "Hồ sơ trên thiết bị"}</span>{!sample && <button className="profile-edit" onClick={() => { setDraft(identity.name); setAvatar(identity.avatar); setEditing(value => !value); setMessage(""); }}><Pencil size={13} />Chỉnh sửa hồ sơ</button>}</div>
          {editing && <form className="profile-edit-form" onSubmit={editProfile}><label htmlFor="profile-name">Tên hiển thị</label><input id="profile-name" value={draft} maxLength={24} onChange={e => setDraft(e.target.value)} autoComplete="nickname" /><small>{draft.length}/24 ký tự</small><fieldset><legend>Chọn Buta đồng hành</legend><div className="profile-avatar-options">{AVATARS.map((value, i) => <button key={value} type="button" aria-label={`Chọn avatar Buta ${i + 1}`} aria-pressed={avatar === value} onClick={() => setAvatar(value)}><img src={avatarPath(value)} alt="" /></button>)}</div></fieldset><div><button className="profile-primary" type="submit"><Save size={14} />Lưu</button><button className="profile-text-button" type="button" onClick={() => setEditing(false)}>Hủy</button></div></form>}
          <nav className="profile-nav" aria-label="Mục hồ sơ">{tabItems.map(item => { const Icon = item.icon; return <button key={item.id} aria-current={tab === item.id ? "page" : undefined} onClick={() => setTab(item.id)}><Icon size={18} />{item.title}{item.id === "achievements" && <span>{earned}</span>}<ChevronRight size={14} /></button>; })}</nav>
          <div className="profile-sidebar-bottom"><span className="profile-sidebar-sprout"><Sprout size={25} /></span><p>Mỗi bước nhỏ hôm nay,<br />một hành trình lớn ngày mai.</p><small><LockKeyhole size={11} />{sample ? "Dữ liệu mẫu, không lưu tiến độ" : "Lưu cục bộ · Chưa liên kết tài khoản"}</small></div>
        </aside>
        <div className="profile-content" ref={content}>
          <div className="profile-heading"><div><span className="profile-eyebrow">GÓC NHỎ CỦA NHÀ THÁM HIỂM</span><h1 id="profile-title">{tab === "overview" ? "Hành trình của bạn" : tab === "progress" ? "Bản đồ tiến độ" : tab === "achievements" ? "Bộ sưu tập thành tích" : "Dấu chân đã qua"}</h1><p>{tab === "overview" ? "Mỗi bài học là một dấu chân trên hành trình khám phá." : tab === "progress" ? "Nhìn lại những nơi đã đi qua và khám phá chặng tiếp theo." : tab === "achievements" ? "Những cột mốc nhỏ ghi lại nỗ lực của bạn." : "Lưu lại từng lần khám phá, luyện tập và hoàn thành thử thách."}</p></div><button className={`profile-preview-button ${sample ? "is-previewing" : ""}`} aria-pressed={sample} onClick={toggleSample}><Sparkles size={14} />{sample ? "Về dữ liệu của tôi" : "Xem hồ sơ mẫu"}</button></div>
          {sample && <div className="profile-sample-notice" role="status"><Sparkles size={15} />Bạn đang xem dữ liệu minh họa. Tiến độ và hồ sơ thật không thay đổi.</div>}
          {message && <div className="profile-message" role="status"><CheckCircle2 size={16} />{message}<button aria-label="Đóng thông báo hồ sơ" onClick={() => setMessage("")}><X size={14} /></button></div>}
          {tab === "overview" && <>
            <div className="profile-stats"><article><span className="profile-stat-icon stat-green"><Flag size={21} /></span><div><strong>{doneCount}<small> / {ALL_LESSONS.length}</small></strong><p>Bài đã hoàn thành</p></div></article><article><span className="profile-stat-icon stat-gold"><Star size={21} /></span><div><strong>{sample ? 28 : "—"}</strong><p>Tổng sao</p><small>{sample ? "Số sao minh họa" : "Chưa tổng hợp dữ liệu sao"}</small></div></article><article><span className="profile-stat-icon stat-peach"><Flame size={22} /></span><div><strong>{streak}<small> ngày</small></strong><p>Chuỗi ngày học</p></div></article></div>
            <div className="profile-feature-grid"><section className="profile-continue"><div><span className="profile-eyebrow">{activity.length ? "TIẾP NỐI CÂU CHUYỆN" : "MỘT CHƯƠNG MỚI ĐANG CHỜ"}</span><h3>{activity.length ? last.name : "Bắt đầu cùng Buta nhé!"}</h3><p>{activity.length ? `${lastRegion.place} · ${last.place}` : "Ghé thăm hòn đảo đầu tiên và ghi dấu chân của riêng bạn."}</p><button className="profile-primary" onClick={() => continueJourney(lastId)}>{sample ? "Về hành trình của tôi" : activity.length ? "Tiếp tục hành trình" : "Khám phá ngay"}<ArrowRight size={16} /></button></div><span className="profile-continue-art"><RegionLandmark region={lastRegion.id} /><span className="profile-art-track" /><img src={avatarPath("pointing")} alt="" /></span></section><section className="profile-classroom"><span className="profile-classroom-icon"><GraduationCap size={26} /></span><span className="profile-eyebrow">HỌC CÙNG ĐỒNG ĐỘI</span><h3>Lớp học của tôi</h3><p>{sample ? "2 lớp học đang đồng hành cùng bạn." : memberships.length ? `${memberships.length} lớp học đang đồng hành cùng bạn.` : "Tìm một lớp học và cùng nhau tiến bộ."}</p><button className="profile-text-button" onClick={onClassrooms}>Mở lớp học<ArrowRight size={14} /></button></section></div>
            <div className="profile-section-heading"><h3><Map size={18} />Những hòn đảo của bạn</h3><button onClick={() => setTab("progress")}>Xem chi tiết<ChevronRight size={14} /></button></div><div className="profile-island-grid">{REGIONS.map(r => renderIsland(r.id))}</div>
            <div className="profile-overview-bottom"><section className="profile-surface"><div className="profile-section-heading"><h3><Award size={18} />Cột mốc đáng nhớ</h3><button onClick={() => setTab("achievements")}>{earned}/{badges.length}<ChevronRight size={14} /></button></div><div className="profile-badge-preview">{[...badges].sort((a, b) => Number(b.earned) - Number(a.earned)).slice(0, 3).map(b => renderBadge(b, true))}</div></section><section className="profile-surface profile-week"><div className="profile-section-heading"><h3><CalendarDays size={18} />7 ngày vừa qua</h3><span>{streak ? `${streak} ngày liên tiếp` : "Cùng tạo thói quen"}</span></div><div className="profile-week-days">{Array.from({ length: 7 }, (_, index) => { const at = Date.now() - (6 - index) * 86400000; const studied = activity.some(a => a.kind === "completed" && localDay(a.at) === localDay(at)); return <div key={index} className={`${studied ? "is-active" : ""} ${index === 6 ? "is-today" : ""}`}><span>{["CN", "T2", "T3", "T4", "T5", "T6", "T7"][new Date(`${localDay(at)}T12:00:00Z`).getUTCDay()]}</span><span>{studied ? <Check size={17} /> : index === 6 ? <Leaf size={16} /> : <span />}</span><small>{index === 6 ? "Hôm nay" : localDay(at).slice(-2)}</small></div>; })}</div><p>Một ngày được ghi nhận khi bạn hoàn thành thử thách.</p></section></div>
          </>}
          {tab === "progress" && <>
            <section className="profile-progress-summary"><span className="profile-summary-icon"><Compass size={31} /></span><div><h3>{doneCount} dấu chân trên bản đồ</h3><p>Đã hoàn thành {doneCount} / {ALL_LESSONS.length} bài học.</p></div><strong>{percentage}%</strong><progress value={doneCount} max={ALL_LESSONS.length} aria-label="Tổng tiến độ học tập" /></section>
            <div className="profile-island-grid">{REGIONS.map(r => renderIsland(r.id))}</div>
            <section className="profile-surface profile-lesson-detail"><div className="profile-section-heading"><h3>Khám phá {regionLabels[region]}</h3><select aria-label="Chọn đảo xem tiến độ" value={region} onChange={e => setRegion(e.target.value as RegionId)}>{REGIONS.map(r => <option key={r.id} value={r.id}>{regionLabels[r.id]}</option>)}</select></div>{region === "arrays" && <div className="profile-route-summary">{ARRAY_ROUTES.map(route => <span key={route.id}><Layers3 size={13} />{route.name}<b>{route.lessons.filter(l => progress[l.id]).length}/{route.lessons.length}</b></span>)}</div>}<div className="profile-lesson-list">{selectedRegion.lessons.map((lesson, index) => { const done = !!progress[lesson.id], available = lessonAvailable(lesson.id) && lessonUnlocked(lesson.id, progress); return <div key={lesson.id} className={`profile-lesson-row ${done ? "is-complete" : ""}`}><span>{done ? <Check size={16} /> : String(index + 1).padStart(2, "0")}</span><div><strong>{lesson.name}</strong><small>{lesson.place}</small></div><span className="profile-lesson-state">{done ? "Đã hoàn thành" : !lessonAvailable(lesson.id) ? "Sắp ra mắt" : available ? "Sẵn sàng khám phá" : "Chưa mở khóa"}</span><button className="profile-mini-button" disabled={sample || !available} aria-label={`Mở bài ${lesson.name}`} onClick={() => continueJourney(lesson.id)}>{available ? <ArrowRight size={16} /> : <LockKeyhole size={14} />}</button></div>; })}</div></section>
          </>}
          {tab === "achievements" && <><div className="profile-achievement-intro"><span><Trophy size={30} /></span><div><h3>Mỗi nỗ lực đều có dấu ấn</h3><p>Bạn đã mở khóa <b>{earned} / {badges.length}</b> huy hiệu. Chọn thử thách và tiếp tục bộ sưu tập nhé!</p></div></div><div className="profile-badge-grid">{badges.map(b => renderBadge(b))}</div></>}
          {tab === "history" && <section className="profile-surface profile-history"><div className="profile-section-heading"><h3><History size={18} />Hoạt động gần đây</h3><select aria-label="Lọc lịch sử học tập" value={historyFilter} onChange={e => setHistoryFilter(e.target.value)}><option value="">Tất cả hoạt động</option><option value="completed">Hoàn thành thử thách</option><option value="play">Bắt đầu thử thách</option><option value="demo">Khám phá demo</option></select></div>{renderHistory()}<p className="profile-history-note"><Clock3 size={13} />{sample ? "Hoạt động minh họa cho giao diện hồ sơ." : "Tối đa 100 hoạt động gần nhất trên thiết bị này. Không khôi phục thời gian của các bài đã chơi trước đây."}</p></section>}
          <footer className="profile-footer"><Sprout size={14} />Hành trình của bạn, từng bước một.<span>{sample ? "Bản xem mẫu" : "Dữ liệu trên thiết bị này"}</span></footer>
        </div>
      </div>
    </div>
  </dialog>;
}

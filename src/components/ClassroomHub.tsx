import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ClipboardList, Clock3, Download, GraduationCap, KeyRound, Layers3, LockKeyhole, Network, Search, Sparkles, Sprout, Trophy, Upload, Users, X } from "lucide-react";
import { classrooms, isCorrect, questionsFor, readMemberships, topicColors, topics, type Classroom } from "../engine/classroom";
import Pig from "./Pig";
import "../classroom.css";

const topicIcons = { Array: Layers3, LinkedList: Network, Tree: Sprout, Graph: Network };
const formatDate = (time: number) => new Date(time).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
type Submission = { file: File; at: number };
type QuizResult = { answers: number[][]; score: number };

export default function ClassroomHub({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const [memberships, setMemberships] = useState(readMemberships);
  const [view, setView] = useState<"mine" | "browse">("mine");
  const [active, setActive] = useState<Classroom | null>(null);
  const [tab, setTab] = useState<"overview" | "resources" | "assignments" | "quiz">("overview");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [notice, setNotice] = useState("");
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [results, setResults] = useState<Record<string, QuizResult>>({});
  const [quizOpen, setQuizOpen] = useState(false);
  const [answers, setAnswers] = useState<number[][]>([[], [], []]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [demoStart] = useState(Date.now);
  const due = demoStart + 3 * 86400000;
  const expired = now >= due;
  useEffect(() => {
    const panel = dialog.current;
    const opener = document.activeElement;
    panel?.showModal();
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(timer); panel?.close(); if (opener instanceof HTMLElement) opener.focus(); };
  }, []);
  useEffect(() => { try { localStorage.setItem("buta-classrooms-v1", JSON.stringify(memberships)); } catch { /* The mock still works when browser storage is unavailable. */ } }, [memberships]);
  useEffect(() => { scrollArea.current?.scrollTo({ top: 0 }); }, [view, active?.id, tab, quizOpen, questionIndex]);
  function enter(c: Classroom) { setActive(c); setTab("overview"); setQuizOpen(false); setNotice(""); }
  function join(c: Classroom) { setMemberships(ids => ids.includes(c.id) ? ids : [...ids, c.id]); enter(c); setNotice(`Đã tham gia lớp ${c.title}. Chào mừng bạn!`); }
  function joinCode(event: React.FormEvent) {
    event.preventDefault();
    const found = classrooms.find(c => c.code === code.trim().toUpperCase());
    if (!found) { setCodeError("Code chưa đúng. Hãy kiểm tra lại code instructor cung cấp."); return; }
    setCodeError(""); setCode(""); join(found);
  }
  function download(c: Classroom, assignment = false) {
    const text = assignment ? `BÀI TẬP ${c.topic}\n${c.title}\n\n1. Mô tả cấu trúc ${c.topic}.\n2. Viết chương trình minh họa một thao tác cơ bản.\n3. Giải thích kết quả và độ phức tạp.\n\nNộp file mã nguồn hoặc báo cáo trước deadline.` : `SỔ TAY ${c.topic} — ${c.level}\nInstructor: ${c.instructor}\n\n${c.description}\n\nMục tiêu\n- Hiểu cách tổ chức dữ liệu.\n- Minh họa các thao tác bằng ví dụ.\n- Phân tích độ phức tạp.\n\nĐây là tài liệu mẫu của giao diện learner.`;
    const url = URL.createObjectURL(new Blob(["\ufeff", text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${assignment ? "bai-tap" : "so-tay"}-${c.topic}.txt`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function submitFile(id: string) {
    if (Date.now() >= due) { setNow(Date.now()); setNotice("Đã hết hạn. Bạn không thể nộp bài trễ."); return; }
    const file = files[id];
    if (!file) return;
    setSubmissions(values => ({ ...values, [id]: { file, at: Date.now() } }));
    setNotice("Đã ghi nhận bài nộp mẫu trong phiên này. File chưa được gửi lên máy chủ.");
  }
  const filtered = classrooms.filter(c => !c.code && (!topic || c.topic === topic) && (!level || c.level === level) && `${c.title} ${c.instructor}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
  const mine = classrooms.filter(c => memberships.includes(c.id));
  const questions = questionsFor(active?.topic ?? "Array");
  const question = questions[questionIndex];
  const result = active ? results[active.id] : undefined;
  function renderCard(c: Classroom, joined: boolean) {
    const Icon = topicIcons[c.topic];
    return <article key={c.id} className="class-card" style={{ "--class-accent": topicColors[c.topic] } as CSSProperties}>
      <div className="class-card-art"><Icon size={42} strokeWidth={1.6} /><span className="class-level">{c.level}</span><i /><i /></div>
      <div className="class-card-body"><div className="class-tags"><span>{c.topic}</span>{c.code && <span><LockKeyhole size={12} /> Private</span>}</div><h3>{c.title}</h3><p>{c.description}</p><div className="class-teacher"><span>{c.instructor.split(" ").at(-1)?.slice(0, 1)}</span>{c.instructor}</div><footer><small><Users size={14} /> {c.members + (joined ? 1 : 0)} học viên</small><button className={joined ? "class-soft" : "class-primary"} onClick={() => joined ? enter(c) : join(c)}>{joined ? "Vào lớp" : "Tham gia"}<ArrowRight size={15} /></button></footer></div>
    </article>;
  }
  return <dialog ref={dialog} className="class-dialog" aria-labelledby="class-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="class-shell">
      <header className="class-header"><span className="class-heading-icon"><GraduationCap size={26} /></span><div><small>HỌC CÙNG NHAU, TIẾN XA HƠN</small><h2 id="class-title">Lớp học của tôi</h2></div><button className="class-icon-button" onClick={onClose} aria-label="Đóng lớp học"><X size={21} /></button></header>
      <div className="class-demo"><Sparkles size={14} /> Bản trải nghiệm learner · Dữ liệu mẫu · Code lớp riêng: <b>BUTA2026</b></div>
      <div className="class-scroll" ref={scrollArea}>
        {notice && <div className="class-notice" role="status"><CheckCircle2 size={18} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Đóng thông báo"><X size={16} /></button></div>}
        {!active ? <>
          <div className="class-topline"><nav className="class-tabs" aria-label="Danh sách lớp"><button aria-current={view === "mine" ? "page" : undefined} onClick={() => setView("mine")}><BookOpen size={17} /> Lớp của tôi <span>{mine.length}</span></button><button aria-current={view === "browse" ? "page" : undefined} onClick={() => setView("browse")}><Search size={17} /> Khám phá lớp học</button></nav><span className="class-top-hint">Một hành trình mới đang chờ bạn</span></div>
          <form className="class-code-box" onSubmit={joinCode}><span className="class-key"><KeyRound size={24} /></span><div><h3>Bạn có lời mời vào lớp?</h3><p>Nhập code từ instructor để mở cánh cửa lớp học.</p></div><div className="class-code-controls"><label className="class-sr" htmlFor="class-code">Code lớp học</label><input id="class-code" placeholder="Nhập code lớp học" value={code} onChange={e => { setCode(e.target.value); setCodeError(""); }} aria-invalid={!!codeError} aria-describedby={codeError ? "class-code-error" : undefined} maxLength={24} /><button className="class-primary" disabled={!code.trim()}>Tham gia <ArrowRight size={16} /></button></div>{codeError && <p id="class-code-error" className="class-error" role="alert">{codeError}</p>}</form>
          {view === "mine" ? mine.length ? <><div className="class-section-heading"><h3>Lớp học đã tham gia</h3><span>{mine.length} lớp học</span></div><div className="class-grid">{mine.map(c => renderCard(c, true))}</div></> : <div className="class-empty"><div className="class-empty-art"><span className="class-empty-book"><GraduationCap size={52} strokeWidth={1.4} /></span><Pig mood="thinking" /><Sparkles className="class-empty-spark" size={26} /></div><span className="class-eyebrow">CÙNG BẠN VIẾT CHƯƠNG MỚI</span><h3>Hành trình vui hơn khi có đồng đội!</h3><p>Bạn chưa vào lớp học nào, hãy tham gia một lớp học và phát triển hơn nào!</p><button className="class-primary" onClick={() => setView("browse")}>Khám phá lớp học <ArrowRight size={17} /></button><small>Hoặc nhập code lời mời ở phía trên nhé.</small></div> : <>
            <div className="class-section-heading"><div><h3>Tìm biệt đội của bạn</h3><p>Các lớp public luôn rộng cửa chào đón bạn.</p></div><span>{filtered.length} lớp học</span></div>
            <div className="class-filters"><label className="class-search"><Search size={17} /><input aria-label="Tìm lớp học" placeholder="Tìm tên lớp, instructor…" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="Chủ đề lớp học" value={topic} onChange={e => setTopic(e.target.value)}><option value="">Tất cả chủ đề</option>{topics.map(t => <option key={t}>{t}</option>)}</select><select aria-label="Trình độ" value={level} onChange={e => setLevel(e.target.value)}><option value="">Mọi trình độ</option><option>Basic</option><option>Advanced</option></select></div>
            <div className="class-grid">{filtered.map(c => renderCard(c, memberships.includes(c.id)))}</div>{!filtered.length && <div className="class-no-results"><Search size={32} /><h3>Chưa tìm thấy lớp phù hợp</h3><p>Thử đổi từ khóa hoặc bộ lọc nhé.</p><button className="class-soft" onClick={() => { setQuery(""); setTopic(""); setLevel(""); }}>Xóa bộ lọc</button></div>}
          </>}
        </> : <>
          <button className="class-back" onClick={() => { if (quizOpen) setQuizOpen(false); else { setActive(null); setView("mine"); setNotice(""); } }}><ArrowLeft size={16} />{quizOpen ? "Về lớp học" : "Tất cả lớp của tôi"}</button>
          <section className="class-banner" style={{ "--class-accent": topicColors[active.topic] } as CSSProperties}><div><div className="class-tags"><span>{active.topic}</span><span>{active.level}</span><span>{active.code ? <><LockKeyhole size={12} /> Private</> : "Public"}</span></div><h3>{active.title}</h3><p>{active.description}</p><small><GraduationCap size={16} /> {active.instructor}<Users size={15} /> {active.members + 1} học viên</small></div><GraduationCap className="class-banner-art" size={100} strokeWidth={1.2} /></section>
          {quizOpen ? <section className="class-quiz-play"><div className="class-section-heading"><h3>Trạm kiểm tra · {active.topic}</h3><span>Câu {questionIndex + 1} / {questions.length}</span></div><div className="class-quiz-progress">{questions.map((_, i) => <span key={i} className={i <= questionIndex ? "filled" : ""} />)}</div><span className="class-pill">{question.type === "single" ? "Multiple choice · Chọn 1 đáp án" : question.type === "boolean" ? "True or false · Đúng hoặc sai" : "Multiple select · Chọn nhiều đáp án"}</span><h4>{question.title}</h4><div className="class-answers" role="group" aria-label="Đáp án">{question.options.map((option, i) => <button key={i} aria-pressed={answers[questionIndex].includes(i)} onClick={() => setAnswers(previous => previous.map((values, n) => n !== questionIndex ? values : question.type === "multiple" ? values.includes(i) ? values.filter(v => v !== i) : [...values, i] : [i]))}><span>{answers[questionIndex].includes(i) ? <Check size={16} /> : String.fromCharCode(65 + i)}</span>{option}</button>)}</div><div className="class-quiz-actions"><button className="class-soft" disabled={questionIndex === 0} onClick={() => setQuestionIndex(i => i - 1)}><ArrowLeft size={16} /> Câu trước</button><button className="class-primary" disabled={!answers[questionIndex].length} onClick={() => { if (questionIndex < questions.length - 1) setQuestionIndex(i => i + 1); else { setResults(values => ({ ...values, [active.id]: { answers: answers.map(a => [...a]), score: questions.filter((q, i) => isCorrect(answers[i], q.correct)).length } })); setQuizOpen(false); setTab("quiz"); } }}>{questionIndex < questions.length - 1 ? "Câu tiếp theo" : "Nộp quiz"}<ArrowRight size={16} /></button></div></section> : <>
            <nav className="class-tabs class-detail-tabs" aria-label="Nội dung lớp">{([["overview", "Tổng quan", BookOpen], ["resources", "Tài liệu", Download], ["assignments", "Bài tập", ClipboardList], ["quiz", "Quiz", Sparkles]] as const).map(([id, title, Icon]) => <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); setNotice(""); }}><Icon size={16} />{title}</button>)}</nav>
            {tab === "overview" && <><div className="class-stats"><button onClick={() => setTab("resources")}><BookOpen /><strong>2</strong><span>Tài liệu khám phá</span></button><button onClick={() => setTab("assignments")}><ClipboardList /><strong>{submissions[active.id] ? "1 / 2" : "0 / 2"}</strong><span>Bài tập đã nộp</span></button><button onClick={() => setTab("quiz")}><Trophy /><strong>{result ? `${result.score} / 3` : "0 / 1"}</strong><span>{result ? "Câu trả lời đúng" : "Quiz hoàn thành"}</span></button></div><div className="class-overview-grid"><article className="class-panel"><span className="class-eyebrow">BẢNG TIN INSTRUCTOR</span><h3>Chào mừng các nhà thám hiểm!</h3><p>Chúng ta sẽ cùng khám phá {active.topic} qua tài liệu, bài thực hành và quiz. Hãy đọc sổ tay trước khi nhận nhiệm vụ đầu tiên nhé.</p><small>{active.instructor} · Thông báo mẫu</small></article><article className="class-panel class-next-task"><Clock3 size={23} /><h3>Nhiệm vụ tiếp theo</h3><p>Thực hành {active.topic} · Bài 01</p><small>Hạn nộp: {formatDate(due)}</small><button className="class-soft" onClick={() => setTab("assignments")}>Xem bài tập <ArrowRight size={15} /></button></article></div></>}
            {tab === "resources" && <><div className="class-section-heading"><h3>Hành trang kiến thức</h3><span>2 tài liệu</span></div>{[false, true].map((assignment, i) => <article className="class-resource" key={i}><span className="class-resource-icon"><BookOpen size={24} /></span><div><h3>{assignment ? "Hướng dẫn thực hành" : "Sổ tay khám phá"} {active.topic}</h3><p>{active.instructor} · TXT · Tài liệu mẫu</p></div><button className="class-soft" onClick={() => download(active, assignment)} aria-label={`Tải ${assignment ? "hướng dẫn" : "sổ tay"} ${active.topic}`}><Download size={16} /><span>Tải xuống</span></button></article>)}</>}
            {tab === "assignments" && <><div className="class-section-heading"><div><h3>Nhiệm vụ của lớp</h3><p>Nộp file trước deadline. Không nhận bài nộp trễ.</p></div></div><article className="class-panel class-assignment"><div className="class-section-heading"><span className={`class-pill ${expired ? "class-closed" : ""}`}>{expired ? "Đã đóng" : submissions[active.id] ? "Đã nộp · Chờ chấm" : "Đang mở"}</span><small><Clock3 size={14} /> {formatDate(due)}</small></div><h3>Thực hành {active.topic} · Bài 01</h3><p>Mô tả cấu trúc dữ liệu, viết chương trình minh họa và giải thích độ phức tạp. Nộp mã nguồn hoặc báo cáo của bạn dưới dạng file.</p><button className="class-back" onClick={() => download(active, true)}><Download size={15} /> Tải đề bài</button>{submissions[active.id] && <div className="class-submitted"><CheckCircle2 size={20} /><div><strong>{submissions[active.id].file.name}</strong><p>Đã nộp lúc {formatDate(submissions[active.id].at)} · Chờ instructor chấm</p></div></div>}<label className={`class-upload ${expired ? "class-upload-disabled" : ""}`}><Upload size={26} /><strong>{files[active.id]?.name ?? "Chọn file bài làm của bạn"}</strong><span>Tối đa 20 MB · Mã nguồn, tài liệu hoặc file ZIP</span><input key={active.id} type="file" aria-label="Chọn file bài làm" disabled={expired} onChange={e => { const file = e.target.files?.[0]; if (file && file.size > 20 * 1024 * 1024) { e.target.value = ""; setFiles(values => ({ ...values, [active.id]: undefined })); setNotice("File vượt quá 20 MB. Hãy chọn file nhỏ hơn."); } else { setFiles(values => ({ ...values, [active.id]: file })); setNotice(""); } }} /></label><div className="class-submit-row"><small>Bài nộp mẫu chỉ giữ trong phiên mở cửa sổ này.</small><button className="class-primary" disabled={expired || !files[active.id]} onClick={() => submitFile(active.id)}><Upload size={16} />{submissions[active.id] ? "Nộp lại bài" : "Nộp bài"}</button></div></article><article className="class-panel class-expired"><span className="class-pill class-closed"><LockKeyhole size={13} /> Đã đóng</span><h3>Khởi động {active.topic} · Bài 00</h3><p>Hạn nộp: {formatDate(demoStart - 86400000)}</p><button className="class-soft" disabled>Đã hết hạn nộp bài</button></article></>}
            {tab === "quiz" && <><div className="class-section-heading"><h3>Trạm kiểm tra kiến thức</h3><span>1 quiz</span></div><article className="class-panel class-quiz-intro"><span className="class-quiz-emblem"><Trophy size={36} /></span><div><span className="class-eyebrow">THỬ THÁCH NHỎ, TIẾN BỘ LỚN</span><h3>Bạn hiểu {active.topic} đến đâu?</h3><p>3 câu hỏi · Multiple choice, True or false, Multiple select</p><small>Không giới hạn thời gian · Xem kết quả sau khi nộp</small></div><button className="class-primary" onClick={() => { setAnswers([[], [], []]); setQuestionIndex(0); setQuizOpen(true); }}>{result ? "Làm lại quiz" : "Bắt đầu quiz"}<ArrowRight size={16} /></button></article>{result && <section className="class-quiz-result"><h3><Trophy size={23} /> Hoàn thành! {result.score} / {questions.length} câu đúng</h3><p>{result.score === questions.length ? "Tuyệt vời, bạn đã chinh phục trạm kiến thức này!" : "Mỗi lần thử là một bước tiến. Cùng xem lại đáp án nhé!"}</p>{questions.map((q, i) => <article key={i}><strong>{isCorrect(result.answers[i], q.correct) ? "✓" : "○"} Câu {i + 1}: {q.title}</strong><p>Bạn chọn: {result.answers[i].map(n => q.options[n]).join(", ")}</p><p>{q.explanation}</p></article>)}</section>}</>}
          </>}
        </>}
      </div>
      <footer className="class-footer"><Sprout size={14} /> Mỗi ngày một chút, cùng nhau tiến bộ.</footer>
    </div>
  </dialog>;
}

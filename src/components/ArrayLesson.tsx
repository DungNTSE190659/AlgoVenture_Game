import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, Gamepad2, RotateCcw } from "lucide-react";
import Pig from "./Pig";
import type { Mode } from "../engine/gameConfig";

const demoSteps = [
  { title: "Mỗi con số có một ngôi nhà", text: "Đây là một mảng có bốn phần tử. Mỗi ô chứa một giá trị, và các ô nằm liên tiếp nhau.", focus: -1 },
  { title: "Chỉ số bắt đầu từ không", text: "Các ô có chỉ số không, một, hai, ba. Chỉ số cho chúng mình biết vị trí của một phần tử.", focus: 0 },
  { title: "Đọc giá trị ở một vị trí", text: "Ô có chỉ số hai đang chứa số sáu. Chỉ số hai là ô thứ ba, vì chúng mình bắt đầu đếm từ không.", focus: 2 },
  { title: "Thay giá trị, giữ vị trí", text: "Buta thay giá trị ở chỉ số một từ ba thành chín. Mảng vẫn có bốn phần tử và các chỉ số vẫn giữ nguyên.", focus: 1 },
];
const tasks = [
  { title: "Tìm đúng vị trí", text: "Chạm vào ô có chỉ số 2.", answer: 2 },
  { title: "Lần theo giá trị", text: "Số 3 đang ở ô nào? Chạm vào ô đó.", answer: 1 },
  { title: "Đếm những ngôi nhà", text: "Mảng này có bao nhiêu phần tử?", answer: 4 },
  { title: "Giúp Buta cập nhật mảng", text: "Chọn ô có chỉ số 1 để thay giá trị của ô đó thành 9.", answer: 1 },
];
type Props = { mode: Mode; onBack: () => void; onPlay: () => void; onComplete: () => void; onNext: () => void };
export default function ArrayLesson({ mode, onBack, onPlay, onComplete, onNext }: Props) {
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState(false);
  const finished = useRef(false);
  const demo = mode === "demo";
  const task = demo ? demoSteps[step] : tasks[step];
  const values = [8, (demo && step === 3) || done ? 9 : 3, 6, 2];
  useEffect(() => {
    if (!done || demo || finished.current) return;
    finished.current = true;
    onComplete();
  }, [done, demo, onComplete]);
  function answer(value: number) {
    if (done || demo) return;
    if (value !== tasks[step].answer) {
      setFeedback(step === 2 ? "Hãy đếm số ô, không phải chỉ số ở ô cuối nhé." : "Chúng mình thử lại nhé. Chỉ số bắt đầu từ 0 ở ô bên trái.");
      return;
    }
    setFeedback("");
    if (step === tasks.length - 1) setDone(true);
    else setStep(step + 1);
  }
  return <main className="adventure-map array-lesson">
    <header className="track-header"><button className="track-back" aria-label="Về bản đồ" onClick={onBack}><ArrowLeft size={20} /></button><div><span className="track-eyebrow">MẢNG · 01</span><h1>Array</h1></div><span className="array-mode">{demo ? <Eye size={20} /> : <Gamepad2 size={20} />}</span></header>
    <section className="array-content">
      <span className="array-overline">{demo ? "HỌC CÙNG BUTA" : done ? "ẢI ĐẦU TIÊN ĐÃ HOÀN THÀNH" : `THỬ THÁCH ${step + 1} / ${tasks.length}`}</span>
      <h2>{done ? "Những ô số đã vào đúng chỗ!" : task.title}</h2>
      <p className="array-prompt">{done ? "Bạn đã biết đọc vị trí, tìm giá trị, đếm phần tử và cập nhật mảng. Con đường tới Linear Search đã mở!" : task.text}</p>
      <div className="array-companion"><Pig mood={done ? "celebrate" : demo ? "explaining" : feedback ? "oops" : "pointing"} /></div>
      <div className="array-cells" aria-label="Mảng gồm bốn phần tử">{values.map((value, index) => <div key={index}>
        <button aria-label={`Ô chỉ số ${index}, giá trị ${value}`} className={demo && demoSteps[step].focus === index ? "cell-highlight" : ""} disabled={demo || done || step === 2} onClick={() => answer(index)}><span>{value}</span></button><small>chỉ số <b>{index}</b></small>
      </div>)}</div>
      {!demo && !done && step === 2 && <div className="array-counts" aria-label="Chọn số phần tử">{[3,4,5].map(count => <button key={count} onClick={() => answer(count)}>{count} phần tử</button>)}</div>}
      <p className="array-feedback" role="status">{feedback || (done ? "✓ Array hoàn thành · Linear Search đã mở khóa" : demo ? "Bạn có thể xem từng bước hoặc vào thẳng thử thách." : "Chọn câu trả lời để giúp Buta đi tiếp.")}</p>
      <div className="array-controls">{done ? <><button className="sheet-demo" onClick={() => { setDone(false); setStep(0); setFeedback(""); finished.current = false; }}><RotateCcw size={18} /> Chơi lại</button><button className="sheet-challenge" onClick={onNext}><Check size={18} /> Đi tiếp cùng Buta</button></> : demo ? <><button className="sheet-demo" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={18} /> Bước trước</button><button className="sheet-challenge" onClick={() => step < demoSteps.length - 1 ? setStep(step + 1) : onPlay()}>{step < demoSteps.length - 1 ? "Bước tiếp" : "Thử thách"}<ArrowRight size={18} /></button></> : null}</div>
      {demo && <button className="array-skip" onClick={onPlay}><Gamepad2 size={16} /> Vào thẳng thử thách</button>}
    </section>
  </main>;
}

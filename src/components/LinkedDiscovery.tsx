import { Fragment, useState } from "react";
import Fox from "./Fox";
import { Check, Lightbulb } from "./LinkedAssetIcons";

const lessons = [
  { title: "Một nút có gì?", task: "Chọn nút mang số 8.", note: "Một nút giữ một giá trị và một liên kết next.", answer: "8" },
  { title: "Đi theo sợi dây", task: "Chọn nút 3 để nối next của nút 8.", note: "HEAD là nơi bắt đầu. next của 8 cần nối đến nút 3.", answer: "3" },
  { title: "Nối lại đường đi", task: "Nút 3 bị mất liên kết. Chọn nơi nối để tới nút 6.", note: "Bạn vừa đi theo next. Giờ thử tự chọn đích cho nó.", answer: "6" },
  { title: "Dừng ở đâu?", task: "Nút 6 là nút cuối. next của nó nên trỏ tới đâu?", note: "Đường đi cần có một điểm kết thúc.", answer: "null" },
];

/** Small, safe interactions before asking a beginner to construct a whole list. */
export default function LinkedDiscovery({ onComplete }: { onComplete: () => void }) {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);
  const lesson = lessons[step];
  function choose(value: string) {
    if (solved) return;
    setSelected(value); setHint(false); setFeedback(""); setError(false);
  }
  function checkAnswer() {
    if (solved) return;
    if (selected === null) { setFeedback("Chọn một nút hoặc NULL, rồi bấm Kiểm tra nhé."); return; }
    const value = selected;
    setHint(false);
    const correct = value === lesson.answer;
    setError(!correct);
    setSolved(correct);
    if (correct && step > 0) {
      const source = ["", "8", "3", "6"][step];
      setLinks(current => ({ ...current, [source]: step === 3 ? "NULL" : value }));
    }
    if (correct) setFeedback([
      "Đúng rồi! 8 là dữ liệu. Phần next lưu liên kết đến nút khác, không lưu giá trị của nút đó.",
      "Đúng! next của 8 trỏ đến 3. Danh sách liên kết là các nút nối với nhau; ta đi từ HEAD theo từng liên kết next.",
      "Đường đi đã liền: 8 → 3 → 6. Liên kết quyết định nút tiếp theo, không phải vị trí khối trên màn hình.",
      "Chính xác! NULL nghĩa là không còn nút tiếp theo. Bạn đã sẵn sàng tự tạo một danh sách nhỏ.",
    ][step]);
    else setFeedback(step === 0
      ? value === "null" ? "NULL là điểm kết thúc, không phải dữ liệu của một nút. Hãy chọn phần chứa số 8 rồi bấm Kiểm tra."
        : `Bạn đã chọn dữ liệu ${value}. Mỗi nút giữ một giá trị riêng; lần này mình cần bạn chọn số 8. Chọn lại rồi bấm Kiểm tra nhé.`
      : step === 1
        ? `Bạn chọn ${value === "null" ? "NULL" : value}. Nhưng dây từ 8 đang đi tới 3. Ta đọc theo mũi tên, không nhảy thẳng tới nút cuối.`
        : step === 2
          ? value === "3" ? "Nối 3 về chính nó sẽ tạo vòng lặp: đi mãi mà không tới 6. Hãy chọn một nút khác." : value === "8" ? "Quay về 8 sẽ tạo vòng 8 → 3 → 8. Hãy nối tiếp tới nút chưa đi qua." : "NULL kết thúc danh sách quá sớm: nút 6 sẽ bị bỏ lại. Hãy nối tới 6 trước."
          : "Nếu nút cuối trỏ về một nút cũ, đường đi sẽ lặp lại mãi. NULL biểu thị không có nút tiếp theo; đó là cách kết thúc danh sách.");
  }
  return <section className="linked-discovery" aria-label="Làm quen Linked List">
    <div className="linked-discovery-progress" aria-label={`Làm quen: ${step + 1} trên 4`}>
      {lessons.map((item, index) => <span key={item.title} className={index <= step ? "is-active" : ""} />)}

    </div>
    <div className="discovery-chain" data-selection={selected ?? undefined} aria-label="Các nút 8, 3, 6 và NULL">
      {["8", "3", "6"].map((value, index) => <Fragment key={value}><div className="discovery-piece">
        <span className="discovery-label">{index === 0 ? "HEAD" : index === 2 ? "TAIL" : ""}</span>
        <div className={`discovery-node ${index === 1 ? "is-yellow" : ""} ${selected === value ? "is-selected" : ""}`}>
          <button aria-label={`Dữ liệu ${value}`} aria-pressed={selected === value} disabled={solved} onClick={() => choose(value)}><span className="discovery-node-value">{value}</span><span className="discovery-node-next" aria-hidden="true">next</span></button>
        </div>
      </div>
      <span className={`discovery-arrow ${links[value] ? "" : "is-broken"}`} aria-hidden="true">{links[value] ? "→" : "?"}</span>
      </Fragment>)}
      <button className={`discovery-null ${selected === "null" ? "is-selected" : ""}`} aria-pressed={selected === "null"} disabled={solved} onClick={() => choose("null")}>NULL</button>
    </div>
    <div className={`discovery-companion ${error ? "is-error" : ""}`}>
      <Fox mood={error ? "thinking" : solved ? "celebrate" : "happy"} />
      <div className="linked-speech"><span className="linked-speaker">Cáo đồng hành</span><p role="status">{hint ? lesson.note : feedback || lesson.task}</p></div>
    </div>
    <div className="discovery-actions">
      <button className="chunky-button linked-check-button" disabled={solved} onClick={checkAnswer}><Check size={24} /> Kiểm tra</button>
      <button className="linked-buta-hint" aria-expanded={hint} onClick={() => setHint(current => !current)}><Lightbulb size={24} /> Cáo gợi ý</button>
      {solved && <button className="discovery-continue" onClick={() => {
      if (step === lessons.length - 1) onComplete();
      else { setStep(step + 1); setSolved(false); setSelected(null); setHint(false); setFeedback(""); setError(false); }
    }}>{step === lessons.length - 1 ? "Tự xây danh sách" : "Tiếp tục"} <span aria-hidden="true">→</span></button>
      }
    </div>
  </section>;
}

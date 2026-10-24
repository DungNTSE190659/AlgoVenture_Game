import { useEffect, useState, type ReactNode } from "react";
import { Lightbulb } from "./LinkedAssetIcons";
import Fox from "./Fox";

export default function LinkedChallengeGuide({ message, error, guidance, objective, children }: {
  message: string; error: boolean; guidance: string; objective?: string; children: ReactNode;
}) {
  const [hint, setHint] = useState(false);
  useEffect(() => { setHint(false); }, [message]);
  return <>
    <div className="linked-challenge-guide">
      <Fox mood={error ? "thinking" : "explaining"} />
      <div className="linked-speech"><span className="linked-speaker">Cáo đồng hành</span><p className={`linked-play-feedback ${error && !hint ? "is-error" : ""}`} role="status">{hint ? guidance : message || objective || "Cứ thử nhé. Mình sẽ cùng bạn tìm ra nguyên nhân nếu có lỗi."}</p></div>
    </div>
    <div className="linked-challenge-tools">
      {children}
      <button className="linked-buta-hint" aria-expanded={hint} onClick={() => setHint(value => !value)}><Lightbulb size={20} /> Cáo gợi ý</button>

    </div>
  </>;
}

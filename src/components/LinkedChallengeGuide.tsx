import { useEffect, useState, type ReactNode } from "react";
import { Lightbulb, RotateCcw, Undo2 } from "./LinkedAssetIcons";
import Pig from "./Pig";

export default function LinkedChallengeGuide({ message, error, guidance, onReset, onUndo, canUndo, children }: {
  message: string; error: boolean; guidance: string; onReset: () => void; onUndo: () => void; canUndo: boolean; children: ReactNode;
}) {
  const [hint, setHint] = useState(false);
  useEffect(() => { setHint(false); }, [message]);
  return <>
    <div className="linked-challenge-guide">
      <Pig mood={error ? "thinking" : "explaining"} />
      <div className="linked-speech"><span className="linked-speaker">Buta đồng hành</span><p className={`linked-play-feedback ${error && !hint ? "is-error" : ""}`} role="status">{hint ? guidance : message || guidance}</p></div>
    </div>
    <div className="linked-challenge-tools">
      {children}
      <button className="linked-buta-hint" aria-expanded={hint} onClick={() => setHint(value => !value)}><Lightbulb size={20} /> Buta gợi ý</button>
      <div className="linked-challenge-secondary">
        <button className="linked-undo" disabled={!canUndo} onClick={() => { setHint(false); onUndo(); }}><Undo2 size={17} /> Hoàn tác</button>
        <button className="linked-reset" onClick={() => { setHint(false); onReset(); }}><RotateCcw size={17} /> Làm lại</button>
      </div>
    </div>
  </>;
}

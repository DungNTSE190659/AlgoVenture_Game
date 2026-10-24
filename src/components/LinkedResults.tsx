import { useEffect, useRef } from "react";
import Fox from "./Fox";
import { RotateCcw, Star } from "./LinkedAssetIcons";
import type { LinkedCounters } from "./LinkedStats";

export function LinkedResultSummary({ counters, mistakes }: { counters: LinkedCounters; mistakes: number }) {
  return <div className="bubble-result-summary linked-result-summary"><dl>
    <div><dt>Lần kiểm tra</dt><dd>{counters.checks}</dd></div>
    <div><dt>Lỗi cần sửa</dt><dd>{mistakes}</dd></div>
    <div><dt>Lượt đặt nút</dt><dd>{counters.placements}</dd></div>
    <div><dt>Lượt nối liên kết</dt><dd>{counters.connections}</dd></div>
    <div><dt>Nút đã duyệt</dt><dd>{counters.visits.length}</dd></div>
  </dl></div>;
}

export function LinkedFailure({ counters, mistakes, message, onReplay, onBack }: {
  counters: LinkedCounters; mistakes: number; message: string; onReplay: () => void; onBack: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const panel = dialog.current;
    panel?.showModal(); title.current?.focus({ preventScroll: true });
    return () => panel?.close();
  }, []);
  return <dialog ref={dialog} className="victory-screen bubble-failure" aria-labelledby="linked-failure-title" onCancel={event => event.preventDefault()}>
    <div className="bubble-failure-content">
      <h2 id="linked-failure-title" tabIndex={-1} ref={title}>Hết lượt thử rồi!</h2>
      <Fox mood="oops" />
      <div className="bubble-failure-stars" role="img" aria-label="0 trên 3 sao">{[0, 1, 2].map(index => <Star key={index} />)}</div>
      <LinkedResultSummary counters={counters} mistakes={mistakes} />
      <p>Đã kiểm tra chưa đúng 5 lần. {message} Mình thử lại nhé!</p>
      <button className="chunky-button button-green" onClick={onReplay}><RotateCcw size={20} /> Chơi lại</button>
      <button className="linked-buta-hint" onClick={onBack}>Về bản đồ</button>
    </div>
  </dialog>;
}

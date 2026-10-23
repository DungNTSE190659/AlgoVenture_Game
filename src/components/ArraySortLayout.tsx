import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import Pig from "./Pig";
import { GameFooter, GameHeader, GameStats } from "./GameHud";

type Slot = ReactElement<{ className?: string; children?: ReactNode }>;
// Keep each game's existing controls and handlers; only arrange presentation slots.
function nodes(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap(child => isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? nodes(child.props.children) : [child]);
}
const classOf = (node: ReactNode) => isValidElement<{ className?: string }>(node) ? node.props.className ?? "" : "";

export default function ArraySortLayout({ children, play }: { children: ReactNode; play: boolean }) {
  const all = nodes(children);
  const content = all.find(node => /^(bubble|selection|insertion|merge|qf)-content\b/.test(classOf(node))) as Slot | undefined;
  if (!content) return <>{children}</>;
  const board: ReactNode[] = [], tools: ReactNode[] = [];
  let instruction: ReactNode;
  for (const child of nodes(content.props.children)) {
    const name = classOf(child);
    if (isValidElement(child) && child.type === "h2") continue;
    if (/\b(bubble|selection|insertion|merge|qf)-task\b/.test(name)) { instruction = child; continue; }
    if (/\b(bubble-action-area|bubble-next-pass|selection-action|qf-actions|insertion-feedback|selection-feedback|merge-feedback|qf-feedback)\b/.test(name)) tools.push(child);
    else board.push(child);
  }
  const chrome: ReactNode[] = [], guide: ReactNode[] = [], dialogue: ReactNode[] = [], overlays: ReactNode[] = [];
  for (const child of all) {
    if (child === content) continue;
    const name = classOf(child);
    if (/\bbubble-dialogue\b/.test(name)) dialogue.push(child);
    else if (/\b(bubble-controls|selection-controls|insertion-controls|merge-controls|qf-demo-controls)\b/.test(name) && isValidElement<{ children?: ReactNode }>(child)) {
      const controls = nodes(child.props.children).filter(part => {
        if (/\b(selection|insertion|merge|qf)-dialogue\b/.test(classOf(part))) { dialogue.push(part); return false; }
        return true;
      });
      guide.push(cloneElement(child, {}, controls));
    }
    else if (isValidElement(child) && child.type === GameFooter) guide.push(child);
    else if (isValidElement(child) && (child.type === GameHeader || child.type === GameStats)) chrome.push(child);
    else overlays.push(child);
  }
  return <>
    {chrome}
    <div className="array-workspace">
      {cloneElement(content, { className: `${content.props.className} array-board-pane` }, board)}
      <aside className={`array-guide ${play ? "array-guide-play" : "array-guide-demo"}`} aria-label="Buta hướng dẫn">
        {play && tools.length > 0 && <div className="array-challenge-tools">{tools}</div>}
        {play && <div className="array-challenge-dialogue"><Pig mood="explaining" /><div className="array-instruction">{instruction}</div></div>}
        {!play && <div className="array-demo-dialogue">{dialogue}</div>}
        <div className="array-guide-actions">{guide}</div>
      </aside>
    </div>
    {overlays}
  </>;
}

import { useLayoutEffect, useRef, type RefObject } from "react";
import type { TreeStep } from "../engine/tree";

type Snapshot = { box: DOMRect; clone: HTMLElement };
function snapshot(element: HTMLElement): Snapshot {
  const clone = element.cloneNode(true) as HTMLElement;
  const originals = [element, ...element.querySelectorAll<HTMLElement>("*")];
  const copies = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
  originals.forEach((original, i) => {
    const style = getComputedStyle(original);
    for (const property of style) copies[i].style.setProperty(property, style.getPropertyValue(property));
    copies[i].removeAttribute("id");
    copies[i].removeAttribute("data-item");
    copies[i].removeAttribute("data-drop");
    copies[i].removeAttribute("data-slot");
    copies[i].style.visibility = "visible";
    // File-backed sliced skins must travel with a clone outside the game root.
    const skin = getComputedStyle(original, "::before");
    if (skin.content !== "none" && skin.content !== "normal" && skin.borderImageSource !== "none") {
      const layer = document.createElement("span");
      for (const property of skin) layer.style.setProperty(property, skin.getPropertyValue(property));
      layer.style.pointerEvents = "none";
      layer.setAttribute("aria-hidden", "true");
      copies[i].setAttribute("data-tree-snapshot", "true");
      copies[i].prepend(layer);
    }
  });
  clone.style.opacity = "1";
  return { box: element.getBoundingClientRect(), clone };
}

/** Preserve the actual visual across React's board snapshots, including single stepping. */
export default function useTreeDemoMotion(root: RefObject<HTMLDivElement | null>, enabled: boolean, key: string, step: TreeStep | undefined, paused: boolean, speed: number) {
  const previous = useRef<{ key: string; items: Map<string, Snapshot>; action?: Snapshot; target?: DOMRect } | null>(null);
  const flights = useRef<{ animation: Animation; finish: () => void }[]>([]);
  useLayoutEffect(() => {
    const panel = root.current;
    if (!enabled || !panel) return;
    const items = new Map<string, Snapshot>();
    panel.querySelectorAll<HTMLElement>("[data-tree-motion]").forEach(el => items.set(el.dataset.treeMotion!, snapshot(el)));
    const source = step && panel.querySelector<HTMLElement>(`[data-item="${step.item}"]`);
    const target = step && panel.querySelector<HTMLElement>(`[data-drop="${step.target}"]`);
    const old = previous.current;
    if (old && old.key !== key) {
      for (const flight of flights.current) flight.finish();
      flights.current = [];
      const before = old.key.split(":"), after = key.split(":");
      const sameRound = before[0] === after[0] && before[1] === after[1];
      const forward = sameRound && Number(after[2]) === Number(before[2]) + 1;
      if (sameRound && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const animate = (from: Snapshot, to: DOMRect, destination?: HTMLElement) => {
          const ghost = from.clone;
          ghost.classList.add("tree-motion-flight");
          ghost.setAttribute("aria-hidden", "true");
          ghost.setAttribute("inert", "");
          Object.assign(ghost.style, { position: "fixed", left: `${to.left}px`, top: `${to.top}px`, width: `${from.box.width}px`, height: `${from.box.height}px`, margin: "0", transform: "none", transition: "none", pointerEvents: "none", zIndex: "100" });
          document.body.append(ghost);
          const opacity = destination?.style.opacity ?? "";
          if (destination) destination.style.opacity = "0";
          const dx = from.box.left - to.left, dy = from.box.top - to.top;
          const animation = ghost.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: `translate(${dx / 2}px, ${dy / 2 - 20}px)`, offset: .5 }, { transform: "translate(0, 0)", opacity: destination ? 1 : 0 }], { duration: 800, easing: "cubic-bezier(.22,.61,.36,1)", fill: "both" });
          animation.playbackRate = speed;
          const finish = () => { animation.cancel(); ghost.remove(); if (destination) destination.style.opacity = opacity; };
          animation.onfinish = finish;
          flights.current.push({ animation, finish });
        };
        let moved = false;
        panel.querySelectorAll<HTMLElement>("[data-tree-motion]").forEach(el => {
          const from = old.items.get(el.dataset.treeMotion!);
          const to = el.getBoundingClientRect();
          if (from && (Math.abs(from.box.x - to.x) > 1 || Math.abs(from.box.y - to.y) > 1)) { animate(from, to, el); moved = true; }
          else if (!from && forward && old.action) { animate(old.action, to, el); moved = true; }
        });
        if (!moved && forward && old.action && old.target) animate(old.action, old.target);
      }
    }
    previous.current = { key, items, action: source ? snapshot(source) : undefined, target: target?.getBoundingClientRect() };
  }, [enabled, key, root]);
  useLayoutEffect(() => {
    for (const { animation } of flights.current) {
      animation.updatePlaybackRate(speed);
      if (paused) animation.pause(); else animation.play();
    }
  }, [paused, speed]);
  useLayoutEffect(() => () => { for (const flight of flights.current) flight.finish(); previous.current = null; }, [enabled]);
}

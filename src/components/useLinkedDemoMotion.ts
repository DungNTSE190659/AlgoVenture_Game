import { useLayoutEffect, useRef } from "react";

type Bounds = { left: number; top: number; width: number; height: number };
type Snapshot = { bounds: Bounds; scroll: { element: HTMLElement; x: number; y: number }[] };
type Flight = { ghost: Element; animation: Animation; finish: () => void };
const visualProperties = ["display", "position", "top", "right", "bottom", "left", "width", "height", "box-sizing", "padding", "margin", "border", "border-radius", "background", "box-shadow", "color", "font", "line-height", "letter-spacing", "text-shadow", "text-align", "flex-direction", "align-items", "justify-content", "gap", "transform", "transform-origin", "fill", "stroke", "stroke-width", "opacity", "filter", "clip-path", "z-index"];

function visualClone(element: Element): Element {
  const clone = element.cloneNode(true) as Element;
  const originals = [element, ...element.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  originals.forEach((original, index) => {
    const style = getComputedStyle(original);
    const copy = copies[index] as HTMLElement | SVGElement;
    for (const property of visualProperties) copy.style.setProperty(property, style.getPropertyValue(property));
    copy.style.visibility = "visible";
    copy.removeAttribute("id");
    copy.setAttribute("tabindex", "-1");
  });
  (clone as HTMLElement).style.opacity = "1";
  return clone;
}

/** Animate shared objects even when React moves them between different parents. */
export default function useLinkedDemoMotion(enabled: boolean, step: number) {
  const ref = useRef<HTMLDivElement>(null);
  const speed = useRef(1);
  const snapshots = useRef(new Map<string, Snapshot>());
  const paths = useRef(new Map<string, string>());
  const flights = useRef(new Map<string, Flight>());
  const wireAnimations = useRef(new Map<string, Animation>());
  const hiddenHardware = useRef(new Map<HTMLElement | SVGElement, string>());
  const lastStep = useRef(step);

  function restoreHardware() {
    for (const [element, visibility] of hiddenHardware.current) element.style.visibility = visibility;
    hiddenHardware.current.clear();
  }

  function syncHardware() {
    restoreHardware();
    const root = ref.current;
    if (!root) return;
    const hide = (element: HTMLElement | SVGElement) => {
      if (!hiddenHardware.current.has(element)) hiddenHardware.current.set(element, element.style.visibility);
      element.style.visibility = "hidden";
    };
    for (const key of flights.current.keys()) {
      if (!key.startsWith("node-")) continue;
      const id = key.slice(5);
      root.querySelectorAll<HTMLElement | SVGElement>(`[data-demo-wire="${id}"], [data-demo-nail="${id}"], [data-demo-node="${id}"] .ll-hole, [data-demo-node="${id}"] .ll-rope-anchor`).forEach(hide);
      const nailGhost = flights.current.get(`nail-${id}`)?.ghost;
      if (nailGhost) {
        hide(nailGhost as HTMLElement);
        nailGhost.querySelectorAll<HTMLElement | SVGElement>("*").forEach(hide);
      }
    }
  }

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !enabled) return;
    restoreHardware();
    const stepChanged = lastStep.current !== step;
    lastStep.current = step;
    if (stepChanged) {
      const rootBox = root.getBoundingClientRect();
      const movedNode = [...root.querySelectorAll<HTMLElement>(".linked-slot [data-demo-node]")].find(node => {
        const previous = snapshots.current.get(`node-${node.dataset.demoNode}`);
        const box = node.querySelector(".linked-node-body")?.getBoundingClientRect();
        return previous && box && Math.abs(box.top - rootBox.top - previous.bounds.top) > 2;
      });
      const focus = root.querySelector(".journey-pig, .node-selected, .journey-nail-selected") ?? movedNode;
      focus?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || step === 0) {
      for (const flight of flights.current.values()) flight.finish();
      for (const animation of wireAnimations.current.values()) animation.cancel();
      wireAnimations.current.clear();
    }
    if (step > 0) root.querySelector(".journey-pig")?.scrollIntoView({ block: "nearest", inline: "center" });
    const origin = root.getBoundingClientRect();
    const next = new Map<string, Snapshot>();
    const elements: [string, Element][] = [];
    root.querySelectorAll<HTMLElement>("[data-demo-node]").forEach(node => {
      const body = node.querySelector(".linked-node-body");
      if (body) elements.push([`node-${node.dataset.demoNode}`, body]);
    });
    root.querySelectorAll<HTMLElement>("[data-demo-nail]").forEach(nail => elements.push([`nail-${nail.dataset.demoNail}`, nail]));
    const pig = root.querySelector(".journey-pig .pig, .journey-pig-pickup .pig");
    if (pig) elements.push(["pig", pig]);
    const duration = 700 / speed.current;
    for (const [key, element] of elements) {
      const box = element.getBoundingClientRect();
      const bounds = { left: box.left - origin.left, top: box.top - origin.top, width: box.width, height: box.height };
      const scroll: Snapshot["scroll"] = [];
      for (let parent = element.parentElement; parent && parent !== root; parent = parent.parentElement) {
        scroll.push({ element: parent, x: parent.scrollLeft, y: parent.scrollTop });
      }
      next.set(key, { bounds, scroll });
      const previous = snapshots.current.get(key);
      const scrollX = previous?.scroll.reduce((sum, item) => sum + item.element.scrollLeft - item.x, 0) ?? 0;
      const scrollY = previous?.scroll.reduce((sum, item) => sum + item.element.scrollTop - item.y, 0) ?? 0;
      const dx = previous ? previous.bounds.left - scrollX - bounds.left : 0;
      const dy = previous ? previous.bounds.top - scrollY - bounds.top : 0;
      if (reduced || step === 0 || (previous && Math.abs(dx) < 1 && Math.abs(dy) < 1)) continue;
      const active = flights.current.get(key);
      const activeBox = active?.ghost.getBoundingClientRect();
      active?.finish();
      const ghost = visualClone(element) as HTMLElement | SVGElement;
      ghost.setAttribute("data-linked-demo-motion", key);
      ghost.setAttribute("aria-hidden", "true");
      ghost.setAttribute("inert", "");
      Object.assign(ghost.style, { position: "fixed", left: `${box.left}px`, top: `${box.top}px`, right: "auto", bottom: "auto", width: `${box.width}px`, height: `${box.height}px`, margin: "0", transform: "none", transformOrigin: "center", pointerEvents: "none", zIndex: "100", transition: "none" });
      document.body.append(ghost);
      const target = element as HTMLElement | SVGElement;
      const opacity = target.style.opacity;
      target.style.opacity = "0";
      const x = activeBox ? activeBox.left - box.left : dx;
      const y = activeBox ? activeBox.top - box.top : dy;
      const animation = ghost.animate(previous ? [
        { transform: `translate(${x}px, ${y}px)` },
        { transform: `translate(${x / 2}px, ${y / 2 - (key.startsWith("node") ? 24 : 0)}px)`, offset: .5 },
        { transform: "translate(0, 0)" },
      ] : [{ transform: "scale(.75)" }, { transform: "scale(1)" }], { duration, easing: "cubic-bezier(.22,.61,.36,1)" });
      const finish = () => {
        animation.cancel();
        ghost.remove();
        target.style.opacity = opacity;
        if (flights.current.get(key)?.animation === animation) flights.current.delete(key);
        syncHardware();
      };
      flights.current.set(key, { ghost, animation, finish });
      animation.onfinish = finish;
    }
    snapshots.current = next;
    for (const [key, flight] of flights.current) if (!next.has(key)) flight.finish();

    const nextPaths = new Map<string, string>();
    root.querySelectorAll<SVGPathElement>("[data-demo-wire]").forEach(path => {
      const key = path.dataset.demoWire!;
      const d = path.getAttribute("d")!;
      const previous = paths.current.get(key);
      nextPaths.set(key, d);
      if (reduced || step === 0 || previous === d) return;
      const active = wireAnimations.current.get(key);
      const current = active ? getComputedStyle(path).getPropertyValue("d") : previous ? `path("${previous}")` : null;
      active?.cancel();
      const animation = path.animate(current ? [{ d: current }, { d: `path("${d}")` }] : [{ strokeDashoffset: 12 }, { strokeDashoffset: 0 }], { duration, easing: "cubic-bezier(.22,.61,.36,1)" });
      wireAnimations.current.set(key, animation);
      animation.onfinish = () => { animation.cancel(); wireAnimations.current.delete(key); };
    });
    paths.current = nextPaths;
    syncHardware();
  });

  useLayoutEffect(() => () => {
    for (const flight of flights.current.values()) flight.finish();
    for (const animation of wireAnimations.current.values()) animation.cancel();
    restoreHardware();
    snapshots.current.clear();
    paths.current.clear();
  }, [enabled]);

  return {
    ref,
    onPauseChange: (paused: boolean) => {
      for (const flight of flights.current.values()) paused ? flight.animation.pause() : flight.animation.play();
      for (const animation of wireAnimations.current.values()) paused ? animation.pause() : animation.play();
    },
    onSpeedChange: (value: number) => {
      const ratio = value / speed.current;
      speed.current = value;
      for (const flight of flights.current.values()) flight.animation.updatePlaybackRate(flight.animation.playbackRate * ratio);
      for (const animation of wireAnimations.current.values()) animation.updatePlaybackRate(animation.playbackRate * ratio);
    },
  };
}

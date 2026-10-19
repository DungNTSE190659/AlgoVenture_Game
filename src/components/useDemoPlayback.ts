import { useEffect, useRef } from "react";

/** Count lesson time, preserving progress when speed changes or playback pauses. */
export function useDemoPlayback(step: number, duration: number, speed: number, running: boolean, advance: () => void) {
  const remaining = useRef(duration);
  const onAdvance = useRef(advance);
  onAdvance.current = advance;
  useEffect(() => { remaining.current = duration; }, [step, duration]);
  useEffect(() => {
    if (!running) return;
    const started = performance.now();
    const timer = setTimeout(() => { remaining.current = 0; onAdvance.current(); }, remaining.current / speed);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - started) * speed);
    };
  }, [step, duration, speed, running]);
}

/** Include both CSS motion and tile animations created with Element.animate(). */
export function useDemoMotionSpeed(speed: number) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    for (const animation of root.current?.getAnimations({ subtree: true }) ?? []) {
      const target = (animation.effect as KeyframeEffect | null)?.target;
      if (target instanceof Element && target.closest(".pig")) continue;
      animation.updatePlaybackRate(speed);
    }
  });
  return root;
}

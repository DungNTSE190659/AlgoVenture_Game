import { useEffect, useState } from "react";

// A damped pendulum for the free end. Gravity restores the hanging rope.
export function useRopeMotion(impulse: string) {
  const [offset, setOffset] = useState({ x: 28, y: 52 });
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setOffset({ x: 0, y: 60 }); return; }
    let angle = .9, velocity = 0, previous = performance.now(), frame = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .03); previous = now;
      velocity += (-12 * Math.sin(angle) - 2.4 * velocity) * dt;
      angle += velocity * dt;
      setOffset({ x: Math.sin(angle) * 60, y: Math.cos(angle) * 60 });
      if (Math.abs(angle) + Math.abs(velocity) < .045) { setOffset({ x: 0, y: 60 }); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [impulse]);
  return offset;
}

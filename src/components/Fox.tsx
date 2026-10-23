import type { PigMood } from "../engine/lesson";

/** Bubble Sort's companion; character changes do not affect lesson state. */
export default function Fox({ mood = "happy" }: { mood?: PigMood }) {
  const encouraging = mood === "oops" || mood === "thinking";
  return <span className="bubble-fox" role="img" aria-label={encouraging ? "Cáo động viên bạn" : "Cáo vui vẻ"} data-mood={mood}>
    <img src={`${import.meta.env.BASE_URL}assets/fox/${encouraging ? "encouraging" : "happy"}.png`} alt="" aria-hidden="true" draggable={false} />
  </span>;
}

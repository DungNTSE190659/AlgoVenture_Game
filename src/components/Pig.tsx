import { useState } from "react";
import type { PigMood } from "../engine/lesson";

type Props = { mood?: PigMood; small?: boolean };
const names: Record<PigMood, string> = {
  happy: "vui vẻ",
  thinking: "đang suy nghĩ",
  oops: "động viên bạn",
  celebrate: "ăn mừng",
  pointing: "chỉ dẫn",
  explaining: "đang giải thích",
  surprised: "ngạc nhiên",
  proud: "tự hào",
};
const artwork = (mood: PigMood) => `${import.meta.env.BASE_URL}assets/buta/2d/${mood}.webp`;
const motion = (mood: PigMood) => `${import.meta.env.BASE_URL}assets/buta/2d/motion/${mood}.webp`;

/** Four drawn poses animate the face and limbs, rather than bobbing a static picture. */
export default function Pig({ mood = "happy", small = false }: Props) {
  const [loaded, setLoaded] = useState<PigMood | null>(null);
  return (
    <span
      className={`pig pig-${mood}${small ? " pig-small" : ""}`}
      role="img"
      aria-label={`Buta ${names[mood]}`}
      data-mood={mood}
      data-animated={loaded === mood}
    >
      <img className="pig-still" src={artwork(mood)} alt="" aria-hidden="true" draggable={false} />
      <span className="pig-clip" aria-hidden="true">
        <img
          key={mood}
          className="pig-sheet"
          src={motion(mood)}
          alt=""
          draggable={false}
          decoding="async"
          onLoad={() => setLoaded(mood)}
        />
      </span>
    </span>
  );
}

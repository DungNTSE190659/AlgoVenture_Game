import { useState } from "react";
import { Vibrate } from "lucide-react";
import { readHapticsPreference, setHapticsEnabled } from "../audio/gameFeedback";

export default function HapticsToggle() {
  const [enabled, setEnabled] = useState(readHapticsPreference);
  return <button type="button" className="lesson-sound-toggle" aria-pressed={enabled} onClick={() => {
    setHapticsEnabled(!enabled);
    setEnabled(!enabled);
  }}><Vibrate size={21} /><span>Rung khi thao tác</span><b>{enabled ? "Bật" : "Tắt"}</b></button>;
}

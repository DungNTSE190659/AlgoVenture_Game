import { useState } from "react";
import { Vibrate } from "lucide-react";
import { Vibrate as TreeVibrate } from "./TreeAssetIcons";
import { readHapticsPreference, setHapticsEnabled } from "../audio/gameFeedback";

export default function HapticsToggle({ assetTheme }: { assetTheme?: "tree" }) {
  const [enabled, setEnabled] = useState(readHapticsPreference);
  return <button type="button" className="lesson-sound-toggle" aria-pressed={enabled} onClick={() => {
    setHapticsEnabled(!enabled);
    setEnabled(!enabled);
  }}>{assetTheme === "tree" ? <TreeVibrate size={21} /> : <Vibrate size={21} />}<span>Rung khi thao tác</span><b>{enabled ? "Bật" : "Tắt"}</b></button>;
}

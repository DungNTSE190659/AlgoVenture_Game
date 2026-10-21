import { afterEach, describe, expect, it, vi } from "vitest";
import { playFeedback, setHapticsEnabled, stopHaptics } from "./gameFeedback";
import { gameAudio } from "./gameAudio";
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("gameplay feedback", () => {
  it("vibrates independently of muted audio and respects saved preference", () => {
    const values = new Map<string, string>();
    const vibrate = vi.fn();
    vi.stubGlobal("document", { hidden: false });
    vi.stubGlobal("navigator", { vibrate, userActivation: { hasBeenActive: true } });
    vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key), setItem: (key: string, value: string) => values.set(key, value) });
    vi.spyOn(gameAudio, "play").mockReturnValue(false);
    playFeedback("retry");
    expect(vibrate).toHaveBeenLastCalledWith([25, 40, 25]);
    setHapticsEnabled(false);
    expect(vibrate).toHaveBeenLastCalledWith(0);
    playFeedback("correct");
    expect(vibrate).toHaveBeenCalledTimes(2);
    setHapticsEnabled(true);
    playFeedback("correct");
    expect(vibrate).toHaveBeenLastCalledWith([12, 35, 20]);
  });
  it("does nothing on hidden, inactive, unsupported or restricted devices", () => {
    vi.spyOn(gameAudio, "play").mockReturnValue(false);
    vi.stubGlobal("document", { hidden: false });
    vi.stubGlobal("navigator", {});
    expect(() => playFeedback("finish")).not.toThrow();
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate, userActivation: { hasBeenActive: false } });
    playFeedback("correct");
    expect(vibrate).not.toHaveBeenCalled();
    stopHaptics();
    expect(vibrate).not.toHaveBeenCalled();
    vi.stubGlobal("document", { hidden: true });
    playFeedback("retry");
    expect(vibrate).not.toHaveBeenCalled();
    vi.stubGlobal("navigator", { vibrate: () => { throw new Error("unavailable"); } });
    expect(stopHaptics).not.toThrow();
  });
});

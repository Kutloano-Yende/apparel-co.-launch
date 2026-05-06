import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "admin-notif-sound-enabled";
const VOLUME_KEY = "admin-notif-sound-volume";
const DEFAULT_VOLUME = 0.25;

// Generate a short, pleasant two-tone chime via WebAudio (no asset needed)
// Returns true on success, or an error code string on failure.
const playChime = async (volume: number): Promise<true | "unsupported" | "blocked" | "error"> => {
  try {
    const AudioCtx =
      (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!AudioCtx) return "unsupported";
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return "blocked";
      }
      if (ctx.state === "suspended") return "blocked";
    }

    const peak = Math.max(0.0001, Math.min(1, volume));
    const now = ctx.currentTime;
    const tones: Array<[number, number]> = [
      [880, now], // A5
      [1320, now + 0.14], // E6
    ];

    tones.forEach(([freq, start]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.34);
    });

    setTimeout(() => ctx.close().catch(() => {}), 800);
    return true;
  } catch {
    return "error";
  }
};

export const useNotificationSound = () => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "true";
  });

  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_VOLUME;
    const v = localStorage.getItem(VOLUME_KEY);
    if (v === null) return DEFAULT_VOLUME;
    const parsed = parseFloat(v);
    if (Number.isNaN(parsed)) return DEFAULT_VOLUME;
    return Math.max(0, Math.min(1, parsed));
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {}
  }, [enabled]);

  useEffect(() => {
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {}
  }, [volume]);

  const play = useCallback(() => {
    if (!enabled) return;
    void playChime(volume);
  }, [enabled, volume]);

  const testSound = useCallback(() => {
    void playChime(volume);
  }, [volume]);

  return { enabled, setEnabled, volume, setVolume, play, testSound };
};

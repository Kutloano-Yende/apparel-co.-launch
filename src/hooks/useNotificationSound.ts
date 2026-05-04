import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "admin-notif-sound-enabled";

// Generate a short, pleasant two-tone chime via WebAudio (no asset needed)
const playChime = async () => {
  try {
    const AudioCtx =
      (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

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
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.34);
    });

    // Auto-close context shortly after
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // Silently ignore — autoplay restrictions or unsupported browser
  }
};

export const useNotificationSound = () => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "true";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {}
  }, [enabled]);

  const play = useCallback(() => {
    if (!enabled) return;
    void playChime();
  }, [enabled]);

  const testSound = useCallback(() => {
    void playChime();
  }, []);

  return { enabled, setEnabled, play, testSound };
};

"use client";

import { useEffect, useRef } from "react";

/**
 * Soft ambient sound that plays automatically after the first user
 * interaction (browser autoplay policy requires a user gesture).
 * No toggle — plays once subtly then fades.
 */
export default function AutoAmbientSound() {
  const playedRef = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const start = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 380;
        filter.connect(master);
        [55, 82.5, 110].forEach((f, i) => {
          const o = ctx.createOscillator();
          o.type = "sine";
          o.frequency.value = f;
          const g = ctx.createGain();
          g.gain.value = i === 0 ? 0.5 : 0.25;
          o.connect(g);
          g.connect(filter);
          o.start();
          o.stop(ctx.currentTime + 6);
        });
        // Fade in then out
        const t = ctx.currentTime;
        master.gain.setValueAtTime(0, t);
        master.gain.linearRampToValueAtTime(0.04, t + 1.5);
        master.gain.linearRampToValueAtTime(0, t + 5.5);
        setTimeout(() => ctx.close().catch(() => {}), 6500);
      } catch {
        /* ignore */
      }
      // Clean up listeners
      document.removeEventListener("click", start);
      document.removeEventListener("touchstart", start);
      document.removeEventListener("keydown", start);
    };

    document.addEventListener("click", start, { once: true });
    document.addEventListener("touchstart", start, { once: true });
    document.addEventListener("keydown", start, { once: true });

    return () => {
      document.removeEventListener("click", start);
      document.removeEventListener("touchstart", start);
      document.removeEventListener("keydown", start);
    };
  }, []);

  return null;
}

"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Optional ambient sound. Default OFF. Uses the Web Audio API to generate a
 * soft, low pad — no audio asset required. Only starts on a user gesture,
 * which respects browser autoplay restrictions.
 */
export default function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ gain: GainNode; oscs: OscillatorNode[] } | null>(null);

  useEffect(() => {
    return () => {
      const ctx = ctxRef.current;
      if (ctx) ctx.close().catch(() => {});
    };
  }, []);

  const start = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = reduce ? 220 : 420;
    filter.connect(master);

    const freqs = [55, 82.5, 110];
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.6 : 0.3;
      o.connect(g);
      g.connect(filter);
      o.start();
      return o;
    });
    nodesRef.current = { gain: master, oscs };

    master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.4);
  };

  const stop = () => {
    const ctx = ctxRef.current;
    const nodes = nodesRef.current;
    if (!ctx || !nodes) return;
    nodes.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    setTimeout(() => {
      nodes.oscs.forEach((o) => {
        try {
          o.stop();
        } catch {
          /* ignore */
        }
      });
      ctx.suspend().catch(() => {});
    }, 700);
  };

  const toggle = () => {
    if (on) {
      stop();
      setOn(false);
    } else {
      if (!ctxRef.current) start();
      else {
        const ctx = ctxRef.current;
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        const nodes = nodesRef.current;
        if (nodes) nodes.gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1);
      }
      setOn(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`${on ? "Mute" : "Enable"} ambient sound`}
      aria-pressed={on}
      className={`grid h-9 w-9 place-items-center text-ink/80 transition-colors hover:text-ink ${className}`}
    >
      <span className="relative flex h-[17px] items-end gap-[2px]">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="block w-[2px] rounded-full bg-current transition-all duration-300"
            style={{
              height: on ? `${[5, 11, 15, 8][i]}px` : "3px",
              opacity: on ? 1 : 0.5,
            }}
          />
        ))}
      </span>
    </button>
  );
}

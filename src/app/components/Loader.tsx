"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";

export default function Loader() {
  const [gone, setGone] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const holdMs = reduce ? 100 : 700;
    const fadeMs = reduce ? 100 : 300;

    const hide = window.setTimeout(() => setGone(true), holdMs);
    const remove = window.setTimeout(() => setRemoved(true), holdMs + fadeMs);

    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(remove);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      data-intro
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[100] flex w-full items-center justify-center bg-base transition-opacity duration-300 ${
        gone ? "opacity-0" : "opacity-100"
      }`}
      style={{ animation: "ks-loader-safety 2s step-end forwards" }}
    >
      <span className="flex overflow-hidden" aria-hidden="true">
        {BRAND.name.split("").map((letter, index) => (
          <span
            key={index}
            className="font-display text-[clamp(2rem,7vw,4.5rem)] tracking-[0.3em] text-ink"
            style={{
              animation: "ks-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both",
              animationDelay: `${index * 0.035}s`,
              paddingLeft: index === 0 ? "0.3em" : 0,
            }}
          >
            {letter}
          </span>
        ))}
      </span>
    </div>
  );
}

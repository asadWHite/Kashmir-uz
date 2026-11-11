"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";
import { useT } from "./I18nProvider";

export default function Loader() {
  const { t } = useT();
  const [gone, setGone] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const holdMs = reduce ? 150 : 1_250;
    const fadeMs = reduce ? 150 : 650;

    // The intro is visual only. It must never lock document scrolling or
    // intercept mouse/touch input, including on desktop if hydration stalls.
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
      className={`pointer-events-none fixed inset-0 z-[100] flex w-full flex-col items-center justify-center bg-base transition-opacity duration-700 ${
        gone ? "opacity-0" : "opacity-100"
      }`}
      // If hydration never completes, CSS hides the visual intro after 5 seconds.
      style={{ animation: "ks-loader-safety 5s step-end forwards" }}
    >
      <span className="flex overflow-hidden" aria-hidden="true">
        {BRAND.name.split("").map((letter, index) => (
          <span
            key={index}
            className="font-display text-[clamp(2rem,7vw,4.5rem)] tracking-[0.3em] text-ink"
            style={{
              animation: "ks-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
              animationDelay: `${0.1 + index * 0.06}s`,
              paddingLeft: index === 0 ? "0.3em" : 0,
            }}
          >
            {letter}
          </span>
        ))}
      </span>
      <span className="mt-7 h-px w-40 origin-left overflow-hidden bg-line" aria-hidden="true">
        <span
          className="block h-full w-full origin-left bg-ink"
          style={{ animation: "ks-bar 1.2s cubic-bezier(0.65,0,0.35,1) both", animationDelay: "0.2s" }}
        />
      </span>
      <span
        className="eyebrow mt-5 opacity-0"
        style={{ animation: "ks-fade-in 0.8s ease 0.7s both" }}
        aria-hidden="true"
      >
        {t("loader.sub")}
      </span>
    </div>
  );
}

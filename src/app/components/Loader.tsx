"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";
import { useT } from "./I18nProvider";

export default function Loader() {
  const { t } = useT();
  // Never render a blocking overlay in server HTML: if hydration fails, there
  // would be no React effect to dismiss it.
  const [visible, setVisible] = useState(false);
  const [gone, setGone] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const reduce = typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const holdMs = reduce ? 200 : 1500;
    const fadeMs = reduce ? 150 : 800;

    // Mounting after hydration intentionally keeps failed JS from blocking the page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    const t1 = window.setTimeout(() => setGone(true), holdMs);
    const t2 = window.setTimeout(() => setRemoved(true), holdMs + fadeMs);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (!visible || removed) return null;
  const letters = BRAND.name.split("");

  return (
    <div
      data-intro
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex w-full flex-col items-center justify-center bg-base transition-opacity duration-700 ${
        gone ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      // Independent of React's timers: if JS stops after mounting, the overlay
      // eventually becomes invisible and stops intercepting input.
      style={{ animation: "ks-loader-safety 3s step-end forwards" }}
    >
      <span className="flex overflow-hidden" aria-hidden="true">
        {letters.map((l, i) => (
          <span
            key={i}
            className="font-display text-[clamp(2rem,7vw,4.5rem)] tracking-[0.3em] text-ink"
            style={{
              animation: "ks-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
              animationDelay: `${0.1 + i * 0.06}s`,
              paddingLeft: i === 0 ? "0.3em" : 0,
            }}
          >
            {l}
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

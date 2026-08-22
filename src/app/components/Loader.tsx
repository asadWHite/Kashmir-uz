"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";
import { useT } from "./I18nProvider";

export default function Loader() {
  const { t } = useT();
  const [gone, setGone] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const holdMs = reduce ? 200 : 1500;
    const fadeMs = reduce ? 150 : 800;

    document.body.style.overflow = "hidden";
    const t1 = window.setTimeout(() => setGone(true), holdMs);
    const t2 = window.setTimeout(() => {
      setRemoved(true);
      document.body.style.overflow = "";
    }, holdMs + fadeMs);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      document.body.style.overflow = "";
    };
  }, []);

  if (removed) return null;
  const letters = BRAND.name.split("");

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-base transition-opacity duration-700 ${
        gone ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="flex overflow-hidden">
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
      </div>
      <div className="mt-7 h-px w-40 origin-left overflow-hidden bg-line">
        <span
          className="block h-full w-full origin-left bg-ink"
          style={{ animation: "ks-bar 1.2s cubic-bezier(0.65,0,0.35,1) both", animationDelay: "0.2s" }}
        />
      </div>
      <p
        className="eyebrow mt-5 opacity-0"
        style={{ animation: "ks-fade-in 0.8s ease 0.7s both" }}
      >
        {t("loader.sub")}
      </p>
    </div>
  );
}

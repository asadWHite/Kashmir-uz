"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { useT } from "./I18nProvider";
import type { StatView } from "@/lib/types";

function formatNum(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

function CountUp({ value, suffix }: { value: string; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const num = parseFloat(value);
    const el = ref.current;
    if (!el) return;
    if (Number.isNaN(num)) {
      setDisplay(value);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !done) {
            done = true;
            const dur = 1700;
            const start = performance.now();
            const tick = (now: number) => {
              const p = Math.min((now - start) / dur, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              setDisplay(formatNum(num * eased));
              if (p < 1) requestAnimationFrame(tick);
              else setDisplay(value);
            };
            requestAnimationFrame(tick);
            io.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export default function Statistics({ stats }: { stats: StatView[] }) {
  const { t, ts, tsS } = useT();
  return (
    <section className="bg-[#1E2023] text-[#F5F0EB]">
      <div className="container-edge py-24 md:py-32">
        <Reveal>
          <p
            className="mb-12 text-[0.72rem] uppercase tracking-[0.32em]"
            style={{ color: "rgba(245,240,235,0.55)" }}
          >
            {t("stats.title")}
          </p>
        </Reveal>
        <div className="grid grid-cols-2 gap-y-14 md:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal
              key={s.id}
              delay={i * 80}
              className={`px-1 md:px-8 ${i % 3 !== 0 ? "md:border-l" : ""} border-white/10`}
            >
              <div className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-none">
                <CountUp value={s.value} suffix={tsS(s.label, s.suffix ?? "")} />
              </div>
              <p
                className="mt-4 text-[0.7rem] uppercase tracking-[0.26em]"
                style={{ color: "rgba(245,240,235,0.6)" }}
              >
                {ts(s.label, s.label)}
              </p>
            </Reveal>
          ))}
        </div>
        {stats.length === 0 && (
          <p className="font-display text-2xl" style={{ color: "rgba(245,240,235,0.5)" }}>
            —
          </p>
        )}
      </div>
    </section>
  );
}

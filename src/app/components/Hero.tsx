"use client";

import { useEffect, useRef } from "react";
import { BRAND, ASSETS } from "@/lib/constants";
import { getHomeSeo } from "@/lib/seo";
import { useT } from "./I18nProvider";

export default function Hero() {
  const { t, locale } = useT();
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { title, description } = getHomeSeo(locale);
    document.title = title;
    const assign = (selector: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute("content", value);
    };
    assign('meta[name="description"]', description);
    assign('meta[property="og:title"]', title);
    assign('meta[property="og:description"]', description);
    assign('meta[name="twitter:title"]', title);
    assign('meta[name="twitter:description"]', description);
  }, [locale]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    const update = () => {
      const y = window.scrollY;
      if (bgRef.current && y < window.innerHeight) {
        bgRef.current.style.transform = `translate3d(0, ${y * 0.2}px, 0) scale(1.06)`;
      }
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      <div ref={bgRef} className="absolute inset-0 -z-20" style={{ transform: "scale(1.06)" }}>
        <img
          src={ASSETS.hero}
          alt={`${BRAND.full} — luxury interior with flowing curtains`}
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
      </div>

      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/35 via-black/15 to-black/65" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 38%, transparent 35%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      <div className="container-edge relative text-center text-[#F5F0EB]">
        <p
          className="eyebrow anim-fade-up"
          style={{ animationDelay: "0.5s", color: "rgba(245,240,235,0.75)" }}
        >
          {t("hero.eyebrow")}
        </p>
        <p
          className="mt-6 font-display anim-fade-up"
          style={{
            animationDelay: "0.66s",
            fontSize: "clamp(3.2rem, 14vw, 12rem)",
            lineHeight: 0.88,
            letterSpacing: "0.05em",
            fontWeight: 500,
          }}
          aria-hidden="true"
        >
          {BRAND.name}
        </p>
        <h1
          className="mx-auto mt-8 max-w-3xl font-display anim-fade-up"
          style={{
            animationDelay: "0.78s",
            fontSize: "clamp(1.35rem, 3.4vw, 2.25rem)",
            lineHeight: 1.2,
            letterSpacing: "0.04em",
            fontWeight: 500,
          }}
        >
          {t("hero.seoTitle")}
        </h1>
        <p
          className="mx-auto mt-6 max-w-xl text-pretty anim-fade-up text-base md:text-lg"
          style={{ animationDelay: "0.92s", color: "rgba(245,240,235,0.82)" }}
        >
          {t("hero.statement")}
        </p>
      </div>

      <div
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 anim-fade-in"
        style={{ animationDelay: "1.2s" }}
      >
        <span className="text-[0.62rem] uppercase tracking-[0.4em] text-white/60">
          {t("hero.scroll")}
        </span>
        <span className="relative block h-12 w-px overflow-hidden bg-white/25">
          <span
            className="absolute left-0 top-0 block h-4 w-px bg-white"
            style={{ animation: "ks-fade-up 1.6s ease-in-out infinite" }}
          />
        </span>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BRAND } from "@/lib/constants";
import { INTRO_DURATION_MS, INTRO_FADE_MS, INTRO_HOLD_MS } from "@/lib/intro";
import { useT } from "./I18nProvider";

export default function Loader() {
  const { t } = useT();
  const [removed, setRemoved] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (removed) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const startedAt = Date.now();
    const finish = () => setRemoved(true);
    // CSS owns the complete timeline, even before hydration. The timer is an
    // independent escape hatch if animations are disabled or animationend fails.
    const fallback = window.setTimeout(finish, reduce.matches ? 0 : INTRO_DURATION_MS);
    const onMotionChange = () => { if (reduce.matches) finish(); };
    reduce.addEventListener("change", onMotionChange);

    // Keep taps from activating invisible links. Do not lock body overflow or
    // make content inert: the CSS cutoff must release input even if JS stalls.
    const isPresent = () => !reduce.matches &&
      Date.now() - startedAt < INTRO_DURATION_MS &&
      getComputedStyle(overlay).visibility !== "hidden";
    const stopScroll = (event: Event) => {
      if (isPresent()) event.preventDefault();
    };
    const stopKeys = (event: KeyboardEvent) => {
      if (isPresent() && ["Tab", "Enter", " ", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "PageDown", "PageUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    overlay.addEventListener("wheel", stopScroll, { passive: false });
    overlay.addEventListener("touchmove", stopScroll, { passive: false });
    document.addEventListener("keydown", stopKeys, true);
    return () => {
      window.clearTimeout(fallback);
      reduce.removeEventListener("change", onMotionChange);
      overlay.removeEventListener("wheel", stopScroll);
      overlay.removeEventListener("touchmove", stopScroll);
      document.removeEventListener("keydown", stopKeys, true);
    };
  }, [removed]);

  if (removed) return null;

  return (
    <>
      <noscript><style>{"[data-intro] { display: none !important; }"}</style></noscript>
      <div
        ref={overlayRef}
        data-intro
        aria-hidden="true"
        className="ks-intro"
        style={{
          "--intro-hold": `${INTRO_HOLD_MS}ms`,
          "--intro-fade": `${INTRO_FADE_MS}ms`,
        } as CSSProperties}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && event.animationName === "ks-intro-exit") {
            setRemoved(true);
          }
        }}
      >
        <div className="ks-intro__composition">
          <Image
            src="/assets/intro-curtain-mark-transparent.webp"
            width={1200}
            height={564}
            alt=""
            preload
            unoptimized
            draggable={false}
            className="ks-intro__mark"
          />
          <span className="ks-intro__wordmark">{BRAND.full}</span>
          <span className="ks-intro__tagline">{t("loader.sub")}</span>
        </div>
      </div>
    </>
  );
}

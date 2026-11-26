"use client";

import Image from "next/image";
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
    const fadeMs = reduce ? 150 : 350;
    const minHold = reduce ? 150 : 550;
    const maxHold = reduce ? 150 : 900;

    // The intro is visual only. It must never lock document scrolling or
    // intercept mouse/touch input, including on desktop if hydration stalls.
    // It also must not *delay* the content: it fades as soon as the page has
    // finished loading (minHold keeps it from flashing), and maxHold caps the
    // wait so one slow asset can never keep visitors behind the overlay.
    const startedAt = Date.now();
    let settled = false;
    let hide: number | undefined;
    let remove: number | undefined;

    const startFade = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(cap);
      const wait = Math.max(0, minHold - (Date.now() - startedAt));
      hide = window.setTimeout(() => setGone(true), wait);
      remove = window.setTimeout(() => setRemoved(true), wait + fadeMs);
    };

    const cap = window.setTimeout(startFade, maxHold);
    if (document.readyState === "complete") startFade();
    else window.addEventListener("load", startFade, { once: true });

    return () => {
      window.removeEventListener("load", startFade);
      window.clearTimeout(cap);
      if (hide !== undefined) window.clearTimeout(hide);
      if (remove !== undefined) window.clearTimeout(remove);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      data-intro
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[100] flex w-full flex-col items-center justify-center bg-black text-[#f5f0eb] transition-opacity duration-700 ${
        gone ? "opacity-0" : "opacity-100"
      }`}
      // If hydration never completes, CSS hides the visual intro after 5 seconds.
      style={{ animation: "ks-loader-safety 5s step-end forwards" }}
    >
      <Image
        src="/assets/intro-curtain-logo.jpg"
        width={2048}
        height={1292}
        alt=""
        loading="eager"
        sizes="(max-width: 576px) 84vw, 480px"
        className="aspect-[2048/686] h-auto w-[min(84vw,30rem)] object-cover object-top"
      />
      <span className="mt-5 whitespace-nowrap pl-[0.12em] font-display text-[clamp(1.5rem,6.5vw,3.5rem)] leading-none tracking-[0.12em]">
        {BRAND.full}
      </span>
      <span className="mt-7 h-px w-40 origin-left overflow-hidden bg-white/25" aria-hidden="true">
        <span
          className="block h-full w-full origin-left bg-current"
          style={{ animation: "ks-bar 0.8s cubic-bezier(0.65,0,0.35,1) both", animationDelay: "0.15s" }}
        />
      </span>
      <span
        className="eyebrow mt-5 px-4 text-center text-white/70 opacity-0"
        style={{ animation: "ks-fade-in 0.6s ease 0.5s both" }}
        aria-hidden="true"
      >
        {t("loader.sub")}
      </span>
    </div>
  );
}

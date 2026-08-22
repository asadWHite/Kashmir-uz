"use client";

import { useEffect, useState } from "react";

/**
 * Subtle custom cursor for fine-pointer (desktop) devices only. A small dot
 * with soft magnetic expansion over interactive elements. Fully disabled on
 * touch / coarse-pointer devices and when reduced motion is requested.
 */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    setEnabled(true);

    const dot = document.createElement("div");
    const ring = document.createElement("div");
    Object.assign(dot.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "6px",
      height: "6px",
      borderRadius: "999px",
      background: "var(--c-ink)",
      pointerEvents: "none",
      zIndex: "9999",
      transform: "translate(-50%, -50%)",
      mixBlendMode: "difference",
    } as CSSStyleDeclaration);
    Object.assign(ring.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "38px",
      height: "38px",
      borderRadius: "999px",
      border: "1px solid var(--c-line-strong)",
      pointerEvents: "none",
      zIndex: "9999",
      transform: "translate(-50%, -50%)",
      transition: "width .3s ease, height .3s ease, opacity .3s ease, background-color .3s ease",
      opacity: "0.6",
    } as CSSStyleDeclaration);
    document.body.append(dot, ring);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      const target = e.target as HTMLElement | null;
      const interactive = !!target?.closest("a, button, [data-cursor]");
      const size = interactive ? 64 : 38;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.opacity = interactive ? "0.9" : "0.55";
      ring.style.backgroundColor = interactive
        ? "color-mix(in srgb, var(--c-ink) 8%, transparent)"
        : "transparent";
    };

    const onLeave = () => (ring.style.opacity = "0");
    const onEnter = () => (ring.style.opacity = "0.55");

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
      dot.remove();
      ring.remove();
    };
  }, []);

  if (!enabled) return null;
  return null;
}

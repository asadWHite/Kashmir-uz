"use client";

import { useEffect } from "react";

/**
 * Desktop-only pointer decoration. It updates only when the pointer moves;
 * no permanent animation-frame loop runs while the user is idle.
 */
export default function Cursor() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const dot = document.createElement("div");
    const ring = document.createElement("div");
    Object.assign(dot.style, {
      position: "fixed", top: "0", left: "0", width: "6px", height: "6px",
      borderRadius: "999px", background: "var(--c-ink)", pointerEvents: "none",
      zIndex: "9999", transform: "translate(-50%, -50%)",
      mixBlendMode: "difference", willChange: "transform",
    } as CSSStyleDeclaration);
    Object.assign(ring.style, {
      position: "fixed", top: "0", left: "0", width: "38px", height: "38px",
      borderRadius: "999px", border: "1px solid var(--c-line-strong)",
      pointerEvents: "none", zIndex: "9999",
      transform: "translate(-50%, -50%)",
      transition: "transform 90ms ease-out, width 180ms ease, height 180ms ease, opacity 180ms ease, background-color 180ms ease",
      opacity: "0.6", willChange: "transform",
    } as CSSStyleDeclaration);
    document.body.append(dot, ring);

    const onMove = (event: MouseEvent) => {
      const position = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
      dot.style.transform = position;
      ring.style.transform = position;

      const target = event.target as HTMLElement | null;
      const interactive = Boolean(target?.closest("a, button, [data-cursor]"));
      const size = interactive ? "64px" : "38px";
      ring.style.width = size;
      ring.style.height = size;
      ring.style.opacity = interactive ? "0.9" : "0.55";
      ring.style.backgroundColor = interactive
        ? "color-mix(in srgb, var(--c-ink) 8%, transparent)"
        : "transparent";
    };

    const onLeave = () => { ring.style.opacity = "0"; dot.style.opacity = "0"; };
    const onEnter = () => { ring.style.opacity = "0.55"; dot.style.opacity = "1"; };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      dot.remove();
      ring.remove();
    };
  }, []);

  return null;
}

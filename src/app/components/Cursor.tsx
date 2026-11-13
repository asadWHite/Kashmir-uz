"use client";

import { useEffect } from "react";

/**
 * Subtle custom cursor for fine-pointer (desktop) devices only.
 *
 * The previous implementation wrote to React state inside the effect just to
 * decide whether to render `null`, which scheduled a re-render on every mount
 * and did nothing else. This version keeps the element imperative (it is
 * outside the React tree by design — it must never intercept pointer events)
 * and returns early on touch devices or when reduced motion is requested.
 */
export default function Cursor() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

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
    dot.dataset.cursor = "dot";
    ring.dataset.cursor = "ring";
    document.body.append(dot, ring);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;
    let running = true;

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

    // Only animate while the pointer has moved recently; an idle page must not
    // burn a requestAnimationFrame loop forever (this was a measurable idle-CPU
    // cost on laptops). The loop parks itself and restarts on the next move.
    let idleFrames = 0;
    const loop = () => {
      const dx = mx - rx;
      const dy = my - ry;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        idleFrames += 1;
        if (idleFrames > 10) {
          raf = 0;
          return;
        }
      } else {
        idleFrames = 0;
      }
      rx += dx * 0.18;
      ry += dy * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!running || raf) return;
      raf = requestAnimationFrame(loop);
    };

    const onPointerMove = (e: MouseEvent) => {
      onMove(e);
      start();
    };

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    start();

    return () => {
      running = false;
      window.removeEventListener("mousemove", onPointerMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      if (raf) cancelAnimationFrame(raf);
      dot.remove();
      ring.remove();
    };
  }, []);

  return null;
}

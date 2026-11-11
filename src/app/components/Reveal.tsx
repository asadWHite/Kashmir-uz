"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  blur?: boolean;
  delay?: number;
  threshold?: number;
  once?: boolean;
};

/**
 * Progressive scroll reveal.
 *
 * Important: the content is visible in server-rendered HTML. IntersectionObserver
 * only adds a subtle entrance animation; it is never responsible for making
 * content visible. If hydration or JavaScript is delayed, the page still works.
 */
export default function Reveal({
  children,
  as,
  className = "",
  blur = false,
  delay = 0,
  threshold = 0.16,
  once = true,
}: RevealProps) {
  const Tag = (as || "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${blur ? "reveal--blur" : ""} ${shown ? "reveal--in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

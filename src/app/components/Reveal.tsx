"use client";

import type { ElementType, ReactNode } from "react";

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
 * Static wrapper retained for existing page components.
 * All sections are rendered immediately; scrolling must not trigger visibility
 * or entrance animations. This keeps curtain and interior cards available at once.
 */
export default function Reveal({ children, as, className = "" }: RevealProps) {
  const Tag = (as || "div") as ElementType;
  return <Tag className={className}>{children}</Tag>;
}

"use client";

import { useEffect, useState } from "react";

/** Appears after scrolling, gently fades the page back to the top. */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-40 grid h-11 w-11 place-items-center rounded-full border border-line bg-surface/70 backdrop-blur transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 12V2M2 7l5-5 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

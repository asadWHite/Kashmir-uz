"use client";

import { useEffect, useState } from "react";

/** Like button with count. Prevents double-like via localStorage. */
export default function LikeButton({
  curtainId,
  initialLikes,
  size = "md",
}: {
  curtainId: number;
  initialLikes: number;
  size?: "sm" | "md";
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const key = `kashmir-liked-${curtainId}`;

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(key) === "1");
    } catch {
      /* ignore */
    }
  }, [curtainId]);

  async function toggle() {
    if (liked) return; // can't unlike
    setLiked(true);
    setLikes((n) => n + 1);
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    // Fire-and-forget API call (with retry for cold start)
    fetch("/api/curtains/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: curtainId }),
    }).catch(() => {});
  }

  const cls = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-2";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={`inline-flex items-center gap-1.5 transition-colors ${cls} ${
        liked ? "text-red-500" : "text-faint hover:text-ink"
      }`}
      aria-label="Like"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} aria-hidden="true">
        <path d="M12 21s-7-4.5-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 5 23 8.5 21.5 12 19 16.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span>{likes}</span>
    </button>
  );
}

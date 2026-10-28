"use client";

import { useEffect, useState } from "react";
import { useFavorites } from "./useLocalState";

/**
 * Favorite heart with real like count from the database.
 * Click: toggles personal favorite (localStorage) AND increments DB count
 * on first like, so popularity is tracked server-side.
 */
export default function FavButton({
  curtainId,
  initialLikes = 0,
  showCount = true,
  size = "md",
}: {
  curtainId: number;
  initialLikes?: number;
  showCount?: boolean;
  size?: "sm" | "md";
}) {
  const { isFav, toggle } = useFavorites();
  const fav = isFav(curtainId);
  const [likes, setLikes] = useState(initialLikes);

  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const wasFav = fav;
    toggle(curtainId);

    if (!wasFav) {
      // First like only → increment
      setLikes((n) => n + 1);
      fetch("/api/curtains/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: curtainId }),
      }).catch(() => {});
    } else {
      // Un-like → decrement to keep the count honest
      setLikes((n) => Math.max(0, n - 1));
      fetch("/api/curtains/unlike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: curtainId }),
      }).catch(() => {});
    }
  }

  const iconSize = size === "sm" ? 16 : 18;
  const cls = size === "sm" ? "text-xs gap-1" : "text-sm gap-1.5";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative z-20 inline-flex items-center transition-all duration-300 ${cls} ${
        fav ? "text-red-500" : "text-faint hover:text-ink"
      }`}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={fav ? "currentColor" : "none"}
        className={`transition-transform duration-300 ${fav ? "scale-110" : ""}`}
        aria-hidden="true"
      >
        <path
          d="M12 21s-7-4.5-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 5 23 8.5 21.5 12 19 16.5 12 21 12 21Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      {showCount && <span className="font-medium tabular-nums">{likes}</span>}
    </button>
  );
}

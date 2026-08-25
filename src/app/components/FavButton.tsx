"use client";

import { useFavorites } from "./useLocalState";

/** Uzum-style favorite heart toggle. Works instantly via localStorage. */
export default function FavButton({
  curtainId,
  className = "",
  showCount = false,
}: {
  curtainId: number;
  className?: string;
  showCount?: boolean;
}) {
  const { isFav, toggle } = useFavorites();
  const fav = isFav(curtainId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(curtainId);
      }}
      className={`inline-flex items-center gap-1.5 transition-all duration-300 ${className} ${
        fav ? "text-red-500" : "text-faint hover:text-ink"
      }`}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        width="18"
        height="18"
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
      {showCount && <span className="text-xs">{fav ? "Saved" : "Save"}</span>}
    </button>
  );
}

"use client";

import { useFavorites } from "./useLocalState";

/** Favorites count badge shown in the navbar. Links to collections page. */
export default function FavoritesIndicator({ className = "" }: { className?: string }) {
  const { ids } = useFavorites();
  if (ids.length === 0) return null;

  return (
    <a
      href="/collections"
      aria-label="My selection"
      className={`relative grid h-9 w-9 place-items-center text-ink/80 transition-colors hover:text-ink ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 21s-7-4.5-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 5 23 8.5 21.5 12 19 16.5 12 21 12 21Z" fill="currentColor" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.6rem] font-medium text-base">
        {ids.length}
      </span>
    </a>
  );
}

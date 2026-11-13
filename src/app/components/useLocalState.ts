"use client";

import { useCallback, useEffect, useSyncExternalStore, useState } from "react";

const FAV_KEY = "kashmir-favorites";
const RECENT_KEY = "kashmir-recent";
const MAX_RECENT = 6;

function read(key: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, val: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new Event("kashmir-local-change"));
  } catch {
    /* ignore */
  }
}

/**
 * Read localStorage-backed state the React way.
 *
 * `useSyncExternalStore` is used instead of `useEffect(() => setState(...))`:
 * the server snapshot is a stable empty array (so hydration is deterministic and
 * there is no mismatch), and the client snapshot updates whenever the store
 * changes. This removes the cascading render on mount that the lint rules flag,
 * and it means the favorites/compare/recently-viewed UI is consistent across
 * every component that reads the same key.
 */
function subscribe(onChange: () => void) {
  window.addEventListener("kashmir-local-change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("kashmir-local-change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

// Stable identities: useSyncExternalStore compares snapshots by reference.
const EMPTY: number[] = [];
const EMPTY_OBJECTS: CompareItem[] = [];
const rawCache = new Map<string, { raw: string | null; parsed: unknown[] }>();

function cachedRead(key: string): unknown[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const cached = rawCache.get(key);
  if (cached && cached.raw === raw) return cached.parsed;
  let parsed: unknown[] = [];
  try {
    parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    if (!Array.isArray(parsed)) parsed = [];
  } catch {
    parsed = [];
  }
  rawCache.set(key, { raw, parsed });
  return parsed;
}

/**
 * Favorites plus a hydration-safe "are we on the client yet" flag.
 *
 * `useSyncExternalStore` takes the server snapshot during SSR and switches to
 * the client snapshot after hydration, so `mounted` becomes true without any
 * setState-in-effect cascade. Consumers that must not flash an empty state use
 * this; everything else uses `useFavorites()`.
 */
export function useFavoritesWithMountState() {
  const ids = useSyncExternalStore(
    subscribe,
    () => cachedRead(FAV_KEY) as number[],
    () => EMPTY,
  );
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return { ids, mounted };
}

/** Favorites: set of curtain ids. */
export function useFavorites() {
  const ids = useSyncExternalStore(
    subscribe,
    () => cachedRead(FAV_KEY) as number[],
    () => EMPTY,
  );

  const isFav = useCallback((id: number) => ids.includes(id), [ids]);

  const toggle = useCallback((id: number) => {
    const cur = read(FAV_KEY);
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    write(FAV_KEY, next);
  }, []);

  return { ids, isFav, toggle };
}

export type CompareItem = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  category: string | null;
  style: string | null;
  room: string | null;
};

const COMPARE_KEY = "kashmir-compare";
const MAX_COMPARE = 3;

function readObj<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

/** Compare: up to 3 curtains stored with full data for side-by-side view. */
export function useCompare() {
  const items = useSyncExternalStore(
    subscribe,
    () => cachedRead(COMPARE_KEY) as CompareItem[],
    () => EMPTY_OBJECTS,
  );

  const isInCompare = useCallback((id: number) => items.some((x) => x.id === id), [items]);

  const toggle = useCallback((item: CompareItem) => {
    const cur = readObj<CompareItem>(COMPARE_KEY);
    if (cur.some((x) => x.id === item.id)) {
      write(COMPARE_KEY, cur.filter((x) => x.id !== item.id));
    } else if (cur.length < MAX_COMPARE) {
      write(COMPARE_KEY, [...cur, item]);
    }
  }, []);

  const remove = useCallback((id: number) => {
    write(COMPARE_KEY, readObj<CompareItem>(COMPARE_KEY).filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => {
    write(COMPARE_KEY, []);
  }, []);

  return { items, isInCompare, toggle, remove, clear, max: MAX_COMPARE };
}

/** Recently viewed: ordered list of curtain ids (most recent first). */
export function useRecentlyViewed() {
  const ids = useSyncExternalStore(
    subscribe,
    () => cachedRead(RECENT_KEY) as number[],
    () => EMPTY,
  );

  const track = useCallback((id: number) => {
    const cur = read(RECENT_KEY).filter((x) => x !== id);
    const next = [id, ...cur].slice(0, MAX_RECENT);
    write(RECENT_KEY, next);
  }, []);

  return { ids, track };
}

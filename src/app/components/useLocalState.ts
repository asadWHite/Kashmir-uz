"use client";

import { useCallback, useEffect, useState } from "react";

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

function write(key: string, val: number[]) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new Event("kashmir-local-change"));
  } catch {
    /* ignore */
  }
}

/** Favorites: set of curtain ids. */
export function useFavorites() {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    setIds(read(FAV_KEY));
    const onChange = () => setIds(read(FAV_KEY));
    window.addEventListener("kashmir-local-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("kashmir-local-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const isFav = useCallback((id: number) => ids.includes(id), [ids]);

  const toggle = useCallback((id: number) => {
    const cur = read(FAV_KEY);
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    write(FAV_KEY, next);
    setIds(next);
  }, []);

  return { ids, isFav, toggle };
}

/** Recently viewed: ordered list of curtain ids (most recent first). */
export function useRecentlyViewed() {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    setIds(read(RECENT_KEY));
    const onChange = () => setIds(read(RECENT_KEY));
    window.addEventListener("kashmir-local-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("kashmir-local-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const track = useCallback((id: number) => {
    const cur = read(RECENT_KEY).filter((x) => x !== id);
    const next = [id, ...cur].slice(0, MAX_RECENT);
    write(RECENT_KEY, next);
    setIds(next);
  }, []);

  return { ids, track };
}

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

function write<T>(key: string, val: T[]) {
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
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    setItems(readObj<CompareItem>(COMPARE_KEY));
    const onChange = () => setItems(readObj<CompareItem>(COMPARE_KEY));
    window.addEventListener("kashmir-local-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("kashmir-local-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const isInCompare = useCallback((id: number) => items.some((x) => x.id === id), [items]);

  const toggle = useCallback((item: CompareItem) => {
    const cur = readObj<CompareItem>(COMPARE_KEY);
    if (cur.some((x) => x.id === item.id)) {
      write(COMPARE_KEY, cur.filter((x) => x.id !== item.id));
    } else if (cur.length < MAX_COMPARE) {
      write(COMPARE_KEY, [...cur, item]);
    }
    setItems(readObj<CompareItem>(COMPARE_KEY));
  }, []);

  const remove = useCallback((id: number) => {
    write(COMPARE_KEY, readObj<CompareItem>(COMPARE_KEY).filter((x) => x.id !== id));
    setItems(readObj<CompareItem>(COMPARE_KEY));
  }, []);

  const clear = useCallback(() => {
    write(COMPARE_KEY, []);
    setItems([]);
  }, []);

  return { items, isInCompare, toggle, remove, clear, max: MAX_COMPARE };
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

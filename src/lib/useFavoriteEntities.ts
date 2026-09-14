"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "ha-dashboard-favorite-entities";

function readStored(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function useFavoriteEntities() {
  const [favorites, setFavorites] = useState<Set<string>>(() => readStored());

  const persist = useCallback((next: Set<string>) => {
    setFavorites(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // localStorage unavailable — fine to no-op
    }
  }, []);

  const toggleFavorite = useCallback(
    (entityId: string) => {
      const next = new Set(favorites);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      persist(next);
    },
    [favorites, persist]
  );

  return { favorites, toggleFavorite };
}

"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "ha-dashboard-hidden-entities";

function readStored(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function useHiddenEntities() {
  const [hidden, setHidden] = useState<Set<string>>(() => readStored());

  const persist = useCallback((next: Set<string>) => {
    setHidden(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // localStorage unavailable (private browsing, etc) — fine to no-op
    }
  }, []);

  const toggleHidden = useCallback(
    (entityId: string) => {
      const next = new Set(hidden);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      persist(next);
    },
    [hidden, persist]
  );

  return { hidden, toggleHidden };
}

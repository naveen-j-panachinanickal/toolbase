'use client';

/**
 * useToolPreferences
 *
 * Manages user-specific tool preferences stored exclusively in localStorage.
 * Provides favorites (toggle), recents (capped at 15, newest-first), and
 * cross-tab sync via the native `storage` event.
 *
 * localStorage keys:
 *   toolbase:favorites  → string[]  e.g. ['magic-pdf', 'pixels']
 *   toolbase:recents    → string[]  e.g. ['data-lens', 'base64']  (max 15)
 */

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'toolbase:favorites';
const RECENTS_KEY = 'toolbase:recents';
const RECENTS_MAX = 15;

// ─── helpers ──────────────────────────────────────────────────────────────────

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Defer cross-instance notification so it fires AFTER React finishes
    // the current commit cycle. Synchronous dispatch would call setState
    // inside another component's state updater → "setState during render" error.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('toolbase:prefs-updated'));
    }, 0);
  } catch {
    // localStorage may be unavailable (private browsing quota, etc.)
  }
}

// ─── hook ─────────────────────────────────────────────────────────────────────

function sameStringArray(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export interface ToolPreferences {
  favorites: string[];
  recents: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  clearFavorites: () => void;
  addRecent: (id: string) => void;
  removeRecent: (id: string) => void;
  clearRecents: () => void;
}

export function useToolPreferences(): ToolPreferences {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  // Hydrate once from localStorage (avoids SSR mismatch)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFavorites(readJSON<string[]>(FAVORITES_KEY, []));
      setRecents(readJSON<string[]>(RECENTS_KEY, []));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Sync across tabs AND same-tab instances
  useEffect(() => {
    const sync = () => {
      const newFavorites = readJSON<string[]>(FAVORITES_KEY, []);
      const newRecents = readJSON<string[]>(RECENTS_KEY, []);
      
      setFavorites(prev => {
         if (sameStringArray(prev, newFavorites)) return prev;
         return newFavorites;
      });
      setRecents(prev => {
         if (sameStringArray(prev, newRecents)) return prev;
         return newRecents;
      });
    };

    window.addEventListener('toolbase:prefs-updated', sync);
    window.addEventListener('storage', sync); // cross-tab

    return () => {
      window.removeEventListener('toolbase:prefs-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((fid) => fid !== id)
        : [...prev, id];
      if (sameStringArray(prev, next)) return prev;
      writeJSON(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  /**
   * Call this whenever a user navigates to a tool page.
   * Prepends the id — deduplicates — caps at RECENTS_MAX.
   */
  const addRecent = useCallback((id: string) => {
    setRecents((prev) => {
      const current = readJSON<string[]>(RECENTS_KEY, prev);
      const deduplicated = current.filter((rid) => rid !== id);
      const next = [id, ...deduplicated].slice(0, RECENTS_MAX);
      if (sameStringArray(current, next)) {
        return sameStringArray(prev, current) ? prev : current;
      }
      writeJSON(RECENTS_KEY, next);
      return next;
    });
  }, []);

  /** Remove a single tool from the recents list */
  const removeRecent = useCallback((id: string) => {
    setRecents((prev) => {
      const current = readJSON<string[]>(RECENTS_KEY, prev);
      const next = current.filter((rid) => rid !== id);
      if (sameStringArray(current, next)) {
        return sameStringArray(prev, current) ? prev : current;
      }
      writeJSON(RECENTS_KEY, next);
      return next;
    });
  }, []);

  /** Wipe the entire recents list */
  const clearRecents = useCallback(() => {
    setRecents(prev => {
        const current = readJSON<string[]>(RECENTS_KEY, prev);
        if (current.length === 0) return sameStringArray(prev, current) ? prev : current;
        writeJSON(RECENTS_KEY, []);
        return [];
    });
  }, []);

  /** Wipe the entire favourites list */
  const clearFavorites = useCallback(() => {
    setFavorites(prev => {
        const current = readJSON<string[]>(FAVORITES_KEY, prev);
        if (current.length === 0) return sameStringArray(prev, current) ? prev : current;
        writeJSON(FAVORITES_KEY, []);
        return [];
    });
  }, []);

  return { favorites, recents, isFavorite, toggleFavorite, clearFavorites, addRecent, removeRecent, clearRecents };
}

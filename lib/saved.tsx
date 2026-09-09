"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { RecipeSuggestion } from "@/lib/schema";

/**
 * Saved recipes — the other value allowed to persist (FR-013a, FR-020).
 * Stored per-browser only; never sent to a server, never shared across devices.
 */

export const SAVED_STORAGE_KEY = "tahyakhchal.saved";

export type SavedRecipe = RecipeSuggestion & {
  id: string;
  savedAt: number;
};

type SavedContextValue = {
  saved: SavedRecipe[];
  isSaved: (recipe: RecipeSuggestion) => boolean;
  toggleSave: (recipe: RecipeSuggestion) => void;
  removeSaved: (id: string) => void;
  ready: boolean;
};

const SavedContext = createContext<SavedContextValue>({
  saved: [],
  isSaved: () => false,
  toggleSave: () => {},
  removeSaved: () => {},
  ready: false,
});

/** Identity is the title: the same dish saved twice is one entry. */
function recipeId(recipe: RecipeSuggestion): string {
  return recipe.title.trim();
}

function readStore(): SavedRecipe[] {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is SavedRecipe =>
        entry &&
        typeof entry.id === "string" &&
        typeof entry.title === "string" &&
        Array.isArray(entry.ingredients) &&
        Array.isArray(entry.steps),
    );
  } catch {
    // Unreadable or blocked storage degrades to an empty list, never a throw.
    return [];
  }
}

function writeStore(recipes: SavedRecipe[]) {
  try {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(recipes));
  } catch {
    // Quota or private mode: the save simply does not persist.
  }
}

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [ready, setReady] = useState(false);

  // Server render starts empty; the real list arrives after mount (no hydration mismatch).
  useEffect(() => {
    setSaved(readStore());
    setReady(true);
  }, []);

  const isSaved = useCallback(
    (recipe: RecipeSuggestion) => saved.some((entry) => entry.id === recipeId(recipe)),
    [saved],
  );

  const toggleSave = useCallback((recipe: RecipeSuggestion) => {
    setSaved((current) => {
      const id = recipeId(recipe);
      const next = current.some((entry) => entry.id === id)
        ? current.filter((entry) => entry.id !== id)
        : [
            {
              id,
              title: recipe.title,
              ingredients: recipe.ingredients,
              steps: recipe.steps,
              savedAt: Date.now(),
            },
            ...current,
          ];
      writeStore(next);
      return next;
    });
  }, []);

  const removeSaved = useCallback((id: string) => {
    setSaved((current) => {
      const next = current.filter((entry) => entry.id !== id);
      writeStore(next);
      return next;
    });
  }, []);

  return (
    <SavedContext.Provider value={{ saved, isSaved, toggleSave, removeSaved, ready }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  return useContext(SavedContext);
}

"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { RecipeSuggestion } from "@/lib/schema";

/**
 * In-visit state only: photos, the working ingredient list, current suggestions.
 * Deliberately NOT persisted — a reload must clear all of it (FR-013, SC-012).
 * It lives in context purely so it survives navigation between the three screens.
 */

export const MAX_PHOTOS = 3;
export const MAX_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export type SelectedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

export type RequestStatus = "idle" | "processing" | "done" | "error";

type SessionContextValue = {
  photos: SelectedPhoto[];
  setPhotos: (photos: SelectedPhoto[]) => void;
  addPhotos: (files: File[]) => { rejected: number; overflow: boolean };
  removePhoto: (id: string) => void;

  ingredients: string[];
  addIngredient: (name: string) => boolean;
  renameIngredient: (index: number, name: string) => void;
  removeIngredient: (index: number) => void;
  setIngredients: (names: string[]) => void;

  recipes: RecipeSuggestion[];
  setRecipes: (recipes: RecipeSuggestion[]) => void;

  status: RequestStatus;
  setStatus: (status: RequestStatus) => void;
  errorCode: string | null;
  setErrorCode: (code: string | null) => void;

  /** True once photos have been analysed, so the ingredients screen does not re-run. */
  analysed: boolean;
  setAnalysed: (value: boolean) => void;

  /* Feature 002 — random dish. In-visit only; a reload clears all of it (FR-109). */
  randomRecipe: RecipeSuggestion | null;
  setRandomRecipe: (recipe: RecipeSuggestion | null) => void;
  randomStatus: RequestStatus;
  setRandomStatus: (status: RequestStatus) => void;
  randomErrorCode: string | null;
  setRandomErrorCode: (code: string | null) => void;
  /** Titles already shown this visit, so the next press can avoid them (FR-104). */
  seenTitles: string[];
  addSeenTitle: (title: string) => void;

  reset: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function isAcceptedType(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  return file.type === "" && /\.hei[cf]$/i.test(file.name);
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([]);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [analysed, setAnalysed] = useState(false);
  const [randomRecipe, setRandomRecipe] = useState<RecipeSuggestion | null>(null);
  const [randomStatus, setRandomStatus] = useState<RequestStatus>("idle");
  const [randomErrorCode, setRandomErrorCode] = useState<string | null>(null);
  const [seenTitles, setSeenTitles] = useState<string[]>([]);

  const addSeenTitle = useCallback((title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setSeenTitles((current) =>
      current.includes(clean) ? current : [...current, clean],
    );
  }, []);

  const addPhotos = useCallback((files: File[]) => {
    let rejected = 0;
    let overflow = false;

    setPhotos((current) => {
      const accepted: SelectedPhoto[] = [];
      for (const file of files) {
        if (!isAcceptedType(file) || file.size > MAX_BYTES || file.size === 0) {
          rejected += 1;
          continue;
        }
        if (current.length + accepted.length >= MAX_PHOTOS) {
          overflow = true;
          break;
        }
        accepted.push({
          id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      return accepted.length > 0 ? [...current, ...accepted] : current;
    });

    return { rejected, overflow };
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  }, []);

  const addIngredient = useCallback((name: string) => {
    const clean = normalize(name);
    if (!clean) return false;
    let added = false;
    setIngredients((current) => {
      if (current.some((item) => item === clean)) return current;
      added = true;
      return [...current, clean];
    });
    return added;
  }, []);

  const renameIngredient = useCallback((index: number, name: string) => {
    const clean = normalize(name);
    setIngredients((current) =>
      clean
        ? current.map((item, i) => (i === index ? clean : item))
        : current.filter((_, i) => i !== index),
    );
  }, []);

  const removeIngredient = useCallback((index: number) => {
    setIngredients((current) => current.filter((_, i) => i !== index));
  }, []);

  const reset = useCallback(() => {
    setPhotos((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      return [];
    });
    setIngredients([]);
    setRecipes([]);
    setStatus("idle");
    setErrorCode(null);
    setAnalysed(false);
    setRandomRecipe(null);
    setRandomStatus("idle");
    setRandomErrorCode(null);
    setSeenTitles([]);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      photos,
      setPhotos,
      addPhotos,
      removePhoto,
      ingredients,
      addIngredient,
      renameIngredient,
      removeIngredient,
      setIngredients,
      recipes,
      setRecipes,
      status,
      setStatus,
      errorCode,
      setErrorCode,
      analysed,
      setAnalysed,
      randomRecipe,
      setRandomRecipe,
      randomStatus,
      setRandomStatus,
      randomErrorCode,
      setRandomErrorCode,
      seenTitles,
      addSeenTitle,
      reset,
    }),
    [
      photos,
      addPhotos,
      removePhoto,
      ingredients,
      addIngredient,
      renameIngredient,
      removeIngredient,
      recipes,
      status,
      errorCode,
      analysed,
      randomRecipe,
      randomStatus,
      randomErrorCode,
      seenTitles,
      addSeenTitle,
      reset,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}

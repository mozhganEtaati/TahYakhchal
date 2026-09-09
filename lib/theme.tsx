"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Theme preference — one of the two values allowed to persist (FR-013a, FR-022).
 * This module and lib/saved.tsx are the ONLY places that may touch localStorage.
 */

export const THEME_STORAGE_KEY = "tahyakhchal.theme";

export type Theme = "dark" | "light";

const DEFAULT_THEME: Theme = "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  toggleTheme: () => {},
});

/** Runs before first paint so the dark default never flashes light. */
export const themeBootstrapScript = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    document.documentElement.setAttribute("data-theme", stored === "light" ? "light" : "dark");
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  // Read after mount: the server cannot know the stored value.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") setTheme(stored);
    } catch {
      // Private window or blocked storage: keep the default.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Preference simply will not survive this session.
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

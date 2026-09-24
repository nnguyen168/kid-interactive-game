"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { ThemeId, Theme } from "./types";
import { THEMES } from "./themes";

const STORAGE_KEY = "kid-app-theme";
const DEFAULT_THEME: ThemeId = "chevalier";

type ThemeContextValue = {
  themeId: ThemeId;
  theme: Theme;
  setThemeId: (id: ThemeId) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && stored in THEMES) {
        // Read after mount (not in a lazy useState initializer) so server and
        // client agree on the first render; only then adopt the stored value.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeIdState(stored as ThemeId);
      }
    } catch {
      // localStorage unavailable, keep default
    }
    setReady(true);
  }, []);

  function setThemeId(id: ThemeId) {
    setThemeIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore write errors
    }
  }

  const theme = THEMES[themeId];

  return (
    <ThemeContext.Provider value={{ themeId, theme, setThemeId, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

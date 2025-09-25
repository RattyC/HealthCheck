"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "hc-theme";

function applyTheme(next: Theme) {
  const root = document.documentElement;
  if (next === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem(STORAGE_KEY) as Theme | null)) || null;
    const preferred = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(preferred);
    applyTheme(preferred);
    setReady(true);
  }, []);

  const value = useMemo(() => {
    return {
      theme,
      ready,
      toggle: () => {
        setTheme((prev) => {
          const next = prev === "dark" ? "light" : "dark";
          localStorage.setItem(STORAGE_KEY, next);
          applyTheme(next);
          return next;
        });
      },
    } satisfies ThemeContextValue;
  }, [theme, ready]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

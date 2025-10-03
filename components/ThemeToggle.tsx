"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle, ready } = useTheme();

  if (!ready) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <span className="block h-3 w-3 animate-pulse rounded-full bg-slate-300 dark:bg-slate-600" />
      </span>
    );
  }

  const label = theme === "dark" ? "โหมดสว่าง" : "โหมดมืด";
  const icon = theme === "dark" ? "☀" : "☾";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="interactive-button inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    >
      <span aria-hidden>{icon}</span>
    </button>
  );
}

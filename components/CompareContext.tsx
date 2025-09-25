"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type CompareItem = {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  hospitalName: string;
};

type CompareContextValue = {
  items: CompareItem[];
  add: (item: CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
};

const STORAGE_KEY = "hc-compare-items";

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: CompareItem[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          setItems(parsed.slice(0, 4));
        }
      }
    } catch (error) {
      console.error("Failed to restore compare items", error);
    } finally {
      loaded.current = true;
    }
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.some((it) => it.id === item.id) || prev.length >= 4) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback((id: string) => items.some((item) => item.id === id), [items]);

  const value = useMemo<CompareContextValue>(() => ({ items, add, remove, clear, has }), [items, add, remove, clear, has]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}

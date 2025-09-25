"use client";

import Link from "next/link";
import { useCompare } from "@/components/CompareContext";

export default function CompareBar() {
  const { items, remove, clear } = useCompare();
  if (items.length === 0) return null;
  const idsParam = items.map((item) => item.id).join(",");

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-full max-w-3xl -translate-x-1/2 rounded-full border border-slate-200 bg-white/90 shadow-lg shadow-slate-900/10 backdrop-blur px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">เปรียบเทียบ ({items.length}/4)</div>
        <div className="flex flex-1 flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => remove(item.id)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <span>{item.title}</span>
              <span aria-hidden className="text-slate-400">×</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ล้างทั้งหมด
          </button>
          <Link
            href={`/compare?ids=${encodeURIComponent(idsParam)}`}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark"
          >
            ไปหน้าเปรียบเทียบ
          </Link>
        </div>
      </div>
    </div>
  );
}

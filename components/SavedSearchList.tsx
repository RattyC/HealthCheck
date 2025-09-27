"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { SavedSearch } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export default function SavedSearchList({ items }: { items: SavedSearch[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function remove(id: string) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/v1/saved-search/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "ไม่สามารถลบการค้นหาได้");
      }
      push({ title: "ลบการค้นหาแล้ว", variant: "success" });
      router.refresh();
    } catch (error) {
      push({ title: error instanceof Error ? error.message : "ไม่สามารถลบการค้นหาได้", variant: "error" });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <ul className="space-y-2">
      {items.map((search) => (
        <li key={search.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-900 dark:text-white">{search.name}</span>
            <button
              type="button"
              onClick={() => remove(search.id)}
              disabled={pendingId === search.id}
              className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-xs text-rose-500 transition hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-500/10"
            >
              <Trash2 size={12} /> ลบ
            </button>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            บันทึกเมื่อ {formatDistanceToNow(new Date(search.createdAt), { addSuffix: true, locale: th })}
          </div>
          <pre className="mt-1 overflow-x-auto rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            {JSON.stringify(search.params, null, 0)}
          </pre>
        </li>
      ))}
    </ul>
  );
}

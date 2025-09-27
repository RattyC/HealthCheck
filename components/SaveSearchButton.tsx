"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export type SaveSearchButtonProps = {
  params: Record<string, string | number | undefined>;
};

export default function SaveSearchButton({ params }: SaveSearchButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const search = useSearchParams();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(() => buildDefaultName(search));
  const [open, setOpen] = useState(false);

  if (!session) {
    return (
      <button
        type="button"
        onClick={() => router.push(`/auth/sign-in?callbackUrl=/packages${buildCurrentQuery(search)}`)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <BookmarkPlus size={16} /> บันทึกการค้นหา
      </button>
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      push({ title: "ตั้งชื่อการค้นหา", variant: "error" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/v1/saved-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), params }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "ไม่สามารถบันทึกได้");
      }
      push({ title: "บันทึกการค้นหาแล้ว", variant: "success" });
      setOpen(false);
      router.refresh();
    } catch (error) {
      push({ title: error instanceof Error ? error.message : "ไม่สามารถบันทึกได้", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <BookmarkPlus size={16} /> บันทึกการค้นหา
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-300">ชื่อการค้นหา</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="เช่น Cardio < 4000"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2 text-sm">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus size={14} />}
              บันทึก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function buildDefaultName(search: URLSearchParams) {
  const q = search.get("q");
  const hospital = search.get("hospitalId");
  if (q) return `Search: ${q}`;
  if (hospital) return `Hospital ${hospital.slice(0, 4)}...`;
  return "การค้นหาใหม่";
}

function buildCurrentQuery(search: URLSearchParams) {
  const query = search.toString();
  return query ? `?${query}` : "";
}

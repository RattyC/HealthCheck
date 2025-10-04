"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type RemoveBookmarkButtonProps = {
  bookmarkId: string;
};

export default function RemoveBookmarkButton({ bookmarkId }: RemoveBookmarkButtonProps) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  async function handleRemove() {
    if (submitting || pending) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/v1/bookmarks/${bookmarkId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "ไม่สามารถลบการบันทึกได้");
      }
      push({ title: "นำออกจากบุ๊กมาร์กแล้ว", variant: "success" });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถลบการบันทึกได้";
      push({ title: message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={submitting || pending}
      className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-medium text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
    >
      {submitting || pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" aria-hidden />}
      ลบบุ๊กมาร์ก
    </button>
  );
}

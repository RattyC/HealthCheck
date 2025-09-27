"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function BookmarkButton({ packageId, initialBookmarked }: { packageId: string; initialBookmarked: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { push } = useToast();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function toggleBookmark() {
    if (!session) {
      router.push(`/auth/sign-in?callbackUrl=/packages/${packageId}`);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/bookmarks${bookmarked ? `/${packageId}` : ""}`, {
        method: bookmarked ? "DELETE" : "POST",
        headers: bookmarked ? undefined : { "Content-Type": "application/json" },
        body: bookmarked ? undefined : JSON.stringify({ packageId }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "ไม่สามารถอัปเดตการบันทึกได้");
      }
      setBookmarked(!bookmarked);
      push({ title: bookmarked ? "ลบบันทึกแล้ว" : "บันทึกแพ็กเกจแล้ว", variant: "success" });
      router.refresh();
    } catch (error) {
      push({ title: error instanceof Error ? error.message : "ไม่สามารถอัปเดตการบันทึกได้", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {bookmarked ? "บันทึกแล้ว" : "บันทึกแพ็กเกจ"}
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type Props = {
  packageId: string;
};

export default function RemoveCartItemButton({ packageId }: Props) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/cart/${packageId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "ไม่สามารถลบออกจากตะกร้าได้");
      }
      push({ title: "นำออกจากตะกร้าแล้ว", variant: "success" });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถลบออกจากตะกร้าได้";
      push({ title: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-70 dark:border-rose-500/60 dark:text-rose-300 dark:hover:bg-rose-500/10"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      ลบ
    </button>
  );
}

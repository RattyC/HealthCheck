"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type Action = "approve" | "reject" | "archive";

const SUCCESS_LABEL: Record<Action, string> = {
  approve: "อนุมัติแพ็กเกจแล้ว",
  reject: "ส่งกลับเป็น Draft แล้ว",
  archive: "เก็บแพ็กเกจเข้าคลังแล้ว",
};

export default function AdminActions({ id, disabled }: { id: string; disabled?: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { push } = useToast();

  async function call(action: Action) {
    try {
      const res = await fetch(`/api/v1/admin/packages/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const raw = await res.text();
        let message = raw || "ไม่สามารถอัปเดตสถานะได้";
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error ?? message;
        } catch {}
        throw new Error(message);
      }
      push({ title: SUCCESS_LABEL[action], variant: "success" });
      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "ลองใหม่อีกครั้ง";
      push({
        title: "อัปเดตสถานะไม่สำเร็จ",
        description: message,
        variant: "error",
      });
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        disabled={pending || disabled}
        onClick={() => start(() => call("approve"))}
        className="rounded border border-emerald-500/70 px-2 py-1 text-xs text-emerald-700 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400/70 dark:text-emerald-300 dark:hover:bg-emerald-400/10"
      >
        Approve
      </button>
      <button
        disabled={pending || disabled}
        onClick={() => start(() => call("reject"))}
        className="rounded border border-amber-500/70 px-2 py-1 text-xs text-amber-700 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-400/70 dark:text-amber-300 dark:hover:bg-amber-400/10"
      >
        Reject
      </button>
      <button
        disabled={pending || disabled}
        onClick={() => start(() => call("archive"))}
        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Archive
      </button>
    </div>
  );
}

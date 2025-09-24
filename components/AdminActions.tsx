"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function AdminActions({ id, disabled }: { id: string; disabled?: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function call(action: "approve" | "reject" | "archive") {
    setErr(null);
    try {
      const res = await fetch(`/api/v1/admin/packages/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "failed");
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button disabled={pending || disabled} onClick={() => start(() => call("approve"))} className="rounded border px-2 py-1 text-xs hover:bg-green-50">Approve</button>
      <button disabled={pending || disabled} onClick={() => start(() => call("reject"))} className="rounded border px-2 py-1 text-xs hover:bg-yellow-50">Reject</button>
      <button disabled={pending || disabled} onClick={() => start(() => call("archive"))} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">Archive</button>
      {err && <span className="ml-2 text-xs text-red-600">{err}</span>}
    </div>
  );
}


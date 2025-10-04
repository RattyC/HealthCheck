"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function AdminCartExportButton() {
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  async function handleExport() {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/v1/admin/cart/export", {
        method: "GET",
        headers: { Accept: "text/csv" },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "ไม่สามารถส่งออกข้อมูลได้");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = response.headers.get("Content-Disposition")?.split("filename=")?.[1]?.replace(/"/g, "") ?? "cart-export.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      push({ title: "ดาวน์โหลดไฟล์ CSV แล้ว", variant: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถส่งออกข้อมูลได้";
      push({ title: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <Download className="h-4 w-4" aria-hidden />
      {loading ? "กำลังดาวน์โหลด..." : "Export CSV"}
    </button>
  );
}

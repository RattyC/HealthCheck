"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AdminStatusBadge from "@/components/AdminStatusBadge";
import AdminActions from "@/components/AdminActions";
import { useToast } from "@/components/ToastProvider";

export type AdminPackageListItem = {
  id: string;
  title: string;
  status: "DRAFT" | "APPROVED" | "ARCHIVED";
  basePrice: number;
  updatedAt: string;
  includeCount: number;
  hospitalName: string | null;
};

type BulkAction = "approve" | "archive";

const BULK_LABEL: Record<BulkAction, string> = {
  approve: "อนุมัติที่เลือก",
  archive: "เก็บเข้าคลังที่เลือก",
};

const BULK_CONFIRM: Record<BulkAction, string> = {
  approve: "แพ็กเกจจะเผยแพร่ให้ผู้ใช้เห็นทันที",
  archive: "แพ็กเกจจะถูกซ่อนจากผู้ใช้ทั่วไป",
};

export default function AdminPackagesTable({ items }: { items: AdminPackageListItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { push } = useToast();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allSelected = selected.size > 0 && selected.size === items.length;

  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(items.map((item) => item.id));
    });
  };

  const selectionSummary = useMemo(() => {
    if (selected.size === 0) return "ไม่ได้เลือกแพ็กเกจ";
    return `เลือก ${selected.size} แพ็กเกจ`;
  }, [selected.size]);

  async function handleBulk(action: BulkAction) {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/admin/packages/bulk-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, packageIds: ids }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? "ไม่สามารถอัปเดตสถานะได้");
        }
        push({
          title: action === "approve" ? "อนุมัติแพ็กเกจแบบกลุ่มแล้ว" : "เก็บแพ็กเกจแบบกลุ่มแล้ว",
          variant: "success",
        });
        setSelected(new Set());
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "ไม่สามารถอัปเดตสถานะได้";
        push({ title: message, variant: "error" });
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
        <div>{selectionSummary}</div>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(BULK_LABEL) as BulkAction[]).map((action) => (
            <button
              key={action}
              type="button"
              disabled={pending || selected.size === 0}
              onClick={() => handleBulk(action)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {BULK_LABEL[action]}
              <span className="text-[11px] text-slate-400">{BULK_CONFIRM[action]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="w-10 p-2 text-left">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
              <th className="p-2 text-left font-semibold">แพ็กเกจ</th>
              <th className="p-2 text-left font-semibold">โรงพยาบาล</th>
              <th className="p-2 text-right font-semibold">ราคา</th>
              <th className="p-2 text-center font-semibold">สถานะ</th>
              <th className="p-2 text-left font-semibold">อัปเดต</th>
              <th className="p-2 text-left font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((pkg) => (
              <tr
                key={pkg.id}
                className="border-t border-slate-100 transition hover:-translate-y-[1px] hover:bg-slate-50 hover:shadow-sm dark:border-slate-800 dark:hover:bg-slate-800/60"
              >
                <td className="p-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                    checked={selected.has(pkg.id)}
                    onChange={() => toggle(pkg.id)}
                  />
                </td>
                <td className="p-2">
                  <div className="font-medium text-slate-900 dark:text-white">{pkg.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{pkg.includeCount} รายการตรวจ</div>
                </td>
                <td className="p-2 text-slate-700 dark:text-slate-300">{pkg.hospitalName ?? "-"}</td>
                <td className="p-2 text-right text-slate-700 dark:text-slate-200">฿{pkg.basePrice.toLocaleString()}</td>
                <td className="p-2 text-center">
                  <AdminStatusBadge status={pkg.status} />
                </td>
                <td className="p-2 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(pkg.updatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="p-2">
                  <AdminActions id={pkg.id} status={pkg.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import PriceHistoryChart from "@/components/PriceHistoryChart";

interface PackageInclude {
  id: string;
  name: string;
  groupName: string | null;
  isOptional: boolean;
}

interface PriceHistoryEntry {
  id: string;
  price: number;
  recordedAt: string;
  notes: string | null;
}

interface DiffPayload {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  basePrice: number;
  priceNote: string | null;
  status: string;
  updatedAt: string;
  hospital: { id: string | null; name: string | null };
  includes: PackageInclude[];
  priceHistory: PriceHistoryEntry[];
  diff: {
    currentPrice: number;
    previousPrice: number | null;
    previousRecordedAt: string | null;
    priceChange: number | null;
  };
}

interface AdminPackageDiffDialogProps {
  packageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminPackageDiffDialog({ packageId, open, onOpenChange }: AdminPackageDiffDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<DiffPayload | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/admin/packages/${packageId}/diff`, { cache: "no-store" });
        if (!response.ok) {
          const raw = await response.text();
          let message = raw || "ไม่สามารถโหลดข้อมูลเปรียบเทียบได้";
          try {
            const parsed = JSON.parse(raw);
            message = parsed?.error ?? message;
          } catch {}
          throw new Error(message);
        }
        const data = await response.json();
        if (!cancelled) {
          setPayload(data.package as DiffPayload);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลเปรียบเทียบได้";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, packageId]);

  const priceChartData = useMemo(
    () =>
      (payload?.priceHistory ?? []).map((entry) => ({
        recordedAt: entry.recordedAt,
        price: entry.price,
      })),
    [payload?.priceHistory]
  );

  const priceChangeLabel = useMemo(() => {
    if (!payload || payload.diff.previousPrice === null || payload.diff.priceChange === null) return null;
    const sign = payload.diff.priceChange > 0 ? "+" : "";
    return `${sign}${payload.diff.priceChange.toLocaleString()} บาท`;
  }, [payload]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">ตรวจสอบการเปลี่ยนแปลงก่อนอนุมัติ</Dialog.Title>
              <Dialog.Close className="rounded-full border border-slate-200 px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                ปิด
              </Dialog.Close>
            </div>

            {loading ? (
              <div className="flex h-60 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden />
              </div>
            ) : error ? (
              <div className="mt-6 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden />
                <p>{error}</p>
              </div>
            ) : payload ? (
              <div className="mt-6 space-y-6">
                <header className="space-y-1">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{payload.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{payload.hospital.name ?? "ไม่ระบุโรงพยาบาล"}</p>
                </header>

                <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/80 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">ราคาใหม่</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">฿{payload.basePrice.toLocaleString()}</div>
                    {payload.priceNote ? (
                      <div className="mt-2 rounded-xl bg-slate-100/80 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
                        {payload.priceNote}
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                    <div className="font-semibold text-slate-700 dark:text-slate-100">ราคาเดิมที่บันทึกไว้ล่าสุด</div>
                    {payload.diff.previousPrice !== null ? (
                      <>
                        <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                          ฿{payload.diff.previousPrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          เมื่อ {payload.diff.previousRecordedAt ? new Date(payload.diff.previousRecordedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                        </div>
                        {priceChangeLabel ? (
                          <div className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            (payload.diff.priceChange ?? 0) > 0
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                          }`}
                          >
                            เปลี่ยนแปลง {priceChangeLabel}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">ยังไม่มีบันทึกราคาก่อนหน้าในระบบ</p>
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">ประวัติราคา</h3>
                  {priceChartData.length > 1 ? (
                    <PriceHistoryChart data={priceChartData} />
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">ยังไม่มีข้อมูลราคาเพียงพอสำหรับสร้างกราฟ</p>
                  )}
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">รายการตรวจปัจจุบัน</h3>
                  {payload.includes.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">ยังไม่มีรายการตรวจที่ระบุ</p>
                  ) : (
                    <ul className="grid gap-2 text-sm sm:grid-cols-2">
                      {payload.includes.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                        >
                          <span>{item.name}</span>
                          {item.isOptional ? (
                            <span className="text-[11px] uppercase tracking-wide text-amber-500">Optional</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {payload.description ? (
                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">คำอธิบาย</h3>
                    <p className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                      {payload.description}
                    </p>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

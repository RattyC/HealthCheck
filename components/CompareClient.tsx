"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCompare } from "@/components/CompareContext";
import { useToast } from "@/components/ToastProvider";

export type ComparePackage = {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  priceNote?: string | null;
  hospital: { id: string; name: string; logoUrl: string | null };
  includes: { id: string; name: string; groupName: string | null; isOptional: boolean }[];
  metrics?: { viewCount: number; compareCount: number; bookmarkCount: number } | null;
};

export default function CompareClient({ initialPackages }: { initialPackages: ComparePackage[] }) {
  const router = useRouter();
  const compare = useCompare();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState<string>("");
  const { push } = useToast();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const items = useMemo(() => {
    const byId = new Map(initialPackages.map((pkg) => [pkg.id, pkg]));
    compare.items.forEach((item) => {
      if (!byId.has(item.id)) {
        byId.set(item.id, {
          id: item.id,
          title: item.title,
          slug: item.slug,
          basePrice: item.basePrice,
          hospital: { id: "", name: item.hospitalName, logoUrl: null },
          includes: [],
          metrics: null,
        });
      }
    });
    return Array.from(byId.values()).slice(0, 4);
  }, [initialPackages, compare.items]);

  const idsQuery = items.map((pkg) => pkg.id).join(",");

  async function handleShare() {
    try {
      setCopied(false);
      const response = await fetch("/api/v1/compare/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map((item) => item.id) }),
      });
      if (!response.ok) throw new Error("แชร์ไม่สำเร็จ");
      const data = await response.json();
      const shareUrl = `${window.location.origin}/compare?slug=${data.slug}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      push({ title: "คัดลอกลิงก์สำหรับแชร์แล้ว", variant: "success" });
    } catch (error: unknown) {
      push({ title: error instanceof Error ? error.message : "แชร์ไม่สำเร็จ", variant: "error" });
    }
  }

  function handleRemove(id: string) {
    compare.remove(id);
    const remaining = items.filter((item) => item.id !== id).map((item) => item.id);
    const query = remaining.length ? `?ids=${encodeURIComponent(remaining.join(","))}` : "";
    router.replace(`/compare${query}`);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
        ยังไม่มีแพ็กเกจที่เลือกเปรียบเทียบ เลือกได้สูงสุด 4 แพ็กเกจจากหน้ารายการ
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">เปรียบเทียบแพ็กเกจ</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {copied ? "คัดลอกแล้ว" : "แชร์ลิงก์"}
          </button>
          <button
            type="button"
            onClick={() => compare.clear()}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ล้างรายการ
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((pkg) => (
          <article key={pkg.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{pkg.title}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{pkg.hospital.name}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(pkg.id)}
                className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-400 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-800"
              >
                ลบ
              </button>
            </div>
            <div className="text-2xl font-semibold text-brand">฿{pkg.basePrice.toLocaleString()}</div>
            {pkg.priceNote && <p className="text-xs text-slate-500">{pkg.priceNote}</p>}
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {pkg.includes.length === 0 && <li className="text-xs text-slate-400">- รายการตรวจจะถูกโหลดเมื่อเปิดลิงก์โดยตรง -</li>}
              {pkg.includes.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <span>{item.name}</span>
                  {item.isOptional && <span className="text-xs text-amber-600 dark:text-amber-300">optional</span>}
                </li>
              ))}
            </ul>
            {pkg.metrics && (
              <div className="mt-auto grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-200">{pkg.metrics.viewCount}</div>
                  <div>ยอดดู</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-200">{pkg.metrics.compareCount}</div>
                  <div>เปรียบเทียบ</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-200">{pkg.metrics.bookmarkCount}</div>
                  <div>บันทึก</div>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
        แชร์ลิงก์นี้: <span className="font-mono">{origin ? `${origin}/compare?ids=${idsQuery}` : `?ids=${idsQuery}`}</span>
      </div>
    </div>
  );
}

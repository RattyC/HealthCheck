"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Link2, Loader2, Share2, Trash2 } from "lucide-react";
import { useCompare } from "@/components/CompareContext";
import { useToast } from "@/components/ToastProvider";
import { resolveHospitalLogo } from "@/lib/hospital-logos";

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
  const [copiedQuickLink, setCopiedQuickLink] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [origin, setOrigin] = useState<string>("");
  const [isSharing, setIsSharing] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const items = useMemo(() => {
    const byId = new Map(
      initialPackages.map((pkg) => [pkg.id, { ...pkg, hospital: { ...pkg.hospital, logoUrl: resolveHospitalLogo(pkg.hospital) } }]),
    );
    compare.items.forEach((item) => {
      if (!byId.has(item.id)) {
        byId.set(item.id, {
          id: item.id,
          title: item.title,
          slug: item.slug,
          basePrice: item.basePrice,
          hospital: {
            id: "",
            name: item.hospitalName,
            logoUrl: resolveHospitalLogo({ id: "", name: item.hospitalName, logoUrl: null }),
          },
          includes: [],
          metrics: null,
        });
      }
    });
    return Array.from(byId.values()).slice(0, 4).map((pkg) => ({
      ...pkg,
      hospital: { ...pkg.hospital, logoUrl: resolveHospitalLogo(pkg.hospital) },
    }));
  }, [initialPackages, compare.items]);

  const idsQuery = items.map((pkg) => pkg.id).join(",");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const targetSearch = items.length ? `?ids=${encodeURIComponent(idsQuery)}` : "";
    if (window.location.search !== targetSearch) {
      router.replace(`/compare${targetSearch}`, { scroll: false });
    }
  }, [idsQuery, items.length, router]);

  useEffect(() => {
    setCopiedQuickLink(false);
    setCopiedShareLink(false);
  }, [idsQuery]);

  const quickLink = origin ? `${origin}/compare${idsQuery ? `?ids=${idsQuery}` : ""}` : `?ids=${idsQuery}`;
  const hasEnoughToShare = items.length >= 2;

  async function handleShare() {
    if (!hasEnoughToShare) {
      push({ title: "เลือกอย่างน้อย 2 แพ็กเกจเพื่อแชร์", variant: "error" });
      return;
    }
    setIsSharing(true);
    try {
      const response = await fetch("/api/v1/compare/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map((item) => item.id) }),
      });
      if (!response.ok) throw new Error("แชร์ไม่สำเร็จ");
      const data = await response.json();
      const shareUrl = `${window.location.origin}/compare?slug=${data.slug}`;

      if (navigator.share && navigator.canShare?.({ url: shareUrl })) {
        await navigator.share({
          title: "เปรียบเทียบแพ็กเกจสุขภาพ",
          text: "ดูแพ็กเกจที่ฉันเลือกไว้",
          url: shareUrl,
        });
        push({ title: "เปิดหน้าต่างแชร์แล้ว", variant: "success" });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedShareLink(true);
        push({ title: "คัดลอกลิงก์สำหรับแชร์แล้ว", variant: "success" });
      }
    } catch (error: unknown) {
      push({ title: error instanceof Error ? error.message : "แชร์ไม่สำเร็จ", variant: "error" });
    } finally {
      setIsSharing(false);
    }
  }

  async function handleCopyQuickLink() {
    try {
      await navigator.clipboard.writeText(quickLink);
      setCopiedQuickLink(true);
      push({ title: "คัดลอกลิงก์แล้ว", variant: "success" });
    } catch (error: unknown) {
      push({ title: error instanceof Error ? error.message : "คัดลอกไม่ได้", variant: "error" });
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
            disabled={isSharing}
            className="interactive-button inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isSharing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : copiedShareLink ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
            {isSharing ? "กำลังสร้างลิงก์" : copiedShareLink ? "คัดลอกลิงก์แชร์แล้ว" : "แชร์ลิงก์ถาวร"}
          </button>
          <button
            type="button"
            onClick={() => compare.clear()}
            className="interactive-button inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            ล้างรายการ
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((pkg) => (
          <article key={pkg.id} className="interactive-card flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  {pkg.hospital.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pkg.hospital.logoUrl} alt={pkg.hospital.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-200">
                      {pkg.hospital.name?.slice(0, 2) ?? "รพ"}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{pkg.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{pkg.hospital.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(pkg.id)}
                className="interactive-button rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800"
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
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
        <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
          <Link2 className="h-4 w-4" aria-hidden /> ลิงก์ด่วน
        </span>
        <code className="flex-1 truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {quickLink}
        </code>
        <button
          type="button"
          onClick={handleCopyQuickLink}
          className="interactive-button inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {copiedQuickLink ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Link2 className="h-3.5 w-3.5" aria-hidden />} {copiedQuickLink ? "คัดลอกแล้ว" : "คัดลอก"}
        </button>
      </div>
    </div>
  );
}

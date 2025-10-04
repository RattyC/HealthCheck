import Link from "next/link";
import { Info } from "lucide-react";
import CompareClient, { type ComparePackage } from "@/components/CompareClient";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getNewestFallbackPackages } from "@/lib/fallback-data";

export const revalidate = 60;

async function loadNewestPackages(): Promise<{ packages: ComparePackage[]; fallback: boolean }> {
  try {
    const results = await prisma.healthPackage.findMany({
      where: { status: "APPROVED" },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: {
        hospital: { select: { id: true, name: true, logoUrl: true } },
        includes: { select: { id: true, name: true, groupName: true, isOptional: true } },
        metrics: { select: { viewCount: true, compareCount: true, bookmarkCount: true } },
      },
    });

    if (results.length === 0) {
      return { packages: buildFallbackPackages(), fallback: true };
    }

    const packages = results.map<ComparePackage>((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      slug: pkg.slug,
      basePrice: pkg.basePrice,
      priceNote: pkg.priceNote,
      hospital: {
        id: pkg.hospital?.id ?? "",
        name: pkg.hospital?.name ?? "ไม่ระบุโรงพยาบาล",
        logoUrl: pkg.hospital?.logoUrl ?? null,
      },
      includes: pkg.includes.map((item) => ({
        id: item.id,
        name: item.name,
        groupName: item.groupName,
        isOptional: item.isOptional,
      })),
      metrics: pkg.metrics
        ? {
            viewCount: pkg.metrics.viewCount,
            compareCount: pkg.metrics.compareCount,
            bookmarkCount: pkg.metrics.bookmarkCount,
          }
        : null,
    }));

    return { packages, fallback: false };
  } catch (error) {
    logger.error("compare.newest.load_failed", { error: `${error}` });
    return { packages: buildFallbackPackages(), fallback: true };
  }
}

function buildFallbackPackages(): ComparePackage[] {
  return getNewestFallbackPackages(4).map((pkg) => ({
    id: pkg.id,
    title: pkg.title,
    slug: pkg.slug,
    basePrice: pkg.basePrice,
    priceNote: pkg.priceNote ?? null,
    hospital: {
      id: pkg.hospitalId,
      name: pkg.hospitalName,
      logoUrl: pkg.hospitalLogoUrl ?? null,
    },
    includes: pkg.includes.map((name, index) => ({
      id: `${pkg.id}-include-${index}`,
      name,
      groupName: null,
      isOptional: false,
    })),
    metrics: {
      viewCount: pkg.metrics.viewCount,
      compareCount: pkg.metrics.compareCount,
      bookmarkCount: pkg.metrics.bookmarkCount,
    },
  }));
}

export default async function CompareNewestPage() {
  const { packages, fallback } = await loadNewestPackages();

  return (
    <section className="space-y-8">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">เปรียบเทียบแพ็กเกจใหม่ล่าสุด</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          รวบรวมแพ็กเกจที่อัปเดตล่าสุดจากโรงพยาบาลพันธมิตร เพื่อให้เห็นความต่างของราคา รายการตรวจ และสิทธิพิเศษได้ในครั้งเดียว
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>อัปเดตทุก 60 วินาที</span>
          <span>•</span>
          <Link href="/packages?sort=updated" className="font-medium text-brand hover:underline">
            ดูรายการทั้งหมด
          </Link>
        </div>
      </header>

      {fallback ? (
        <div className="flex items-start gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/50 dark:bg-amber-900/30 dark:text-amber-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            กำลังแสดงข้อมูลตัวอย่างเนื่องจากไม่สามารถเชื่อมต่อฐานข้อมูลได้ ชุดข้อมูลจริงจะกลับมาอัตโนมัติเมื่อระบบพร้อม
          </p>
        </div>
      ) : null}

      <CompareClient initialPackages={packages} />
    </section>
  );
}

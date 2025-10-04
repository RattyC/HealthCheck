// Compare page renders side-by-side analysis of selected health packages.
import Link from "next/link";
import { notFound } from "next/navigation";
import CompareClient, { type ComparePackage } from "@/components/CompareClient";
import { prisma } from "@/lib/prisma";
import { getFallbackPackages } from "@/lib/fallback-data";

export const revalidate = 30;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const idsParam = (sp.ids as string) ?? "";
  const slug = (sp.slug as string) ?? "";
  const addParamRaw = sp.add;
  let ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);

  const additions = (Array.isArray(addParamRaw) ? addParamRaw : addParamRaw ? [addParamRaw] : [])
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  if (additions.length) {
    const merged = [...ids, ...additions];
    const unique: string[] = [];
    for (const candidate of merged) {
      if (!unique.includes(candidate)) {
        unique.push(candidate);
      }
      if (unique.length === 4) break;
    }
    ids = unique;
  }

  if (!ids.length && slug) {
    const snapshot = await prisma.compareSnapshot.findUnique({ where: { slug } });
    if (!snapshot) {
      notFound();
    }
    ids = snapshot.packageIds.slice(0, 4);
  }

  let packages: ComparePackage[] = [];

  if (ids.length) {
    const dbPackages = await prisma.healthPackage.findMany({
      where: { id: { in: ids } },
      include: {
        hospital: { select: { id: true, name: true, logoUrl: true } },
        includes: { select: { id: true, name: true, groupName: true, isOptional: true } },
        metrics: true,
      },
    });

    const dbMap = new Map<string, ComparePackage>();
    const dbSlugMap = new Map<string, ComparePackage>();
    for (const pkg of dbPackages) {
      const normalized: ComparePackage = {
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
      };
      dbMap.set(pkg.id, normalized);
      dbSlugMap.set(pkg.slug, normalized);
    }

    const fallbackPackages = getFallbackPackages();
    const fallbackMap = new Map<string, ComparePackage>();
    const fallbackSlugMap = new Map<string, ComparePackage>();
    for (const fallback of fallbackPackages) {
      const normalized: ComparePackage = {
        id: fallback.id,
        title: fallback.title,
        slug: fallback.slug,
        basePrice: fallback.basePrice,
        priceNote: fallback.priceNote ?? null,
        hospital: {
          id: fallback.hospitalId,
          name: fallback.hospitalName,
          logoUrl: fallback.hospitalLogoUrl ?? null,
        },
        includes: fallback.includes.map((name, index) => ({
          id: `${fallback.id}-include-${index}`,
          name,
          groupName: null,
          isOptional: false,
        })),
        metrics: {
          viewCount: fallback.metrics.viewCount,
          compareCount: fallback.metrics.compareCount,
          bookmarkCount: fallback.metrics.bookmarkCount,
        },
      };
      fallbackMap.set(fallback.id, normalized);
      fallbackSlugMap.set(fallback.slug, normalized);
    }

    packages = ids
      .map((identifier) => dbMap.get(identifier) ?? fallbackMap.get(identifier) ?? dbSlugMap.get(identifier) ?? fallbackSlugMap.get(identifier))
      .filter((pkg): pkg is ComparePackage => Boolean(pkg));
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-medium text-slate-700 dark:text-slate-200">เลือกแพ็กเกจได้สูงสุด 4 รายการเพื่อเปรียบเทียบ</div>
        <Link href="/compare/new" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
          ดูแพ็กเกจใหม่ล่าสุด
        </Link>
      </div>
      <CompareClient initialPackages={packages} />
    </section>
  );
}

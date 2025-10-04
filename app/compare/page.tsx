// Compare page renders side-by-side analysis of selected health packages.
import Link from "next/link";
import { notFound } from "next/navigation";
import CompareClient, { type ComparePackage } from "@/components/CompareClient";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const idsParam = (sp.ids as string) ?? "";
  const slug = (sp.slug as string) ?? "";
  let ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (!ids.length && slug) {
    const snapshot = await prisma.compareSnapshot.findUnique({ where: { slug } });
    if (!snapshot) {
      notFound();
    }
    ids = snapshot.packageIds.slice(0, 4);
  }

  const packages: ComparePackage[] = ids.length
    ? await prisma.healthPackage.findMany({
        where: { id: { in: ids } },
        include: {
          hospital: { select: { id: true, name: true, logoUrl: true } },
          includes: { select: { id: true, name: true, groupName: true, isOptional: true } },
          metrics: true,
        },
      })
    : [];

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

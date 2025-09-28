// Compare page renders side-by-side analysis of selected health packages.
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
      <CompareClient initialPackages={packages} />
    </section>
  );
}

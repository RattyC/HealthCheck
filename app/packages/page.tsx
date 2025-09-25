import FilterBar from "@/components/FilterBar";
import PackageCard from "@/components/PackageCard";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { packageSearchSchema, type PackageSearchInput } from "@/lib/validators";

export const revalidate = 60;

type PackageWithMeta = {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  gender: string | null;
  category: string[];
  hospital: { id: string; name: string; logoUrl: string | null };
  _count: { includes: number };
};

type HospitalOption = {
  value: string;
  label: string;
};

function buildWhereClause(input: PackageSearchInput) {
  const tokens = input.q?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  const where: Prisma.HealthPackageWhereInput = {
    status: "APPROVED",
    ...(input.hospitalId ? { hospitalId: input.hospitalId } : {}),
    ...(input.minPrice ? { basePrice: { gte: input.minPrice } } : {}),
    ...(input.maxPrice ? { basePrice: { lte: input.maxPrice } } : {}),
    ...(input.gender && input.gender !== "any"
      ? {
          OR: [
            { gender: "any" },
            { gender: input.gender },
          ],
        }
      : {}),
    ...(input.age
      ? {
          AND: [
            { OR: [{ minAge: null }, { minAge: { lte: input.age } }] },
            { OR: [{ maxAge: null }, { maxAge: { gte: input.age } }] },
          ],
        }
      : {}),
    ...(input.category ? { category: { has: input.category } } : {}),
    ...(input.q
      ? {
          OR: [
            { title: { contains: input.q, mode: "insensitive" } },
            { hospital: { name: { contains: input.q, mode: "insensitive" } } },
            ...(tokens.length ? [{ tags: { hasSome: tokens } }] : []),
            { includes: { some: { name: { contains: input.q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
  return where;
}

function resolveOrderBy(sort: string): Prisma.HealthPackageOrderByWithRelationInput {
  switch (sort) {
    case "priceDesc":
      return { basePrice: "desc" };
    case "updated":
      return { updatedAt: "desc" };
    default:
      return { basePrice: "asc" };
  }
}

function getBestValueId(list: PackageWithMeta[]): string | null {
  if (list.length === 0) return null;
  let bestId: string = list[0].id;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const pkg of list) {
    const count = pkg._count?.includes ?? 1;
    const score = pkg.basePrice / Math.max(count, 1);
    if (score < bestScore) {
      bestScore = score;
      bestId = pkg.id;
    }
  }
  return bestId;
}

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = packageSearchSchema.safeParse({
    q: raw.q,
    hospitalId: raw.hospitalId,
    minPrice: raw.minPrice,
    maxPrice: raw.maxPrice,
    gender: raw.gender,
    age: raw.age,
    category: raw.category,
    sort: raw.sort,
    page: raw.page,
    limit: raw.limit ?? 12,
  });

  if (!parsed.success) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">แพ็กเกจทั้งหมด</h1>
        <EmptyState title="พารามิเตอร์ไม่ถูกต้อง" hint="รีเฟรชหน้าหรือปรับฟิลเตอร์ใหม่อีกครั้ง" />
      </section>
    );
  }

  const input = parsed.data;
  const skip = (input.page - 1) * input.limit;
  let hospitals: HospitalOption[] = [];
  let total = 0;
  let items: PackageWithMeta[] = [];

  const where = buildWhereClause(input);

  try {
    const [hospitalRows, packageTotal, packageRows] = await Promise.all([
      prisma.hospital.findMany({
        include: { _count: { select: { packages: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.healthPackage.count({ where }),
      prisma.healthPackage.findMany({
        where,
        orderBy: resolveOrderBy(input.sort),
        include: {
          hospital: { select: { id: true, name: true, logoUrl: true } },
          _count: { select: { includes: true } },
        },
        skip,
        take: input.limit,
      }),
    ]);

    hospitals = hospitalRows.map((h) => ({ value: h.id, label: `${h.name} (${h._count?.packages ?? 0})` }));
    total = packageTotal;
    items = packageRows.map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      slug: pkg.slug,
      basePrice: pkg.basePrice,
      gender: pkg.gender,
      category: pkg.category,
      hospital: pkg.hospital,
      _count: { includes: pkg._count?.includes ?? 0 },
    } satisfies PackageWithMeta));
  } catch (error) {
    console.error("Failed to load packages", error);
    hospitals = [];
    total = 0;
    items = [];
  }

  const bestValueId = getBestValueId(items);
  const showMock = items.length === 0 && hospitals.length === 0;
  const mockItems: PackageWithMeta[] = [
    {
      id: "demo-1",
      title: "Basic Health Check (Male)",
      slug: "demo-1",
      basePrice: 1990,
      gender: "male",
      category: ["basic"],
      hospital: { id: "h1", name: "Demo Hospital", logoUrl: null },
      _count: { includes: 8 },
    },
    {
      id: "demo-2",
      title: "Basic Health Check (Female)",
      slug: "demo-2",
      basePrice: 2090,
      gender: "female",
      category: ["basic"],
      hospital: { id: "h1", name: "Demo Hospital", logoUrl: null },
      _count: { includes: 8 },
    },
    {
      id: "demo-3",
      title: "Premium Checkup",
      slug: "demo-3",
      basePrice: 4990,
      gender: "any",
      category: ["premium"],
      hospital: { id: "h1", name: "Demo Hospital", logoUrl: null },
      _count: { includes: 15 },
    },
  ];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">แพ็กเกจทั้งหมด</h1>
      <FilterBar hospitals={hospitals} />
      {items.length === 0 ? (
        <>
          <EmptyState
            title="ไม่พบผลลัพธ์"
            hint="ลองปรับช่วงราคา เลือกโรงพยาบาลอื่น หรือเคลียร์ตัวกรองเพื่อดูตัวเลือกมากขึ้น"
          />
          {showMock && (
            <div className="space-y-2">
              <div className="mt-2 text-sm text-gray-600">ตัวอย่าง (mock) เพื่อดูหน้าตา:</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockItems.map((p) => (
                  <PackageCard key={p.id} pkg={p} bestValue={false} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} bestValue={pkg.id === bestValueId} />
          ))}
        </div>
      )}
      {!showMock && <Pagination page={input.page} limit={input.limit} total={total} />}
    </section>
  );
}

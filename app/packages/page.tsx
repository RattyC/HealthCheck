// Packages listing page handles filtering, pagination, and best-value highlighting.
import FilterBar from "@/components/FilterBar";
import PackageCard from "@/components/PackageCard";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import SaveSearchButton from "@/components/SaveSearchButton";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { packageSearchSchema, type PackageSearchInput } from "@/lib/validators";
import { Search } from "lucide-react";
import { differenceInDays } from "date-fns";
import { logger } from "@/lib/logger";

export const revalidate = 60;

const DB_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_DB_TIMEOUT ?? 2500);

function withTimeout<T>(promise: Promise<T>, fallback: T, label: string, timeout = DB_TIMEOUT_MS): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      logger.warn(`${label}.timeout`, { timeout });
      resolve(fallback);
    }, timeout);
  });

  return Promise.race([
    promise
      .then((result) => {
        clearTimeout(timer);
        return result;
      })
      .catch((error) => {
        clearTimeout(timer);
        logger.error(`${label}.failed`, { error: `${error}` });
        return fallback;
      }),
    timeoutPromise,
  ]);
}

type PackageWithMeta = {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  gender: string | null;
  category: string[];
  priceNote: string | null;
  updatedAt: Date;
  hospital: { id: string; name: string; logoUrl: string | null };
  _count: { includes: number };
};

const packageSelect = {
  id: true,
  title: true,
  slug: true,
  basePrice: true,
  gender: true,
  category: true,
  priceNote: true,
  updatedAt: true,
  hospital: { select: { id: true, name: true, logoUrl: true } },
  _count: { select: { includes: true } },
} satisfies Prisma.HealthPackageSelect;

type PackageRow = Prisma.HealthPackageGetPayload<{ select: typeof packageSelect }>;
type HospitalRow = Prisma.HospitalGetPayload<{ include: { _count: { select: { packages: true } } } }>;

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

function buildBadges(pkg: PackageWithMeta) {
  const badges: Array<{ label: string; tone?: "success" | "info" | "warning" }> = [];
  const daysFromUpdate = differenceInDays(new Date(), pkg.updatedAt);
  if (daysFromUpdate <= 14) {
    badges.push({ label: "อัปเดตใหม่", tone: "success" });
  }
  if (pkg.priceNote && pkg.priceNote.toLowerCase().includes("ลด")) {
    badges.push({ label: "ลดราคา", tone: "warning" });
  }
  return badges;
}

function buildSerializableParams(input: PackageSearchInput) {
  const entries: Record<string, string | number> = {};
  if (input.q) entries.q = input.q;
  if (input.hospitalId) entries.hospitalId = input.hospitalId;
  if (input.minPrice !== undefined) entries.minPrice = input.minPrice;
  if (input.maxPrice !== undefined) entries.maxPrice = input.maxPrice;
  if (input.gender) entries.gender = input.gender;
  if (input.age !== undefined) entries.age = input.age;
  if (input.category) entries.category = input.category;
  entries.sort = input.sort;
  entries.page = input.page;
  entries.limit = input.limit;
  return entries;
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
    const [hospitalRows, packageTotal, packageRows] = await withTimeout(
      prisma.$transaction([
        prisma.hospital.findMany({
          include: { _count: { select: { packages: true } } },
          orderBy: { name: "asc" },
        }),
        prisma.healthPackage.count({ where }),
        prisma.healthPackage.findMany({
          where,
          orderBy: resolveOrderBy(input.sort),
          select: packageSelect,
          skip,
          take: input.limit,
        }),
      ]),
      [[], 0, []] as [HospitalRow[], number, PackageRow[]],
      "packages.page.tx"
    );

    hospitals = hospitalRows.map((h) => ({ value: h.id, label: `${h.name} (${h._count?.packages ?? 0})` }));
    total = packageTotal;
    items = packageRows.map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      slug: pkg.slug,
      basePrice: pkg.basePrice,
      gender: pkg.gender,
      category: pkg.category,
      priceNote: pkg.priceNote ?? null,
      updatedAt: pkg.updatedAt,
      hospital: pkg.hospital,
      _count: { includes: pkg._count?.includes ?? 0 },
    } satisfies PackageWithMeta));
  } catch (error) {
    logger.error("packages.page.query_failed", { error: `${error}` });
    hospitals = [];
    total = 0;
    items = [];
  }

  const bestValueId = getBestValueId(items);
  const showMock = items.length === 0 && hospitals.length === 0;
  const serializedParams = buildSerializableParams(input);
  const mockItems: PackageWithMeta[] = [
    {
      id: "demo-1",
      title: "Basic Health Check (Male)",
      slug: "demo-1",
      basePrice: 1990,
      gender: "male",
      category: ["basic"],
      priceNote: null,
      updatedAt: new Date(),
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
      priceNote: null,
      updatedAt: new Date(),
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
      priceNote: null,
      updatedAt: new Date(),
      hospital: { id: "h1", name: "Demo Hospital", logoUrl: null },
      _count: { includes: 15 },
    },
  ];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">แพ็กเกจทั้งหมด</h1>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterBar hospitals={hospitals} />
        <SaveSearchButton params={serializedParams} />
      </div>
      {items.length === 0 ? (
        <>
          <EmptyState
            title="ไม่พบผลลัพธ์"
            hint="ลองปรับช่วงราคา เลือกโรงพยาบาลอื่น หรือเคลียร์ตัวกรองเพื่อดูตัวเลือกมากขึ้น"
            icon={<Search size={20} />}
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
            <PackageCard key={pkg.id} pkg={pkg} bestValue={pkg.id === bestValueId} badges={buildBadges(pkg)} />
          ))}
        </div>
      )}
      {!showMock && <Pagination page={input.page} limit={input.limit} total={total} />}
    </section>
  );
}

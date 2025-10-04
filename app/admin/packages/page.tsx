// Admin packages table for reviewing, filtering, and moderating health package records.
import { PackageStatus, type Prisma } from "@prisma/client";
import AdminPackagesToolbar from "@/components/AdminPackagesToolbar";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import { FileSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { adminPackageQuerySchema } from "@/lib/validators";
import { requireRole } from "@/lib/auth-guard";
import { logger } from "@/lib/logger";
import AdminPackagesTable, { type AdminPackageListItem } from "@/components/AdminPackagesTable";

export const revalidate = 30;

const SORT_MAP: Record<string, Prisma.HealthPackageOrderByWithRelationInput> = {
  updatedDesc: { updatedAt: "desc" },
  updatedAsc: { updatedAt: "asc" },
  priceAsc: { basePrice: "asc" },
  priceDesc: { basePrice: "desc" },
  titleAsc: { title: "asc" },
};

const ACCEPTED_STATUS = new Set(["DRAFT", "APPROVED", "ARCHIVED"]);
const ACCEPTED_LIMIT = [10, 20, 50, 100];

export default async function AdminPackages({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["ADMIN", "EDITOR"], "/dashboard");
  const sp = await searchParams;
  const parsed = adminPackageQuerySchema.safeParse(sp);
  const input = parsed.success
    ? parsed.data
    : { q: "", status: "all", sort: "updatedDesc", page: 1, limit: 20 };
  const limit = ACCEPTED_LIMIT.includes(input.limit) ? input.limit : 20;
  const page = input.page;
  const q = input.q ?? "";
  const statusParam = input.status ?? "all";
  const sortParam = input.sort ?? "updatedDesc";
  const skip = (page - 1) * limit;

  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const searchConditions: Prisma.HealthPackageWhereInput[] = [
    { title: { contains: q, mode: "insensitive" } },
    { hospital: { name: { contains: q, mode: "insensitive" } } },
  ];

  if (tokens.length) {
    searchConditions.push({ tags: { hasSome: tokens } });
  }

  const where: Prisma.HealthPackageWhereInput = {
    ...(ACCEPTED_STATUS.has(statusParam) ? { status: statusParam as PackageStatus } : {}),
    ...(q ? { OR: searchConditions } : {}),
  };

  const orderBy = SORT_MAP[sortParam] ?? SORT_MAP.updatedDesc;

  let total = 0;
  let items: Array<Prisma.HealthPackageGetPayload<{ include: { hospital: true; _count: { select: { includes: true } } } }>> = [];

  try {
    [total, items] = await Promise.all([
      prisma.healthPackage.count({ where }),
      prisma.healthPackage.findMany({
        where,
        orderBy,
        include: {
          hospital: true,
          _count: { select: { includes: true } },
        },
        skip,
        take: limit,
      }),
    ]);
  } catch (error) {
    logger.error("admin.packages.query_failed", { error: `${error}` });
    total = 0;
    items = [];
  }

  const defaults = { q, status: ACCEPTED_STATUS.has(statusParam) ? statusParam : "all", sort: sortParam, limit };

  const tableItems: AdminPackageListItem[] = items.map((pkg) => ({
    id: pkg.id,
    title: pkg.title,
    status: pkg.status,
    basePrice: pkg.basePrice,
    updatedAt: pkg.updatedAt.toISOString(),
    includeCount: pkg._count?.includes ?? 0,
    hospitalName: pkg.hospital?.name ?? null,
  }));

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">จัดการแพ็กเกจ</h1>
      <AdminPackagesToolbar total={total} defaults={defaults} />
      {items.length === 0 ? (
        <EmptyState
        title="ไม่พบแพ็กเกจ"
        hint="ลองค้นด้วยคำหลักอื่นหรือเปลี่ยนตัวกรอง"
        icon={<FileSearch className="h-6 w-6" aria-hidden />}
      />
      ) : (
        <AdminPackagesTable items={tableItems} />
      )}
      <Pagination page={page} limit={limit} total={total} />
    </section>
  );
}

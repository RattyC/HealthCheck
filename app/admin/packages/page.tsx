// Admin packages table for reviewing, filtering, and moderating health package records.
import { PackageStatus, type Prisma } from "@prisma/client";
import AdminStatusBadge from "@/components/AdminStatusBadge";
import AdminActions from "@/components/AdminActions";
import AdminPackagesToolbar from "@/components/AdminPackagesToolbar";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import { prisma } from "@/lib/prisma";
import { adminPackageQuerySchema } from "@/lib/validators";
import { requireRole } from "@/lib/auth-guard";
import { logger } from "@/lib/logger";

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

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">จัดการแพ็กเกจ</h1>
      <AdminPackagesToolbar total={total} defaults={defaults} />
      {items.length === 0 ? (
        <EmptyState title="ไม่พบแพ็กเกจ" hint="ลองค้นด้วยคำหลักอื่นหรือเปลี่ยนตัวกรอง" />
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-2 text-left font-semibold">แพ็กเกจ</th>
                <th className="p-2 text-left font-semibold">โรงพยาบาล</th>
                <th className="p-2 text-right font-semibold">ราคา</th>
                <th className="p-2 text-center font-semibold">สถานะ</th>
                <th className="p-2 text-left font-semibold">อัปเดต</th>
                <th className="p-2 text-left font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((pkg) => (
                <tr
                  key={pkg.id}
                  className="border-t border-slate-100 transition hover:-translate-y-[1px] hover:bg-slate-50 hover:shadow-sm dark:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <td className="p-2">
                    <div className="font-medium text-slate-900 dark:text-white">{pkg.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{pkg._count?.includes ?? 0} รายการตรวจ</div>
                  </td>
                  <td className="p-2 text-slate-700 dark:text-slate-300">{pkg.hospital?.name ?? "-"}</td>
                  <td className="p-2 text-right text-slate-700 dark:text-slate-200">฿{pkg.basePrice.toLocaleString()}</td>
                  <td className="p-2 text-center"><AdminStatusBadge status={pkg.status} /></td>
                  <td className="p-2 text-xs text-slate-500 dark:text-slate-400">{new Date(pkg.updatedAt).toLocaleString()}</td>
                  <td className="p-2"><AdminActions id={pkg.id} status={pkg.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} limit={limit} total={total} />
    </section>
  );
}

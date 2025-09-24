import FilterBar from "@/components/FilterBar";
import PackageCard from "@/components/PackageCard";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import { prisma } from "@/lib/prisma";

export const revalidate = 60; // ISR: รีเฟรชทุก 60 วินาที

export default async function PackagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q as string) ?? "";
  const hospitalId = (sp.hospitalId as string) || undefined;
  const minPrice = Number((sp.minPrice as string) ?? 0) || 0;
  const maxPrice = Number((sp.maxPrice as string) ?? 0) || 0;
  const gender = (sp.gender as string) || undefined;
  const age = Number((sp.age as string) ?? 0) || 0;
  const category = (sp.category as string) || undefined;
  const sort = (sp.sort as string) || "priceAsc";
  const page = Math.max(1, Number((sp.page as string) ?? 1));
  const limit = Math.min(Math.max(1, Number((sp.limit as string) ?? 12)), 50);
  const skip = (page - 1) * limit;

  const where: any = {
    status: "APPROVED",
    ...(hospitalId ? { hospitalId } : {}),
    ...(minPrice ? { basePrice: { gte: minPrice } } : {}),
    ...(maxPrice ? { basePrice: { lte: maxPrice } } : {}),
    ...(gender && gender !== "any" ? { OR: [{ gender: "any" }, { gender }] } : {}),
    ...(age
      ? {
          AND: [
            { OR: [{ minAge: null }, { minAge: { lte: age } }] },
            { OR: [{ maxAge: null }, { maxAge: { gte: age } }] },
          ],
        }
      : {}),
    ...(category ? { category: { has: category } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { tags: { hasSome: q.toLowerCase().split(" ") } },
            { includes: { some: { name: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  let hospitals: any[] = [];
  let total = 0;
  let items: any[] = [];
  try {
    [hospitals, total, items] = await Promise.all([
      prisma.hospital.findMany({ include: { _count: { select: { packages: true } } }, orderBy: { name: "asc" } }),
      prisma.healthPackage.count({ where }),
      prisma.healthPackage.findMany({
        where,
        orderBy:
          sort === "priceDesc"
            ? { basePrice: "desc" }
            : sort === "updated"
            ? { updatedAt: "desc" }
            : { basePrice: "asc" },
        include: {
          hospital: { select: { id: true, name: true, logoUrl: true } },
          _count: { select: { includes: true } },
        },
        skip,
        take: limit,
      }),
    ]);
  } catch (e) {
    // Fallback: no DB or query error → show empty state gracefully
    hospitals = [];
    total = 0;
    items = [];
  }

  const hospitalOptions = hospitals.map((h) => ({ value: h.id, label: `${h.name} (${h._count?.packages ?? 0})` }));

  const showMock = items.length === 0 && hospitals.length === 0;
  const mockItems = [
    { id: "demo-1", title: "Basic Health Check (Male)", slug: "demo-1", basePrice: 1990, gender: "male", category: ["basic"], hospital: { id: "h1", name: "Demo Hospital", logoUrl: null }, _count: { includes: 8 } },
    { id: "demo-2", title: "Basic Health Check (Female)", slug: "demo-2", basePrice: 2090, gender: "female", category: ["basic"], hospital: { id: "h1", name: "Demo Hospital", logoUrl: null }, _count: { includes: 8 } },
    { id: "demo-3", title: "Premium Checkup", slug: "demo-3", basePrice: 4990, gender: "any", category: ["premium"], hospital: { id: "h1", name: "Demo Hospital", logoUrl: null }, _count: { includes: 15 } },
  ];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">แพ็กเกจทั้งหมด</h1>
      <FilterBar hospitals={hospitalOptions} />
      {items.length === 0 ? (
        <>
          <EmptyState title="ไม่พบผลลัพธ์หรือฐานข้อมูลยังไม่พร้อม" hint="ตรวจสอบการเชื่อมต่อฐานข้อมูล หรือปรับฟิลเตอร์ให้กว้างขึ้น" />
          {showMock && (
            <div className="space-y-2">
              <div className="mt-2 text-sm text-gray-600">ตัวอย่าง (mock) เพื่อดูหน้าตา:</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockItems.map((p) => (
                  <PackageCard key={p.id} pkg={p as any} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p: any) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
        </div>
      )}
      {!showMock && <Pagination page={page} limit={limit} total={total} />}
    </section>
  );
}

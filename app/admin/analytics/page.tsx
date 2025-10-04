import { subDays, format } from "date-fns";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import AdminAnalyticsLineChart from "@/components/AdminAnalyticsLineChart";
import EmptyState from "@/components/EmptyState";
import { TrendingUp, ListFilter, Link2 } from "lucide-react";

export const revalidate = 0;

function formatDay(date: Date) {
  return format(date, "dd MMM");
}

function bucketByDay<T extends { createdAt: Date }>(items: T[], days = 14) {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = subDays(new Date(), i);
    buckets.set(format(day, "yyyy-MM-dd"), 0);
  }
  for (const item of items) {
    const key = format(item.createdAt, "yyyy-MM-dd");
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }
  return Array.from(buckets.entries()).map(([key, value]) => ({
    label: formatDay(new Date(key)),
    value,
  }));
}

export default async function AdminAnalyticsPage() {
  await requireRole(["ADMIN", "EDITOR"], "/dashboard");
  const rangeDays = 14;
  const rangeStart = subDays(new Date(), rangeDays - 1);

  try {
    const [searchLogs, compareSnapshots, cartItems] = await Promise.all([
      prisma.searchLog.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true, filters: true },
      }),
      prisma.compareSnapshot.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true },
      }),
      prisma.cartItem.findMany({
        where: { addedAt: { gte: rangeStart } },
        select: { addedAt: true },
      }),
    ]);

    const searchTrend = bucketByDay(searchLogs, rangeDays);
    const compareTrend = bucketByDay(compareSnapshots, rangeDays);
    const cartTrend = bucketByDay(
      cartItems.map((item) => ({ createdAt: item.addedAt })),
      rangeDays
    );

    const filterCount = new Map<string, number>();
    for (const log of searchLogs) {
      const filters = log.filters as Record<string, unknown> | null;
      if (!filters) continue;
      for (const [key, raw] of Object.entries(filters)) {
        const value = Array.isArray(raw)
          ? raw.join(",")
          : typeof raw === "object" && raw !== null
          ? JSON.stringify(raw)
          : String(raw ?? "");
        const label = `${key}:${value}`;
        filterCount.set(label, (filterCount.get(label) ?? 0) + 1);
      }
    }

    const topFilters = Array.from(filterCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">ข้อมูลสรุปการใช้งานช่วง {rangeDays} วันที่ผ่านมา</p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">การค้นหาทั้งหมด</p>
              <TrendingUp className="h-4 w-4 text-brand" aria-hidden />
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{searchLogs.length.toLocaleString()}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">เฉลี่ย {(searchLogs.length / rangeDays).toFixed(1)} ครั้งต่อวัน</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">การเปรียบเทียบ</p>
              <Link2 className="h-4 w-4 text-brand" aria-hidden />
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{compareSnapshots.length.toLocaleString()}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">เฉลี่ย {(compareSnapshots.length / rangeDays).toFixed(1)} ลิงก์ต่อวัน</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ตะกร้าที่เพิ่ม</p>
              <ListFilter className="h-4 w-4 text-brand" aria-hidden />
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{cartItems.length.toLocaleString()}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">เฉลี่ย {(cartItems.length / rangeDays).toFixed(1)} รายการต่อวัน</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Search volume per day</h2>
            {searchTrend.every((point) => point.value === 0) ? (
              <EmptyState
                title="ยังไม่มีข้อมูล"
                hint="รอให้มีการค้นหาจริงจากผู้ใช้"
                icon={<TrendingUp className="h-6 w-6" aria-hidden />}
              />
            ) : (
              <div className="mt-4 h-64">
                <AdminAnalyticsLineChart data={searchTrend} color="#0ea5a0" label="ครั้ง" />
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">ตัวกรองยอดนิยม</h2>
            {topFilters.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">ยังไม่มีข้อมูลตัวกรองที่ใช้บ่อย</p>
            ) : (
              <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {topFilters.map(([label, count]) => (
                  <li key={label} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <span className="truncate">{label}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Compare link creation</h2>
            {compareTrend.every((point) => point.value === 0) ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">ยังไม่มีข้อมูลการเปรียบเทียบในช่วงเวลาที่กำหนด</p>
            ) : (
              <div className="mt-4 h-60">
                <AdminAnalyticsLineChart data={compareTrend} color="#6366f1" label="ลิงก์" />
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Cart additions per day</h2>
            {cartTrend.every((point) => point.value === 0) ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">ยังไม่มีการเพิ่มลงตะกร้าในช่วงเวลาที่กำหนด</p>
            ) : (
              <div className="mt-4 h-60">
                <AdminAnalyticsLineChart data={cartTrend} color="#f97316" label="ตะกร้า" />
              </div>
            )}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    logger.error("admin.analytics.failed", { error: `${error}` });
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Analytics</h1>
        <EmptyState
          title="ไม่สามารถโหลดข้อมูลได้"
          hint="กรุณาลองรีเฟรชหน้าหรือเช็คการเชื่อมต่อฐานข้อมูล"
          icon={<TrendingUp className="h-6 w-6" aria-hidden />}
        />
      </section>
    );
  }
}

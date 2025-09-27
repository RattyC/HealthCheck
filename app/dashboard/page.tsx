import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import EmptyState from "@/components/EmptyState";
import SavedSearchList from "@/components/SavedSearchList";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function formatRelative(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true, locale: th });
}

const healthPackageSelect = {
  id: true,
  title: true,
  slug: true,
  basePrice: true,
  hospital: { select: { name: true } },
} satisfies Prisma.HealthPackageSelect;

type BookmarkWithPackage = Prisma.BookmarkGetPayload<{
  include: { package: { select: typeof healthPackageSelect } };
}>;

type MetricWithPackage = Prisma.PackageMetricGetPayload<{
  include: { package: { select: typeof healthPackageSelect } };
}>;

export default async function DashboardPage() {
  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    redirect("/auth/sign-in?callbackUrl=/dashboard");
  }

  let summary = {
    bookmarkCount: 0,
    savedSearchCount: 0,
    compareCount: 0,
    notificationsCount: 0,
  };
  let recentBookmarks: BookmarkWithPackage[] = [];
  let savedSearches = [] as Awaited<ReturnType<typeof prisma.savedSearch.findMany>>;
  let recentSearches = [] as Awaited<ReturnType<typeof prisma.searchLog.findMany>>;
  let compareSnapshots = [] as Awaited<ReturnType<typeof prisma.compareSnapshot.findMany>>;
  let trendingPackages: MetricWithPackage[] = [];
  let loadError: Error | null = null;

  try {
    const [summaryResult, bookmarksResult, savedSearchResult, recentSearchResult, compareResult, trendingResult] = await Promise.all([
      (async () => {
        const [bookmarkCount, savedSearchCount, compareCount, notificationsCount] = await Promise.all([
          prisma.bookmark.count({ where: { userId } }),
          prisma.savedSearch.count({ where: { userId } }),
          prisma.compareSnapshot.count({ where: { userId } }),
          prisma.notification.count({ where: { userId, readAt: null } }),
        ]);
        return { bookmarkCount, savedSearchCount, compareCount, notificationsCount };
      })(),
      prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          package: {
            select: healthPackageSelect,
          },
        },
        take: 6,
      }),
      prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.searchLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.compareSnapshot.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.packageMetric.findMany({
        orderBy: { viewCount: "desc" },
        include: {
          package: {
            select: healthPackageSelect,
          },
        },
        take: 5,
      }),
    ]);

    summary = summaryResult;
    recentBookmarks = bookmarksResult;
    savedSearches = savedSearchResult;
    recentSearches = recentSearchResult;
    compareSnapshots = compareResult;
    trendingPackages = trendingResult;
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    logger.error("dashboard.page.query_failed", { error: `${error}` });
  }

  const tiles = [
    {
      label: "แพ็กเกจที่บันทึกไว้",
      value: summary.bookmarkCount,
      href: "/bookmarks",
    },
    {
      label: "Saved searches",
      value: summary.savedSearchCount,
      href: "#saved-searches",
    },
    {
      label: "ลิงก์เปรียบเทียบ",
      value: summary.compareCount,
      href: "#compare-links",
    },
    {
      label: "การแจ้งเตือน",
      value: summary.notificationsCount,
      href: "#notifications",
    },
  ];

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">แดชบอร์ดของฉัน</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          ติดตามแพ็กเกจที่สนใจ ค้นหาที่บันทึกไว้ และข้อมูลยอดนิยมล่าสุดจากระบบ
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              {tile.label}
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{tile.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {loadError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-100 lg:col-span-2">
            ไม่สามารถเชื่อมต่อฐานข้อมูลได้ ข้อมูลบนแดชบอร์ดนี้จะแสดงเป็นค่าว่างจนกว่าจะเชื่อมต่อสำเร็จ
          </div>
        ) : null}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">รายการที่บันทึกล่าสุด</h2>
            <Link href="/bookmarks" className="text-xs font-medium text-brand hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          {recentBookmarks.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-300">ยังไม่มีแพ็กเกจที่บันทึกไว้</p>
          ) : (
            <ul className="space-y-3">
              {recentBookmarks.map((bookmark) => (
                <li key={bookmark.id} className="flex items-start gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
                  <div className="flex-1">
                    <Link
                      href={`/packages/${bookmark.package.id}`}
                      className="font-medium text-slate-900 hover:text-brand dark:text-white"
                    >
                      {bookmark.package.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {bookmark.package.hospital?.name ?? "-"} · ฿{bookmark.package.basePrice.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400">{formatRelative(bookmark.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div id="saved-searches" className="space-y-3 rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Saved searches</h2>
          </div>
          {savedSearches.length === 0 ? (
            <EmptyState title="ยังไม่มีการบันทึกการค้นหา" hint="เลือกตัวกรองแล้วกดปุ่มบันทึกบนหน้าค้นหาเพื่อเข้าถึงที่นี่ได้ทันที" />
          ) : (
            <SavedSearchList items={savedSearches} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">การค้นหาล่าสุด</h2>
          </div>
          {recentSearches.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-300">ยังไม่มีประวัติการค้นหา</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentSearches.map((log) => (
                <li key={log.id} className="rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-slate-400">ผลลัพธ์ {log.results}</span>
                    <span className="text-[11px] text-slate-400">{formatRelative(log.createdAt)}</span>
                  </div>
                  <pre className="mt-1 overflow-x-auto rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                    {JSON.stringify(log.filters, null, 0)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div id="compare-links" className="space-y-3 rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">เปรียบเทียบที่เคยสร้าง</h2>
            <Link href="/compare" className="text-xs font-medium text-brand hover:underline">
              เริ่มเปรียบเทียบ
            </Link>
          </div>
          {compareSnapshots.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-300">ยังไม่มีลิงก์เปรียบเทียบที่บันทึกไว้</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {compareSnapshots.map((snapshot) => (
                <li key={snapshot.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
                  <span className="truncate text-slate-600 dark:text-slate-300">{snapshot.packageIds.join(", ")}</span>
                  <Link href={`/compare?slug=${snapshot.slug}`} className="text-xs font-medium text-brand hover:underline">
                    เปิด
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div id="notifications" className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Top 5 แพ็กเกจยอดนิยม</h2>
          <Link href="/packages?sort=updated" className="text-xs font-medium text-brand hover:underline">
            ดูทั้งหมด
          </Link>
        </div>
        {trendingPackages.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">ยังไม่มีข้อมูลสถิติการเข้าชม</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2">แพ็กเกจ</th>
                <th className="py-2 text-right">ราคา</th>
                <th className="py-2 text-right">ยอดดู</th>
                <th className="py-2 text-right">เปรียบเทียบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trendingPackages.map((metric) => (
                <tr key={metric.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2">
                    <Link href={`/packages/${metric.package.id}`} className="font-medium text-slate-900 hover:text-brand dark:text-white">
                      {metric.package.title}
                    </Link>
                    <div className="text-xs text-slate-500">{metric.package.hospital?.name ?? "-"}</div>
                  </td>
                  <td className="py-2 text-right text-slate-600 dark:text-slate-300">฿{metric.package.basePrice.toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-600 dark:text-slate-300">{metric.viewCount}</td>
                  <td className="py-2 text-right text-slate-600 dark:text-slate-300">{metric.compareCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

// User dashboard aggregates bookmarks, recent activity, and shortcuts after sign-in.
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import type { Prisma } from "@prisma/client";
import ThemeToggle from "@/components/ThemeToggle";
import SavedSearchList from "@/components/SavedSearchList";
import EmptyState from "@/components/EmptyState";
import PriceHistoryChart, { type PriceHistoryPoint } from "@/components/PriceHistoryChart";
import RemoveBookmarkButton from "@/components/RemoveBookmarkButton";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { DB_TIMEOUT_MS } from "@/lib/runtime-config";
import { Bookmark, ListChecks } from "lucide-react";
import { getSession, type SessionLike } from "@/lib/session";

export const dynamic = "force-dynamic";

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

type ViewWithPackage = Prisma.PackageViewGetPayload<{
  include: { package: { select: typeof healthPackageSelect } };
}>;

type NotificationSubscriptionWithPackage = Prisma.NotificationSubscriptionGetPayload<{
  include: { package: { select: typeof healthPackageSelect } };
}>;

type PriceTrendSeries = {
  package: BookmarkWithPackage["package"];
  points: PriceHistoryPoint[];
};

type ProfileSummary = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  lastLoginAt: Date | null;
};

const navItems = [
  { id: "overview", label: "ภาพรวม", icon: "🏠" },
  { id: "bookmarks", label: "บุ๊กมาร์ก", icon: "📑" },
  { id: "activity", label: "กิจกรรม", icon: "🕓" },
  { id: "compare-history", label: "เปรียบเทียบ", icon: "🔗" },
  { id: "notifications", label: "แจ้งเตือน", icon: "🔔" },
  { id: "settings", label: "ตั้งค่า", icon: "⚙️" },
];

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

function formatRelative(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true, locale: th });
}

function initialsFrom(name?: string | null, fallback?: string | null) {
  const source = name ?? fallback ?? "";
  const initial = source.trim().slice(0, 1).toUpperCase();
  return initial || "U";
}

function roleLabel(role?: string) {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "EDITOR":
      return "Editor";
    case "USER":
    default:
      return "ผู้ใช้งาน";
  }
}

function renderNotificationMessage(notification: { type: string; payload: Prisma.JsonValue | null }) {
  const payload = (notification.payload ?? {}) as Record<string, unknown>;
  const pkgTitle = typeof payload.packageTitle === "string" ? payload.packageTitle : undefined;
  switch (notification.type) {
    case "PRICE_DROP":
      return pkgTitle ? `ราคาแพ็กเกจ "${pkgTitle}" ลดลง` : "มีแพ็กเกจที่คุณติดตามลดราคา";
    case "PACKAGE_APPROVED":
      return pkgTitle ? `แพ็กเกจ "${pkgTitle}" ได้รับการอนุมัติแล้ว` : "แพ็กเกจของคุณได้รับการอนุมัติ";
    default:
      return typeof payload.message === "string" ? payload.message : "การแจ้งเตือนทั่วไป";
  }
}

function userFromSession(session: SessionLike) {
  if (!session?.user) return undefined;
  const user = session.user as { id?: string; role?: string; name?: string | null; email?: string | null };
  return user;
}

export default async function DashboardPage() {
  const session = await getSession();
  const sessionUser = userFromSession(session);
  const userId = sessionUser?.id;
  if (!userId) {
    redirect("/auth/sign-in?callbackUrl=/dashboard");
  }

  let profile: ProfileSummary | null = null;
  let summary = { bookmarkCount: 0, savedSearchCount: 0, compareCount: 0, notificationsCount: 0 };
  let recentBookmarks: BookmarkWithPackage[] = [];
  let savedSearches = [] as Awaited<ReturnType<typeof prisma.savedSearch.findMany>>;
  let recentSearches = [] as Awaited<ReturnType<typeof prisma.searchLog.findMany>>;
  let compareSnapshots = [] as Awaited<ReturnType<typeof prisma.compareSnapshot.findMany>>;
  let trends: MetricWithPackage[] = [];
  let recentViews: ViewWithPackage[] = [];
  let notifications = [] as Awaited<ReturnType<typeof prisma.notification.findMany>>;
  let notificationSubscriptions: NotificationSubscriptionWithPackage[] = [];
  let priceTrendSeries: PriceTrendSeries[] = [];
  let loadError: Error | null = null;

  try {
    const [profileResult, summaryResult, bookmarksResult, savedSearchResult, recentSearchResult, compareResult, viewsResult, notificationsResult, subscriptionsResult, trendingResult] = await Promise.all([
      withTimeout(
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, role: true, image: true, lastLoginAt: true },
        }),
        null,
        "dashboard.profile"
      ),
      withTimeout(
        (async () => {
          const [bookmarkCount, savedSearchCount, compareCount, notificationsCount] = await Promise.all([
            prisma.bookmark.count({ where: { userId } }),
            prisma.savedSearch.count({ where: { userId } }),
            prisma.compareSnapshot.count({ where: { userId } }),
            prisma.notification.count({ where: { userId, readAt: null } }),
          ]);
          return { bookmarkCount, savedSearchCount, compareCount, notificationsCount };
        })(),
        summary,
        "dashboard.summary"
      ),
      withTimeout(
        prisma.bookmark.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          include: { package: { select: healthPackageSelect } },
          take: 6,
        }),
        [],
        "dashboard.bookmarks"
      ),
      withTimeout(
        prisma.savedSearch.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        [],
        "dashboard.saved-searches"
      ),
      withTimeout(
        prisma.searchLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
        [],
        "dashboard.search-logs"
      ),
      withTimeout(
        prisma.compareSnapshot.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        [],
        "dashboard.compare-snapshots"
      ),
      withTimeout(
        prisma.packageView.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          include: { package: { select: healthPackageSelect } },
          take: 6,
        }),
        [],
        "dashboard.recent-views"
      ),
      withTimeout(
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
        [],
        "dashboard.notifications"
      ),
      withTimeout(
        prisma.notificationSubscription.findMany({
          where: { userId },
          include: {
            package: { select: healthPackageSelect },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        }) as Promise<NotificationSubscriptionWithPackage[]>,
        [] as NotificationSubscriptionWithPackage[],
        "dashboard.notification-subscriptions"
      ),
      withTimeout(
        prisma.packageMetric.findMany({
          orderBy: { viewCount: "desc" },
          include: { package: { select: healthPackageSelect } },
          take: 5,
        }),
        [],
        "dashboard.trending"
      ),
    ]);

    profile = profileResult;
    summary = summaryResult;
    recentBookmarks = bookmarksResult;
    savedSearches = savedSearchResult;
    recentSearches = recentSearchResult;
    compareSnapshots = compareResult;
    recentViews = viewsResult;
    notifications = notificationsResult;
    notificationSubscriptions = subscriptionsResult;
    trends = trendingResult;

    const bookmarkTargets = recentBookmarks
      .map((bookmark) => bookmark.package)
      .filter((pkg): pkg is BookmarkWithPackage["package"] => Boolean(pkg))
      .slice(0, 3);

    const targetIds = Array.from(new Set(bookmarkTargets.map((pkg) => pkg.id))).slice(0, 3);
    if (targetIds.length > 0) {
      const historyResult = await withTimeout(
        prisma.priceHistory.findMany({
          where: { packageId: { in: targetIds } },
          orderBy: { recordedAt: "asc" },
          take: 30,
        }),
        [],
        "dashboard.price-history"
      );

      priceTrendSeries = bookmarkTargets
        .map((pkg) => ({
          package: pkg,
          points: historyResult
            .filter((history) => history.packageId === pkg.id)
            .map<PriceHistoryPoint>((history) => ({
              recordedAt: history.recordedAt.toISOString(),
              price: history.price,
            })),
        }))
        .filter((series) => series.points.length > 1);
    }
  } catch (error) {
    loadError = error instanceof Error ? error : new Error(String(error));
    logger.error("dashboard.page.query_failed", { error: `${error}` });
  }

  const tiles = [
    { label: "แพ็กเกจที่บันทึกไว้", value: summary.bookmarkCount, href: "#bookmarks" },
    { label: "Saved searches", value: summary.savedSearchCount, href: "#activity" },
    { label: "ลิงก์เปรียบเทียบ", value: summary.compareCount, href: "#compare-history" },
    { label: "การแจ้งเตือน", value: summary.notificationsCount, href: "#notifications" },
  ];

  const bookmarkGroups = recentBookmarks.reduce<Map<string, BookmarkWithPackage[]>>((acc, bookmark) => {
    const hospitalName = bookmark.package?.hospital?.name ?? "ไม่ระบุโรงพยาบาล";
    const key = hospitalName.trim().length ? hospitalName : "ไม่ระบุโรงพยาบาล";
    const current = acc.get(key) ?? [];
    current.push(bookmark);
    acc.set(key, current);
    return acc;
  }, new Map());
  const groupedBookmarkEntries = Array.from(bookmarkGroups.entries()).sort(([a], [b]) => a.localeCompare(b));

  const profileName = profile?.name ?? sessionUser?.name ?? "ผู้ใช้ใหม่";
  const profileEmail = profile?.email ?? sessionUser?.email ?? "";
  const profileRole = roleLabel(profile?.role ?? sessionUser?.role);
  const lastLoginText = profile?.lastLoginAt ? formatRelative(profile.lastLoginAt) : "—";
  const notificationPreferences = {
    priceDrop: notificationSubscriptions.some((sub) => sub.type === "PRICE_DROP"),
    packageApproved: notificationSubscriptions.some((sub) => sub.type === "PACKAGE_APPROVED"),
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 pb-12 pt-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:hidden">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span aria-hidden className="mr-1">
              {item.icon}
            </span>
            {item.label}
          </a>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[260px,1fr] lg:grid-cols-[300px,1fr]">
        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {profile?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.image} alt="avatar" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <span aria-hidden>{initialsFrom(profileName, profileEmail)}</span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{profileName}</h2>
                {profileEmail ? <p className="text-sm text-slate-500 dark:text-slate-300">{profileEmail}</p> : null}
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {profileRole}
                </div>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <dt>เข้าใช้งานครั้งล่าสุด</dt>
                <dd className="text-slate-600 dark:text-slate-200">{lastLoginText}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>แจ้งเตือนที่ยังไม่อ่าน</dt>
                <dd className="text-slate-600 dark:text-slate-200">{summary.notificationsCount}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/settings/profile"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                แก้ไขโปรไฟล์
              </Link>
              <Link
                href="/auth/reset"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                เปลี่ยนรหัสผ่าน
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Quick actions</h3>
            <div className="mt-3 space-y-2">
              {(profile?.role === "ADMIN" || sessionUser?.role === "ADMIN") ? (
                <Link
                  href="/admin/packages/new"
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>เพิ่มแพ็กเกจใหม่</span>
                  <span aria-hidden>＋</span>
                </Link>
              ) : null}
              <Link
                href="/compare"
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span>เปรียบเทียบล่าสุด</span>
                <span aria-hidden>↗</span>
              </Link>
              <Link
                href="/bookmarks"
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span>จัดการบุ๊กมาร์ก</span>
                <span aria-hidden>★</span>
              </Link>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-left text-sm text-slate-400 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-75 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-800"
                disabled
              >
                <span>ดาวน์โหลดข้อมูล (เร็ว ๆ นี้)</span>
                <span aria-hidden>⬇</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-rose-200 px-4 py-2 text-left text-sm text-rose-500 transition hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                disabled
              >
                <span>ลบบัญชี</span>
                <span aria-hidden>🗑</span>
              </button>
            </div>
          </div>

          <nav className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:block">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">เมนู</h3>
            <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">การแจ้งเตือนที่ติดตาม</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>ราคาแพ็กเกจ</span>
                <input type="checkbox" checked={notificationPreferences.priceDrop} readOnly className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
              </div>
              <div className="flex items-center justify-between">
                <span>การอนุมัติแพ็กเกจ</span>
                <input type="checkbox" checked={notificationPreferences.packageApproved} readOnly className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
              </div>
            </div>
            {notificationSubscriptions.length > 0 ? (
              <ul className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                {notificationSubscriptions.map((sub) => (
                  <li key={sub.id} className="rounded border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <div className="font-medium text-slate-700 dark:text-slate-200">{sub.package?.title ?? "การแจ้งเตือนทั่วไป"}</div>
                    <div>{sub.package?.hospital?.name ?? "ระบบ"}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">ยังไม่มีการตั้งแจ้งเตือนแบบเฉพาะเจาะจง</p>
            )}
          </div>
        </aside>

        <div className="space-y-12">
          <section id="overview" className="space-y-4">
            <header className="space-y-1">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">แดชบอร์ดของฉัน</h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">ติดตามแพ็กเกจที่สนใจ กิจกรรมล่าสุด และตั้งค่าการแจ้งเตือนของคุณได้จากที่นี่</p>
            </header>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {tiles.map((tile) => (
                <Link
                  key={tile.label}
                  href={tile.href}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{tile.label}</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{tile.value}</div>
                </Link>
              ))}
            </div>
            {loadError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-100">
                ไม่สามารถเชื่อมต่อฐานข้อมูลได้ ข้อมูลบนแดชบอร์ดนี้จะแสดงเป็นค่าว่างจนกว่าจะเชื่อมต่อสำเร็จ
              </div>
            ) : null}
          </section>

          <section id="bookmarks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">แพ็กเกจที่บันทึกไว้</h2>
              <Link href="/bookmarks" className="text-sm font-medium text-brand hover:underline">
                ไปที่หน้าบุ๊กมาร์ก
              </Link>
            </div>
            {recentBookmarks.length === 0 ? (
              <EmptyState
                title="ยังไม่มีบุ๊กมาร์ก"
                hint="เริ่มสำรวจแพ็กเกจและกดบันทึกเพื่อเรียกดูได้จากที่นี่"
                icon={<Bookmark className="h-6 w-6" aria-hidden />}
              />
            ) : (
              <div className="space-y-4">
                {groupedBookmarkEntries.map(([hospital, items]) => (
                  <div key={hospital} className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{hospital}</h3>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{items.length} รายการ</span>
                    </div>
                    <ul className="space-y-3">
                      {items.map((bookmark) => (
                        <li key={bookmark.id} className="rounded-xl border border-slate-100 px-3 py-3 dark:border-slate-800">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <Link
                                href={`/packages/${bookmark.package.id}`}
                                className="font-medium text-slate-900 hover:text-brand dark:text-white"
                              >
                                {bookmark.package.title}
                              </Link>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                ฿{bookmark.package.basePrice.toLocaleString()} • บันทึก {formatRelative(bookmark.createdAt)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:justify-end">
                              <Link
                                href={`/compare?add=${bookmark.package.id}`}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                เพิ่มไปยัง Compare
                              </Link>
                              <Link
                                href={`/packages/${bookmark.package.id}`}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                ดูรายละเอียด
                              </Link>
                              <RemoveBookmarkButton bookmarkId={bookmark.id} />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {priceTrendSeries.length > 0 && (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">แนวโน้มราคาของแพ็กเกจที่คุณติดตาม</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">แสดงสูงสุด {priceTrendSeries.length} แพ็กเกจ</span>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {priceTrendSeries.map((series) => (
                    <div key={series.package.id} className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/packages/${series.package.id}`}
                            className="text-sm font-semibold text-slate-900 hover:text-brand dark:text-white"
                          >
                            {series.package.title}
                          </Link>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{series.package.hospital?.name ?? "-"}</div>
                        </div>
                        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            ฿{series.package.basePrice.toLocaleString()}
                          </div>
                          <div>ราคาอัปเดตล่าสุด</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <PriceHistoryChart data={series.points.slice(-10)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section id="activity" className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">การค้นหาและดูล่าสุด</h2>
                <Link href="/packages" className="text-sm font-medium text-brand hover:underline">
                  ค้นหาแพ็กเกจเพิ่มเติม
                </Link>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">การค้นหาล่าสุด</h3>
                  {recentSearches.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">ยังไม่มีประวัติการค้นหา</p>
                  ) : (
                    <ul className="mt-3 space-y-3 text-sm">
                      {recentSearches.map((log) => (
                        <li key={log.id} className="rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wide text-slate-400">ผลลัพธ์ {log.results}</span>
                            <span className="text-[11px] text-slate-400">{formatRelative(log.createdAt)}</span>
                          </div>
                          <pre className="mt-1 max-h-24 overflow-x-auto rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                            {JSON.stringify(log.filters, null, 0)}
                          </pre>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Saved searches</h3>
                  {savedSearches.length === 0 ? (
                    <EmptyState
                    title="ยังไม่มีการบันทึกการค้นหา"
                    hint="เลือกตัวกรองแล้วกดปุ่มบันทึกบนหน้าค้นหาเพื่อแสดงที่นี่"
                    icon={<ListChecks className="h-6 w-6" aria-hidden />}
                  />
                  ) : (
                    <div className="mt-3">
                      <SavedSearchList items={savedSearches} />
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">แพ็กเกจที่ดูล่าสุด</h3>
                  {recentViews.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">ยังไม่มีการเปิดดูแพ็กเกจ</p>
                  ) : (
                    <ul className="mt-3 space-y-3 text-sm">
                      {recentViews.map((entry) => (
                        <li key={entry.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800">
                          <div>
                            <Link href={`/packages/${entry.package.id}`} className="font-medium text-slate-900 hover:text-brand dark:text-white">
                              {entry.package.title}
                            </Link>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{entry.package.hospital?.name ?? "-"}</div>
                          </div>
                          <span className="text-[11px] text-slate-400">{formatRelative(entry.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section id="compare-history" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">เปรียบเทียบที่เคยสร้าง</h2>
              <Link href="/compare" className="text-sm font-medium text-brand hover:underline">
                เริ่มเปรียบเทียบใหม่
              </Link>
            </div>
            {compareSnapshots.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-300">ยังไม่มีลิงก์เปรียบเทียบที่บันทึกไว้</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {compareSnapshots.map((snapshot) => (
                  <li key={snapshot.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex-1 truncate text-slate-600 dark:text-slate-300">{snapshot.packageIds.join(", ")}</div>
                    <div className="flex items-center gap-2">
                      <Link href={`/compare?slug=${snapshot.slug}`} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        เปิดลิงก์
                      </Link>
                      <span className="text-[11px] text-slate-400">{formatRelative(snapshot.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="notifications" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">การแจ้งเตือนล่าสุด</h2>
                  <Link href="/notifications" className="text-sm font-medium text-brand hover:underline">
                    ดูทั้งหมด
                  </Link>
                </div>
                {notifications.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">ยังไม่มีการแจ้งเตือนใหม่</p>
                ) : (
                  <ul className="mt-3 space-y-3 text-sm">
                    {notifications.map((notification) => (
                      <li key={notification.id} className="rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{notification.type.replace(/_/g, " ")}</span>
                          <span>{formatRelative(notification.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-slate-700 dark:text-slate-200">{renderNotificationMessage(notification)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Top 5 แพ็กเกจยอดนิยม</h2>
                  <Link href="/packages?sort=updated" className="text-sm font-medium text-brand hover:underline">
                    ดูทั้งหมด
                  </Link>
                </div>
                {trends.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">ยังไม่มีข้อมูลสถิติการเข้าชม</p>
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
                      {trends.map((metric) => (
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
            </div>
          </section>

          <section id="settings" className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">การตั้งค่า</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">โหมดแสดงผล</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">สลับโหมดสว่าง/มืดได้ทุกที่ในเว็บไซต์</p>
                </div>
                <ThemeToggle />
              </div>

              <div className="grid gap-3 py-4 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
                <Link
                  href="/auth/forgot-password"
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <span>รีเซ็ตรหัสผ่าน</span>
                  <span aria-hidden>↗</span>
                </Link>
                <Link
                  href="/notifications"
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <span>ตั้งค่าการแจ้งเตือน</span>
                  <span aria-hidden>🔔</span>
                </Link>
                <button
                  type="button"
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:hover:bg-slate-800"
                  disabled
                >
                  <span>ดาวน์โหลดข้อมูล (JSON)</span>
                  <span aria-hidden>⬇</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-between rounded-xl border border-rose-200 px-4 py-3 text-left text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  disabled
                >
                  <span>ลบบัญชีผู้ใช้</span>
                  <span aria-hidden>🗑</span>
                </button>
              </div>

              <form action="/api/auth/signout" method="post" className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="submit"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  ออกจากระบบ
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

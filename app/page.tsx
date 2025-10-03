// Landing page for HealthCheck CM Price showing highlights, quick filters, and top packages.
import Link from "next/link";
import {
  Search,
  Sparkles,
  Shield,
  Star,
  HeartPulse,
  LayoutDashboard,
  ClipboardList,
  ShoppingCart,
  Bookmark,
  Clock,
  Package,
  Building2,
  Info,
} from "lucide-react";
import { getTopFallbackPackages, getFallbackHospitalSummaries } from "@/lib/fallback-data";
import { getInsuranceBundles } from "@/lib/insurance-data";
import { ADMIN_TIMEOUT_MS, DB_TIMEOUT_MS } from "@/lib/runtime-config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import EmptyState from "@/components/EmptyState";
import { getSession } from "@/lib/session";

export const revalidate = 300;

const currency = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

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

const quickFilters = [
  { label: "ราคาต่ำกว่า 3,000", href: "/packages?maxPrice=3000", emoji: "💸" },
  { label: "สำหรับผู้หญิง", href: "/packages?gender=female", emoji: "👩" },
  { label: "สำหรับผู้ชาย", href: "/packages?gender=male", emoji: "👨" },
  { label: "Executive Checkup", href: "/packages?category=executive", emoji: "🏆" },
  { label: "ตรวจสุขภาพผู้สูงอายุ", href: "/packages?category=senior", emoji: "👵" },
];

const featureHighlights = [
  {
    title: "ค้นหาง่าย ครอบคลุม",
    description: "รวบรวมแพ็กเกจจากโรงพยาบาลในเชียงใหม่กว่า 20 แห่ง พร้อมฟิลเตอร์ที่ละเอียด",
    icon: <Search className="h-5 w-5" aria-hidden />,
  },
  {
    title: "อัปเดตราคาเสมอ",
    description: "เห็นราคาล่าสุด รายการตรวจ และหมายเหตุพิเศษแบบเรียลไทม์",
    icon: <Sparkles className="h-5 w-5" aria-hidden />,
  },
  {
    title: "กราฟแนวโน้มราคา",
    description: "เปรียบเทียบราคาในอดีตพร้อมข้อมูลสถิติความนิยม",
    icon: <Star className="h-5 w-5" aria-hidden />,
  },
  {
    title: "ซื้อประกันได้ในที่เดียว",
    description: "เลือกแพ็กเกจพร้อมประกันสุขภาพหรืออุบัติเหตุจากพันธมิตรของเรา",
    icon: <Shield className="h-5 w-5" aria-hidden />,
  },
];

const insuranceBundles = getInsuranceBundles();

type AdminSummary = {
  pendingDrafts: number;
  approved: number;
  totalActiveCarts: number;
  latestInterest: {
    packageId: string;
    packageSlug: string;
    packageTitle: string;
    hospitalName: string;
    quantity: number;
    amount: number;
    userName: string;
    addedAt: Date;
  } | null;
};

const ADMIN_SUMMARY_FALLBACK: AdminSummary = {
  pendingDrafts: 0,
  approved: 0,
  totalActiveCarts: 0,
  latestInterest: null,
};

async function loadAdminSummary(): Promise<AdminSummary> {
  try {
    const [draft, approved, carts, latestItems] = await prisma.$transaction([
      prisma.healthPackage.count({ where: { status: "DRAFT" } }),
      prisma.healthPackage.count({ where: { status: "APPROVED" } }),
      prisma.cart.count(),
      prisma.cartItem.findMany({
        orderBy: { addedAt: "desc" },
        select: {
          addedAt: true,
          quantity: true,
          package: {
            select: {
              id: true,
              slug: true,
              title: true,
              basePrice: true,
              hospital: { select: { name: true } },
            },
          },
          cart: {
            select: {
              user: { select: { name: true, email: true } },
            },
          },
        },
        take: 8,
      }),
    ]);

    const latestItem = latestItems?.[0] ?? null;
    const latestInterest = latestItem
      ? {
          packageId: latestItem.package?.id ?? latestItem.package?.slug ?? "",
          packageSlug: latestItem.package?.slug ?? latestItem.package?.id ?? "",
          packageTitle: latestItem.package?.title ?? "ไม่ระบุชื่อแพ็กเกจ",
          hospitalName: latestItem.package?.hospital?.name ?? "ไม่ระบุโรงพยาบาล",
          quantity: latestItem.quantity,
          amount: (latestItem.package?.basePrice ?? 0) * latestItem.quantity,
          userName: latestItem.cart?.user?.name ?? latestItem.cart?.user?.email ?? "ผู้ใช้ไม่ระบุชื่อ",
          addedAt: latestItem.addedAt,
        }
      : null;

    return {
      pendingDrafts: draft,
      approved,
      totalActiveCarts: carts,
      latestInterest,
    } satisfies AdminSummary;
  } catch (error) {
    logger.warn("homepage.admin-summary.failed", { error: `${error}` });
    return ADMIN_SUMMARY_FALLBACK;
  }
}

type UserSummary = {
  totalItems: number;
  totalAmount: number;
  bookmarkCount: number;
  lastUpdated: Date | null;
  recentItems: Array<{
    id: string;
    slug: string;
    title: string;
    hospitalName: string;
    quantity: number;
    price: number;
  }>;
};

const USER_SUMMARY_FALLBACK: UserSummary = {
  totalItems: 0,
  totalAmount: 0,
  bookmarkCount: 0,
  lastUpdated: null,
  recentItems: [],
};

async function loadUserSummary(userId: string): Promise<UserSummary> {
  const [cart, bookmarkCount] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId },
      select: {
        updatedAt: true,
        items: {
          orderBy: { addedAt: "desc" },
          select: {
            quantity: true,
            package: {
              select: {
                id: true,
                slug: true,
                title: true,
                basePrice: true,
                hospital: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.bookmark.count({ where: { userId } }),
  ]);

  const items = cart?.items ?? [];
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * (item.package?.basePrice ?? 0), 0);
  const recentItems = items.slice(0, 3).map((item, index) => {
    const pkg = item.package;
    const fallbackId = `cart-${index}`;
    return {
      id: pkg?.id ?? pkg?.slug ?? fallbackId,
      slug: pkg?.slug ?? pkg?.id ?? fallbackId,
      title: pkg?.title ?? "ไม่ระบุชื่อแพ็กเกจ",
      hospitalName: pkg?.hospital?.name ?? "ไม่ระบุโรงพยาบาล",
      quantity: item.quantity,
      price: pkg?.basePrice ?? 0,
    };
  });

  return {
    totalItems,
    totalAmount,
    bookmarkCount,
    lastUpdated: cart?.updatedAt ?? null,
    recentItems,
  } satisfies UserSummary;
}

function HeroSearch() {
  return (
    <form action="/packages" className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-brand dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-4 w-4 text-slate-400" aria-hidden />
        <input
          name="q"
          placeholder="ค้นหาแพ็กเกจหรือโรงพยาบาล..."
          className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-200"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-white shadow transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
      >
        เริ่มค้นหา
      </button>
    </form>
  );
}

export default async function HomePage() {
  const session = await getSession();
  const sessionUser = (session?.user ?? null) as { id?: string; role?: string; name?: string | null; email?: string | null } | null;
  const userId = typeof sessionUser?.id === "string" ? sessionUser.id : null;
  const userRole = typeof sessionUser?.role === "string" ? sessionUser.role : null;
  const isAdmin = userRole === "ADMIN" || userRole === "EDITOR";
  const isAuthenticated = Boolean(userId);

  const shouldLoadConsumerData = !isAdmin;

  const topPackagesPromise = shouldLoadConsumerData
    ? withTimeout(
        prisma.healthPackage.findMany({
          where: { status: "APPROVED" },
          include: {
            hospital: { select: { name: true, logoUrl: true } },
            metrics: true,
          },
          orderBy: [{ metrics: { viewCount: "desc" } }, { updatedAt: "desc" }],
          take: 6,
        }),
        [],
        "homepage.top-packages"
      )
    : Promise.resolve([]);

  const hospitalsPromise = shouldLoadConsumerData
    ? withTimeout(
        prisma.hospital.findMany({
          include: { _count: { select: { packages: true } } },
          orderBy: { packages: { _count: "desc" } },
          take: 6,
        }),
        [],
        "homepage.hospitals"
      )
    : Promise.resolve([]);

  const adminSummaryPromise = isAdmin
    ? withTimeout(loadAdminSummary(), ADMIN_SUMMARY_FALLBACK, "homepage.admin-summary", ADMIN_TIMEOUT_MS)
    : Promise.resolve<AdminSummary | null>(null);

  const userSummaryPromise = userId && !isAdmin
    ? withTimeout(loadUserSummary(userId), USER_SUMMARY_FALLBACK, "homepage.user-summary")
    : Promise.resolve<UserSummary | null>(null);

  const [topPackages, hospitals, adminSummary, userSummary] = await Promise.all([
    topPackagesPromise,
    hospitalsPromise,
    adminSummaryPromise,
    userSummaryPromise,
  ]);

  type FeaturedPackage = {
    id: string;
    slug: string;
    title: string;
    basePrice: number;
    updatedAt: Date;
    hospital: { name: string; logoUrl: string | null } | null;
    metrics: { viewCount?: number | null } | null;
  };

  type HighlightHospital = {
    id: string;
    name: string;
    logoUrl: string | null;
    district: string | null;
    packageCount: number;
  };

  const fetchedTopPackages: FeaturedPackage[] = shouldLoadConsumerData
    ? topPackages.map((pkg) => ({
        id: pkg.id,
        slug: pkg.slug,
        title: pkg.title,
        basePrice: pkg.basePrice,
        updatedAt: pkg.updatedAt,
        hospital: pkg.hospital ? { name: pkg.hospital.name, logoUrl: pkg.hospital.logoUrl ?? null } : null,
        metrics: pkg.metrics ? { viewCount: pkg.metrics.viewCount } : null,
      }))
    : [];

  const fetchedHospitals: HighlightHospital[] = shouldLoadConsumerData
    ? hospitals.map((hospital) => ({
        id: hospital.id,
        name: hospital.name,
        logoUrl: hospital.logoUrl ?? null,
        district: hospital.district ?? null,
        packageCount: hospital._count?.packages ?? 0,
      }))
    : [];

  let resolvedTopPackages = fetchedTopPackages;
  let resolvedHospitals = fetchedHospitals;
  let fallbackPackagesUsed = false;
  let fallbackHospitalsUsed = false;

  if (shouldLoadConsumerData && resolvedTopPackages.length === 0) {
    resolvedTopPackages = getTopFallbackPackages().map((pkg) => ({
      id: pkg.id,
      slug: pkg.slug,
      title: pkg.title,
      basePrice: pkg.basePrice,
      updatedAt: pkg.updatedAt,
      hospital: { name: pkg.hospitalName, logoUrl: pkg.hospitalLogoUrl },
      metrics: { viewCount: pkg.metrics.viewCount },
    }));
    fallbackPackagesUsed = resolvedTopPackages.length > 0;
  }

  if (shouldLoadConsumerData && resolvedHospitals.length === 0) {
    resolvedHospitals = getFallbackHospitalSummaries().map((hospital) => ({
      id: hospital.id,
      name: hospital.name,
      logoUrl: hospital.logoUrl,
      district: hospital.district,
      packageCount: hospital.packageCount,
    }));
    fallbackHospitalsUsed = resolvedHospitals.length > 0;
  }

  const hasPackages = resolvedTopPackages.length > 0;
  const hasHospitals = resolvedHospitals.length > 0;
  const persona = isAdmin ? "admin" : isAuthenticated ? "user" : "guest";
  const resolvedAdminSummary = isAdmin ? adminSummary ?? ADMIN_SUMMARY_FALLBACK : null;
  const resolvedUserSummary = persona === "user" ? userSummary ?? USER_SUMMARY_FALLBACK : null;
  const userLastUpdatedLabel = resolvedUserSummary?.lastUpdated
    ? resolvedUserSummary.lastUpdated.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
    : "ยังไม่มีรายการ";
  const latestInterest = resolvedAdminSummary?.latestInterest ?? null;
  const latestInterestLabel = latestInterest
    ? latestInterest.addedAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
    : "-";
  const userDisplayName = sessionUser?.name ?? sessionUser?.email ?? "คุณ";
  const shouldShowConsumerSections = persona !== "admin";
  const usingFallbackData = shouldShowConsumerSections && (fallbackPackagesUsed || fallbackHospitalsUsed);

  return (
    <main className="mx-auto max-w-6xl space-y-16 px-4 pb-16 pt-12">
      <section className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-300">
          <HeartPulse className="h-3.5 w-3.5" aria-hidden />
          <span>ตรวจสุขภาพ + ประกันครบในที่เดียว</span>
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          เปรียบเทียบแพ็กเกจตรวจสุขภาพในเชียงใหม่ได้ง่าย ๆ
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          ค้นหาราคา รายการตรวจ และโปรโมชันล่าสุด พร้อมเลือกประกันสุขภาพ/อุบัติเหตุที่เหมาะกับคุณ
        </p>
        <div className="mt-8">
          <HeroSearch />
        </div>
        <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          หรือ <Link href="/packages" className="font-medium text-brand hover:underline">ดูแพ็กเกจทั้งหมด</Link> / <Link href="/insurance" className="font-medium text-brand hover:underline">เปรียบเทียบประกันสุขภาพ</Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {persona === "admin"
                ? "ภาพรวมสำหรับผู้ดูแลระบบ"
                : persona === "user"
                ? `ยินดีต้อนรับกลับ ${userDisplayName}`
                : "เริ่มต้นใช้งานเร็วขึ้น"}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {persona === "admin"
                ? "ติดตามสถานะโปรโมชัน แพ็กเกจ และความสนใจจากผู้ใช้แบบเรียลไทม์"
                : persona === "user"
                ? "สรุปโปรโมชันและแพ็กเกจที่คุณบันทึกไว้เพื่อเตรียมขอใบเสนอราคา"
                : "สมัครบัญชีฟรีเพื่อบันทึกแพ็กเกจ รับแจ้งเตือนโปรโมชัน และเปรียบเทียบได้ไว"}
            </p>
          </div>
          {persona === "admin" ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="interactive-button inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                เปิดแดชบอร์ดแอดมิน
              </Link>
              <Link
                href="/admin/cart"
                className="inline-flex items-center justify-center rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
              >
                ดูตะกร้าผู้ใช้
              </Link>
            </div>
          ) : persona === "user" ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/cart"
                className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                ดูตะกร้าของฉัน
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
              >
                ไปที่แดชบอร์ด
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                เข้าสู่ระบบ / สมัครฟรี
              </Link>
              <Link
                href="/packages"
                className="inline-flex items-center justify-center rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
              >
                สำรวจแพ็กเกจยอดนิยม
              </Link>
            </div>
          )}
        </div>

        {persona === "admin" && resolvedAdminSummary ? (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
                <span className="rounded-full bg-brand/10 p-2 text-brand dark:bg-brand/20">
                  <LayoutDashboard className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">แพ็กเกจรออนุมัติ</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{resolvedAdminSummary.pendingDrafts}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">จัดการก่อนโปรโมชันหมดอายุ</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
                <span className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
                  <ClipboardList className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">แพ็กเกจเผยแพร่แล้ว</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{resolvedAdminSummary.approved}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ทบทวนคำอธิบายและราคาให้ครบ</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
                <span className="rounded-full bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-200">
                  <ShoppingCart className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">ผู้ใช้ที่มีตะกร้า</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{resolvedAdminSummary.totalActiveCarts}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">เตรียมติดตามเพื่อปิดการขาย</p>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-gradient-to-r from-brand/10 via-white to-transparent p-4 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:from-brand/20 dark:text-slate-200">
              {latestInterest ? (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-brand">ตะกร้าล่าสุด</div>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {latestInterest.userName} เพิ่ม {latestInterest.packageTitle} จำนวน {latestInterest.quantity} รายการ ({currency.format(latestInterest.amount)})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {latestInterest.hospitalName} · อัปเดต {latestInterestLabel}
                    </p>
                  </div>
                  <Link
                    href={`/packages/${latestInterest.packageSlug}`}
                    className="inline-flex items-center justify-center rounded-full border border-brand px-4 py-2 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
                  >
                    เปิดโปรไฟล์แพ็กเกจ
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">ยังไม่มีผู้ใช้เพิ่มแพ็กเกจในช่วงนี้ ลองส่งอีเมลแนะนำโปรโมชันใหม่ ๆ</p>
              )}
            </div>
          </>
        ) : persona === "user" && resolvedUserSummary ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr,1fr]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
                  <span className="rounded-full bg-brand/10 p-2 text-brand dark:bg-brand/20">
                    <ShoppingCart className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">รายการในตะกร้า</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{resolvedUserSummary.totalItems}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">พร้อมส่งขอใบเสนอราคา</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
                  <span className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
                    <Sparkles className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">งบประมาณประมาณการ</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{currency.format(resolvedUserSummary.totalAmount)}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">รวมทุกโปรโมชันในตะกร้า</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
                  <span className="rounded-full bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-200">
                    <Bookmark className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">แพ็กเกจที่บันทึกไว้</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{resolvedUserSummary.bookmarkCount}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">ไว้เทียบโปรโมชันทีหลัง</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
                  <span className="rounded-full bg-slate-200 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Clock className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">อัปเดตล่าสุด</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{userLastUpdatedLabel}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">เวลาที่คุณแก้ไขตะกร้า</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">แพ็กเกจล่าสุดในตะกร้า</h3>
                {resolvedUserSummary.recentItems.length ? (
                  <ul className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    {resolvedUserSummary.recentItems.map((item, index) => {
                      const amount = currency.format(item.price * item.quantity);
                      return (
                        <li key={`${item.id}-${index}`} className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-none last:pb-0 dark:border-slate-800">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <Link
                                href={`/packages/${item.slug}`}
                                className="font-medium text-slate-900 transition hover:text-brand dark:text-white dark:hover:text-brand"
                              >
                                {item.title}
                              </Link>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{item.hospitalName}</div>
                            </div>
                            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                              <div>จำนวน {item.quantity}</div>
                              <div className="font-semibold text-slate-900 dark:text-white">{amount}</div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">ยังไม่มีแพ็กเกจในตะกร้าเริ่มต้นค้นหาและบันทึกได้เลย</p>
                )}
              </div>
            </div>

            <aside className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-gradient-to-b from-brand/10 via-white to-transparent p-4 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:from-brand/20 dark:text-slate-200">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand dark:text-brand/80">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  โปรโมชันที่ห้ามพลาด
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  ใช้ฟิลเตอร์ “อัปเดตใหม่” และ “ลดราคา” เพื่อดูแพ็กเกจที่เพิ่งปรับโปรโมชันโดยเฉพาะสำหรับคุณ
                </p>
                <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-300">
                  <li>• บันทึกแพ็กเกจเพื่อรับการแจ้งเตือนเมื่อลดราคา</li>
                  <li>• แชร์ลิงก์เปรียบเทียบให้ครอบครัวตัดสินใจร่วมกัน</li>
                  <li>• กด “ส่งคำขอใบเสนอราคา” แล้วทีมงานจะติดต่อกลับภายใน 1 วันทำการ</li>
                </ul>
              </div>
              <Link
                href="/packages?sort=updated"
                className="mt-4 inline-flex items-center justify-center rounded-full border border-brand px-4 py-2 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
              >
                ดูแพ็กเกจที่เพิ่งอัปเดต
              </Link>
            </aside>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/60">
              <span className="rounded-full bg-brand/10 p-2 text-brand dark:bg-brand/20">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">รู้โปรโมชันก่อนใคร</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">สมัครบัญชีเพื่อรับการแจ้งเตือนเมื่อแพ็กเกจที่สนใจลดราคา</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/60">
              <span className="rounded-full bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-200">
                <Bookmark className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">บันทึกและเปรียบเทียบง่าย</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">เก็บแพ็กเกจเข้าบุ๊กมาร์กแล้วเปรียบเทียบราคา รายการตรวจ และโปรโมชั่นในคลิกเดียว</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/60">
              <span className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
                <ShoppingCart className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">ตะกร้ารวมทุกสิ่ง</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">รวบรวมแพ็กเกจที่สนใจ แล้วยื่นคำขอใบเสนอราคาพร้อมรายละเอียดโปรโมชั่นให้โรงพยาบาลติดต่อกลับ</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {shouldShowConsumerSections && (
        <>
          {usingFallbackData && (
            <div className="flex items-start gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm dark:border-amber-500/50 dark:bg-amber-900/20 dark:text-amber-100">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                กำลังแสดงข้อมูลตัวอย่างบางส่วนแทนข้อมูลจริงระหว่างรอการเชื่อมต่อฐานข้อมูล เพื่อให้คุณสำรวจหน้าร้านได้ต่อเนื่อง
              </p>
            </div>
          )}

          <section aria-labelledby="quick-filters" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="quick-filters" className="text-lg font-semibold text-slate-900 dark:text-white">ค้นหาเร็วตามหมวดที่ได้รับความนิยม</h2>
          <Link href="/packages" className="text-sm font-medium text-brand hover:underline">
            ดูทั้งหมด
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Link
              key={filter.href}
              href={filter.href}
              className="interactive-chip inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <span aria-hidden>{filter.emoji}</span>
              {filter.label}
            </Link>
          ))}
        </div>
          </section>

          <section aria-labelledby="top-packages" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 id="top-packages" className="text-lg font-semibold text-slate-900 dark:text-white">แพ็กเกจยอดนิยม</h2>
          <Link href="/packages?sort=updated" className="text-sm font-medium text-brand hover:underline">
            ดูแพ็กเกจทั้งหมด
          </Link>
        </div>
        {hasPackages ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resolvedTopPackages.map((pkg) => (
              <article key={pkg.id} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{pkg.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{pkg.hospital?.name ?? "ไม่ระบุโรงพยาบาล"}</p>
                  </div>
                  {pkg.metrics?.viewCount ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                      ⭐ ยอดดู {pkg.metrics.viewCount}
                    </span>
                  ) : null}
                </div>
                <dl className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <dt>ราคาเริ่มต้น</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">{currency.format(pkg.basePrice)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>อัปเดตล่าสุด</dt>
                    <dd>{pkg.updatedAt.toLocaleDateString("th-TH")}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Link
                    href={`/packages/${pkg.slug}`}
                    className="interactive-button inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    ดูรายละเอียด
                  </Link>
                  <Link
                    href={`/compare?add=${pkg.id}`}
                    className="interactive-button inline-flex items-center justify-center rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand hover:text-white"
                  >
                    เปรียบเทียบ
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="ยังไม่มีข้อมูลแพ็กเกจ"
            hint="กำลังรอข้อมูลล่าสุดจากโรงพยาบาล"
            icon={<Package className="h-6 w-6" aria-hidden />}
          />
        )}
          </section>

          <section aria-labelledby="insurance-section" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 id="insurance-section" className="text-lg font-semibold text-slate-900 dark:text-white">แพ็กเกจ + ประกันสุขภาพ / อุบัติเหตุ</h2>
          <Link href="/insurance" className="text-sm font-medium text-brand hover:underline">
            ดูรายละเอียดทั้งหมด
          </Link>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          เลือกแพ็กเกจตรวจสุขภาพพร้อมประกันที่เหมาะกับคุณในงบเดียว ติดต่อเจ้าหน้าที่เพื่อขอใบเสนอราคาได้ฟรี
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {insuranceBundles.map((bundle) => (
            <article key={bundle.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{bundle.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">พันธมิตร: {bundle.partner}</p>
                </div>
                <Shield className="h-5 w-5 text-brand" aria-hidden />
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{bundle.coverage}</p>
              <div className="mt-4 text-sm font-semibold text-brand">เริ่มต้น {currency.format(bundle.price)}/เดือน</div>
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">{bundle.highlight}</p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">เหมาะสำหรับ: {bundle.idealFor}</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                {bundle.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <span aria-hidden>•</span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                เจ้าหน้าที่ติดต่อกลับภายใน {bundle.responseTimeHours} ชม.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm">
                <Link
                  href={`/insurance/${bundle.id}`}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  ดูรายละเอียด
                </Link>
                <Link
                  href={`/insurance/${bundle.id}?action=contact`}
                  className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  ขอใบเสนอราคา
                </Link>
              </div>
            </article>
          ))}
        </div>
          </section>

          <section aria-labelledby="top-hospitals" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 id="top-hospitals" className="text-lg font-semibold text-slate-900 dark:text-white">โรงพยาบาลพันธมิตร</h2>
          <Link href="/packages?sort=popular" className="text-sm font-medium text-brand hover:underline">
            ดูโรงพยาบาลทั้งหมด
          </Link>
        </div>
        {hasHospitals ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resolvedHospitals.map((hospital) => (
              <article key={hospital.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {(hospital.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hospital.logoUrl} alt={hospital.name} className="h-12 w-12 rounded-full object-cover" />
                  )) || hospital.name.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-white">{hospital.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">มีแพ็กเกจ {hospital.packageCount} รายการ</p>
                </div>
                <Link href={`/packages?hospitalId=${hospital.id}`} className="text-sm font-medium text-brand hover:underline">
                  ดูแพ็กเกจ
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="ยังไม่มีข้อมูลโรงพยาบาล"
            hint="กำลังจัดเตรียมข้อมูลล่าสุด"
            icon={<Building2 className="h-6 w-6" aria-hidden />}
          />
        )}
          </section>

          <section aria-labelledby="feature-highlights" className="space-y-6">
        <h2 id="feature-highlights" className="text-lg font-semibold text-slate-900 dark:text-white">ทำไมถึงควรใช้ HealthCheck CM Price?</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {featureHighlights.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
          </section>

          <section className="rounded-2xl bg-gradient-to-r from-brand via-brand/90 to-brand-dark px-6 py-10 text-center text-white shadow-lg">
        <h2 className="text-2xl font-semibold">พร้อมเริ่มต้นดูแลสุขภาพและความคุ้มครองของคุณแล้วหรือยัง?</h2>
        <p className="mt-3 text-sm text-white/80">ค้นหาแพ็กเกจ ตรวจสอบโปรโมชั่น และรับคำแนะนำจากผู้เชี่ยวชาญฟรี</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/packages" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand shadow hover:bg-slate-100">
            เริ่มค้นหาแพ็กเกจสุขภาพ
          </Link>
          <Link href="/insurance" className="interactive-button inline-flex items-center justify-center rounded-full border border-white px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
            ดูประกันสุขภาพและอุบัติเหตุ
          </Link>
        </div>
          </section>
        </>
      )}

      <footer className="border-t border-slate-200 pt-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="text-lg font-semibold text-slate-900 dark:text-white">
              HealthCheck CM Price
            </Link>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              แหล่งข้อมูลแพ็กเกจตรวจสุขภาพและประกันครบวงจรสำหรับคนเชียงใหม่
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">ลิงก์สำคัญ</h3>
            <ul className="mt-2 space-y-1">
              <li><Link href="/about" className="hover:text-brand">เกี่ยวกับเรา</Link></li>
              <li><Link href="/blog" className="hover:text-brand">บทความ</Link></li>
              <li><Link href="/contact" className="hover:text-brand">ติดต่อทีมงาน</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">ข้อกำหนด</h3>
            <ul className="mt-2 space-y-1">
              <li><Link href="/terms" className="hover:text-brand">ข้อกำหนดการใช้งาน</Link></li>
              <li><Link href="/privacy" className="hover:text-brand">นโยบายความเป็นส่วนตัว</Link></li>
              <li><Link href="/insurance/disclosure" className="hover:text-brand">คำเตือนด้านประกันภัย</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">ติดตามเรา</h3>
            <ul className="mt-2 space-y-1">
              <li><a href="https://facebook.com" className="hover:text-brand">Facebook</a></li>
              <li><a href="https://instagram.com" className="hover:text-brand">Instagram</a></li>
              <li><a href="mailto:hello@healthcheck.cm" className="hover:text-brand">hello@healthcheck.cm</a></li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-xs text-slate-400">
          © {new Date().getFullYear()} HealthCheck CM Price · Chiang Mai, Thailand
        </p>
      </footer>
    </main>
  );
}

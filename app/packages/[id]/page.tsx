// Package detail page rendering pricing insight, history, and cart/bookmark controls.
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/session";
import BookmarkButton from "@/components/BookmarkButton";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import AddToCartButton from "@/components/AddToCartButton";
import PackageBookingPanel from "@/components/PackageBookingPanel";
import { getFallbackPromotions } from "@/lib/fallback-data";
import type { FallbackPromotion } from "@/lib/fallback-data";
import { getFallbackPackages, type FallbackPackage } from "@/lib/fallback-data";
import { Info } from "lucide-react";

export const revalidate = 300;

function renderFallbackPackage(pkg: FallbackPackage) {
  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{pkg.title}</h1>
          <div className="text-sm text-slate-600 dark:text-slate-300">{pkg.hospitalName}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-slate-900 dark:text-white">฿{pkg.basePrice.toLocaleString()}</div>
          {pkg.priceNote ? <div className="text-xs text-slate-500 dark:text-slate-400">{pkg.priceNote}</div> : null}
        </div>
      </header>

      <div className="flex items-start gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm dark:border-amber-500/50 dark:bg-amber-900/20 dark:text-amber-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          ข้อมูลชุดนี้เป็นตัวอย่างสำหรับการสาธิตขณะฐานข้อมูลหลักไม่พร้อมใช้งาน คุณยังสามารถสำรวจรายละเอียดและติดต่อทีมงานเพื่อดำเนินการต่อได้ทันที
        </p>
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-300">{pkg.description}</p>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 md:grid-cols-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">ยอดเข้าชม</div>
          <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{pkg.metrics.viewCount.toLocaleString()} ครั้ง</div>
          <p className="text-xs text-slate-500 dark:text-slate-400">ความสนใจเฉลี่ยต่อเดือน</p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">การเปรียบเทียบ</div>
          <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{pkg.metrics.compareCount.toLocaleString()} ครั้ง</div>
          <p className="text-xs text-slate-500 dark:text-slate-400">ผู้ใช้เพิ่มลงตะกร้าเพื่อเทียบราคา</p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">บุ๊กมาร์ก</div>
          <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{pkg.metrics.bookmarkCount.toLocaleString()} ครั้ง</div>
          <p className="text-xs text-slate-500 dark:text-slate-400">จำนวนผู้ติดตามโปรโมชั่น</p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">รายการตรวจ ({pkg.includes.length})</h2>
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {pkg.includes.map((name) => (
            <li
              key={name}
              className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              {name}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">ก้าวต่อไป</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          สนใจแพ็กเกจนี้? แจ้งรายละเอียดให้ทีมงานทราบเพื่อรับโปรโมชั่นล่าสุดและจัดตารางตรวจที่เหมาะกับคุณ
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/packages"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ดูแพ็กเกจอื่น
          </Link>
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            ขอคำแนะนำและใบเสนอราคา
          </Link>
        </div>
      </section>
    </article>
  );
}

type PromotionOption = {
  code: string;
  label: string;
  description?: string;
  discountLabel?: string;
  eligibilityNote?: string;
  recommended?: boolean;
};

function mapFallbackPromotion(promotion: FallbackPromotion): PromotionOption {
  return {
    code: promotion.code,
    label: promotion.label,
    description: promotion.description,
    discountLabel: promotion.discountLabel,
    eligibilityNote: promotion.eligibilityNote,
    recommended: promotion.recommended,
  } satisfies PromotionOption;
}

function buildPromotions(pkg: {
  id: string;
  slug: string;
  priceNote?: string | null;
}): PromotionOption[] {
  const fallbackFromId = getFallbackPromotions(pkg.id).map(mapFallbackPromotion);
  const fallbackFromSlug = getFallbackPromotions(pkg.slug).map(mapFallbackPromotion);
  const combined = [...fallbackFromId, ...fallbackFromSlug];
  if (combined.length > 0) {
    const seen = new Set<string>();
    return combined.filter((promo) => {
      if (seen.has(promo.code)) return false;
      seen.add(promo.code);
      return true;
    });
  }

  return [
    {
      code: `${pkg.id}-STD`,
      label: "มาตรฐาน",
      description: pkg.priceNote ?? "ราคาปกติตามประกาศของโรงพยาบาล",
      recommended: true,
    },
    {
      code: `${pkg.id}-EARLY`,
      label: "จองล่วงหน้า 7 วัน",
      description: "ลด 5% เมื่อชำระครบก่อนวันตรวจอย่างน้อย 7 วัน",
      discountLabel: "ลด 5%",
    },
  ];
}

export default async function PackageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fallbackPackage = getFallbackPackages().find((pkg) => pkg.id === id || pkg.slug === id) ?? null;
  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (fallbackPackage && id.startsWith("demo-")) {
    return renderFallbackPackage(fallbackPackage);
  }
  const pkg = await prisma.healthPackage
    .findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        hospital: true,
        includes: true,
        histories: { orderBy: { recordedAt: "desc" }, take: 12 },
        bookmarks: userId ? { where: { userId }, select: { id: true } } : false,
        cartItems: userId
          ? {
              where: { cart: { userId } },
              select: { id: true },
              take: 1,
            }
          : false,
      },
    })
    .catch((error) => {
      logger.error("packages.detail.failed", { error: `${error}`, id });
      return null;
    });
  if (!pkg) {
    if (fallbackPackage) {
      return renderFallbackPackage(fallbackPackage);
    }
    return <div className="text-gray-600 dark:text-slate-300">ไม่พบแพ็กเกจหรือฐานข้อมูลยังไม่พร้อม</div>;
  }

  const inCart = Boolean(pkg.cartItems?.length);
  const promotions = buildPromotions({ id: pkg.id, slug: pkg.slug, priceNote: pkg.priceNote });

  const historyPoints = (pkg.histories ?? []).slice().reverse();
  const latest = historyPoints[historyPoints.length - 1];
  const first = historyPoints[0];
  const priceChange = latest && first ? latest.price - first.price : 0;
  const priceChangeLabel = priceChange === 0 ? "ไม่มีการเปลี่ยนแปลง" : priceChange > 0 ? `เพิ่มขึ้น ฿${priceChange.toLocaleString()}` : `ลดลง ฿${Math.abs(priceChange).toLocaleString()}`;
  const lastUpdated = pkg.updatedAt ? format(pkg.updatedAt, "d MMM yyyy") : "-";
  const isNew = pkg.updatedAt ? differenceInDays(new Date(), pkg.updatedAt) <= 14 : false;

  return (
    <article className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{pkg.title}</h1>
          <div className="text-sm text-gray-600">{pkg.hospital?.name}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {isNew && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600">อัปเดตใหม่</span>}
            {pkg.gender && pkg.gender !== "any" && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">{pkg.gender}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">฿{pkg.basePrice.toLocaleString()}</div>
          {pkg.priceNote && <div className="text-xs text-gray-500">{pkg.priceNote}</div>}
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <BookmarkButton packageId={pkg.id} initialBookmarked={Boolean(pkg.bookmarks?.length)} />
          </div>
        </div>
      </header>

      {pkg.description && <p className="text-gray-700">{pkg.description}</p>}

      <PackageBookingPanel packageId={pkg.id} initialInCart={inCart} promotions={promotions} />

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 md:grid-cols-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">ราคาเฉลี่ย</div>
          <div className="text-xl font-semibold text-slate-900 dark:text-white">
            ฿{Math.round(historyPoints.reduce((acc, item) => acc + item.price, 0) / Math.max(historyPoints.length, 1)).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">จากประวัติ {historyPoints.length} ครั้ง</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">ความเปลี่ยนแปลงล่าสุด</div>
          <div className={`text-xl font-semibold ${priceChange > 0 ? "text-rose-500" : priceChange < 0 ? "text-emerald-500" : "text-slate-900 dark:text-white"}`}>
            {priceChangeLabel}
          </div>
          {latest && <div className="text-xs text-slate-500 dark:text-slate-400">ล่าสุดเมื่อ {format(new Date(latest.recordedAt), "d MMM yyyy")}</div>}
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">ข้อมูลล่าสุด</div>
          <div className="text-xl font-semibold text-slate-900 dark:text-white">{lastUpdated}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{pkg.includes.length} รายการตรวจ</div>
        </div>
      </section>

      {historyPoints.length > 1 && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">แนวโน้มราคา</h2>
            <span className="text-xs text-slate-500">ข้อมูลย้อนหลัง {historyPoints.length} ครั้ง</span>
          </div>
          <PriceHistoryChart
            data={historyPoints.map((point) => ({
              price: point.price,
              recordedAt: new Date(point.recordedAt).toISOString(),
            }))}
          />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold">รายการตรวจ ({pkg.includes.length})</h2>
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {pkg.includes.map((item) => (
            <li key={item.id} className="rounded border px-3 py-2 text-sm">{item.name}</li>
          ))}
        </ul>
      </section>

      {pkg.histories?.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">ประวัติราคา</h2>
          <ul className="text-sm text-gray-600">
            {pkg.histories.map((history) => (
              <li key={history.id}>฿{history.price.toLocaleString()} • {new Date(history.recordedAt).toLocaleDateString()}</li>
            ))}
          </ul>
        </section>
      )}

      {pkg.sourceUrl && (
        <div className="text-sm text-gray-600">
          ที่มา: <a className="text-brand underline" href={pkg.sourceUrl} target="_blank">ลิงก์อ้างอิง</a>
        </div>
      )}
    </article>
  );
}

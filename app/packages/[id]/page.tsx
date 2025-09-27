import { format, differenceInDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/session";
import BookmarkButton from "@/components/BookmarkButton";
import PriceHistoryChart from "@/components/PriceHistoryChart";

export const revalidate = 300;

export default async function PackageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (id.startsWith("demo-")) {
    return (
      <article className="space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">ตัวอย่างแพ็กเกจ (Demo)</h1>
            <div className="text-sm text-gray-600">Demo Hospital</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">฿1,990</div>
          </div>
        </header>
        <section>
          <h2 className="mb-2 text-lg font-semibold">รายการตรวจ (3)</h2>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {['CBC','FBS','Chest X-ray'].map((n) => (
              <li key={n} className="rounded border px-3 py-2 text-sm">{n}</li>
            ))}
          </ul>
        </section>
        <div className="text-sm text-gray-600">ที่มา: ตัวอย่างข้อมูลเพื่อแสดงผล UI</div>
      </article>
    );
  }
  const pkg = await prisma.healthPackage
    .findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        hospital: true,
        includes: true,
        histories: { orderBy: { recordedAt: "desc" }, take: 12 },
        bookmarks: userId
          ? { where: { userId }, select: { id: true } }
          : false,
      },
    })
    .catch((error) => {
      logger.error("packages.detail.failed", { error: `${error}`, id });
      return null;
    });
  if (!pkg) return <div className="text-gray-600">ไม่พบแพ็กเกจหรือฐานข้อมูลยังไม่พร้อม</div>;

  const historyPoints = (pkg.histories ?? [])
    .slice()
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
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
          <div className="mt-3 flex justify-end">
            <BookmarkButton packageId={pkg.id} initialBookmarked={Boolean(pkg.bookmarks?.length)} />
          </div>
        </div>
      </header>

      {pkg.description && <p className="text-gray-700">{pkg.description}</p>}

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
